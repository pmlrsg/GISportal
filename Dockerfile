#
#  This Dockerfile creates an image based on the contents of the current
#  folder; therefore the submodules have to be initalised and updated before 
#  the image is build. See docker-readme.md for full details
#
#  To obtain the latest image direct from the Docker Hub you can 
#  run `docker pull pmlrsg/gisportal` on the command line
#

FROM ubuntu:20.04

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
    python-dev \
    redis \
    ruby \
    ruby-dev \
    wget \
    && gem install sass

# Install pip as the plotting code will need to load pip packages
RUN curl https://bootstrap.pypa.io/pip/2.7/get-pip.py --output get-pip.py \
    && python2 get-pip.py

# Packages required for plotting. Very sensitive to the specific versions!
RUN pip install pillow requests pandas jinja2 matplotlib \
    'numpy==1.16' 'cython<1.5' \
    'pyproj<2.2' 'pathlib' \
    'bokeh==0.12.7' 'owslib==0.13.0' 'tornado==4.5.2' 'shapely==1.5.17' \
    scipy \
    'cftime==1.5.1.1' \
    'netCDF4==1.4.3.2'

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

