FROM ubuntu:20.04

LABEL maintainer="Pete Walker <petwa@pml.ac.uk>"

SHELL ["/bin/bash", "-c"]

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
    libxml2-dev \
    libxslt-dev \
    python3 python3-dev python3-pip \
    redis \
    wget



# Make python3 the default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1
RUN update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1

# Python packages (Python-3-compatible versions only)
RUN pip install --upgrade pip
# Ruby + Sass for grunt-contrib-sass (legacy Sass fix)
RUN apt-get update && apt-get install -y ruby-full ruby-sass

RUN pip install \
    pillow \
    requests \
    pandas \
    jinja2 \
    matplotlib \
    numpy \
    cython \
    pyproj \
    pathlib \
    bokeh \
    owslib \
    tornado \
    shapely \
    scipy \
    cftime \
    netCDF4

# Portal user setup
RUN mkdir /var/portal \
    && useradd -d /var/portal -s /bin/bash portal \
    && cd /var/portal \
    && touch .bashrc \
    && echo '. "$HOME/.bashrc"' > .profile \
    && mkdir -p /var/portal/GISportal
RUN chown -R portal:portal /var/portal

USER portal

# NVM + Node
RUN cd /var/portal \
    && wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash \
    && source .bashrc \
    && nvm install 6 \
    && nvm install 10 \
    && nvm alias default 6.17.1

# Node dependencies
ADD --chown=portal:portal ./package.json /var/portal/GISportal/package.json

RUN cd /var/portal/GISportal \
    && source /var/portal/.bashrc \
    && npm install \
    && npm -g install grunt-cli@1.3.2

# Add all code
ADD --chown=portal:portal . /var/portal/GISportal/

# Final build
RUN cd /var/portal/GISportal \
    && source /var/portal/.bashrc \
    && grunt

VOLUME /var/portal/GISportal/config

WORKDIR /var/portal/GISportal
CMD ["/var/portal/GISportal/docker-run.sh"]
