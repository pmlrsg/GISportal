#!/bin/bash

function getDomainInfo {
	echo ""
	echo "Enter the domain name (and path, without the http:// part), e.g. 'www.example.com/portal', and press [ENTER]: "; read -e domain; domain=${domain%/}; nicedomain=${domain//\//_};
   read -p "Do you wish to use ssl? (y/n)?" -n 1 choice2 #-
   case "$choice2" in 
     y|Y ) ssl="s";;
     * ) ssl="" ;;
   esac
   echo ""
   read -p "Do you wish to setup authentication for this domain? (y/n)?" -n 1 choice2 #-
   case "$choice2" in 
     y|Y ) auth="y";;
     * ) auth="n"; return ;;
   esac
   while [ -e config/site_settings/"$nicedomain"/config-server.js ]
   do
   	echo "That domain already has authentication, please try something else or type cancel and press [ENTER]: "; read -e domain; domain=${domain%/}; nicedomain=${domain//\//_};
   	if [ $domain == "cancel" ]
   		then
   			domain="/";
   			return
   	fi
	done
	domainonly=$(echo $domain | cut -d/ -f1);
   echo ""
   echo "Enter an admin email address (must be linked to a gmail account) and press [ENTER]: "; read -e admin_email;
   echo ""
   echo "OAuth Settings using Google"
   echo "---------------------------"
   echo "If you are unfamiliar with how to setup OAuth authentication then this guide will "
   echo "help:  https://support.google.com/cloud/answer/6158849/?hl=en&authuser=0"
   echo ""
   echo "Go to https://console.developers.google.com/apis/credentials and create a new OAuth 2.0 client"
   echo "ID for a Web Application; you will be asked for the following pieces of information: "
   echo ""
   echo " - Authorised JavaScript origin:   http$ssl://$domainonly"
   echo " - Authorised redirect URIs:       http$ssl://$domain/app/user/auth/google/callback"
   echo ""
   while [ -z $clientid ]
   do
   	echo "Enter the Client ID and press [ENTER]: "; read -e clientid;
   done
   while [ -z $clientsecret ]
   do
   	echo "Enter the Client Secret and press [ENTER]: "; read -e clientsecret;
	done
}
echo "Configuring your new portal..."

npm install --silent

while [ -z $domain ]
do
	getDomainInfo;
done

mail=
echo ""
# Add this back in when the rest of the email information is sorted
#echo "Which email service would you like to use to send collaboraiton invites? (leave blank if none) ['mailgun', 'gmail' or 'other']: "; read -e mail;

if [ -n "$mail" ]
   then
      if [ $mail == 'mailgun' ]
         then
            echo "";
            echo "Please enter a mailgun API key: "; read -e key;
            echo "Please enter a mailgun domain: "; read -e domain;
            mailconf="email{method:'$mail', mailgun_api_key: '$key', mailgun_domain: '$domain'},"
      fi

      if [ $mail == 'gmail' ] ||  [ $mail == 'other' ]
         then
            echo "";
            echo "Please enter the email address: "; read -e email;
            echo "Please enter the password: "; read -e pass;
            mailconf="email{method:'$mail', $mail_email: '$email', $mail_pass: '$pass'},"
      fi
fi


if [ ! -e config/site_settings/"$nicedomain" ]
	then
		mkdir -p config/site_settings/"$nicedomain"
fi

if [ ! -e config/site_settings/layers ]
	then
		mkdir -p config/site_settings/layers
fi

conf=false

if [ $auth == 'y' ] || [ -n "$mailconf" ]
   then
      conf=true;
fi

if [ $domain != "/" ] && [ "$conf" == true ]
   then
   TEMPLATE=$(cat config_examples/config-server-template.js);
   echo ${TEMPLATE} | sed s/DOMAIN_NAME/$nicedomain/ | \
      sed s/CLIENT_ID/$clientid/ | \
      sed s/CLIENT_SECRET/$clientsecret/ | \
      sed s_CALLBACK_http$ssl://$domain/app/user/auth/google/callback_ | \
      sed "s|EMAIL|$mailconf|" | \
      sed s/ADMINISTRATOR/$admin_email/ > config/site_settings/$nicedomain/config-server.js;
fi

if [ ! -e config/global-config-server.js ]
   then
      cp ./config_examples/global-config-server.js ./config/global-config-server.js;
      cat config_examples/global-config-server.js | sed s/SECRET/$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 150 | head -n 1)/ > config/global-config-server.js;
fi

echo "Adding the submodules from git"
git submodule init
git submodule update
# Install any dependencies that the plotting toolkit needs
# 
# e.g. 
# echo "Installing submodule dependencies"
# cd plotting 
# pip install -r requirements.txt
# cd ../

echo "Building GISportal from source files"
grunt


if [ "$SOURCE" = "docker" ]
   then
   echo ""
   echo "The installation step is complete; now run the docker container in normal node to begin using the application, e.g. run:"
   echo ""
   echo "  docker run -d -p 6789:6789 -v /usr/share/GISportal:/app/GISportal/config -t pmlrsg/gisportal"
   echo ""
fi

if [ "$SOURCE" != "docker" ]
   then
   echo ""
   echo "The configuration is complete; run the following command to start the application:"
   echo ""
   echo "node app.js"
   echo ""
fi

