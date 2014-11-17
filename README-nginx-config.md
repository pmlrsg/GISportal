# nginx Configuration


```
upstream uwsgi_servers {
    server 127.0.0.1:8000;
}

upstream node_servers {
    server localhost:6789;
}

server {
    listen *:80;

    location  /. { ## Disable .htaccess and other hidden files
        return 404;
    }

    location /node/socket.io {
        try_files @uri @location_socketio;
    }

    location /socket.io {
        try_files @uri @location_socketio;
    }

    location /node {
        try_files @uri @location_node;
    }

    # handle middleware requests and send them to the uwsgi proxy
    location /service {
        try_files @uri @location_middleware;
    }

    # any request that hasn't been matched to a location is just plain old html/css/js/images, so it can go 
    # to the default location
    location / {
        try_files @uri @location_html;
    }

    error_page 403 /403.html;
    error_page 401 /403.html;
    location = /403.html {
        root /etc/nginx/html;
        internal;
    }

    location @location_middleware {
	# rewrite request path to take the /service part
	rewrite ^/service/(.*) /$1 break;
	
        # the upstream server group to pass the request to
        include uwsgi_params;
        uwsgi_pass uwsgi_servers;

	proxy_redirect     off;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Host $server_name;

        # make sure we use HTTP1.1 and connection set to nothing so that keepalive works
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # set the correct header; without this the server names from the upstream servers are visible to the client
        proxy_set_header Host   $host;
	
    }

    location @location_html {
        root /var/www/pmlrsg-GISportal/html;

    }

    location @location_node {
    	proxy_pass http://node_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location @location_socketio {
        # rewrite request path to take the /node part
        rewrite ^/node/(.*) /$1 break;

        proxy_pass http://node_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

    }
}

