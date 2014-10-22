from flask import Blueprint, current_app, abort
import os
import markdown




portal_metadata = Blueprint('metadata', __name__)




@portal_metadata.route('/metadata/<metadata_type>/<metadata_id>', methods=["get"])
def metadata(metadata_type, metadata_id):
   metadata_id = metadata_id.lower()
   if (metadata_type in current_app.config.get('MARKDOWN_DIRS')):
      markdown_dir = current_app.config.get('MARKDOWN_ROOT')
      type_dir = '%s/%s' % (markdown_dir, metadata_type)
      types = { x.lower(): x for x in os.listdir(type_dir)}
      temp_type = '%s.md' % metadata_id
      if temp_type in types:
         type_name = types[temp_type]
         with open('%s/%s' % (type_dir, type_name)) as tfile:
            text = tfile.read()
            current_app.logger.debug(text)
            html = markdown.markdown(text).replace('\n','') 
         return html
      else:
         return abort(404)

   else:
      abort(404)
      


