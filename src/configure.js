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
   this.searchInit();

   var groupedTags = gisportal.groupTags();
   var categories = this.browseCategories;

   if (typeof(gisportal.config.browseMode) === 'undefined' || gisportal.config.browseMode == 'tabs') {
      this.renderTagsAsTabs();
   } else if (gisportal.config.browseMode == 'selectlist') {
      this.renderTagsAsSelectlist();
   }


   $('#configurePanel').bind('scroll', function() {
     gisportal.events.trigger('configurepanel.scroll', $(this).scrollTop())
   })
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
};

/**
 * This function initiates the DOM event handlers
 */
gisportal.configurePanel.initDOM = function()  {
   // nothing to see here any more
}

gisportal.configurePanel.toggleIndicator = function(name, tag, tagname)  {
   var options = [];
   
   var refine = {};
   refine.cat = tagname;
   refine.tag = tag;
   options.push(refine);

   gisportal.refinePanel.reset();
   gisportal.configurePanel.selectLayer(name, options);
}

/**
 * Resets the tabs and search box on the portal
 */
gisportal.configurePanel.reset = function(){
   $('.js-search').val("").change();
   changeTab( $('#configurePanel .js-default-tab'));
   
   // This seems most unnecessary as it reloads the data and the templates each time an indicator is selected
   //  // gisportal.configurePanel.refreshData();
     
   // reset the options when browseMode = selectlist
   $('.selectoptions .dd-container').ddslick('reset');
   // and when browseMode = tabs
   $('.js-indicator-select .dd-container').ddslick('reset');
   
}

/**
 * This used to be triggered by a button, that still exists
 * for when an indicator already exists but now when a new indicator
 * is added, this function automatically gets called.
 */
gisportal.configurePanel.buildMap = function(indicator)  {
   if (indicator) gisportal.refinePanel.open(indicator);
   else gisportal.indicatorsPanel.open();
};

/**
 * This is used to show and hide the build/next button.
 * It used to show the indicators that are selected but that
 * has been removed.
 */

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
 * @param   {object} an object of layers to build the tags for; this can be null in which case gisportal.layers, i.e. all layers, are used
 * @returns {object} Data structure with tags as keys
 */
gisportal.groupTags = function(layers)  {
   if (layers == undefined) {
      layers = gisportal.layers;
   }
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
               tagVal = tagVal;

               // Create an array if needed at grouped[tag][tagVal]
               // then put the layer name into it.
               if (!grouped[tag][tagVal]) grouped[tag][tagVal] = [];
               grouped[tag][tagVal].push(layer.name);
            } 
            else if (typeof tagVal === "object" && tagVal !== null)  {
               // Lowercase all tag values in the array
               tagVal = _.map(tagVal, function(d) { return d; });

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
                  var t = tagVal[k];
                  
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
gisportal.groupNames = function(layers)  {
   if (layers == undefined) {
      layers = gisportal.layers;
   }
   var group = {};

   // Iterate over layers so that
   // we can get the name and tags of each
   // layer. 
   var keys = Object.keys(layers);
   for (var i = 0; i < keys.length; i++)  {
      // Cache the indicator so that we don't need
      // to keep finding it.
      var indicator = layers[keys[i]];
      // Lowercase the name so that it can be used for comparisons
      var name = indicator.name;
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
               tagName = tagName;
               // If the cat already exists, use that, otherwise create a new array for it
               if (!group[name][cat]) group[name][cat] = {};
               // If the tagName already exists, use that, otherwise create a new array for it
               if (!group[name][cat][tagName]) group[name][cat][tagName] = [];
               // Add the id to the tagName array
               group[name][cat][tagName].push(id);
            }
            else if (typeof tagName === 'object' && tagName !== null)  {
               // If tagName is an array, iterate over the strings
               for (var k = 0; k < tagName.length; k++)  {
                  // innerTagName is the actual tag name, needs to be lowercase
                  var innerTagName = tagName[k];
                  // If cat has an array, use that, otherwise create one
                  if (!group[name][cat]) group[name][cat] = {}; 
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
 */
gisportal.configurePanel.renderTagsAsTabs = function()  {
   var grouped = gisportal.groupTags();

   // load the template
   var catFilter = gisportal.templates['category-filter-tabs']();
   $('.js-category-filter').html(catFilter);
   $('.more-info').on('click', function() {
      var message_block = $(this).prev();
      if(message_block.is(':visible')){
         $(this).html("more info...");
         message_block.slideUp('slow');
      }else{
         $(this).html("less info...");
         message_block.slideDown('slow');
      }
   });
   $('button#reset-list').on('click', function() {
      gisportal.configurePanel.resetPanel();
   });

   // iterate over each category
   for (var cat in gisportal.config.browseCategories)  {

      var catNameKeys = Object.keys(gisportal.config.browseCategories);
      var tabNumber = _.indexOf(catNameKeys, cat) + 1;
      var targetDiv = $('#tab-browse-'+ tabNumber+' + .indicator-select');

      gisportal.configurePanel.renderIndicatorsByTag(cat, targetDiv, tabNumber);

   }
};

/**
 * An alternative method of grouping/filtering categories. This 
 * method adds a select list instead of the three tabs, and lists
 * each of the categories specified in gisportal.config.browseCategories
 */
gisportal.configurePanel.renderTagsAsSelectlist = function() {
   // load the template
   var catFilter = gisportal.templates['category-filter-selectlist']();
   $('.js-category-filter').html(catFilter);
   $('.more-info').on('click', function() {
      var message_block = $(this).prev();
      if(message_block.is(':visible')){
         $(this).html("more info...");
         message_block.slideUp('slow');
      }else{
         $(this).html("less info...");
         message_block.slideDown('slow');
      }
   });
   $('button#reset-list').on('click', function() {
      gisportal.configurePanel.resetPanel();
   });

   var categories = [];
   for (var category in gisportal.config.browseCategories) {
      var c = {
         value: category,
         text: gisportal.config.browseCategories[category],
      }
      categories.push(c);
   }

   var targetDiv = $('.js-category-filter-options');

   $('#js-category-filter-select').ddslick({
      data: categories,
      onSelected: function(data) {
         if (data.selectedData) {
            gisportal.configurePanel.renderIndicatorsByTag(data.selectedData.value, targetDiv);
         }
      }
   });
   // set the index to 0, or if a defaultCategory is set use that instead; setting the value triggers the rendering of the drop down lists to filter by
   var defaultValue = { index: 0 };
   if (typeof(gisportal.config.defaultCategory) !== 'undefined' && gisportal.config.defaultCategory) {
      defaultValue = { value: gisportal.config.defaultCategory };
   } 
   $('#js-category-filter-select').ddslick('select', defaultValue);
}

/**
 * [renderIndicatorsByTag description]
 * @param  {[type]} cat       the name of the category to render
 * @param  {[type]} targetDiv a jQuery object of the div where the drop down list should be created
  */
gisportal.configurePanel.renderIndicatorsByTag = function(cat, targetDiv, tabNumber) {
   targetDiv.html('');

   var grouped = gisportal.groupTags();

   var tagVals = grouped[cat];
   var tagNames = [];
   if (grouped[cat]) {
      tagNames = Object.keys(grouped[cat]);
      // sort it before it's rendered
      tagNames.sort() 
   } 
   var catName = gisportal.config.browseCategories[cat];
   var catNameKeys = Object.keys(gisportal.config.browseCategories);
   
   for (var i = 0; i < tagNames.length; i++)  {
      var vals = tagVals[tagNames[i]];
      if (vals.length > 0)  {
         var tagNameSafe = gisportal.utils.replace(['\ ','.',';',':'], ['_','_','_','_'], tagNames[i]);
         // sort them
         vals.sort();
         // For each tag name, if it has values then render the mustache
         var indicators = [];
         // Do not allow duplicates, and all values should be lowercase
         vals = _.unique(vals, function(d)  {
            return d;
         });
         
         _.forEach(vals, function(d)  {
            var tmp = {};
            tmp.name = d;
            // Modified is used when a unique id is required
            // in the actual html, for radio buttons for example.
            tmp.modified = gisportal.utils.nameToId(d);
            tmp.tagname = cat;
            tmp.tagvalue = tagNames[i];
            indicators.push(tmp);
         });

         var rendered = gisportal.templates['categories'] ({
            tag : tagNames[i],
            tagnamesafe: tagNameSafe,
            tagModified : gisportal.utils.nameToId(tagNames[i]),
            indicators : indicators 
         });
         targetDiv.append(rendered);
         // only for browseMode = tabs <!--
         if (tabNumber) $('label[for="tab-browse-' + tabNumber + '"]').html(catName);
         // -->
         
         $('#select-'+ tagNameSafe).ddslick({
            selectText: tagNames[i],
            onSelected: function(data) {
               if (data.selectedData) {
                  gisportal.configurePanel.toggleIndicator(data.selectedData.name, data.selectedData.tag, data.selectedData.tagname);
               }
            }
         });
      }
   }
}


/**
 * We use Fuse for searching the layers.
 * It is initiated with a key value pair of indicator
 * id and name.
 */
gisportal.configurePanel.searchInit = function()  {
   $('.js-search-results').html('');
   var records = [];
   var layers = Object.keys(gisportal.layers);
   for (var i = 0; i < layers.length; i++){
      
      var layer = gisportal.layers[layers[i]];

      var searchRecord = {
         name: layer.name,
         providerTag: layer.providerTag,
         region: layer.tags.region,
     };

     records.push(searchRecord);
   }

   var options = {
      threshold : 0.2,
      keys : [ 'name', 'providerTag', 'region' ]
   };

   this.fuse = new Fuse(records, options);

   $('.js-search').addClear({
      onClear: function(){
         $('.js-search').change();
         $('.js-search-results').css('display', 'none');
      },
      right: '20px',
      top: '2px',
      fontSize: '17px',
      closeSymbol: '<img src="img/cross.png" width="14" />'
   });

   // If statement is needed to stop the change event trigger on lose of focus
   // This caused issues when selecting indicators (its needed....)
   var currentSearchValue = "";
   $('.js-search').on('keyup change', function()  {
      var searchBoxVal = $(this).val();
      if( currentSearchValue != searchBoxVal ){
         currentSearchValue = searchBoxVal;
         
         gisportal.events.trigger('search.typing', searchBoxVal);

         gisportal.configurePanel.search(searchBoxVal);
      }
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

   var indicators = [];
   
   results = _.uniq(results, function(val) {
      return val.name;
   }); 

   _.forEach(results, function(d)  {
      var tmp = {};
      tmp.name = d.name;
      tmp.modified = d.name.replace(/ /g, '__').toLowerCase();
      indicators.push(tmp);
   });
   var rendered = gisportal.templates['browseIndicators']({
      location: 'search',
      indicators : indicators,
      search_term: val,
      empty_search: (val == "")
   });
   
   $('.js-search-results').html(rendered);
   $('.js-search-results a').click(function() {
      gisportal.configurePanel.toggleIndicator($(this).text(), '');
      $('.js-search-results').css('display', 'none');   
      gisportal.events.trigger('search.resultselected', $(this).text())
   });
   $('.js-search-results').css('display', 'block');
   if (val == 'sombrero') {
      $('#sb').find('audio')[0].play();
      $('[class*="icon-"]').addClass('icon-sombrero');
      $('[class*="icon-"]').addClass('jiggly');
   } else {
      $('[class*="icon-"]').removeClass('icon-sombrero');
      $('[class*="icon-"]').removeClass('jiggly');
   }
   var selected = [];

};

/**
 * This function should be called when a layer has been selected.
 *
 * @param {string} name - The name of the selected indicator
 * @param {object} options - This includes the id if it is known
 */
gisportal.configurePanel.selectLayer = function(name, options)  {

   var options = options || {};
   var name = name;
   var id = this.hasIndicator(name);  
   
   if (options.id) {
      id = options.id;
   }

   name = name.replace(/__/g, ' ');

   var tmp = {};
   tmp.name = name;
   if (id) tmp.id = id;
   if (options) tmp.refine = options;
   //if (options.refined !== undefined) tmp.refined = options.refined;

   this.buildMap(tmp);
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
 * Takes an object of layers (like layers is) and resets the panel to display these layers only.
 * If no layers are given then it resets to the original layers.
 * @param {Object} given_layers - The layers you want to be loaded or NULL.
 */
gisportal.configurePanel.resetPanel = function(given_layers){
   if(given_layers){
      // Either keeps the original as it is or stores the layers if it is undefined
      gisportal.original_layers = gisportal.original_layers || gisportal.layers;
      gisportal.layers = given_layers;
      gisportal.configurePanel.refreshData();
         $('.filtered-list-message').show();
   }else{
      // Ensures the panel is only reset when it really needs to be
      if(gisportal.original_layers && gisportal.layers != gisportal.original_layers){
         gisportal.layers = gisportal.original_layers; // Resets back to the original layers
         gisportal.configurePanel.refreshData();
         $('.filtered-list-message').hide();
         $('.unfiltered-list-message').show();
         setTimeout(function(){
            $('.unfiltered-list-message').slideUp('slow')
         }, 5000);
      }
   }
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
