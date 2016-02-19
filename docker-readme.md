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
1. The first time you run the container you will need to run it interactively (the -it arguments) so that the setup script can create the config files specific to your needs
```
docker run -it pmlrsg/gisportal /app/GISportal/docker-run.sh
```
This will lead you through the interactive setp of the application including the option to specify a domain name (if you want to use one), the setup of Google as OAuth provider for authentication, and specifying administrator details
1. On subsequent runs there's no need to run interactively
```

```
