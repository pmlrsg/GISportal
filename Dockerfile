#
#  This Dockerfile creates an image based on the contents of the current
#  folder; therefore the submodules have to be initalised and updated before 
#  the image is build. See docker-readme.md for full details
#
#  To obtain the latest image direct from the Docker Hub you can 
#  run `docker pull pmlrsg/gisportal` on the command line
#

FROM ubuntu:22.04

MAINTAINER "Pete Walker" <petwa@pml.ac.uk>

SHELL ["/bin/bash", "-c"]

# Set up OS level packages both for the core portal and for the Python based plotting
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    gcc \
    gdal-bin \
    libffi-dev \
    libfreetype-dev \
    libhdf5-dev \
    libjpeg-turbo-progs \
    libnetcdf-dev \
    redis \
    ruby \
    ruby-dev \
    wget \
    python3-pip \
    && gem install sass

# Packages required for plotting
RUN pip install bokeh \ 
	cftime \ 
	cython \ 
	jinja2 \ 
	matplotlib \ 
	netCDF4 \ 
	numpy \ 
	owslib \ 
	pandas \ 
	pathlib \ 
	pillow \ 
	pyproj \ 
	requests \ 
	scipy \ 
	shapely \ 
	tornado
	

# Portal will run as user, portal, with all files in /var/portal. We need to 
# ensure portal can always write.
RUN mkdir /var/portal \
    && useradd -d /var/portal -s /bin/bash portal \
    && cd /var/portal \
    && touch .bashrc \
    && echo '. "$HOME/.bashrc"' > .profile \
    && mkdir -p /var/portal/GISportal
RUN chown -R portal:portal /var/portal

# The rest of the install can be done as the portal user. We will use NVM to mix and match
# the node versions as required.
USER portal

RUN cd /var/portal \
    && wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash \
    && source .bashrc \
    && nvm install 6 \
    && nvm install 10 \
    && nvm alias default 6.17.1 

# Install all the node apps required
ADD --chown=portal:portal ./package.json /var/portal/GISportal/package.json

RUN cd /var/portal/GISportal \
    && source /var/portal/.bashrc \
    && npm install \
    && npm -g install grunt-cli@1.3.2 

# Pull all the portal code
ADD --chown=portal:portal . /var/portal/GISportal/

# Final grunt build of the portal itself
RUN cd /var/portal/GISportal \
    && source /var/portal/.bashrc \
    && grunt 
 
# We assume that all the config files will be in here. Normally mounted from outside Docker. 
VOLUME /var/portal/GISportal/config

WORKDIR /var/portal/GISportal
CMD ["/var/portal/GISportal/docker-run.sh"]

