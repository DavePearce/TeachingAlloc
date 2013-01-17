# -*-python-*-

import cherrypy
import os
import json

class Table(object):
    def __init__(self,filename,titles):
        self.filename = filename
        self.titles = titles
        self.exposed = True
        self.content = load(filename)
    #
    def index(self):
        return json.dumps(self.content)
    index.exposed = True

# Load a given file representing a database table.
def load(filename):
    f = open(filename,"r")
    data = json.load(f)
    f.close()
    return data
