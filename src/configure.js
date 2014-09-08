/*------------------------------------*\
    Configure Panel
    This file is for the 'Configure
    your map' panel, which includes
    searching and browsing indicators.
\*------------------------------------*/

/**
 * The configure panel uses the gisportal.configurePanel
 * namespace object.
 */
gisportal.configurePanel = {};

/**
 * The refreshData function is used to initialise
 * all of the data within the configure panel.
 * Currently, there is no use-case for updating
 * more than once but it is useful to be able
 * to have a way to reset the panel.
 */
gisportal.configurePanel.refreshData = function()  {
   var groupedTags = gisportal.groupTags();
   var categories = this.browseCategories;

   this.renderPopular();
   $("[id^='tab-browse']+.indicator-select").html('');
   for (var cat in gisportal.config.browseCategories)  {
      this.renderTags(cat, groupedTags);
   }
   this.searchInit();
};

/**
 * All panels have an open function.
 */
gisportal.configurePanel.open = function()  {
   gisportal.panels.showPanel( 'choose-indicator' );
};

/**
 * All panels have a close function.
 */
gisportal.configurePanel.close = function()  {
   //$('#configurePanel').toggleClass('hidden', true).toggleClass('active', false);
   gisportal.configurePanel.refreshData();
};

/**
 * This function initiates the DOM event handlers
 */
gisportal.configurePanel.initDOM = function()  {
   function toggleIndicator()  {
      var name = $(this).parent().data('name').toLowerCase();
      var options = {};
      
      var cat = $(this).parents('[data-cat]');
      if (cat)  {
         var refine = {};
         refine.cat = cat.data('cat');
         refine.tag = $(this).data('tag');
         options.refine = refine;
         //options.refined = true;
      }

      if ($(this).is(':checked')) {
         gisportal.configurePanel.selectLayer(name, options);
      }
      else  {
         gisportal.configurePanel.deselectLayer(name);
      }
   }

   $('.js-build').click(function()  {
      gisportal.configurePanel.buildMap();
   });

   /* Temp */
   $('.js-popular, .indicator-select, .js-search-results').on('click', ".js-toggleVisibility, .js-toggleVisibility~label", toggleIndicator);
   
   
   $('.js-indicators').on('change', '.hide-select', function()  {
     // togggle! important 
   });
   
   $('.indicator-select').on('click', '.indicator-dropdown', function()  {
        $(this).siblings('ul').toggleClass('hidden'); 
   });

   $('.js-configure-indicators').on('click', '.js-remove', function()  {
      gisportal.configurePanel.deselectLayer($(this).data('name'));
   });

}

/**
 * This used to be triggered by a button, that still exists
 * for when an indicator already exists but now when a new indicator
 * is added, this function automatically gets called.
 */
gisportal.configurePanel.buildMap = function(indicator)  {
   gisportal.configurePanel.close();
   if (indicator) gisportal.refinePanel.open(indicator);
   else gisportal.indicatorsPanel.open();
};

/**
 * This is used to show and hide the build/next button.
 * It used to show the indicators that are selected but that
 * has been removed.
 */
gisportal.configurePanel.refreshIndicators = function()  {

   /* Show selected indicators
   $.get('templates/configureIndicators.mst', function(template) {
      var indicators = gisportal.selectedLayers;
      var rendered = Mustache.render(template, {
         indicators : indicators 
      });
      $('.js-configure-indicators').html(rendered);
   }); */


   if (gisportal.selectedLayers.length > 0)  {
      $('.js-build').toggleClass('hidden', false);
   }  
   else  {
      $('.js-build').toggleClass('hidden', true);
   }
};

/**
 * This is quite a complicated function.
 * gisportal.layers is an array of indicators
 * in the structure of gisportal.layers[i].tags[tag].
 * To put all of the indicators into the form that
 * the configurePanel requires to show tags with the 
 * indicator names (not ids) within, we needed to flip
 * the data structure. 
 * This function creates a data structure with an array of
 * names accessed with gisportal.groupTags()[tag][value].
 *
 * @returns {object} Data structure with tags as keys
 */
gisportal.groupTags = function()  {
   var layers = gisportal.layers;
   var grouped = {};
   
   // Iterate over the ids in gisportal.layers
   var ids = Object.keys(layers);
   for (var i = 0; i < ids.length; i++)  {
      // Cache the layer so that properties (like name) can
      // easily be accessed
      var layer = layers[ids[i]];

      var tags = layer.tags;
      if (tags)  {
         // If the layer has tags, iterate over them.
         // Tags are essentially categories of tag values.
         var tagKeys = Object.keys(tags);
         for (var j = 0; j < tagKeys.length; j++)  {
            // tag will have the name of the tag category, such as 'Ecosystem Element'
            var tag = tagKeys[j];

            // tagVal will have the values of the tag, such as 'Fish'
            var tagVal = tags[tag];
            
            // Some tags may be empty, if they are then just ignore them
            // otherwise, create an empty object related to the tag.
            if (!grouped[tag] && tagVal !== null)  {
               grouped[tag] = {};
            } 

            // Some tag values will be a single string,
            // others will be an array of strings.
            if (typeof tagVal === "string")  {
               // There may be tag values with different
               // capitalisations, so to compare we need
               // to lowercase all of them.
               tagVal = tagVal.toLowerCase();

               // Create an array if needed at grouped[tag][tagVal]
               // then put the layer name into it.
               if (!grouped[tag][tagVal]) grouped[tag][tagVal] = [];
               grouped[tag][tagVal].push(layer.name);
            } 
            else if (typeof tagVal === "object" && tagVal !== null)  {
               // Lowercase all tag values in the array
               tagVal = _.map(tagVal, function(d) { return d.toLowerCase(); });

               // If the tag value isn't represented in the tag array
               // then create a new array.
               // [Is this needed anymore?]
               if (!grouped[tag][tagVal]) grouped[tag][tagVal] = [];
               
               // Iterate over the original tagVal array
               // The actual tag value will be accessed with
               // tagVal[k]. Value is the actual tag, such as
               // 'Adult Cod'
               for (var k = 0; k < tagVal.length; k++)  {
                  // Cache the lowercase actual tag value
                  var t = tagVal[k].toLowerCase();
                  
                  // If the actual tag val isn't represented
                  // then create an array.
                  if (!grouped[tag][t])  {
                     grouped[tag][t] = [];
                  }

                  // Add the layer name to the array
                  grouped[tag][t].push(layer.name);
               }
            }
         }
      }
   }
   // Return the new data structure with
   // the tags (categories) as the keys.
   return grouped;
};

/**
 * Similar to groupTags, sometimes we need
 * to be able to get ids from a name.
 * This function creates a data structure with
 * indicator names as lowercase keys. The values to the keys
 * are arrays of tags (tag categories) that have the tag values inside
 * and the ids of the layers inside that.
 *
 * @returns {object} Data structure with names as keys
 */
gisportal.groupNames = function()  {
   var group = {};

   // Iterate over gisportal.layers so that
   // we can get the name and tags of each
   // layer. 
   var keys = Object.keys(gisportal.layers);
   for (var i = 0; i < keys.length; i++)  {
      // Cache the indicator so that we don't need
      // to keep finding it.
      var indicator = gisportal.layers[keys[i]];
      // Lowercase the name so that it can be used for comparisons
      var name = indicator.name.toLowerCase();
      var id = indicator.id;
      var tags = indicator.tags;
      
      // If the name is not a duplicate, use it as a key
      // for a new object. Otherwise just add to the object
      // that already exists.
      if (!group[name]) group[name] = {};
      
      if (tags)  {
         // Cache the keys of the tags
         var tagKeys = Object.keys(tags);
         for (var j = 0; j < tagKeys.length; j++)  {
            // cat is the tag/category, such as 'Fish'
            var cat = tagKeys[j];
            // tagName is the value of the tag, such as 'Adult Cod'
            var tagName = tags[cat];

            // tagName may be a string or an array of strings
            if (typeof tagName === 'string')  {
               // Convert tagName to lowercase so that it doesn't produce duplicates
               tagName = tagName.toLowerCase();
               // If the cat already exists, use that, otherwise create a new array for it
               if (!group[name][cat]) group[name][cat] = [];
               // If the tagName already exists, use that, otherwise create a new array for it
               if (!group[name][cat][tagName]) group[name][cat][tagName] = [];
               // Add the id to the tagName array
               group[name][cat][tagName].push(id);
            }
            else if (typeof tagName === 'object' && tagName !== null)  {
               // If tagName is an array, iterate over the strings
               for (var k = 0; k < tagName.length; k++)  {
                  // innerTagName is the actual tag name, needs to be lowercase
                  var innerTagName = tagName[k].toLowerCase();
                  // If cat has an array, use that, otherwise create one
                  if (!group[name][cat]) group[name][cat] = []; 
                  // If innerTagName has an array, use that, otherwise create one
                  if (!group[name][cat][innerTagName]) group[name][cat][innerTagName] = [];
                  // Add the id to the innerTagName array
                  group[name][cat][innerTagName].push(id);              
               }
            }
         }   
      }
   }
   // Returns the data structure with the indicator name
   // as the key.
   return group;
};

/**
 * This function is used to render the tags
 * on the configure panel. There are three tabs
 * with a category each, with multiple tag names
 * and tag values.
 *
 * @param {object} cat - The category, such as 'Ecosystem Element'
 * @param {object} grouped - The grouped tags, using gisportal.groupTags()
 */
gisportal.configurePanel.renderTags = function(cat, grouped)  {
   var tagVals = grouped[cat];
   var tagNames = [];
   if (grouped[cat]) tagNames = Object.keys(grouped[cat]);
   var catName = gisportal.config.browseCategories[cat];
   var catNameKeys = Object.keys(gisportal.config.browseCategories);
   // tabNumber is a hack used to give different logic to the region (middle) tab,
   // so that clicking a region will automatically show that region in the refine panel.
   var tabNumber = _.indexOf(catNameKeys, cat) + 1;
   $('#tab-browse-2 + .panel-tab').attr('data-cat', catNameKeys[1]);


   for (var i = 0; i < tagNames.length; i++)  {
      var vals = tagVals[tagNames[i]];
      if (vals.length > 0)  {
         // For each tag name, if it has values then render the mustache
         // template. The template should probably be cached more heavily.
         $.get('templates/categories.mst', (function(index, cat) {
            var indicators = [];
            // Do not allow duplicates, and all values should be lowercase
            vals = _.unique(vals, function(d)  {
               return d.toLowerCase();
            });
            
            _.forEach(vals, function(d)  {
               var tmp = {};
               var d = d.toLowerCase();
               tmp.name = d;
               // Modified is used when a unique id is required
               // in the actual html, for radio buttons for example.
               tmp.modified = gisportal.utils.nameToId(d);
               indicators.push(tmp);
            });
               
            return function(template) { 
               var rendered = Mustache.render(template, {
                  tag : tagNames[index],
                  tagModified : gisportal.utils.nameToId(tagNames[index]),
                  indicators : indicators 
               });
               $('#tab-browse-'+ tabNumber+' + .indicator-select').append(rendered);
               $('label[for="tab-browse-' + tabNumber + '"]').html(catName);
               // Inline all SVG icons 
               gisportal.replaceAllIcons();
            }
         })(i));
      }
   }
};

/**
 * This function renders the popular indicators part of the
 * configure panel. It is fairly simple compared to the 
 * rest of the panel
 */
gisportal.configurePanel.renderPopular = function()  {
   var indicators = [];
   var groupedNames = gisportal.groupNames();
   // The popular indicators are manually stored in config.js for now
   // It would be good to have this come from analytics
   var popular = gisportal.config.popularIndicators;
   popular = _.unique(popular, function(d)  {
      return d.toLowerCase();
   });
   _.forEach(popular, function(d)  {
      var tmp = {};
      var d = d.toLowerCase();
      if (groupedNames[d])  {
         tmp.name = d;
         tmp.modified = d.replace(/ /g, '__');
         indicators.push(tmp);
      }
   });

   $.get('templates/browseIndicators.mst', function(template) {
      var rendered = Mustache.render(template, {
         location : 'popular',
         indicators : indicators
      });
      
      $('.js-popular').html(rendered);
      gisportal.replaceAllIcons();
   });
};

/**
 * We use Fuse for searching the layers.
 * It is initiated with a key value pair of indicator
 * id and name.
 */
gisportal.configurePanel.searchInit = function()  {
   $('.js-search-results').html('');
   var all = [];
   var layers = Object.keys(gisportal.layers);
   for (var i = 0; i < layers.length; i++)  {
     var tmp = {};
     tmp.id = gisportal.layers[i];
     tmp.name = gisportal.layers[layers[i]].name;
     all.push(tmp)
   }

   var options = {
      threshold : 0.2,
      keys : [ 'id', 'name']
   };
   this.fuse = new Fuse(all, options);

   $('.js-search').on('keyup', function()  {
      gisportal.configurePanel.search($(this).val());
   });
};

/**
 * This should run when somebody types into the search box.
 * It searches both the id and name.
 *
 * @params {string} val - The string to search for.
 */
gisportal.configurePanel.search = function(val)  {
   var results = this.fuse.search(val);

   $.get('templates/browseIndicators.mst', function(template) {
      
      var indicators = [];
      
      results = _.uniq(results, function(val) {
         return val.name.toLowerCase();
      }); 

      _.forEach(results, function(d)  {
         var tmp = {};
         tmp.name = d.name.toLowerCase();
         tmp.modified = d.name.replace(/ /g, '__').toLowerCase();
         indicators.push(tmp);
      });
      var rendered = Mustache.render(template, {
         location: 'search',
         indicators : indicators
      });
      
      $('.js-search-results').html(rendered);
     
      var selected = [];
      // This shows a check for selected layers
      // but because we no longer have multiple select enabled, I have commented it out.
      /*
      $('.js-toggleVisibility[data-name]:checked').each(function(i,d) { 
          var name = $(d).data('name').toLowerCase();
          if ($.inArray(name, selected) === -1)  {
              selected.push(name);
          } 
      })
      
      for (var i = 0; i < selected.length; i++)  {
         $('.js-toggleVisibility[data-name="' + selected[i] + '"]').prop("checked", true).toggleClass('active', true).change();
      } */


      // Inline SVG icons
      gisportal.replaceAllIcons();
   });

};

/**
 * This function should be called when a layer has been selected.
 *
 * @param {string} name - The name of the selected indicator
 * @param {object} options - This includes the id if it is known
 */
gisportal.configurePanel.selectLayer = function(name, options)  {
   // Trigger the analytics event
   gisportal.analytics.events.selectLayer( { name: name } );
   
   var options = options || {};
   var name = name.toLowerCase();
   var id = this.hasIndicator(name);  
   
   if (options.id) {
      id = options.id;
   }

   
   name = name.replace(/__/g, ' ');

   $('.js-toggleVisibility[data-name="' + name + '"]').toggleClass('active', true).prop('checked', true);   
   $('.js-toggleVisibility[data-name="' + name + '"]').prev('label').toggleClass('active', true).prop('checked', true);

   var tmp = {};
   tmp.name = name;
   if (id) tmp.id = id;
   if (options.refine) tmp.refine = options.refine;
   if (options.refined !== undefined) tmp.refined = options.refined;
   gisportal.configurePanel.refreshIndicators();

   this.buildMap(tmp);
};

/**
 * Deselects the layer from configure panel.
 *
 * @param {string} name - The name of the layer
 */
gisportal.configurePanel.deselectLayer = function(name)  {
   // Trigger the analytics event
   gisportal.analytics.events.deselectLayer( { name: name } );
   
   var name = name.toLowerCase();
   var id = this.hasIndicator(name);
   gisportal.configurePanel.unselectIndicator(name);
   $('.js-toggleVisibility[data-name="' + name + '"]').removeClass('active').prop('checked', false).change();
   $('.js-configure-indicators [data-name="' + name + '"]').remove();
   // If there is an index then it is a 'real' layer, otherwise just a placeholder 
   if (id)  {
      gisportal.indicatorsPanel.removeIndicators(id);
   }
   gisportal.configurePanel.refreshIndicators();
   

};

/**
 * Remove all layers
 */
gisportal.configurePanel.removeAll = function()  {
   for (var name in gisportal.selectedIndicators)  {
      gisportal.configurePanel.deselectLayer(name);
   }
};

/**
 * Check if the name has indicators.
 * This could be changed to use groupNames.
 *
 * @param {string} name - The name of the layer
 */
gisportal.configurePanel.hasIndicator = function(name)  {
   var index = -1;
   var id;
   for (var i in gisportal.layers)  {
      if (gisportal.layers[i].name.toLowerCase() === name.toLowerCase()) return gisportal.layers[i].id;
   }
   return false;
};


/**
 * This make sures the indicators are in the correct order.
 *
 * @param {number} index - The index that the indicator should be at
 * @param {string} name - The name of the indicator
 */
gisportal.configurePanel.reorderIndicators = function(index, name)  {
   var arr = gisportal.selectedLayers;
   var current = _.findIndex(arr, function(d) { return d.name.toLowerCase() === name.toLowerCase();  });
   var obj = arr[current];
   arr.splice(current, 1);
   arr.splice(index, 0, obj);
   return arr;
};

/**
 * Default tool tip styling
 */
$.fn.tooltipster('setDefaults', {
  theme: 'tooltipster-shadow'
});

/**
 * Provides all local storage.
 * API - http://www.jstorage.info/
 */
gisportal.storage = $.jStorage;