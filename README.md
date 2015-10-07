# GIS Portal #

The [GIS portal](https://github.com/pmlrsg/GISportal) is a web-based visualisation system delivering data in a form that allows for rapid interpretation at a regional scale to support policy implementation, environmental management and relevant commercial uses.

The GIS portal was developed as part of the [European Commission FP7](http://cordis.europa.eu/projects/rcn/100881_en.html) project OPEC. 

## Overview ##

The portal is composed of three parts. A web frontend written with **HTML**, **CSS** and **JavaScript**, a middleware written in **Python**, and a backend consisting of **OGC WXS** services. 

### Web Frontend ###
Main JavaScript Location: **src/**  
Javascript Libs: **html/js-libs/**  
Our CSS: **html/css/** - To be further split out into separate files.  
Our Images: **html/img/**  
HTML: **html/index.html**

The portal consists of two pages. The main page contains the portal itself and the other is part of the OpenID login system. The main page uses jQuery and jQuery UI as its main JavaScript libraries.

Communication between the middleware and the frontend is done with AJAX directed at URLs created by Flask.

### Middleware ###

Written in **Python**, the middleware facilitates communication between the backend **OGC WXS** services and the web frontend. This is done in two parts.

#### Caching Scripts ####
Location: **cachingscripts/**

The caching scripts can be used on a cron job store and update relevant data from any **WMS** or **WFS** servers listed in the server list. This saves the data being recreated by the client each time, enables the transfer of less data as only the relevant data is stored, stops the data provider getting swamped by requests, and enables faster response times.

There are two scripts, one for each service, ``wmsCapabilities.py`` and ``wfsCapabilities.py``, as well as a server list to go along with each service. ``wmsServers.py`` is for **WMS** servers and ``wfsServers.py`` is for **WFS** servers.

Some of the data that comes back from the WXS services is not very user friendly, so two further files ``wmsLayerTags.py`` and ``wfsLayerTags.py`` help fill in and tidy up any missing data from the WXS services. These are manually configured and managed, but depending on your target audience they can be left empty.

#### Data Processing and User Data Storage ####
Location: **middleware/portalflask/**

The middleware is required to respond to requests from the web frontend. The frontend needs to be able to store data for a user to be retrieved at a later date and needs to be able to process data for the client to create graphs or other items. This is where Flask, a Python micro-framework, comes in. Flask does a lot of the heavy lifting allowing for the quick development of server-side code.

For the storage of user data a REST styled architecture is employed with JSON being used as the intermediate format. To save developing an account and login system, OpenID has been used along with an SQLite database for simplicity.

## First Steps | Linux ##

1. **Clone Repository**  
First we need to clone the repository. 
``git clone https://github.com/pmlrsg/GISportal.git``

2. **Install Dependencies**
The following dependencies will need to be installed by your package manager (for example, yum). Some of the names may be different depending on your system, we use Fedora. Some may already be installed.
``httpd mod_wsgi python-devel numpy netcdf-devel libyaml libxml libxslt-devel openssl-devel gcc``
We also need to install all the required libraries. This can be done in a few ways, the easiest using **pip** and the ``requirements.txt``. This may need sudo permissions.
``pip install -r middleware/requirements.txt``
Finally we need autoprefixer from NPM, this will allow the portal to be run in IE9 and other older browsers
``npm install -g autoprefixer``

3. **Build JavaScript/CSS**  
For production, JavaScript and CSS need to be minifed. This is done with a build script. This will build all the jsdoc3 documentation, minify the javascript and css, and move any images to the correct locations.
``python build.py --clean``
``python build.py build``

For development, you still need to run the build script but without minification.

``python build.py --clean``
``python build.py dev``
**Notes**  
Java 7 is required for the build process.  
Make sure you are in the same directory as ``build.py``.  
Edit ``config/config.js`` and change ``siteMode`` from ``development`` to ``production``.

4. **Create database**  
Make sure you are in ``middleware/portalflask``  
Run ``python manage.py syncdb`` as apache (or make accessible to apache) to create the database.

5. **Tell Apache About The WSGI File**  
In the Apache ``.conf`` file you need to add these lines and change any paths to match your system.  
**Notes**  
This step assumes you have already setup the **wsgi_module** for apache. If not you will need to install it using your package manager (ie. ``sudo yum install mod_wsgi``).

        WSGIScriptAlias /service  "/var/www/middleware/gisportal.wsgi"
        WSGIDaemonProcess portalflask user=apache group=apache processes=5 threads=10 maximum-requests=1000 umask=0007

        <Directory "/var/www/middleware/">
            WSGIProcessGroup portalflask
            WSGIApplicationGroup %{GLOBAL}
            Order deny,allow 
        
            Require all granted
        </Directory>
**Using SSL**
If you intend to make the portal accessible using SSL the WSGIProcessGroup mut be unique for the whole server; e.g. change ``portalflask`` to ``portalflask_ssl``

6. **Reload Apache**  
Apache runs an instance of the application and does not auto reload on any changes. The easiest way depending on your setup is to reload the Apache configs and then touch the ``.wsgi`` file for any changes made in future.  
`sudo service httpd reload` - reload Apache configs  
`touch gisportal.wsgi` - touching the file will restart the daemon process  
**Notes**  
It is very likely that the commands for apache will be different for you depending on what platform you are using and your setup.

## Folder Structure ##
**doc** - location where jsdoc3 will create the documentation.  
**externs** - used with the closure compiler to provide extra info.  
**html/static** - anything that should be web accessible located here.  
**lib** - libraries used for compiling, testing and documentation.  
**middleware**  
&ensp;**cachingscripts** - contains all the Python files todo with the cachingscripts.  
&ensp;**portalflask** - contains the Python code for the data processing and data storage.
**src** - javascript source along with some libraries that will be compiled with plovr/closure.  
&ensp;**libs**  
&ensp;**windows**


## Fedora 19 ##
These are the exact steps we use to install the GIS Portal on a fresh Fedora 19 installation. You may have some of the dependancies already and some steps you might be able to skip (for eample if SELinux is already permissive).

    sudo yum install httpd mod_wsgi
    sudo service httpd enable
    sudo service httpd start
    
    sudo yum install python-devel numpy netcdf-devel libyaml libxml libxslt-devel openssl-devel gcc
    sudo pip install -r middleware/requirements.txt
    
    mkdir config
    cp config_examples/* config/
    mkdir html/cache
    mkdir html/cache/layers
    mkdir html/cache/openID
    mkdir html/cache/openID/associations
    mkdir html/cache/openID/nonces
    mkdir html/cache/openID/temp
    
    sudo chown -R apache:apache html/cache/openID/
    
    # The WSGI code needs to be placed into /etc/httpd/conf/httpd.conf
    WSGIScriptAlias /service  "/var/www/middleware/gisportal.wsgi"
    WSGIDaemonProcess portalflask user=apache group=apache processes=5 threads=10 maximum-requests=1000 umask=0007
    
    <Directory "/var/www/middleware/">
        WSGIProcessGroup portalflask
        WSGIApplicationGroup %{GLOBAL}
        Order deny,allow 
    
        Require all granted
    </Directory>


    # Some of these settings may needs changing depending on your setup
    cp config_examples/settings.py middleware/portalflask/settings.py
    
    # Change OPENID_FOLDER to a path correct to your machine
    vi middleware/portalflask/settings.py
    
    python middleware/manage.py syncdb
    
    SELinux must be permissive
    setenforce 0
    
    ./clearcache
    
    sudo service httpd restart

## Analytics ##

**Enabling basic GA**

Go to `config/config.js` and set `gisportal.config.analytics.active` to `true` and `gisportal.config.analytics.UATrackingId` to the tracking code of the project. Basic tracking is now enabled.

**Setting up Custom Definations**

For a deeper level of tracking custom definations needs to be setup. For this you need to go into the google analytics admin and select Custom Definitions under the property column.

**Custom Dimensions**
Start by clicking Custom Dimensions and creating a new custom dimesion labeled Indicator Name.   
Procede to make this list **IN THIS ORDER**:  
- Indicator Name
- Indicator ID
- Region
- Interval
- Elevation
- Layer Style
- Graph type
- Confidence
- Year
- Click Location

**Custom Metrics**
In the left hand panel select Custom Metrics and again make the following in the same order:
- Used in graph
- Used in layer


If you had no previous metrics or dimensions installed and you added them in the listed order analytics is now setup.

**Follow this section only if you already had custom metrics made or didnt make them in that order:**  
Each custom definiation has a unique index.`cm[0-9][0-9]` for `Custom Metrics` and `cd[0-9][0-9]` for `Custom Dimensions`.
Indexes can not be changed. The current config file was expecting the definition names to be next to certain indexes.
Go over each custom definition key in the config file and change it the one in your analytics account.

**Currently mapped names:**  
***Dimenstions:***  
 #cd1 - Indicator Name  
 #cd2 - Indicator ID  
 #cd3 - Region  
 #cd4 - Interval  
 #cd5 - Elevation  
 #cd6 - Layer Style  
 #cd7 - Graph type  
 #cd8 - Confidence  
 #cd9 - Year   
 #cd10 - Click Location  
 #cd11 - Indicator Provider  

***Metrics:***  
 #cm1 - Used in graph  
 #cm2 - Used in layer 
