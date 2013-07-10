#!/usr/bin/env python

from cStringIO import StringIO
from glob import iglob
import gzip
import os
import re
import shutil
import sys
import json
import string
import codecs

from pake import Target, ifind, main, output, rule, target, variables, virtual

# Change the python working directory to be where this script is located
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

if sys.platform == 'win32':
   variables.JAVA = 'C:/Program Files/Java/jre7/bin/java.exe'
   variables.PYTHON = 'C:/Python27/python.exe'
else:
   variables.JAVA = 'java'
   variables.PYTHON = 'python'

SPEC = [path
        for path in ifind('specs')
        if path.endswith('.js')]

SRC = [path
       for path in ifind('src')
       if path.endswith('.js')]

HTML = [path 
        for path in ifind('src/html')
        if path.endswith('.html')]

# Reorder to move opecportal.js to the front
SRC.remove('src/opecportal.js')
SRC.insert(0, 'src/opecportal.js')
SRC.remove('src/opec.js')
SRC.append('src/opec.js')

JSDOC = 'lib/jsdoc/jsdoc'
PLOVR_JAR = 'lib/plovr/plovr-eba786b34df9.jar'
UGLIFYJS = '/local1/data/scratch/node-v0.8.18-linux-x64/node_modules/uglifyjs/bin/uglifyjs'
YUICOMPRESSOR = 'lib/yuicompressor-2.4.7/build/yuicompressor-2.4.7.jar'
CSS = 'html/static/css/'

def report_sizes(t):
   t.info('uncompresses: %d bytes', os.stat(t.name).st_size)
   stringio = StringIO()
   gzipfile = gzip.GzipFile(t.name, 'w', 9, stringio)
   with open(t.name) as f:
      shutil.copyfileobj(f, gzipfile)
   gzipfile.close()
   t.info('   compressed: %d bytes', len(stringio.getvalue()))
   
virtual('build-all', 'build', 'doc')
   
virtual('build', 'minjs', 'mincss', 'images', 'replace')

virtual('dev', 'js', 'css', 'images')


virtual('minjs', 'html/static/OPECPortal.min.js')
@target('html/static/OPECPortal.min.js', PLOVR_JAR, 'opec_all.js')
def build_min_opec_js(t):
   t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'opec_all.js')

virtual('js', 'html/static/OPECPortal.js')
@target('html/static/OPECPortal.js', SRC)
def build_opec_js(t):
   t.info('building non-compiled version')
   destination = open('html/static/OPECPortal.js', 'wb')
   for filename in SRC:
      #shutil.copyfileobj(open(filename, 'r'), destination)
      with open(filename, 'rb') as file:
         destination.write(file.read())
         destination.write('\n')
   destination.close()
   t.info('finished')

virtual('uglify', 'html/static/OPECPortal.uglify.min.js')
@target('html/static/OPECPortal.uglify.min.js', UGLIFYJS, SRC)
def uglify_opec(t):
   t.output(UGLIFYJS, SRC)
   
virtual('html', 'html/static/index.html')
@target('html/static/index.html', HTML)
def build_html(t):
   t.info('Building HTML')
   destination = open('html/static/index.html', 'w')
   
   if 'src/html/fragments/main.html' in HTML:
      with open(HTML['src/html/fragments/main.html'], 'r') as file:       
         destination.write(file.read())
         destination.write('\n')
         
virtual('mincss', 'html/static/css/OPECPortal.min.css')
@target('html/static/css/OPECPortal.min.css', YUICOMPRESSOR)
def build_min_opec_css(t):
   t.output('%(JAVA)s', '-jar', YUICOMPRESSOR, CSS + 'OPECPortal.css')   
         
virtual('css', 'html/static/css/OPECPortal.css')
@target('html/static/css/OPECPortal.css', YUICOMPRESSOR)
def build_opec_css(t):
   t.info('Building CSS')
   opec_css = open('opec_css.json', 'r')
   json_css = json.load(opec_css)
   opec_css.close()
   destination = open('html/static/css/OPECPortal.css', 'w')
   for filename in json_css["files"]:
      with open(filename, 'rb') as file:
         t.info('-- Adding ' + filename)
         destination.write(file.read())
         destination.write('\n')
   destination.close()
   t.info('Finished building CSS.')
   
virtual('images', 'build_images')
@target('build_images', phony=True)
def build_opec_images(t):
   t.info('Moving Images')
   opec_images = open('opec_images.json', 'r')
   json_images = json.load(opec_images)
   opec_images.close()
   # http://stackoverflow.com/a/7420617/770233
   for foldername in json_images["folders"]:
      t.info('-- Adding ' + foldername["to"])
      root_src_dir = foldername["from"]
      root_dst_dir = foldername["to"]
      for src_dir, dirs, files in os.walk(root_src_dir):
         dst_dir = src_dir.replace(root_src_dir, root_dst_dir)
         if not os.path.exists(dst_dir):
            os.mkdir(dst_dir)
         for file_ in files:
            src_file = os.path.join(src_dir, file_)
            dst_file = os.path.join(dst_dir, file_)
            if os.path.exists(dst_file):
                os.remove(dst_file)
            shutil.move(src_file, dst_dir)
   t.info('Finished moving images.')
    
virtual('doc', 'jsdoc')
@target('jsdoc', SRC, phony=True)
def build_jsdoc(t):
   t.info('building documentation')
   t.run(JSDOC, '-r', 'src', '-d', 'doc')
   t.info('built documentation')
   
virtual('replace', 'replace-paths')
@target('replace-paths', phony=True)
def replacePath(t):
   t.info('Replacing paths')
   opec_replacements = open('opec_replacements.json', 'r')
   json_replacements = json.load(opec_replacements)
   opec_replacements.close()
   with codecs.open('html/static/index.html', 'r', 'utf-8') as read_file:
      with codecs.open('html/static/index.new.html', 'w', 'utf-8') as destination:
         for line in read_file:
            for path in json_replacements["build-paths"]:
               destination.write(string.replace(line, path["from"], path["to"]))
   shutil.move('html/static/index.new.html', 'html/static/index.html')
   t.info('Finished replacing paths.')
 
'''
Taken from ol3 build.py 
https://github.com/openlayers/ol3/blob/master/build.py
under 2-clause BSD license
'''
virtual('todo', 'fixme') 
@target('fixme', phony=True)
def find_fixme(t):
   regex = re.compile(".(FIXME|TODO).")
   matches = dict()
   totalcount = 0
   for filename in SRC:
      f = open(filename, 'r')
      for lineno, line in enumerate(f):
         if regex.search(line):
            if (filename not in matches):
               matches[filename] = list()
            matches[filename].append("#" + str(lineno + 1).ljust(10) + line.strip())
            totalcount += 1
      f.close()
      
   for filename in matches:
     print "  ", filename, "has", len(matches[filename]), "matches:"
     for match in matches[filename]:
        print "    ", match
        print
   print "A total number of", totalcount, "TODO/FIXME was found"
      
if __name__ == '__main__':
   main() 