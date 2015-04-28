/*------------------------------------*\
    Refine Panel
    This file is for the 'refine' 
    panel.
\*------------------------------------*/

gisportal.refinePanel = {};

/**
 * The benefit of having a single refine panel
 * is that it means we can easily get access to the data.
 * Beforehand there was a lot of guesswork and DOM manipulation
 * but now we can just hold it in currentData.
 */
gisportal.refinePanel.currentData = null;

gisportal.refinePanel.found = false;

/**
 * This both opens the panel and initates it
 * with data.
 *
 * @param {object} data - The indicators that have the same name
 */
gisportal.refinePanel.open = function(data) {

   this.initDOM();
   gisportal.panels.showPanel('refine-indicator');
   this.currentData = data;
//   $('.js-refine-name').html(this.currentData.name);
   this.refreshData(data);
};

/**
 * Closes the refine panel
 */
gisportal.refinePanel.close = function() {
   $('#js-refine-section-interval').toggleClass('hidden', true);
   $('#js-refine-section-reliability').toggleClass('hidden', true);
   gisportal.panels.showPanel('choose-indicator');
};

/**
 * This initiates the DOM event handlers.
 *
 * @param {object} data - This object holds all the data needed
 */
gisportal.refinePanel.initDOM = function(data) {
   $('.js-refine-configure').on('click', function() {
      gisportal.configurePanel.reset();
      gisportal.configurePanel.open();
      gisportal.refinePanel.close();
   });
};

/**
 * Currently refreshData just renders the panel
 */
gisportal.refinePanel.refreshData = function() {
   var data = gisportal.refinePanel.currentData;

   var indicator = data.indicator || {};
   var id = data.id;
   var name = data.name;
   var refine = data.refine;

   // get a filtered version of groupTags (indicatorTags) that just apply to the selected indicator name
   var tags_flat = gisportal.utils.flattenObject(gisportal.groupTags())
   var matchingTags = {};

   for (var tag in tags_flat) {
      if (tags_flat.hasOwnProperty(tag)){
         if (tags_flat[tag] === name) {   // the tag applies to this indicator
            matchingTags[tag] = tags_flat[tag];
         }
      }
   }
   var indicatorTags = gisportal.utils.unflattenObject(matchingTags);

   // an array to hold the filters that could be available
   var furtherFilters = [];

   // work out if any of the browseCategories for the selected indicator name has more than one option
   for (var tag in indicatorTags) {
      if (indicatorTags.hasOwnProperty(tag)) {
         if ( _.keys(indicatorTags[tag]).length > 1 && gisportal.config.browseCategories[tag]) {
            // has the category already been added to the refine array
            for (var i = 0; i < data.refine.length; i++) {
               if (data.refine[i].cat !== tag) {
                  furtherFilters.push( tag );
                  break;   // to only add it once
               }
            }
         }
      }
   }

   // get an array of ids that are in each refine category
   var indicatorCategories = gisportal.groupNames()[data.name];
   var possibleIndicators = [];

   for (var i = 0; i < data.refine.length; i++) {
      var category = data.refine[i].cat;
      var tag = data.refine[i].tag;
      if (category !== 'undefined' && tag !== '') {  // they didn't use the search results
         var indicators = indicatorCategories[category][tag];
         possibleIndicators.push(indicators);
      } else {                                       // they clicked on a search result, so there won't be a refine category so use the niceName
         var indicators = indicatorCategories.niceName[name];
         possibleIndicators.push(indicators);
      }
   }

   // refinedIndicators is an array of values that exist in *all* possibleIndicators arrays
   var refinedIndicators =  _.intersection.apply(_, possibleIndicators);

   // and if there's only 1 then we have our winner - load it up baby
   if (refinedIndicators.length == 1) {
      gisportal.refinePanel.layerFound(refinedIndicators[0]);
      return;
   } else {
      // 
      // This is along the right lines but doesn't quite work; it produces a furtherFilters object that's the wrong shape
      //
      //
      //
      // if not, then get the tags that apply to all refinedIndicators so that the user can further refine
      console.log('refinedIndicators: ' + refinedIndicators.length);
      var refinedTags = [];
      for (var i in refinedIndicators) {
         var id = refinedIndicators[i];
         refinedTags.push(gisportal.layers[id].tags)  // need to make sure that a) it exists in browseCateogories, and b) it hasn't already been refined
      }
      furtherFilters = _.merge.apply(_, refinedTags); 
   }

   // if not, at this stage there must be more than one refinedIndicators so we need to render the possible filters
   if (furtherFilters.length > 0) {    // there's at least one more user selection required to identify a single indicator
      var refineSection = $('.js-refine-section')
      refineSection.html('');

      indicator.group = gisportal.groupNames()[name];

      var selectedValues = [];

      // create drop downs for each of the further filters
      for (var tag in furtherFilters) {
         var tagName = furtherFilters[tag];
         var tagDisplayName = gisportal.config.browseCategories[tagName];

         // we only want to show tags that haven't already been selected, so if the tag's in refine.data don't bother with it (or maybe show it but pre-selected?)
         var tagRefinedAlready = _.findKey(refine, function(chr) { return chr.cat == tagName; });
         var refineValue = undefined;
         if (tagRefinedAlready > -1) {
            var tmp = {
               tag: tagName,
               value: refine[tagRefinedAlready].tag
            }
            selectedValues.push(tmp);
         }

         // first create a div and append it to the filter section
         var placeholder = $('<div class="js-refine-section-' + tagName + '"><div id="refine-' + tagName + '"></div></div>')
         placeholder.appendTo(refineSection);
         // then add a ddslick drop down to it populated with tagName options
         $('#refine-' + tagName).ddslick({
            data: gisportal.utils.mustacheFormat(indicator.group[tagName]),
            initialState: "open",
            selectText: "Select a " + tagDisplayName,
            onSelected: function(data) {
               if (data.selectedData) {
                  var tmp = {};
                  tmp.cat = data.original.attr('id').replace('refine-', '');     // == tagName, but that's not available here hence the apparently slightly odd method of getting it
                  tmp.tag = data.selectedData.text;
                  var data = gisportal.refinePanel.currentData;
   
                  data.refine.push(tmp);
                  gisportal.refinePanel.currentData = data;
                  gisportal.refinePanel.refreshData();
               }
            }
         })
         // this doesn't work because the dropdown isn't actually rendered until in we're in the next loop, and by then `tagName` has changed value
         // try getting the index using _.findIndex with refineValue
         //
         //
         // .ready(function() {
         // if (refineValue != undefined) {
         //   $('#refine-' + tagName).ddslick('select', { value: refineValue});
         // }
         // });
      }

      // once the filter drop downs have been rendered loop through all refinedIndicators adding tooltips for more info
      for (var indicator in refinedIndicators) {
         var id = refinedIndicators[indicator];
         var holder = $('input[value="' + id + '"]').parent()
         
         var tags = [];
         for (cat in gisportal.config.browseCategories) {
            var tmp = {
               name: gisportal.config.browseCategories[cat],
               value: gisportal.layers[id].tags[cat]
            }
            tags.push(tmp);
         }

         var data = {
            provider: gisportal.layers[id].providerTag,
            dateStart: gisportal.layers[id].firstDate,
            dateEnd: gisportal.layers[id].lastDate,
            tags: tags 
         }

         var info = gisportal.templates['tooltip-refinedetails'](data);

         if (holder.length > 0) {
            holder.tooltipster({
               content: $(info),
               position: 'right',
            })
         }
      }

   } else {
      console.log('addToPanel');

   }
};

gisportal.refinePanel.layerFound = function(layerId) {
   var data = {};
   data.id = layerId;

   gisportal.indicatorsPanel.selectLayer(layerId);
   gisportal.indicatorsPanel.addToPanel(data);
   gisportal.indicatorsPanel.open();
   gisportal.refinePanel.reset();
   gisportal.configurePanel.reset();
}

gisportal.refinePanel.reset = function() {
   $('.js-refine-section').html('');
}
