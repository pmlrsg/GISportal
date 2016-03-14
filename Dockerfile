#
#  This Dockerfile creates an image based on the contents of the current
#  folder; therefore the submodules have to be initalised and updated before 
#  the image is build. See docker-readme.md for full details
#
#  To obtain the latest image direct from the Docker Hub you can 
#  run `docker pull pmlrsg/gisporta` on the command line
#

FROM centos:latest

MAINTAINER "Ben Calton" <bac@pml.ac.uk>

RUN yum -y update && \
    yum clean all && \
    rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7 && \
    yum install -y epel-release gcc && \
    yum install -y python-devel python-pip && \
    pip install numpy && \
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
        python-pillow-devel \
        python-requests \
        python-pandas \
        python-jinja2 \
        python-matplotlib && \
    pip install bokeh owslib shapely netCDF4 && \
    npm install -g grunt-cli --silent && \
    gem install sass && \
    mkdir -p /app/GISportal/config /app/GISportal/html/plots
 
ADD . /app/GISportal/

RUN cd /app/GISportal && \
    npm install --silent && \
    grunt  

VOLUME /app/GISportal/config

EXPOSE 6789
WORKDIR /app/GISportal

CMD ["/app/GISportal/docker-run.sh"]
