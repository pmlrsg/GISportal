FROM centos:latest

MAINTAINER "Ben Calton" <bac@pml.ac.uk>

RUN yum -y update; \
    yum clean all; \
    rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7; \
    yum install -y epel-release; \
    yum install -y nodejs npm git python wget tar redis ruby python-devel gdal libjpeg-turbo freetype-devel libpng-devel hdf5-devel netcdf-devel python-pillow; \
    wget -O /tmp/get-pip.py https://bootstrap.pypa.io/get-pip.py; \
    python /tmp/get-pip.py; \
    pip install requests numpy pandas jinja2 bokeh owslib Pillow shapely netCDF4; \
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
