# Installation script - run this to create config-server.js files in the 
# appropriate location

import os
import subprocess

def npm_install():
    subprocess.run(['npm', 'install', '--silent'])


def check_existing():
    pass


def ask_yes_no(question):
    while (True):
        response = input(f"{question}? (y/n):  ")
        if response in ["y", "Y"]:
            return True
        elif response in ["n", "N"]:
            return False
        else:
            print(f"'{response}' is not a valid answer; please respond with either 'y' for Yes or 'n' for No")


def install():
    print("Configuring your new portal...")

    #npm_install()

    domain = input("Enter the domain name (and path, without the http:// part), e.g. 'www.example.com/portal', and press [ENTER]:  ")
    nicedomain = domain.replace("/", "_")
    
    check_existing()

    ssl = ask_yes_no("Do you wish to use ssl")
    use_auth = ask_yes_no("Do you wish to setup authentication for this domain")
    if use_auth:
        if ask_yes_no("Configure Google OAuth"):
            domainonly = domain.split("/")[0]
            protocol = "http"
            if ssl: protocol = "https"
            
            print("")
            print("OAuth Settings using Google")
            print("---------------------------")
            print("If you are unfamiliar with how to setup OAuth authentication then this guide will ")
            print("help:  https://support.google.com/cloud/answer/6158849/?hl=en&authuser=0")
            print("")
            print("Go to https://console.developers.google.com/apis/credentials and create a new OAuth 2.0 client")
            print("ID for a Web Application; you will be asked for the following pieces of information: ")
            print("")
            print(f" - Authorised JavaScript origin:   {protocol}://{domainonly}")
            print(f" - Authorised redirect URIs:       {protocol}://{domain}/app/user/auth/google/callback")
            print("")        


if __name__ == "__main__":
    install()

    