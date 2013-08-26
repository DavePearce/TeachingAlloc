# -*-python-*-

import os
from cherrypy.lib.static import serve_file
import json

# ============================================================
# Mako Config
# ============================================================

from mako.template import Template
from mako.lookup import TemplateLookup
lookup = TemplateLookup(directories=['html'])

# ============================================================
# Application Entry
# ============================================================

class Main(object):
    def __init__(self,root_url,username):
        self.root_url = root_url
        self.username = username
    
    # gives access to images/
    def images(self, filename):
        abspath = os.path.abspath("images/" + filename)
        return serve_file(abspath, "image/png")
    images.exposed = True
    
    def js(self, filename):
        abspath = os.path.abspath("js/" + filename)
        return serve_file(abspath, "application/javascript")
    js.exposed = True

    def css(self, filename):
        abspath = os.path.abspath("css/" + filename)
        return serve_file(abspath, "text/css")
    css.exposed = True
    
    def view(self,year):
        template = lookup.get_template("index.html")
        return template.render(ROOT_URL=self.root_url,YEAR=year)        
    view.exposed = True
    
    def data(self,year,table):
        return json.dumps(load("data/" + year + "/" + table + ".dat"))
    data.exposed = True
    
    # application root
    def index(self):
        template = lookup.get_template("index.html")
        return template.render(ROOT_URL="")
    index.exposed = True
    # exposed

# Load a given file representing a database table.
def load(filename):
    f = open(filename,"r")
    data = json.load(f)
    f.close()
    return data
