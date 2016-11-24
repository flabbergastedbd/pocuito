import os
import re
import json
import hashlib
import utilities

import tornado.web

from db import models


class CustomCommandHandler(tornado.web.RequestHandler):
    def initialize(self, session):
        self.session = session
        self.client = self.session.query(models.Client).get(self.request.remote_ip)

    def write(self, chunk):
        if isinstance(chunk, (list, dict)):
            super(CustomCommandHandler, self).write(json.dumps(chunk))
            self.set_header('Content-Type', 'application/json')
        else:
            super(CustomCommandHandler, self).write(chunk)


class Recorder(CustomCommandHandler):
    SUPPORTED_METHODS = ['GET', 'POST', 'PUT', 'DELETE']

    def get(self):
        if self.client is not None:
            self.write(self.client.toJSON())
        else:
            return(self.post())

    def post(self):
        if self.client is not None:
            self.session.delete(self.client)
        self.client = models.Client(ip=self.request.remote_ip)
        if self.request.body:
            self.client.update(json.loads(self.request.body))
        self.session.add(self.client)
        self.session.commit()

    def put(self):
        json_data = json.loads(self.request.body)
        if self.client is not None:
            self.client.update(json_data)
            self.session.merge(self.client)
            self.session.commit()
        else:
            self.set_status(403)

    def delete(self):
        if self.client is not None:
            self.session.delete(self.client)
            self.session.commit()
            self.set_status(200)
        else:
            self.set_status(400)


class RequestsHandler(CustomCommandHandler):
    SUPPORTED_METHODS = ('GET', 'DELETE')

    def get(self, request_id=None):
        if self.client is None:
            self.set_status(403)
        else:
            query = self.session.query(models.Request).filter_by(client=self.client)
            if request_id is None:
                limit = 5
                offset = 0
                if self.get_argument('url', None):
                    query = query.filter(models.Request.url.like('%' + self.get_argument('url') + '%'))
                if self.get_argument('method', None):
                    query = query.filter_by(method=self.get_argument('method'))
                requests = query.offset(offset).limit(limit)
                self.write([r.toJSON() for r in requests])
            else:
                request = request_query.filter_by(id=int(request_id)).first()
                if request:
                    self.write(request.toJSON())
                else:
                    self.set_status(400)

    def delete(self, request_id=None):
        if self.client is None or request_id is None:
            self.set_status(403)
        else:
            query = self.session.query(models.Request).filter_by(client=self.client, id=request_id)
            query.delete()
            self.set_status(200)

class PingHandler(tornado.web.RequestHandler):
    SUPPORTED_METHODS = ('GET',)
    def get(self):
        self.write({'active': True})


class GarbageHandler(tornado.web.RequestHandler):
    pass


def get_command_handlers(uu, session):
    return([
        tornado.web.URLSpec(r'/%s/client/?' % (uu), Recorder, dict(session=session)),
        tornado.web.URLSpec(r'/%s/requests/?([0-9]+)?/?' % (uu), RequestsHandler, dict(session=session)),
        tornado.web.URLSpec(r'/%s/ping/?' % (uu), PingHandler),
        tornado.web.URLSpec(r'.*', GarbageHandler),
    ])
