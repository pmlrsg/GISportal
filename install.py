# Installation script - run this to create config-server.js files in the 
# appropriate location

import json
import os
import random
import shutil
import string
import subprocess
import sys

def npm_install():
    subprocess.run(['npm', 'install', '--silent'])


def check_existing(config_file: str) -> bool:
    if os.path.exists(config_file):
        print(f"\033[1;31;40m A config file already exists for the selected site ({config_file})\033[0m")
        print("You can edit this file directly or remove it to re-create a fresh configuration. If you")
        print("choose to remove it, it's best to make a backup first")
        sys.exit(os.EX_DATAERR)
    return True


def ask_yes_no(question: str) -> bool:
    while (True):
        response = input(f"{question} (y/n):  \n")
        if response in ["y", "Y"]:
            return True
        elif response in ["n", "N"]:
            return False
        else:
            print(f"'{response}' is not a valid answer; please respond with either 'y' for Yes or 'n' for No")


def ask_text_required(question: str) -> str:
    while (True):
        response = input(f"{question}:  \n")
        if (response != ""):
            return response
        else:
            print("A response is required, please try again...")


def ask_text_optional(question: str) -> str:
    return input(f"{question}?:  \n")


def ask_text_list(question: str) -> list:
    return_list = []
    print(f'{question}: \nEnter as many items as needed; leave blank to finish the list')
    while (True):
        response = input('-: ')
        if response != "":
            return_list.append(response)
        else:
            return return_list
        

def install():
    print("Configuring your new portal...")

    # install node modules:
    npm_install()

    # copy global server config if it doesn't already exist
    global_config = os.path.join('config', 'global-config-server.js')
    if not os.path.exists(global_config):
        shutil.copyfile(os.path.join('config_examples', 'global-config-server.js'), global_config)
        with open(global_config, 'r') as file:
            filedata = file.read()

        filedata = filedata.replace('SECRET', ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=128)))

        with open(global_config, 'w') as file:
            file.write(filedata)
            file.close()

    config = {
       'session' : {
            'secret' : ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=128)),
            'age' : 0
        },
        'logDir': 'logs',
        'auth': {}
    }

    domain = input("Enter the domain name (and path, without the http:// part), e.g. 'www.example.com/portal', and press [ENTER]:  \n")
    nicedomain = domain.replace("/", "_")
    domainonly = domain.split("/")[0]
    config_file = os.path.join('config', 'site_settings', nicedomain, 'config-server.js')

    check_existing(config_file)

    use_auth = ask_yes_no("Do you wish to setup authentication for this domain?")
    auth_configured = False

    if use_auth:
        print("")
        print("TLS/SSL Settings")
        print("----------------")
        print("For authentication to function properly you will need to configure access to the application to use a TLS/SSL")
        print("certificate; the configuration of Apache/nginx is not covered by this install script ")
        print("")
        input("I understand: press [Enter]")
        print("")

        admin_email = ask_text_list("Please provide the email addresses of site administrators one address at a time")
        config['admins'] = admin_email

        if ask_yes_no("Configure Google OAuth"):
            print("")
            print("OAuth Settings using Google")
            print("---------------------------")
            print("If you are unfamiliar with how to setup OAuth authentication then this guide will ")
            print("help:  https://support.google.com/cloud/answer/6158849/?hl=en&authuser=0")
            print("")
            print("Go to https://console.developers.google.com/apis/credentials and create a new OAuth 2.0 client")
            print("ID for a Web Application; you will be asked for the following pieces of information: ")
            print("")
            print(f" - Authorised JavaScript origin:   https://{domainonly}")
            print(f" - Authorised redirect URIs:       https://{domain}/app/user/auth/google/callback")
            print("")  

            clientid = ask_text_required("Enter the Client ID")
            clientsecret = ask_text_required("Enter the Client Secret")
            config['auth']['google'] = {
                'scope' : 'https://www.googleapis.com/auth/userinfo.email',
                'clientid' : clientid,
                'clientsecret' : clientsecret, 
                'callback' : f'https://{domain}/app/user/auth/google/callback',
                'prompt': 'select_account'
            }
            auth_configured = True
            print(u'\033[1;32;40m\u2713 Google OAuth config complete \033[0m')
            print("")
        
        if ask_yes_no("Configure SAML authentication"):
            print("")
            print("SAML settings")
            print("-------------")
            print("During the setup process of SAML-based sign-on the provider will require some information about")
            print("the application; the details they require are:")
            print("")
            print(f" - Identifer (Entity ID):                         a unique name, e.g. gisportal-saml")
            print(f" - Reply URL or Assertion Consumer Service URL:   https://{domain}/app/user/auth/saml/callback")
            print(f" - Sign on URL:                                   https://{domain}/app/user/auth/saml")
            print(f" - Relay State:                                   https://{domain}/")
            print(f" - Logout URL:                                    https://{domain}/app/user/logout")
            print("")

            issuer = ask_text_required("What is the application Identifer (Entity ID)?")
            entry_point = ask_text_required("What is the URL of the SAML entry point?")
            certificate = ask_text_required("Enter the SAML provider's certificate for this application")
            login_button = ask_text_required("What is the URL/Path to the login button image? This can be a full URL or local path, e.g. '/img/sign-in-with-microsoft.png'")

            config['auth']['saml'] = {
                'issuer': issuer,
                'callbackUrl': f'https://{domain}/app/user/auth/saml/callback',
                'entryPoint': entry_point,
                'cert': certificate,
                'loginButton': login_button
            }
            auth_configured = True
            print(u'\033[1;32;40m\u2713 SAML config complete \033[0m')
            print("")

        if auth_configured and ask_yes_no("Do you want to require users to login before they access the application?"):
            config['auth']['requireAuthBeforeAccess'] = True
            if ask_yes_no("Do you want to restrict access to the application to a defined set of users?"):
                allowed_users = ask_text_list("Please enter the email address of allowed users one at a time; you do not need to add site administrators to this list, they are automatically allowed")
                config['auth']['specificUsersOnly'] = allowed_users

        
    if ask_yes_no("Do you want to create API tokens to allow access to the application?"):
        config['tokens'] = {}
        api_users = ask_text_list("Please enter the email addresses of API users one at a time")
        for email in api_users:
            token = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=36))
            config['tokens'][token] = email

    print("")
    print("Application styling")
    print("-------------------")
    print("The application is provided with a range of stylesheets; which stylesheet would you like to use?")

    ss = {
        'GISportal': 'Purple (default)',
        'GISportal_modellers': 'YInMn Blue',
        'GISportal-marine-eo': 'Paynes Blue',
        'GISportal_petrel': 'Petrel'
    }
    for index, key in enumerate(ss.keys()):
        print(f" {index+1}: {ss[key]}")
    print("")
    stylesheet = input("Select stylesheet number [1-4] or press [Enter] for default:  ")
    if stylesheet != "" and stylesheet in ['1','2','3','4']:
        config['cssFile'] = list(ss.keys())[int(stylesheet)-1]
    else:
        config['cssFile'] = list(ss.keys())[0]

    # make sure we have a correctly name folder to receive the file
    os.makedirs(os.path.join('config', 'site_settings', nicedomain), exist_ok=True)
    # save the config file
    f = open(config_file, 'x')
    f.write(f"global.config['{nicedomain}'] = {json.dumps(config, indent='  ')}")
    f.close()

    print(u"\033[1;32;40m\u2713 Installation is complete \033[0m")
    print(f"the configuration file has been saved in '{config_file}'")
    print("")


if __name__ == "__main__":
    try:
        install()
    except KeyboardInterrupt:
        print('\nInstallation cancelled')
        try:
            sys.exit(130)
        except SystemExit:
            os._exit(130)

    