#!/usr/local/bin/python

# =============================================================
# USER CONFIG
# =============================================================

HOMEDIR = r"/u/staff/djp/projects/TeachingAlloc/"
ACTUAL_ROOT_URL = r"/cgi-bin/cgiwrap/djp/teaching-alloc.cgi/"
IDEAL_ROOT_URL = r"djp/cgi-bin/teaching-alloc.cgi/"

# ============================================================
# Path Config
# ============================================================

import os
import cgi
import cgitb; cgitb.enable()  # for troubleshooting
import sys

# change working directory
os.chdir(HOMEDIR)

sys.path.insert(0, "lib")
sys.path.insert(0, "src")

# ============================================================
# Imports
# ============================================================

import cherrypy
import main

# ============================================================
# Start CherryPY
# ============================================================

import wsgiref.handlers

def application(environ, start_response):
    app = cherrypy.tree.mount(main.Main(IDEAL_ROOT_URL,os.getenv("REMOTE_USER")), ROOT_URL)
    return app(environ,start_response)

if __name__ == '__main__':
    wsgiref.handlers.CGIHandler().run(application)
