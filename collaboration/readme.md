# Collaboration Setup

## Installation
This setup document assumes that you already have **node.js** and **Redis** installed on your server; if you don't have it installed you will need to do this first. 

In this directory run
```
npm install
```
this will install all the necessary node modules into a folder called `node_modules`. 

## Configuration
### Google OAuth Settings
You will need to create a Project in the Google Developers Console to allow the collaboration application to authorise users. To do this:

1. Got to https://console.developers.google.com and login
2. Create a new Project; give the project a name and ID, and agree to the terms and conditions.
3. Once the project has been created click on the project name to view the project dashboard.
4. From the menu on the left of the project dashboard select **APIs & auth** > **Credentials**
5. Under the OAuth heading click the **Create new Client ID** button
6. Leave the Application Type as **Web Application**
7. Set the **Authorised Javascript Origins** value to the URL that your application will run on
8. Set the **Authorised Redirect URI** value to the URL on the callback function; the callback function is `/node/auth/google/callback` so the value you need to enter would be `https://www.example.com/node/auth/google/callback`
9. Click the **Create Client ID** to save the details; the new client ID details will be shown on the screen and you will need to add these to the application's configuration file

### Edit the configuration file
Edit the configuration file in `collaboration/config/config.json` and copy the `clientid`, `clientsecret` and `callback` values from the Google Developers Console into the appropriate locations. 

The `scope` value denotes what information Google returns once the user has been authenticated; see https://developers.google.com/+/api/oauth#scopes for more detailed information about which scopes are available and what information they return. For the purposes of this application `userinfo.email` is sufficient but you may want to ask for more information if you want to extend the functionality currently offered.

Set a long random string for the `session.secret` value; this is used to encrypt the cookie. The `session.age` setting denotes how long the cookie is valid for in seconds; setting this to `0` will means that only a session cookie is set.

### Apache Config
If you are using Apache to serve the application you will need to configure this to proxy all HTTP requests where the request path starts with `/node` or `/socket.io/` and all websocket requests to the node.js application. To do this, first make sure that you have the `mod_proxy` and `mod_proxy_wstunnel` modules installed and enabled; on a Red Hat/Fedora/Centos system you can run `apachectl -M | grep proxy` and if you see `proxy_module` and `proxy_wstunnel_module` in the results you're good to go, if not you will need to install/enable them.

In the virtual host configuration file add the following:
```
  ProxyPass /socket.io/1/websocket/ ws://localhost:6789/socket.io/1/websocket/
  ProxyPass /socket.io/ http://localhost:6789/socket.io/
  ProxyPass /node/ http://localhost:6789/node/
```
This assumes that the node.js application is running on the same machine as Apache, if not you will need to replace `localhost` with the appropriate URL or IP address. The port number should match the `app.port` setting in the config file.

### Changes to passport-google-oauth
A minor tweak was made the Google OAuth module to ensure that the user always sees the select account option at login; this way the user can choose which Google account to authorise for use with the application rather than just using the currently logged in account. 

Around line 137 of `node_modules/passport-google-oauth/lib/passport-google-oauth/oauth2.js` 
```
return params;
``` 
becomes...
```
params['prompt'] = 'select_account';
return params;
```