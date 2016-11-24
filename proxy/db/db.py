from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models

class DB(object):
    def __init__(self, scheme='sqlite3', path=''):
        self.engine = create_engine("%s://%s" % (scheme, path))
        models.Base.metadata.create_all(self.engine)
        self.session = sessionmaker(bind=self.engine)

    def get_session(self):
        return(self.session())
