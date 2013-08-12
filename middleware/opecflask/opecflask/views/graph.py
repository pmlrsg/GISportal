from flask import Blueprint, abort, request, jsonify, g, current_app
from opecflask.models.database import db_session
from opecflask.models.state import State
from opecflask.models.graph import Graph
from opecflask.models.user import User
from opecflask.core import short_url
import datetime
import sqlite3 as sqlite

portal_graph = Blueprint('portal_graph', __name__)

@portal_graph.route('/graph/<graphid>', methods = ['GET'])
def getGraph(graphID):
   pass
   
@portal_graph.route('/graph', methods = ['GET'])
def getGraphs():
   pass
   
@portal_graph.route('/graph', methods = ['POST'])
def setGraph():
   pass