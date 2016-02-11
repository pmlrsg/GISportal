#!/bin/bash
function getDomainInfo {
	read -p "Do you wish to use ssl? (y/n)?" -n 1 choice2 #-
	case "$choice2" in 
	  y|Y ) ssl="s";;
	  * ) ssl="" ;;
	esac
	echo
   echo -n "Enter the domain name and press [ENTER]: "; read domain;
   echo -n "Enter an admin email address and press [ENTER]: "; read admin_email;
   echo "Do this cool thing and give us the clientid and clientsecret :: http$ssl://$domain/app/user/auth/google/callback"
   echo -n "Enter the clientid and press [ENTER]: "; read clientid;
   echo -n "Enter the clientsecret and press [ENTER]: "; read clientsecret;
}
echo "Configuring your new portal..."

npm install

while [ -z $domain ]
do
read -p "Do you wish to setup a domain now? (y/n)?" -n 1 choice #-
case "$choice" in 
  y|Y ) echo; getDomainInfo;;
  n|N ) domain="/" ;;
  * ) echo; echo "Please choose y or n";;
esac
done

if [ ! -e config/site_settings/"$domain" ]
	then
		mkdir -p config/site_settings/"$domain";
fi

if [ ! -e config/site_settings/layers ]
	then
		mkdir -p config/site_settings/layers;
fi

if [ $domain != "/" ]
	then
		echo "GLOBAL.config['$domain'] = {">>config/site_settings/"$domain"/config-server.js
		echo "   // Application settings">>config/site_settings/"$domain"/config-server.js
		echo "   app: {">>config/site_settings/"$domain"/config-server.js
		echo "      // the port that the application will run on">>config/site_settings/"$domain"/config-server.js
		echo "      port: 6789,">>config/site_settings/"$domain"/config-server.js
		echo "   },">>config/site_settings/"$domain"/config-server.js
		echo "   // redis connection settings">>config/site_settings/"$domain"/config-server.js
		echo "   redisURL: 'http$ssl://localhost:6379/',">>config/site_settings/"$domain"/config-server.js
		echo "   // OAuth2 settings from Google, plus others if applicable">>config/site_settings/"$domain"/config-server.js
		echo "   auth: {">>config/site_settings/"$domain"/config-server.js
		echo "      google: {">>config/site_settings/"$domain"/config-server.js
		echo "         scope : 'https://www.googleapis.com/auth/userinfo.email',">>config/site_settings/"$domain"/config-server.js
		echo "         clientid : '$clientid',">>config/site_settings/"$domain"/config-server.js
		echo "         clientsecret : '$clientsecret',">>config/site_settings/"$domain"/config-server.js
		echo "         callback : 'http$ssl://$domain/app/user/auth/google/callback',">>config/site_settings/"$domain"/config-server.js
		echo "         prompt: 'select_account'">>config/site_settings/"$domain"/config-server.js
		echo "      }">>config/site_settings/"$domain"/config-server.js
		echo "   },">>config/site_settings/"$domain"/config-server.js
		echo "   // session settings">>config/site_settings/"$domain"/config-server.js
		echo "   session : {">>config/site_settings/"$domain"/config-server.js
		echo "      // ssssh! it's secret (any randon string to keep prying eyes from seeing the content of the cookie)">>config/site_settings/"$domain"/config-server.js
		echo "      secret : '$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 50 | head -n 1)',">>config/site_settings/"$domain"/config-server.js
		echo "      // the age in seconds that the cookie should persist; 0 == session cookie that expires when the browser is closed">>config/site_settings/"$domain"/config-server.js
		echo "      age : 0">>config/site_settings/"$domain"/config-server.js
		echo "   },">>config/site_settings/"$domain"/config-server.js
		echo "   admins:[">>config/site_settings/"$domain"/config-server.js
		echo "      '$admin_email'">>config/site_settings/"$domain"/config-server.js
		echo "   ]">>config/site_settings/"$domain"/config-server.js
		echo "}">>config/site_settings/"$domain"/config-server.js
fi


if [ ! -e config/config-server.js ]
	then
		cp ./config_examples/config-server.js ./config/config-server.js;
fi
if [ ! -e config/base_config.js ]
	then
		cp ./config_examples/base_config.js ./config/base_config.js;
fi
if [ ! -e config/analytics_config.js ]
	then
		cp ./config_examples/analytics_config.js ./config/analytics_config.js;
fi

grunt dev
node app.js