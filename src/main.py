# -*-python-*-

import os
from cherrypy.lib.static import serve_file
import filedb

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
        self.course_data = filedb.Table("data/courses.dat",[])
        self.staff_data = filedb.Table("data/staff.dat",[])
    
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
    
    # course view page
    def courses(self):
        template = lookup.get_template("courses.html")
        return template.render(ROOT_URL=self.root_url)

    # staff view page    
    def staff(self):
        template = lookup.get_template("staff.html")
        return template.render(ROOT_URL=self.root_url)

    # allocation view page    
    def allocation(self):
        template = lookup.get_template("allocation.html")
        return template.render(ROOT_URL=self.root_url)
        
    # application root
    def index(self):
        template = lookup.get_template("index.html")
        return template.render(ROOT_URL="")
    
    # exposed
    index.exposed = True
    courses.exposed = True
    staff.exposed = True
    allocation.exposed = True
    images.exposed = True
    js.exposed = True
    css.exposed = True

