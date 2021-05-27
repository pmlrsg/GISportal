#
#  This Dockerfile creates an image based on the contents of the current
#  folder; therefore the submodules have to be initalised and updated before 
#  the image is build. See docker-readme.md for full details
#
#  To obtain the latest image direct from the Docker Hub you can 
#  run `docker pull pmlrsg/gisportal` on the command line
#

FROM centos:7

MAINTAINER "Ben Calton" <bac@pml.ac.uk>

RUN yum -y update && \
    yum clean all && \
    rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7 && \
    yum install -y epel-release gcc && \
    yum install -y nodejs \
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
        python-matplotlib

RUN pip install cython
RUN pip install 'netCDF4<1.5'
RUN pip install 'pyproj<2.2'

RUN rm -rf /usr/lib64/python2.7/site-packages/numpy* && \
    pip install 'numpy<=1.16' 'bokeh==0.12.7' owslib shapely netCDF4 && \
    npm install -g grunt-cli --silent 

RUN yum -y install ruby-devel libffi-devel make
RUN gem install ffi --version "1.12.2"
RUN gem install rb-inotify --version '<0.10'
RUN gem install sass && \
    mkdir -p /app/GISportal/config
 
ADD ./package.json /app/GISportal/package.json

RUN cd /app/GISportal && \
    npm install --silent

ADD . /app/GISportal/

VOLUME /app/GISportal/config

EXPOSE 6789
WORKDIR /app/GISportal

CMD ["/app/GISportal/docker-run.sh"]

