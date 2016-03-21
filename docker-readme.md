## To create a Docker image and run the application

1. **Clone the repository and the submodules**

    From inside the GISportal git clone directory, make sure you have the submodules initialised and updated

    ```
    git submodule init
    git submodule update
    ```

2. **Create the Docker image**

    Use the following command to create a Docker image using the Dockerfile

    ```
    docker build -t pmlrsg/gisportal .
    ```

3.  **Run the installation script**

    The first time you run the container you will need to run it interactively (the `-i` arguments) so that the setup script can create the config files specific to your needs. The config files will be created in a volume that is stored on the host machine (so they can be backed up); the `-v` argument specifies where the folder is on the host machine. In this example the foler on the host machine, which must exist prior to running this command, is `/usr/share/GISportal`

    ```
    mkdir -p /usr/share/GISportal
    docker run -v /usr/share/GISportal:/app/GISportal/config -it pmlrsg/gisportal /app/GISportal/docker-install.sh
    ```

    This will lead you through the interactive setp of the application including the option to specify a domain name (if you want to use one), the setup of Google as OAuth provider for authentication, and specifying administrator details

4. **Run the container**

    On subsequent runs there's no need to run interactively; the portal will be accessible at http://localhost:6789/

    ```
    docker run -d -p 6789:6789 -v /usr/share/GISportal:/app/GISportal/config -t pmlrsg/gisportal
    ```

## Running GISportal with nginx ##
  
You can run a standard installation of nginx and use the `proxy_pass` command to proxy requests to your GISportal container running on port 6789; see the main README.md for details. Alternatively, you can use an nginx docker container using the following commands:

```
docker pull jwilder/nginx-proxy
docker run -d -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy
docker run -d -p 6789:6789 -v /usr/share/GISportal:/app/GISportal/config -e VIRTUAL_HOST=<your-required-hostname> -e VIRTUAL_PORT=6789 -t pmlrsg/gisportal
```

