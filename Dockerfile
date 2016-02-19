FROM centos:latest

MAINTAINER "Ben Calton" <bac@pml.ac.uk>

RUN yum -y update; \
    yum clean all; \
    rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7; \
    yum install -y epel-release; \
    yum install -y nodejs npm git python wget tar redis ruby; \
    npm install -g grunt-cli --silent && \
    gem install sass && \
    mkdir -p /app/GISportal/config 
ADD . /app/GISportal/
RUN cd /app/GISportal && \
    npm install --silent && \
    grunt  

# Use node-forever to keep it going when things go pete tong

VOLUME ["/app/GISportal/config" ]

EXPOSE 6789
CMD ["/app/GISportal/docker-run.sh"]
