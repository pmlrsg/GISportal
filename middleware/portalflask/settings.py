DEBUG = True
DEBUG_WITH_APTANA = False

JSON_SORT_KEYS = False

SECRET_KEY = 'HWnbQHpVMAVEBvmtK9mIvem9az8j3RfMVNI4BZ8koEN1jQhfFm9DbM4Q'

OPENID_FOLDER = '/home/rsgadmin/wci.earth2observe.eu-portal/openID'
DATABASE_URI = 'sqlite:///' + OPENID_FOLDER + '/user_storage.db'


LOG_LEVEL = "DEBUG"
# This path needs changing according to local server configuration
# Leave as empty if you want the log to be in the same place as the .wsgi
LOG_PATH = ''

# The error level of logging into the database
# E for errors only or W for warnings too
ERROR_LEVEL = "W"

# section to define root folder for markdown metadata files
MARKDOWN_ROOT = "/var/www/earth2observe-GISportal/markdown"
MARKDOWN_DIRS = ['provider', 'indicator']

