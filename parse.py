#!/usr/bin/env python

import re
import logging
logger = logging.getLogger("portal_proxy")

#from lxml import etree
from BeautifulSoup import BeautifulStoneSoup

def check_dupes(tag,data,res):
    """Check whether an element/attribute already exists in a given parent node;
    if not, add it to the parent; otherwise, create a list containing both.

    @param tag: name of element or attribute to check for.
    @param data: data contained in the element or attribute.
    @param res: parent node to check/modify."""

    tag = re.sub('^.*:','',tag)

    if tag in res:
        # this tag already exists. don't overwrite it!
        if not isinstance(res[tag], list):
            # not a list, turn it into one
            res[tag] = [res[tag]]
        # then append
        res[tag].append(data)
    else:
        res[tag] = data

def _process(el,depth=0):
    """Recursively turn an lxml tree into a datastructure that should
    more-or-less accurately represent it.

    @param el: the lxml Element to process.
    @param depth: number of recursions. Not currently checked.
    @return: a datastructure representing the element."""

    res = {}
    for i in el.contents:
        if 'name' in dir(i) and i.name:
            data = _process(i,depth+1)
            if hasattr(i, 'string') and i.string is not None:
                text = i.string.strip().encode('utf-8')
                if len(text) > 0:
                    if data == {}:
                        try:
                            data = text
                        except:
                           pass
                    else:
                        data.update({'text': text})

            check_dupes(i.name,data,res)

    if 'name' in dir(el):
        for key,data in el._getAttrMap().iteritems():
            check_dupes(key,data,res)

    return res

def process(file, tag='Layer'):
    """Take a file and search for a given tag, returning a data structure representing it.

    @param file: string containing xml to process.
    @param tag: tagname for lxml to search for.
    @return: list of dictionaries, one per tag found."""

    logger.debug("parse.process: tag=%s" % tag)
    selfClosingTags = ['boundingbox']

    root = BeautifulStoneSoup(file, selfClosingTags=selfClosingTags)
    logger.debug(root.findAll(tag))
    obj = [_process(i) for i in root.findAll(tag)]
    return obj

if __name__ == '__main__':
    from sys import argv
    import yaml

    print yaml.dump(process(open(argv[1]).read(),argv[2]),default_flow_style=False)
