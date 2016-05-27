# GIS Portal #

The [GIS portal](https://github.com/pmlrsg/GISportal) is a web-based visualisation and analysis tool for examining geospatial data that is available via Web Map Service (WMS) and Web Coverage Service (WCS)

The GIS portal was developed as part of the [European Commission FP7](http://cordis.europa.eu/projects/rcn/100881_en.html) project OpEc, and its development continues with eartH2Observe as well as other sources of development investment or sponsorship of particular features.

## Example Instances ##
> You can find a full list of example instances of the GISportal software at http://pmlrsg.github.io/GISportal

## Overview ##

The portal is composed of three parts. A web frontend written with **HTML**, **CSS** and **JavaScript**, a middleware written in **Node.js**, and a plotting and data extraction library written in **Python** that provides the analysis tools. 

### Web Frontend ###
Javascript source: **src/**  
Javascript Libs: **html/js-libs/**  
Our CSS: **src/css/** 
Our Images: **html/img/**  
HTML: **src/index.html** and **src/templates/**

### Middleware ###

Written in **Node.js**, the middleware facilitates communication between the backend **OGC WxS** services and the web frontend. 

## First Steps | Linux ##

1. **Clone Repository**  
First we need to clone the repository, and pull in the submodules 
```
git clone https://github.com/pmlrsg/GISportal.git GISportal
cd GISportal
git submodule init
git submodule update
```

2. **Install Dependencies**

    The following dependencies will need to be installed by your package manager (for example, yum). Some of the names may be different depending on your system, we use Fedora. Some may already be installed.
    ```
    yum install nodejs  npm  redis  ruby  gdal  libjpeg-turbo  freetype-devel  libpng-devel  hdf5-devel  \
        netcdf-devel  python-devel  python-pip  python-pillow-devel  python-requests  python-pandas  python-jinja2
    ```

    **A note about numpy**: Depending on your host OS and how up to date your package manager sources are you may need to update your version of numpy. For example, Centos7 currently has version 1.7.1, and Fedora 21 offers 1.8.2, however, there was a change to the way that masked arrays are handled that was introduced in version 1.8.3. You can check which version you have by running the following in Python:
    ```
    import numpy
    numpy.version.version
    print(numpy)
    ```
    This will give you the version number and the installation location. If you have **version number < 1.8.3** you will need to delete the folder where it is installed and install via `pip` which has a more recent version:
    ```
    pip install numpy
    ```
    We also need to install all the required libraries. This can be done in a few ways, the easiest using **pip**. This will probably need sudo permissions.
    ```
    pip install bokeh owslib shapely netCDF4 
    ```


3. **Build JavaScript/CSS**  

    **Install SASS**

    To compile the CSS for the project we use SASS. This relies on a ruby gem called sass.

    ```
    sudo gem install sass
    ```

    For production, JavaScript and CSS should be minifed; the application is configured to offer compressed files unless you tell it to use `dev` mode. The build mechanism uses Grunt, which first needs to be installed. 

    Make sure you have Grunt CLI tools
    ```
    npm install -g grunt-cli
    ```
    Install the Node.js application modules
    ```
    npm install
    ````
    To build in **production** mode; this uses minified javascript and CSS
    ```
    grunt
    ```
    To build in **development** mode; this uses uncompressed javascript and CSS that can easily be debugged
    ```
    grunt dev
    ```

4. **Start Redis**

    The application uses Redis to store information when the collaboration features are being used. This needs to be running in order for the application to start
    ```
    systemctl enable redis
    systemctl start redis
    ```

5. **Run the application**

    At this point you should have everything you need to start the application
    ```
    node app.js
    ```
    You can check the application is running by going to `http://localhost:6789/` This will give you basic functionality and the ability to add new WMS layers, but if you want to use the application's collaboration features and/or allow users to upload and save geometry files you will need to setup a configuration file...

6. **Creating a configuration file**
    
    The application configuration files are created in `config` and the easiest way to create one is to use the install script; run:
    ``` 
    ./install.sh
    ```
    and following the prompts to create a config file. The resulting config file will be created in `config/site_settings/<domain>/config.js` - you should keep a backup of this file. Have a look in `config_examples/config.js` for additional optional configuration options that can be used to change the behviour of your version. 

7. **On-going maintenance**

    During normal use of the application users can upload shape files, CSV files and various geometry files to identify their region of interest. Eventually, these are stored in `/config/site_settings/<domain>/user_<email_address>` but whilst they are being uploaded and converted they are stored in `uploads`. If the conversion to GeoJSON fails for any reason then the uploaded file is not deleted; you may want to periodcally delete everything from this folder.

    If a user requests a plot the resulting plot files are stored in `html/plots`; this folder can grow to be very large and you may want to periodically delete things from this directory too. During the plot creation a netCDF file is created in `/tmp` to holde the data for the requested area; these should be deleted regularly too. 

    You could add a crontab entry to cover each of these tasks:
    ```
    0 2 * * * find /path/to/GISporal/uploads/ -mtime +1 exec rm -rf {} \;
    0 2 * * * find /path/to/GISporal/html/plots -mtime +1 exec rm -rf {} \;
    0 2 * * * find /tmp -name "*.nc" -mtime +1 exec rm -rf {} \;
    ```

## Additional Indicator Information ##

To give users more information, you can set up some markdown files that can be shown on indicators.

To do this you need to create a markdown folder inside the domain level `site_settings` folder. Inside this folder you should create a folder for each of the layer tags that you want to describe further. Finally fill each tag folder with markdown files in the format: `tag_value.md` where `tag_value` is the lowercase value of the tag.


## nginx Configuration ##

The collaboration features of the GISportal use websockets to communicate between server and browser. nginx offers really good support for websockets so this is the preferred and recommended web server software; other web servers may work but not fully.

An example nginx configuration would look like this:
```
server {
    listen *:80;

    location  /. { ## Disable .htaccess and other hidden files
        return 404;
    }

    location / {
        try_files @uri @location_node;
    }

    location @location_node {
        proxy_pass http://localhost:6789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_redirect     off;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Host $server_name;
    }
}

```

## Docker ##

There is a Dockerfile that can be used to build a Docker image provided with this repository. See the [docker-readme.md] file for full details of how to do this.


Alternatively, you can use the pre-built image that is available to download from the Docker Hub
```
docker pull pmlrsg/gisportal
```

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

