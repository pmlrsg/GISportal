/*------------------------------------*\
    Configure Panel
    This file is for the 'Configure
    your map' panel, which includes
    searching and browsing indicators.
\*------------------------------------*/

gisportal.configurePanel = {};

gisportal.configurePanel.refreshData = function()  {
   var groupedTags = this.groupTags();
   var categories = this.browseCategories;

  this.renderPopular();
   for (var cat in gisportal.config.browseCategories)  {
      this.renderTags(cat, groupedTags);
   }
   this.searchInit();
};

gisportal.configurePanel.initDOM = function()  {
   function toggleIndicator()  {
      var id = $(this).parent().data('id');
      if ($(this).is(':checked'))  {
         gisportal.configurePanel.selectLayer(id);
         $('.js-toggleVisibility[data-id="' + id + '"]').prop('checked', true);
      }
      else  {
         gisportal.configurePanel.deselectLayer(id);
         $('.js-toggleVisibility[data-id="' + id + '"]').prop('checked', false);
      }
   }

   $('.js-build').click(function() {
      gisportal.indicatorsPanel.refreshData();
      $('#configurePanel').toggleClass('hidden', true);
      $('#indicatorsPanel').toggleClass('hidden', false);
   });

   /* Temp */
   $('.js-popular, .indicator-select, .js-search-results').on('click', ".js-toggleVisibility, .js-toggleVisibility~label", toggleIndicator);
   
   $('.indicator-select').on('click', '.indicator-dropdown', function()  {
      console.log(this);
      if ($(this).siblings('select').height() > 50)  {
        $(this).siblings('ul').toggleClass('hidden'); 
      }
   });

   $('.js-configure-indicators').on('click', '.js-remove', function()  {
      gisportal.configurePanel.deselectLayer($(this).data('id'));
   });

   $('.build-map-footer').on('click', '.js-remove-all', gisportal.configurePanel.removeAll);
}

gisportal.configurePanel.refreshIndicators = function()  {

   /* All logic in here due to race conditions
    * that leave indicators when all are
    * removed */
   $.get('templates/configureIndicators.mst', function(template) {
      var indicatorIds = Object.keys(gisportal.layers);
      var indicators = [];
      for (var i = 0; i < indicatorIds.length; i++)  {
         var tmp = {};
         tmp.id = indicatorIds[i];
         tmp.name = gisportal.layers[tmp.id].name;
         indicators.push(tmp);
      }

      var rendered = Mustache.render(template, {
         indicators : indicators 
      });
      console.log(indicators, indicatorIds, gisportal.layers);
      $('.js-configure-indicators').html(rendered);
   });

};

gisportal.configurePanel.groupTags = function()  {
   var layers = gisportal.microLayers;
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
            
            if (grouped[tag] && !grouped[tag][tagVal] && tagVal !== null)  {
               grouped[tag][tagVal] = [];
            }
            
            if (typeof tagVal === "string")  {
               // tagVal is a single tag
               grouped[tag][tagVal].push(layer.id);
            } 
            else if (typeof tagVal === "object" && tagVal !== null)  {
               // tagVal is a category (array of tags)
               for (var k = 0; k < tagVal.length; k++)  {
                  var t = tagVal[k];
                  if (!grouped[tag][t])  {
                     grouped[tag][t] = [];
                  }
                  grouped[tag][t].push(layer.id);
               }
            }
         }
      }
   }
   return grouped;
};

gisportal.configurePanel.renderTags = function(cat, grouped)  {
   var tagVals = grouped[cat];
   var tagNames = Object.keys(grouped[cat]);
   var catName = gisportal.config.browseCategories[cat];
   for (var i = 0; i < tagNames.length; i++)  {
      var vals = tagVals[tagNames[i]];
      if (vals.length > 0)  {
         $.get('templates/categories.mst', (function(index) {
            var indicators = [];
            for (var i = 0; i < vals.length; i++)  {
               var tmp = [];
               tmp.id = vals[i];
               tmp.name = gisportal.microLayers[tmp.id].name;
               indicators.push(tmp);
            }


            return function(template) { 
               var rendered = Mustache.render(template, {
                  tag : tagNames[index],
                  indicators : indicators 
               });
               $('#tab-'+catName.toLowerCase()+' + .indicator-select').append(rendered);
            }
         })(i));
      }
   }
};


gisportal.configurePanel.renderPopular = function()  {
   var popular = gisportal.config.popularIndicators;
   
   var popularIndicators = [];
   for (var i = 0; i < popular.length; i++)  {
      var tmp = [];
      tmp.id = popular[i];
      tmp.name = gisportal.microLayers[tmp.id].name;
      popularIndicators.push(tmp);
   }

   $.get('templates/browseIndicators.mst', function(template) {
      var rendered = Mustache.render(template, {
         location : 'popular',
         indicators : popularIndicators
      });
      
      $('.js-popular').html(rendered);
   });
};

gisportal.configurePanel.searchInit = function()  {

   var all = [];
   for (var i = 0; i < Object.keys(gisportal.microLayers).length; i++)  {
     var tmp = {};
     tmp.id = Object.keys(gisportal.microLayers)[i];
     tmp.name = gisportal.microLayers[Object.keys(gisportal.microLayers)[i]].name;
     all.push(tmp)
   }

   var options = {
      threshold : 0.2,
      keys : [ 'id', 'name']
   };
   this.fuse = new Fuse(all, options);

   $('#indicatorSearch').on('keypress', function()  {
      gisportal.configurePanel.search($(this).val());
   });
};

gisportal.configurePanel.search = function(val)  {
   var results = this.fuse.search(val);

   $.get('templates/browseIndicators.mst', function(template) {
      var rendered = Mustache.render(template, {
         location: 'search',
         indicators : results
      });
      
      $('.js-search-results').html(rendered);
     
      var selected = [];
      $('.js-toggleVisibility[data-id]:checked').each(function(i,d) { 
          var id = $(d).data('id');
          if ($.inArray(id, selected) === -1)  {
              selected.push(id);
          } 
      })
      
      for (var i = 0; i < selected.length; i++)  {
         $('.js-toggleVisibility[data-id="' + selected[i] + '"]').prop("checked", true);
      }
   });

};

gisportal.configurePanel.selectLayer = function(id)  {
   var microlayer = gisportal.microLayers[id];
   var options = {};
   if (microlayer)  {
      gisportal.getLayerData(microlayer.serverName + '_' + microlayer.origName + '.json', microlayer,options);
   }
};

gisportal.configurePanel.deselectLayer = function(id)  {
   console.log('deselect');
   if (gisportal.layers[id])  {
      gisportal.layers[id].unselect();
      /* For now, unselect() just hides */
      delete gisportal.layers[id];  
      $('.js-toggleVisibility[data-id="' + id + '"]').prop('checked', false); 
   }
   gisportal.configurePanel.refreshIndicators(); 

};

gisportal.configurePanel.removeAll = function()  {
   for (var id in gisportal.layers)  {
      gisportal.configurePanel.deselectLayer(id);
   }
};

