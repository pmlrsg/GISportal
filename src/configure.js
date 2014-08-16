/*------------------------------------*\
    Configure Panel
    This file is for the 'Configure
    your map' panel, which includes
    searching and browsing indicators.
\*------------------------------------*/

gisportal.configurePanel = {};

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

gisportal.configurePanel.open = function()  {
   $('#configurePanel').toggleClass('hidden', false).toggleClass('active', true);
};

gisportal.configurePanel.close = function()  {
   $('#configurePanel').toggleClass('hidden', true).toggleClass('active', false);
   gisportal.configurePanel.refreshData();
};

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

      if ($(this).is(':checked'))  {
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
      if ($(this).siblings('select').height() > 50)  {
        $(this).siblings('ul').toggleClass('hidden'); 
      }
   });

   $('.js-configure-indicators').on('click', '.js-remove', function()  {
      gisportal.configurePanel.deselectLayer($(this).data('name'));
   });

}

gisportal.configurePanel.buildMap = function(indicator)  {
   gisportal.configurePanel.close();
   if (indicator) gisportal.refinePanel.open(indicator);
   else gisportal.indicatorsPanel.open();
};

gisportal.configurePanel.refreshIndicators = function()  {

   /* All logic in here due to race conditions
    * that leave indicators when all are
    * removed */
   $.get('templates/configureIndicators.mst', function(template) {
      var indicators = gisportal.selectedLayers;
      var rendered = Mustache.render(template, {
         indicators : indicators 
      });
      $('.js-configure-indicators').html(rendered);
   });
   if (gisportal.selectedLayers.length > 0)  {
      $('.js-build').toggleClass('hidden', false);
   }  
   else  {
      $('.js-build').toggleClass('hidden', true);
   }
};

gisportal.groupTags = function()  {
   var layers = gisportal.layers;
   var grouped = {};
   
   for (var i = 0; i < Object.keys(layers).length; i++)  {
      var layer = layers[Object.keys(layers)[i]];
      var tags = layer.tags;
      if (tags)  {
         for (var j = 0; j < Object.keys(tags).length; j++)  {
            var tag = Object.keys(tags)[j];
            var tagVal = tags[tag];
            if (!grouped[tag] && tagVal !== null)  {
               grouped[tag] = {};
            } 
            
            if (typeof tagVal === "string")  {
               // tagVal is a single tag
               if (!grouped[tag][tagVal.toLowerCase()]) grouped[tag][tagVal.toLowerCase()] = [];
               grouped[tag][tagVal.toLowerCase()].push(layer.name);
            } 
            else if (typeof tagVal === "object" && tagVal !== null)  {
               tagVal = _.map(tagVal, function(d) { return d.toLowerCase(); });
               if (!grouped[tag][tagVal]) grouped[tag][tagVal] = [];
               // tagVal is a category (array of tags)
               for (var k = 0; k < tagVal.length; k++)  {
                  var t = tagVal[k].toLowerCase();
                  if (!grouped[tag][t])  {
                     grouped[tag][t] = [];
                  }
                  grouped[tag][t].push(layer.name);
               }
            }
         }
      }
   }
   return grouped;
};

gisportal.groupNames = function()  {
   var group = {};

   for (var i = 0; i < Object.keys(gisportal.layers).length; i++)  {
      var indicator = gisportal.layers[Object.keys(gisportal.layers)[i]];
      var name = indicator.name.toLowerCase();
      var id = indicator.id;
      var tags = indicator.tags;
      
      if (!group[name]) group[name] = {};
      
      if (tags)  { 
         for (var j = 0; j < Object.keys(tags).length; j++)  {
            var cat = Object.keys(tags)[j];
            var tagName = tags[cat];
            if (typeof tagName === 'string')  {
               tagName = tagName.toLowerCase();
               if (!group[name][cat]) group[name][cat] = [];
               if (!group[name][cat][tagName]) group[name][cat][tagName] = [];
               group[name][cat][tagName].push(id);
            }
            else if (typeof tagName === 'object' && tagName !== null)  {
               for (var k = 0; k < tagName.length; k++)  {
                  var innerTagName = tagName[k].toLowerCase();
                  if (!group[name][cat]) group[name][cat] = []; 
                  if (!group[name][cat][innerTagName]) group[name][cat][innerTagName] = [];
                  group[name][cat][innerTagName].push(id);              
               }
            }
         }   
      }
   }

   return group;
};

gisportal.configurePanel.renderTags = function(cat, grouped)  {
   var tagVals = grouped[cat];
   var tagNames = Object.keys(grouped[cat]);
   var catName = gisportal.config.browseCategories[cat];
   var tabNumber = _.indexOf(Object.keys(gisportal.config.browseCategories), cat) + 1;

   $('#tab-browse-2 + .panel-tab').attr('data-cat', Object.keys(gisportal.config.browseCategories)[1]);


   for (var i = 0; i < tagNames.length; i++)  {
      var vals = tagVals[tagNames[i]];
      if (vals.length > 0)  {
         $.get('templates/categories.mst', (function(index, cat) {
            var indicators = [];
            vals = _.unique(vals, function(d)  {
               return d.toLowerCase();
            });
            _.forEach(vals, function(d)  {
               var tmp = {};
               var d = d.toLowerCase();
               tmp.name = d;
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
               
               gisportal.replaceAllIcons();
            }
         })(i));
      }
   }
};


gisportal.configurePanel.renderPopular = function()  {
   var indicators = [];
   var groupedNames = gisportal.groupNames();
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

gisportal.configurePanel.searchInit = function()  {
   $('.js-search-results').html('');
   var all = [];
   for (var i = 0; i < Object.keys(gisportal.layers).length; i++)  {
     var tmp = {};
     tmp.id = Object.keys(gisportal.layers)[i];
     tmp.name = gisportal.layers[Object.keys(gisportal.layers)[i]].name;
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
      $('.js-toggleVisibility[data-name]:checked').each(function(i,d) { 
          var name = $(d).data('name').toLowerCase();
          if ($.inArray(name, selected) === -1)  {
              selected.push(name);
          } 
      })
      
      for (var i = 0; i < selected.length; i++)  {
         $('.js-toggleVisibility[data-name="' + selected[i] + '"]').prop("checked", true).toggleClass('active', true).change();
      }
      gisportal.replaceAllIcons();
   });

};

gisportal.configurePanel.selectLayer = function(name, options)  {
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

gisportal.configurePanel.deselectLayer = function(name)  {
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

gisportal.configurePanel.removeAll = function()  {
   for (var name in gisportal.selectedIndicators)  {
      gisportal.configurePanel.deselectLayer(name);
   }
};

gisportal.configurePanel.hasIndicator = function(name)  {
   var index = -1;
   var id;
   for (var i in gisportal.layers)  {
      if (gisportal.layers[i].name.toLowerCase() === name.toLowerCase()) return gisportal.layers[i].id;
   }
   return false;
};

gisportal.configurePanel.reorderIndicators = function(index, name)  {
   var arr = gisportal.selectedLayers;
   var current = _.findIndex(arr, function(d) { return d.name.toLowerCase() === name.toLowerCase();  });
   var obj = arr[current];
   arr.splice(current, 1);
   arr.splice(index, 0, obj);
   return arr;
};
