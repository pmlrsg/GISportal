from flask import Blueprint, abort, request, jsonify, g, current_app, render_template, session, flash, url_for, redirect
from opecflask.models.database import db_session
from opecflask.models.state import State
from opecflask.models.graph import Graph
from opecflask.models.quickregions import QuickRegions
from opecflask.models.roi import ROI
from opecflask.models.layergroup import LayerGroup
from opecflask.models.user import User
from opecflask import oid
import sqlite3 as sqlite

portal_user = Blueprint('portal_user', __name__)

COMMON_PROVIDERS = {'google': 'https://www.google.com/accounts/o8/id',
                    'yahoo': 'https://yahoo.com/',
                    'aol': 'http://aol.com/',
                    'steam': 'https://steamcommunity.com/openid/'
}

@portal_user.route('/')
def index():
   return render_template('index.html')
   
@portal_user.route('/login')
@oid.loginhandler
def login_with_google():
   print('in login with google')
   # if we are already logged in, go back to were we came from
   if g.user is not None:
      return redirect(url_for('state_user.getStates'))
   return oid.try_login(COMMON_PROVIDERS['google'], ask_for=['email'])

@portal_user.route('/login/<provider>', methods=['GET', 'POST'])
@oid.loginhandler
def login(provider):
   print('in login')
   # if we are already logged in, go back to were we came from
   if g.user is not None:
      return redirect(url_for('portal_user.index'))
   #if request.method == 'POST':
      #openid = request.form.get('openid')
      #if openid:
         #return oid.try_login(openid, ask_for=['email'])
         
   if provider is not None and provider in COMMON_PROVIDERS:
      return oid.try_login(COMMON_PROVIDERS[provider], ask_for=['email'])
   return redirect(url_for('portal_user.index'))
                          
@oid.after_login
def create_or_login(resp):
   print('in create or login')
   session['openid'] = resp.identity_url
   user = User.query.filter_by(openid=resp.identity_url).first()
   if user is not None:
      flash(u'Successfully signed in')
      g.user = user
      return redirect(url_for('portal_user.index'))
   return redirect(url_for('portal_user.create_user', next=oid.get_next_url(),
                           email=resp.email))
                           
@portal_user.route('/create-user', methods=['GET', 'POST'])
def create_user():
   print('in create user')
   if g.user is not None or 'openid' not in session:
      return redirect(url_for('portal_user.index'))
   if request.method == 'POST':
      print ('in post')
      email = request.form['email']
      if '@' not in email:
         flash(u'Error: you have to enter a valid email address')
      else:
         flash(u'Profile successfully created')
         db_session.add(User(email, session['openid']))
         db_session.commit()
         return redirect(oid.get_next_url())
   elif request.method == 'GET':
      print('in get')
      email = request.args.get('email', None)
      if '@' not in email:
         flash(u'Error: you have to enter a valid email address')
      else:
         flash(u'Profile successfully created')
         db_session.add(User(email, session['openid']))
         db_session.commit()
         return redirect(oid.get_next_url())
   print('returning')
   return redirect(url_for('portal_user.index'))
   
#@portal_user.route('/profile', methods=['GET', 'POST'])
#def edit_profile():
   #if g.user is None:
      #abort(401)
   #form = dict(email=g.user.email)
   #if request.method == 'POST':
      #if 'delete' in request.form:
         #pass
      #form['email'] = request.form['email']
      #if '@' not in form['email']:
         #flash(u'Error: you have to enter a valid email address')
      #else:
         #flash(u'Profile successfully created')
         #g.user.email = form['email']
         #db_session.commit()
         #return redirect(url_for('portal_user.edit_profile'))
   #return render_template('edit_profile.html', form=form)
   
@portal_user.route('/logout')
def logout():
   session.pop('openid', None)
   flash(u'You have been signed out')
   return redirect(oid.get_next_url())