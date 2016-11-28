import re
import json
import base64
import hashlib

from sqlalchemy import Column, Integer, Float, Text, Boolean, String, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from sqlalchemy.orm import sessionmaker, relationship

import utilities

Base = declarative_base()

class Client(Base):
    __tablename__ = 'clients'

    ip = Column(String, primary_key=True)
    active = Column(Boolean, default=False)
    url_regexp = Column(String, default='^$')
    body_tampers_string = Column(String, nullable=True)
    response_headers_add_string = Column(String, nullable=True)

    def update(self, json_data):
        if json_data.get('body_tampers', None):
            self.body_tampers_string = json.dumps(json_data['body_tampers'])
        if json_data.get('response_headers_add', None):
            self.response_headers_add_string = json.dumps(json_data['response_headers_add'])
        if json_data.get('active', None):
            self.active = json_data['active']
        if json_data.get('url_regexp', None):
            self.url_regexp = json_data['url_regexp']

    def toJSON(self):
        return({
            'ip': self.ip,
            'active': self.active,
            'url_regexp': self.url_regexp,
            'body_tampers': self.body_tampers,
            'response_headers_add': self.response_headers_add
        })

    @hybrid_property
    def body_tampers(self):
        return(json.loads(self.body_tampers_string) if self.body_tampers_string else None)

    @hybrid_property
    def response_headers_add(self):
        return(json.loads(self.response_headers_add_string) if self.response_headers_add_string else None)

    def is_url_match(self, url):
        return(re.search(self.url_regexp, url))

    def tamper_request(self, request):
        body_tampers = self.body_tampers
        if body_tampers and request.body:  # Request body tampering
            for match, replacement in body_tampers.iteritems():
                request.body = re.sub(match, replacement, request.body)
        return(request)

    def tamper_response(self, response):
        response_headers_add = self.response_headers_add
        if response_headers_add and response.headers:
            for k, v in response_headers_add.iteritems():
                response.headers.parse_line("%s: %s" % (k, v))
        return(response)

class Request(Base):
    __tablename__ = 'requests'

    id = Column(Integer, primary_key=True)
    url = Column(String)
    method = Column(String)
    data = Column(String, nullable=True)
    time = Column(Float(precision=10))
    headers_string = Column(Text)
    response_code = Column(String)
    response_headers_string = Column(Text)
    response_body = Column(Text, nullable=True)
    binary_response = Column(Boolean, default=False)
    client_ip = Column(String, ForeignKey('clients.ip'))
    client = relationship(Client,
            cascade="save-update, delete",
            backref='requests')

    def __init__(self, request, response):
        """Tornado request response objects"""
        try:
            response_body = request.response_buffer.decode("utf-8")
            binary_response = False
        except UnicodeDecodeError:
            response_body = base64.b64encode(request.response_buffer)
            binary_response = True

        self.url = request.url
        self.method = request.method
        self.data = request.body.decode('utf-8')
        self.time = response.request_time
        self.headers_string = json.dumps(dict(request.headers))
        self.response_code = response.code
        self.response_headers_string = json.dumps(dict(response.headers))
        self.response_body = response_body
        self.binary_response = binary_response

    @hybrid_property
    def headers(self):
        return(json.loads(self.headers_string))

    @hybrid_property
    def response_headers(self):
        return(json.loads(self.response_headers_string))

    def toJSON(self):
        return({
            'id': self.id,
            'url': self.url,
            'method': self.method,
            'data': self.data,
            'time': self.time,
            'headers': self.headers,
            'response_code': self.response_code,
            'response_headers': self.response_headers,
            'response_body': self.response_body,
            'binary_response': self.binary_response
        })
