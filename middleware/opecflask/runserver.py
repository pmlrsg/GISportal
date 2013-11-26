from opecflask import create_app

app, database = create_app(path='/var/www/html/opec/middleware/opecflask/')

if app.debug: use_debugger = True
try:
   use_debugger = not(app.config.get('DEBUG_WITH_APTANA'))
except:
   pass
   
app.run(use_debugger=use_debugger, debug=app.debug,
        use_reloader=use_debugger, host='0.0.0.0')