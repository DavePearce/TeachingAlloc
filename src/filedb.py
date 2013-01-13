# -*-python-*-

import cherrypy

class Table(object):
    def __init__(self,filename,titles):
        self.filename = filename
        self.titles = titles
        self.exposed = True
        self.content = "BLAH BLAH"

    def GET(self):
        return "GET REQUEST" + self.content

    def PUT(Self):
        pass


