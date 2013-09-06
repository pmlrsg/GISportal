Not finished yet...

# Operational Ecology (OPEC) Portal #

The [OPEC](http://marineopec.eu/) portal is a web-based visualisation system delivering data in a form that allows for rapid 
interpretation at a regional scale to support policy implementation, environmental management and relevant commercial uses.

The OPEC portal was developed as part of the [European Commission FP7](http://cordis.europa.eu/projects/rcn/100881_en.html) project OPEC. 

## Overview ##

The portal is composed of three parts. A web frontend written with **HTML5**, **CSS3** and **JavaScript**, a middleware written in **Python**, and a backend consisting of **OGC WXS** services. 

### Web Frontend ###
Main JavaScript Location: **src/**  
Javascript Libs: **html/static/js-libs/**  
Our CSS: **html/static/css/** - To be further split out into separate files.  
Our Images: **html/static/img/**  
HTML: **html/static/index.html**

The portal consists of two pages. The main page contains the portal itself and the other is part of the OpenID login system. The main page uses jQuery and jQuery UI as its main JavaScript libraries.

Communication between the middleware and the frontend is done with AJAX directed at URLs created by Flask.

### Middleware ###

Written in **Python**, the middleware facilitates communication between the backend **OGC WXS** services and the web frontend. This is done in two parts.

#### Caching Scripts ####
Location: **middleware/cachingscripts/**

The caching scripts are used on a cron job to trim and store relevant data from any **WMS** or **WFS** servers listed in the server list. This saves the data being recreated by the client each time, enables the transfer of less data as only the relevant data is stored, stops the data provider getting swamped by requests, and enables faster response times. 

There are two scripts, one for each service, ``wmsCapabilities_2_6_6.py`` and ``wfsCapabilities.py``, as well as a server list to go along with each service. ``wmsServers.py`` is for **WMS** servers and ``wfsServers.py`` is for **WFS** servers.

Some of the data that comes back from the WXS services is not very user friendly, so two further files ``wmsLayerTags.py`` and ``wfsLayerTags.py`` help fill in and tidy up any missing data from the WXS services. These are manually configured and managed, but depending on your target audience they can be left empty.

Finally ``productFilter.csv`` and ``layerFilter.csv`` are used to filter **WMS** services. This is useful if you have a **WMS** server that has some data you wish to display on the portal, but some data you don't wish to be shown on the portal. Currently these are in csv format and only for **WMS**, but the idea in future would be to role these into the ``w*sLayerTags.py`` files, allowing for both a whitelist and a blacklist.

#### Data Processing and User Data Storage ####
Location: **middleware/opecflask/**  
Old Version: **middleware/wcs2json/**

The middleware is required to respond to requests from the web frontend. The frontend needs to be able to store data for a user to be retrieved at a later date and needs to be able to process data for the client to create graphs or other items. This is where Flask, a Python micro-framework, comes in. Flask does a lot of the heavy lifting allowing for the quick development of server-side code.

For the storage of user data a REST styled architecture is employed with JSON being used as the intermediate format. To save developing an account and login system, OpenID has been used along with an SQLite database for simplicity.

### Backend ###
To Be Completed

#### WMS ####
To Be Completed

#### WCS ####
To Be Completed

#### WFS ####
To Be Completed

## First Steps | Linux ##

1. First we need to check out the repository.  
``svn checkout http://rsg.pml.ac.uk/intranet/svnroots/opec/WP6/OpEcVis foldername``

2. Next we need to install all the required libraries. This can be done in a few ways, the easiest using **pip** and the ``requirements.txt``. There are two ``requirements.txt``, one for the libraries need to run the caching scripts
**Note:** Make sure you are in the correct directory  
``pip install -r requirements.txt``

3. Finally we need build the page and all the documentation.  
``build.py build-all``  
This will build all the jsdoc3 documentation, minify the javascript and css, and move any images to the correct locations.

## Folder Structure ##
**doc** - location where jsdoc3 will create the javadoc.  
**externs** - used with the closure compiler to provide extra info.  
**html/static** - anything that should be web accessible located here.  
**lib** - libraries used for compiling, testing and documentation.  
**middleware**  
&ensp;**cachingscripts** - contains all the Python files todo with the cachingscripts.  
&ensp;**opecflask** - contains the Python code for the data processing and data storage.  
&ensp;<del>**wcs2json**</del> - deprecated, to be deleted.  
**specs** - tests done with jasmine.  
**src** - javascript source along with some libraries that will be compiled with plovr/closure.  
&ensp;**libs**  
&ensp;**windows**



