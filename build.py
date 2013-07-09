#!/usr/bin/env python

from cStringIO import StringIO
from glob import iglob
import gzip
import os
import re
import shutil
import sys

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
   
virtual('build', 'minjs', 'css')

virtual('dev', 'js', 'css')


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
         
virtual('css', 'html/static/css/main.min.css')
@target('html/static/css/main.min.css', YUICOMPRESSOR)
def build_min_opec_css(t):
   t.output('%(JAVA)s', '-jar', YUICOMPRESSOR, CSS + 'main.css')
   
virtual('doc', 'jsdoc')
@target('jsdoc', SRC, phony=True)
def build_jsdoc(t):
   t.info('building documentation')
   t.run(JSDOC, '-r', 'src', '-d', 'doc')
   t.info('built documentation')
   
 
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