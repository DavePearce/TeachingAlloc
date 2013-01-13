#!/usr/bin/python

# ============================================================
# Path Config
# ============================================================

import sys

sys.path.insert(0, "lib")
sys.path.insert(0, "src")

# ============================================================
# Imports
# ============================================================

import cherrypy
import main

# ============================================================
# Run Local HTTP Server
# ============================================================

#cherrypy.quickstart(main.Main("http://localhost:8080","djp"))

root = main.Main("http://localhost:8080","djp")

conf = {
    'global': {
        'server.socket_host': '0.0.0.0',
        'server.socket_port': 8080,
    },
    '/': {
        'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
    }
}

cherrypy.quickstart(root, '/', conf)
