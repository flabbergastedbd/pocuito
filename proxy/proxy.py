#!/usr/bin/env python
"""
# Inbound Proxy Module developed by Bharadwaj Machiraju (blog.tunnelshade.in) as a part of Google Summer of Code 2013 for OWASP OWTF.
"""

import os
import re
import ssl
import sys
import uuid
import socket
import datetime
import argparse
from multiprocessing import Value

import tornado.httpserver
import tornado.ioloop
import tornado.iostream
import tornado.web
import tornado.httpclient
import tornado.escape
import tornado.httputil
import tornado.options
import tornado.template
import tornado.websocket
import tornado.gen

import utilities

from socket_wrapper import wrap_socket
from command_handlers import get_command_handlers
from db import DB, models

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

class ProxyHandler(tornado.web.RequestHandler):

    """This RequestHandler processes all the requests that the application received."""

    SUPPORTED_METHODS = ['GET', 'POST', 'CONNECT', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE']
    server = None
    restricted_response_headers = ['Content-Length', 'Content-Encoding', 'Etag', 'Transfer-Encoding', 'Connection', 'Vary', 'Accept-Ranges', 'Pragma']
    restricted_request_headers = ['Connection', 'Pragma', 'Cache-Control', 'If-Modified-Since']

    def __new__(cls, application, request, **kwargs):
        # http://stackoverflow.com/questions/3209233/how-to-replace-an-instance-in-init-with-a-different-object
        # Based on upgrade header, websocket request handler must be used
        try:
            if request.headers['Upgrade'].lower() == 'websocket':
                return CustomWebSocketHandler(application, request, **kwargs)
        except KeyError:
            pass
        return tornado.web.RequestHandler.__new__(cls, application, request, **kwargs)

    def initialize(self, session):
        self.session = session
        # Has to be done for every request so being done here
        self.client = self.session.query(models.Client).filter_by(
            ip=self.request.remote_ip,
            active=True).first()

    def set_default_headers(self):
        # Automatically called by Tornado,
        # Used to remove "Server" header set by tornado
        del self._headers["Server"]

    def set_status(self, status_code, reason=None):
        """Sets the status code for our response.

        Overriding is done so as to handle unknown response codes gracefully.
        """
        self._status_code = status_code
        if reason is not None:
            self._reason = tornado.escape.native_str(reason)
        else:
            try:
                self._reason = tornado.httputil.responses[status_code]
            except KeyError:
                self._reason = tornado.escape.native_str("Server Not Found")

    def finish_response(self, response):
        """Write a new response and cache it."""
        self.set_status(response.code)
        for header, value in response.headers.get_all():
            if header == "Set-Cookie":
                self.add_header(header, value)
            else:
                if header not in ProxyHandler.restricted_response_headers:
                    self.set_header(header, value)
        self.finish()

    def handle_data_chunk(self, data):
        """Callback when a small chunk is received."""
        if data:
            self.write(data)
            self.request.response_buffer += data

    @tornado.web.asynchronous
    @tornado.gen.coroutine
    def get(self):
        """Handle all requests except the connect request.

        Once ssl stream is formed between browser and proxy, the requests are then processed by this function.
        """
        # The flow starts here
        self.request.local_timestamp = datetime.datetime.now()
        self.request.response_buffer = ''

        # The requests that come through ssl streams are relative requests, so transparent proxying is required. The
        # following snippet decides the url that should be passed to the async client
        if self.request.uri.startswith(self.request.protocol, 0):  # Normal Proxy Request.
            self.request.url = self.request.uri
        else:  # Transparent Proxy Request.
            self.request.url = "%s://%s" % (self.request.protocol, self.request.host)
            if self.request.uri != '/':  # Add uri only if needed.
                self.request.url += self.request.uri

        # Initiate cache store if recording is present based on remote_ip
        # Pocuito based code
        url_client_match = False
        if self.client is not None:
            url_client_match = self.client.is_url_match(self.request.url)
            if url_client_match:
                # Look for tampering stuff
                self.request = self.client.tamper_request(self.request)
        # End pocuito code

        # Request header cleaning
        for header in ProxyHandler.restricted_request_headers:
            try:
                del self.request.headers[header]
            except:
                continue

        async_client = tornado.httpclient.AsyncHTTPClient()

        body = self.request.body or None
        request = tornado.httpclient.HTTPRequest(
            url=self.request.url,
            method=self.request.method,
            body=body,
            headers=self.request.headers,
            follow_redirects=False,
            use_gzip=True,
            streaming_callback=self.handle_data_chunk,
            header_callback=None,
            proxy_host=self.application.outbound_address,
            proxy_port=self.application.outbound_port,
            proxy_username=self.application.outbound_username,
            proxy_password=self.application.outbound_password,
            allow_nonstandard_methods=True,
            validate_cert=False
        )

        response = yield tornado.gen.Task(async_client.fetch, request)

        # Pocuito code (Tamper response)
        if url_client_match:
            rModel = models.Request(self.request, response)
            rModel.client = self.client
            self.session.add(rModel)
            self.session.commit()
            response = self.client.tamper_response(response)
        # End pocuito code

        self.finish_response(response)

    # The following 5 methods can be handled through the above implementation.
    @tornado.web.asynchronous
    def post(self):
        return self.get()

    @tornado.web.asynchronous
    def head(self):
        return self.get()

    @tornado.web.asynchronous
    def put(self):
        return self.get()

    @tornado.web.asynchronous
    def delete(self):
        return self.get()

    @tornado.web.asynchronous
    def options(self):
        return self.get()

    @tornado.web.asynchronous
    def trace(self):
        return self.get()

    @tornado.web.asynchronous
    def connect(self):
        """Gets called when a connect request is received.

        * The host and port are obtained from the request uri
        * A socket is created, wrapped in ssl and then added to SSLIOStream
        * This stream is used to connect to speak to the remote host on given port
        * If the server speaks ssl on that port, callback start_tunnel is called
        * An OK response is written back to client
        * The client side socket is wrapped in ssl
        * If the wrapping is successful, a new SSLIOStream is made using that socket
        * The stream is added back to the server for monitoring
        """
        host, port = self.request.uri.split(':')

        def start_tunnel():
            try:
                self.request.connection.stream.write(b"HTTP/1.1 200 OK CONNECTION ESTABLISHED\r\n\r\n")
                wrap_socket(
                    self.request.connection.stream.socket,
                    host,
                    self.application.ca_cert,
                    self.application.ca_key,
                    self.application.ca_pass,
                    self.application.certs_dir,
                    success=ssl_success)
            except tornado.iostream.StreamClosedError:
                pass

        def ssl_success(client_socket):
            client = tornado.iostream.SSLIOStream(client_socket)
            server.handle_stream(client, self.application.address)  # lint:ok

        try:
            # Adds a fix for check_hostname errors in Tornado 4.3.0
            # When connecting through a new socket, no need to wrap the socket before passing
            # to SSIOStream
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
            upstream = tornado.iostream.SSLIOStream(s)
            # upstream.set_close_callback(ssl_fail)
            upstream.connect((host, int(port)), callback=start_tunnel, server_hostname=host)
        except Exception, e:
            print(e)
            print(("[!] Dropping CONNECT request to " + self.request.uri))
            self.write(b"404 Not Found :P")
            self.finish()


class CustomWebSocketHandler(tornado.websocket.WebSocketHandler):

    """Class is used for handling websocket traffic.

    * Object of this class replaces the main request handler for a request with header => "Upgrade: websocket"
    * wss:// - CONNECT request is handled by main handler
    """

    def upstream_connect(self, io_loop=None, callback=None):
        """Custom alternative to tornado.websocket.websocket_connect.

        Returns a future.
        """
        # io_loop is needed or it won't work with Tornado.
        if io_loop is None:
            io_loop = tornado.ioloop.IOLoop.current()

        # During secure communication, we get relative URI, so make them absolute
        if self.request.uri.startswith(self.request.protocol, 0):  # Normal Proxy Request.
            self.request.url = self.request.uri
        # Transparent Proxy Request
        else:
            self.request.url = "%s://%s%s" % (self.request.protocol, self.request.host, self.request.uri)
        self.request.url = self.request.url.replace("http", "ws", 1)

        # Have to add cookies and stuff
        request_headers = tornado.httputil.HTTPHeaders()
        for name, value in self.request.headers.items():
            if name not in ProxyHandler.restricted_request_headers:
                request_headers.add(name, value)
        # Build a custom request
        request = tornado.httpclient.HTTPRequest(
            url=self.request.url,
            headers=request_headers,
            proxy_host=self.application.outbound_ip,
            proxy_port=self.application.outbound_port,
            proxy_username=self.application.outbound_username,
            proxy_password=self.application.outbound_password
        )
        self.upstream_connection = CustomWebSocketClientConnection(io_loop, request)
        if callback is not None:
            io_loop.add_future(self.upstream_connection.connect_future, callback)
        return self.upstream_connection.connect_future

    def _execute(self, transforms, *args, **kwargs):
        """Overriding of a method of WebSocketHandler."""

        def start_tunnel(future):
            """A callback which is called when connection to url is successful."""
            # We need upstream to write further messages
            self.upstream = future.result()
            # HTTPRequest needed for caching
            self.handshake_request = self.upstream_connection.request
            # Needed for websocket data & compliance with cache_handler stuff
            self.handshake_request.response_buffer = ''
            # Tiny hack to protect caching (according to websocket standards)
            self.handshake_request.version = 'HTTP/1.1'
            # XXX: I dont know why a None is coming
            self.handshake_request.body = self.handshake_request.body or ''
            # The regular procedures are to be done
            tornado.websocket.WebSocketHandler._execute(self, transforms, *args, **kwargs)

        # We try to connect to provided URL & then we proceed with connection on client side.
        self.upstream = self.upstream_connect(callback=start_tunnel)

    def store_upstream_data(self, message):
        """Save websocket data sent from client to server.

        i.e add it to HTTPRequest.response_buffer with direction (>>)
        """
        try:  # Cannot write binary content as a string, so catch it
            self.handshake_request.response_buffer += (">>> %s\r\n" % message)
        except TypeError:
            self.handshake_request.response_buffer += (">>> May be binary\r\n")

    def store_downstream_data(self, message):
        """Save websocket data sent from client to server.

        i.e add it to HTTPRequest.response_buffer with direction (<<)
        """
        try:  # Cannot write binary content as a string, so catch it.
            self.handshake_request.response_buffer += ("<<< %s\r\n" % message)
        except TypeError:
            self.handshake_request.response_buffer += ("<<< May be binary\r\n")

    def on_message(self, message):
        """Everytime a message is received from client side, this instance method is called."""
        self.upstream.write_message(message)  # The obtained message is written to upstream.
        self.store_upstream_data(message)

        # The following check ensures that if a callback is added for reading message from upstream, another one is not
        # added.
        if not self.upstream.read_future:
            # A callback is added to read the data when upstream responds.
            self.upstream.read_message(callback=self.on_response)

    def on_response(self, message):
        """A callback when a message is recieved from upstream."""
        # The following check ensures that if a callback is added for reading message from upstream, another one is not
        # added
        if not self.upstream.read_future:
            self.upstream.read_message(callback=self.on_response)
        if self.ws_connection:  # Check if connection still exists.
            if message.result():  # Check if it is not NULL (indirect checking of upstream connection).
                self.write_message(message.result())  # Write obtained message to client.
                self.store_downstream_data(message.result())
            else:
                self.close()

    def on_close(self):
        """Called when websocket is closed.

        So handshake request-response pair along with websocket data as response body is saved
        """
        # Required for cache_handler
        self.handshake_response = tornado.httpclient.HTTPResponse(
            self.handshake_request,
            self.upstream_connection.code,
            headers=self.upstream_connection.headers,
            request_time=0
        )

class CustomWebSocketClientConnection(tornado.websocket.WebSocketClientConnection):
    def _handle_1xx(self, code):
        # Had to extract response code, so it is necessary to override.
        self.code = code
        super(CustomWebSocketClientConnection, self)._handle_1xx(code)


def get_argparser():
    parser = argparse.ArgumentParser(description='A proxy for pocuito extension')
    parser.add_argument('--addr', '-a', dest='address', action='store',
                        default='127.0.0.1', type=str,
                        help='network address to listen on')
    parser.add_argument('--port', '-p', dest='port', action='store',
                        default=8888, type=int,
                        help='port to listen on')
    parser.add_argument('--outbound-addr', dest='outbound_address', action='store',
                        default=None, type=str,
                        help='Outbound proxy address to forward requests to.')
    parser.add_argument('--outbound-port', dest='outbound_port', action='store',
                        default=None, type=int,
                        help='Outbound proxy port to forward requests to.')
    parser.add_argument('--outbound-username', '-ou', dest='outbound_username', action='store',
                        default=None, type=str,
                        help='Outbound proxy username for auth')
    parser.add_argument('--outbound-password', dest='outbound_password', action='store',
                        default=None, type=str,
                        help='Outbound proxy password for auth')
    parser.add_argument('--outbound-type', dest='outbound_type', action='store',
                        default=None, type=str, choices=['basic', 'digest'],
                        help='Outbound proxy auth type')
    parser.add_argument('--certs-dir', dest='certs_dir', action='store',
                        default=os.path.join(ROOT_DIR, 'certs', 'certs'), type=str,
                        help='Certs to be stored location')
    parser.add_argument('--ca-cert', dest='ca_cert', action='store',
                        default=os.path.join(ROOT_DIR, 'certs', 'ca.crt'), type=str,
                        help='CA certification path')
    parser.add_argument('--ca-key', dest='ca_key', action='store',
                        default=os.path.join(ROOT_DIR, 'certs', 'ca.key'), type=str,
                        help='CA key path')
    parser.add_argument('--ca-pass', dest='ca_pass', action='store',
                        default=os.path.join(ROOT_DIR, 'certs', 'ca_pass.txt'), type=str,
                        help='CA pass contained file path')
    parser.add_argument('--log-file', dest='log_file', action='store',
                        default=os.path.join(ROOT_DIR, 'proxy.log'), type=str,
                        help='Path to log file')
    parser.add_argument('--db-scheme', dest='db_scheme', action='store',
                        default='sqlite', type=str,
                        help='DB scheme for sqlalchemy connection')
    parser.add_argument('--db-path', dest='db_path', action='store',
                        default='', type=str,
                        help='DB path for sqlalchemy connection')
    parser.add_argument('--instances', dest='instances', action='store',
                        default=1, type=int,
                        help='Number of instances to run (0 = No. of cores) (if using postgres)')
    parser.add_argument('--uuid', dest='uuid', action='store',
                        default=str(uuid.uuid1()).replace('-', ''), type=str,
                        help='A random string in url for command api')
    return(parser)

def main():
    # Arg parsing
    arg_parser = get_argparser();
    args = arg_parser.parse_args()

    # The tornado application, which is used to pass variables to request handler
    application = tornado.web.Application(debug=False, gzip=True,)

    # State dictionary object will be used by requests
    application.state = {}

    # Outbound proxy stuff
    application.address = args.address
    application.port = args.port
    application.outbound_address = args.outbound_address
    application.outbound_port = args.outbound_port
    application.outbound_username = args.outbound_username
    application.outbound_password = args.outbound_password

    # Certs stuff
    application.certs_dir = args.certs_dir
    application.ca_cert = args.ca_cert
    application.ca_key = args.ca_key
    with open(args.ca_pass, 'r') as f:
        application.ca_pass = f.read()
        application.ca_pass = application.ca_pass.strip('\n')

    # DB Stuff
    db = DB(args.db_scheme, args.db_path)

    global server
    server = tornado.httpserver.HTTPServer(application)
    try:
        server.bind(application.port, address=application.address)
        tornado.options.parse_command_line(
            args=["dummy_arg", "--log_file_prefix=%s" % args.log_file, "--logging=info"])
        # NEVER more than 1 instance, we use a dictionary as data store
        if ('sqlite3' in args.db_scheme):
            server.start(1)
        else:
            server.start(args.instances)
        # If at all forked, now this is the new process

        session = db.get_session()  # Get db session

        application.add_handlers("%s" % (application.address.replace('.', '\.')),
                                 get_command_handlers(args.uuid, session))
        application.add_handlers('.*', [(r'.*', ProxyHandler, dict(session=session))])
        print("http://%s:%d/%s/" % (application.address, application.port, args.uuid))
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        pass
    except Exception, e:
        print(e)
    finally:
        server.stop()
        tornado.ioloop.IOLoop.instance().stop()

if __name__ == "__main__":
    main()
