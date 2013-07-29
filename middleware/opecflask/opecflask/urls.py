from views.state import portal_state, getState, setState
from views.proxy import portal_proxy, proxy
from views.wfs import portal_wfs, getWFSData
from views.wcs import portal_wcs, getWcsData

routes = [
   ((portal_proxy, ''),
      ('/proxy', proxy)
   ),
   ((portal_state, '/state'),
      ('/getstate', getState),
      ('/setstate', setState)
   ),
   ((portal_wcs, '/wcs2json'),
      ('/wcs', getWcsData)
   ),
   ((portal_wfs, '/wfs2json'),
      ('/wfs', getWFSData)
   )
]

def setup_routing(app, routes):
    """
    Registers blueprint instances and add routes all at once.
    Routes are defined using the following format:
    [
    ((blueprint_or_app_instance, url_prefix),
        ('/route1/<param>', view_function),
        ('/route2', ViewClass.as_view('view_name'),
    ),
    ...
    ]
    """
    for route in routes:
        endpoint, rules = route[0], route[1:]
        for pattern, view in rules:
            if endpoint is None:
                app.add_url_rule(pattern, view_func=view)
            else:
                endpoint[0].add_url_rule(pattern, view_func=view)
        if endpoint is not None:
            app.register_blueprint(endpoint[0], url_prefix=endpoint[1])

# Alternative method to using 'setup_routing' above
def setupBlueprints(app):
   app.register_blueprint(portal_state)
   app.register_blueprint(portal_proxy)
   app.register_blueprint(portal_wfs)
   app.register_blueprint(portal_wcs)