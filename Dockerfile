#
#  This Dockerfile creates an image based on the contents of the current
#  folder; therefore the submodules have to be initalised and updated before 
#  the image is build. See docker-readme.md for full details
#
#  To obtain the latest image direct from the Docker Hub you can 
#  run `docker pull pmlrsg/gisportal` on the command line
#

# We have only tested on centos 7
FROM centos:7

MAINTAINER "Ben Calton" <bac@pml.ac.uk>

RUN yum -y update \
    && yum clean all \
    && rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7 \
    && yum install -y epel-release gcc \
    && yum install -y \
	nodejs \
        npm \
        git \
        wget \
        tar \
        redis \
        ruby \
        gdal \
        libjpeg-turbo \
        freetype-devel \
        libpng-devel \
        hdf5-devel \
        netcdf-devel \
        python-devel \
        python-pip \
        python-pillow-devel \
        python-requests \
        python-pandas \
        python-jinja2 \
        python-matplotlib \
	ruby-devel \
	libffi-devel \
	make \
    && rm -rf /usr/lib64/python2.7/site-packages/numpy*

# The correct version of numpy must be installed first to stop other packages dragging 
# the wrong one in. We picked 1.16 as it is the latest that will work with python 2.7
RUN pip install 'numpy<=1.16'

# Split into chunks to make sure it happens in the correct order
RUN pip install \
        cython \
        'netCDF4<1.5' \
        'pyproj<2.2'
RUN pip install \
        'bokeh==0.12.7' \
        owslib \
        shapely

# Use NVM to switch between versions. GISportal works on v6.7.1 but grunt requires a newer version.
# We need to make GISportal work on the newer node.
RUN curl -o /tmp/install.sh https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh \
    && bash /tmp/install.sh \
    && source /root/.nvm/nvm.sh \
    && nvm install v6.17.1 \
    && nvm install v16.2.0

RUN npm install -g grunt-cli --silent 

RUN gem install ffi --version "1.12.2" \
    && gem install rb-inotify --version '<0.10' \
    && gem install sass \
    && mkdir -p /app/GISportal/config
 
ADD ./package.json /app/GISportal/package.json

RUN cd /app/GISportal \
    && npm install

ADD . /app/GISportal/

RUN source /root/.nvm/nvm.sh \ 
    && cd /app/GISportal \
    && nvm exec v16.2.0 grunt

VOLUME /app/GISportal/config

WORKDIR /app/GISportal
CMD ["/app/GISportal/docker-run.sh"]

