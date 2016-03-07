== To create a Docker image and run the application

1. Clone the repository and the submodule(s)
```
git clone https://gitlab.rsg.pml.ac.uk/web-development/GISportal /path/where/you/want/GISportal
cd !$
git submodule init
git submodule update
```
1. Create the Docker image from the Dockerfile
```
docker build -t pmlrsg/gisportal .
```
1. The first time you run the container you will need to run it interactively (the `-it` arguments) so that the setup script can create the config files specific to your needs. The config files will be created in a volume that is stored on the host machine (so they can be backed up); the `-v` argument specifies where the folder is on the host machine. In this example the foler on the host machine, which must exist prior to running this command, is `/usr/share/GISportal`
```
mkdir -p /usr/share/GISportal
docker run -v /usr/share/GISportal:/app/GISportal/config -it pmlrsg/gisportal /app/GISportal/docker-install.sh
```
This will lead you through the interactive setp of the application including the option to specify a domain name (if you want to use one), the setup of Google as OAuth provider for authentication, and specifying administrator details
1. On subsequent runs there's no need to run interactively; the portal will be accessible at http://localhost:6789/
```
docker run -d -p 6789:6789 -v /usr/share/GISportal:/app/GISportal/config pmlrsg/gisportal
```

== Running GISportal with nginx
You can run a standard installation of nginx and use the `proxy_pass` command to proxy requests to your GISportal container running on port 6789. Alternatively, you can use a nginx docker container using the following commands:
```
docker pull jwilder/nginx-proxy
docker run -d -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy
docker run -d -p 6789:6789 -v /usr/share/GISportal:/app/GISportal/config -e VIRTUAL_HOST=<your-required-hostname> -e VIRTUAL_PORT=6789 -t pmlrsg/gisportal
```

