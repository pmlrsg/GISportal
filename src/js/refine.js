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
   gisportal.refinePanel.currentData = null;
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
      var params = {
         "event" : "refinePanel.cancel"
      };
      gisportal.events.trigger('refinePanel.cancel', params);
   });
};

/**
 * Currently refreshData just renders the panel
 */
gisportal.refinePanel.refreshData = function(data) {
   if(data){
      gisportal.refinePanel.currentData = data;
   }
   data = gisportal.refinePanel.currentData;
   
   var name = data.name;
   var refine = data.refine;

   // get a filtered version of groupTags (indicatorTags) that just apply to the selected indicator name
   var tags_flat = gisportal.utils.flattenObject(gisportal.groupTags());
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

   var i;
   // work out if any of the browseCategories for the selected indicator name has more than one option
   for (tag in indicatorTags) {
      if (indicatorTags.hasOwnProperty(tag)) {
         if ( _.keys(indicatorTags[tag]).length > 1 && gisportal.browseCategories[tag]) {
            // has the category already been added to the refine array
            for (i = 0; i < data.refine.length; i++) {
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

   for (i = 0; i < data.refine.length; i++) {
      var category = data.refine[i].cat;
      tag = data.refine[i].tag;
      var indicators;
      if (category !== 'undefined' && tag !== '') {  // they didn't use the search results
         indicators = indicatorCategories[category][tag];
         possibleIndicators.push(indicators);
      } else {                                       // they clicked on a search result, so there won't be a refine category so use the niceName
         indicators = indicatorCategories.niceName[name];
         possibleIndicators.push(indicators);
      }
   }

   // refinedIndicators is an array of values that exist in *all* possibleIndicators arrays
   var refinedIndicators =  _.intersection.apply(_, possibleIndicators);
   var refinedIndicatorLayers;

   // and if there's only 1 then we have our winner - load it up baby
   if (refinedIndicators.length == 1) {
      gisportal.refinePanel.layerFound(refinedIndicators[0]);
      gisportal.refinePanel.currentData = null;
      return;
   } else {
      // more refinement is required. Show the user what they have selected so far
      var selectedTags = [];
      for (var r in refine) {
         var tmp = {
            cat: gisportal.browseCategories[refine[r].cat],
            tag: refine[r].tag,
            rawCat: refine[r].cat
         };
         selectedTags.push(tmp);
      }

      var refine_data = {
         indicatorCount: refinedIndicators.length,
         indicatorName: name,
         refine: selectedTags
      };

      var rendered = gisportal.templates.refine(refine_data);
      $('.js-refined-tags').html(rendered);

      // add some magic to allow them to remove selected categories
      $('.refine-remove').click(function() {
         var cat = $(this).data('cat');
         if($('.refine-remove').length == 1){
            gisportal.configurePanel.reset();
            gisportal.configurePanel.open();
            gisportal.refinePanel.close();
         }else{
            gisportal.refinePanel.removeCategory(cat);
         }
         var params = {
            "event" : "refinePanel.removeCat",
            "cat": cat
         };
         gisportal.events.trigger('refinePanel.removeCat', params);
      });
      $('.indicator-select').bind('scroll', function() {
         var scrollPercent = parseInt(100 * ($(this).scrollTop()/(this.scrollHeight - $(this).height())));
         var params = {
            "event": "refinePanel.scroll",
            "scrollPercent": scrollPercent
         };
         gisportal.events.trigger('refinePanel.scroll', params);
      });

      // build an object of gisportal.layers based on refinedIndicators so that we can pass this to 
      // the gisportal.groupNames function to get a set of matching tags in the right structure
      refinedIndicatorLayers = {};

      for (i in refinedIndicators){
         var layer_id = refinedIndicators[i];
         refinedIndicatorLayers[layer_id] = gisportal.layers[layer_id];
      }
      
   }
   gisportal.refinePanel.renderRefreshedData(furtherFilters, refinedIndicatorLayers, refine, name, refinedIndicators);
};

gisportal.refinePanel.renderRefreshedData = function(furtherFilters, refinedIndicatorLayers, refine, name, refinedIndicators){

   if (refinedIndicators.length == 1) {
      gisportal.refinePanel.layerFound(refinedIndicators[0]);
      return;
   }
   var alreadyRefinedFilters = [];
   var matching_tags = gisportal.groupNames(refinedIndicatorLayers)[name];
   var placeholder, data, indicator, id, info, holder;
   // if not, at this stage there must be more than one refinedIndicators so we need to render the possible filters
   if (furtherFilters.length > 0) {    // there's at least one more user selection required to identify a single indicator
      var refineSection = $('.js-refine-section');
      refineSection.html('');

      var checkTag = function(chr) { return chr.cat == tagName; };

      var updateDDSlick = function(data) {
         if (data.selectedData) {
            var tmp = {};
            tmp.cat = data.original.attr('id').replace('refine-', '');     // == tagName, but that's not available here hence the apparently slightly odd method of getting it
            tmp.tag = data.selectedData.text;
            data = gisportal.refinePanel.currentData;

            data.refine.push(tmp);
            gisportal.refinePanel.currentData = data;
            gisportal.refinePanel.refreshData();
         }
      };

      // create drop downs for each of the further filters
      for (var i = 0; i < furtherFilters.length; i++) {
         var tagName = furtherFilters[i];
         var tagDisplayName = gisportal.browseCategories[tagName];

         // we only want to show tags that haven't already been selected, so if the tag's in refine.data don't bother with it (or maybe show it but pre-selected?)
         var tagRefinedAlready = _.findKey(refine, checkTag);

         if (tagRefinedAlready === undefined) {  // it hasn't been refined so we can show it
            // first create a div and append it to the filter section
            placeholder = $('<div class="js-refine-section-' + tagName + '"><div id="refine-' + tagName + '"></div></div>');
            placeholder.appendTo(refineSection);

            var a = 'a';
            if (_.indexOf(['a','e','i','o','u'], tagDisplayName.substring(0,1).toLowerCase()) > -1) a = 'an';

            // then add a ddslick drop down to it populated with tagName options
            $('#refine-' + tagName).ddslick({
               data: gisportal.utils.mustacheFormat(matching_tags[tagName]),
               initialState: 'open',
               selectText: 'Select '+ a + ' ' + tagDisplayName,
               onSelected: updateDDSlick
            });
         } else {
            // If the tag has already been refined, add it to the alreadyRefinedFilters array
            alreadyRefinedFilters.push(tagName);
         }
      }

      if (alreadyRefinedFilters.length != furtherFilters.length) {
         // If there are furtherFilters that haven't already been refined
         // once the filter drop downs have been rendered loop through all refinedIndicators adding tooltips for more info
         for (indicator in refinedIndicators) {
            id = refinedIndicators[indicator];
            holder = $('input[value="' + id + '"]').parent();

            var layer = gisportal.layers[id];
            var tags = [];
            for (var cat in gisportal.browseCategories) {
               var tmp = {
                  name: gisportal.browseCategories[cat],
                  value: layer.tags[cat]
               };
               tags.push(tmp);
            }

            data = {
               provider: layer.providerTag,
               dateStart: layer.firstDate,
               dateEnd: layer.lastDate,
               owner: layer.owner,
               tags: tags
            };

            info = gisportal.templates['tooltip-refinedetails'](data);

            if (holder.length > 0) {
               holder.tooltipster({
                  contentCloning: true,
                  content: $(info),
                  position: 'right',
               });
            }
         }
      }

   }
   if (furtherFilters.length === 0 || alreadyRefinedFilters.length == furtherFilters.length) {
      // If there aren't any furtherFilters or they've all been already refined
      placeholder = $('<div class="js-refine-section-external' + '"><div id="refine-external"></div></div>');
      $('.js-refined-tags').append(placeholder);
      data = {};
      for (indicator in refinedIndicators){
         data[refinedIndicators[indicator]] = [refinedIndicators[indicator]];
      }

      $('#refine-external').ddslick({
         data: gisportal.utils.mustacheFormat(data),
         initialState: 'open',
         selectText: 'Select a Layer',
         onSelected: function(data) {
            gisportal.refinePanel.layerFound(data.selectedData.text);
         }
      });

      for (indicator in refinedIndicators){
         id = refinedIndicators[indicator];
         info = gisportal.templates['tooltip-refine-external-details'](gisportal.layers[id]);
         holder = $('input[value="' + id + '"]').parent();
         if (holder.length > 0) {
            holder.tooltipster({
               contentCloning: true,
               content: $(info),
               position: 'right',
            });
         }
      }




   }
};

gisportal.refinePanel.layerFound = function(layerId, style) {
   var data = {};
   data.id = layerId;

   gisportal.indicatorsPanel.selectLayer(layerId, style);
   gisportal.indicatorsPanel.addToPanel(data);
   gisportal.indicatorsPanel.open();
   gisportal.refinePanel.reset();
   gisportal.configurePanel.reset();
   if(gisportal.getAutoScaleFromString(gisportal.layers[layerId].autoScale)){
      gisportal.scalebars.autoScale(layerId);
   }
};

gisportal.refinePanel.removeCategory = function(cat) {
   var refine = gisportal.refinePanel.currentData.refine;
   var refineTmp = [];

   for (var r in refine) {
      if (refine[r].cat != cat) refineTmp.push(refine[r]);
   }

   gisportal.refinePanel.currentData.refine = refineTmp;

   if (refineTmp.length === 0) {
      gisportal.refinePanel.close();
   } else {
      gisportal.refinePanel.refreshData();
   }
};

gisportal.refinePanel.reset = function() {
   $('.js-refine-section').html('');
};