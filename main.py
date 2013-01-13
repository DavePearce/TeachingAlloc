# -*-python-*-

import os
from cherrypy.lib.static import serve_file

# ============================================================
# Mako Config
# ============================================================

from mako.template import Template
from mako.lookup import TemplateLookup
lookup = TemplateLookup(directories=['html'])

# ============================================================
# Application Entry
# ============================================================

class Main:
    # gives access to images/
    def images(self, filename):
        abspath = os.path.abspath("images/" + filename)
        return serve_file(abspath, "image/png")

    # gives access to js/
    def js(self, filename):
        abspath = os.path.abspath("js/" + filename)
        return serve_file(abspath, "application/javascript")

    def css(self, filename):
        abspath = os.path.abspath("css/" + filename)
        return serve_file(abspath, "text/css")

    # application root
    def index(self):
        template = lookup.get_template("index.html")
        return template.render()
    
    # exposed
    index.exposed = True
    images.exposed = True
    js.exposed = True
    css.exposed = True

