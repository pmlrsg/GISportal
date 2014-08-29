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
gisportal.refinePanel.open = function(data)  {
   this.found = false;
   this.initDOM();
   $('#refinePanel').toggleClass('hidden', false).toggleClass('active', true);
   this.currentData = data;
   $('.js-refine-name').html(this.currentData.name);
   this.refreshData(data);
}; 

/**
 * Closes the refine panel
 */
gisportal.refinePanel.close = function()  {
   $('#js-refine-section-interval').toggleClass('hidden', true);
   $('#js-refine-section-reliability').toggleClass('hidden', true);
   $('#refinePanel').toggleClass('hidden', true).toggleClass('active', false);
};

/**
 * When an indicator has been found (refined) then
 * call this function to set gisportal.refinePanel.found to true
 * and adds the indicator to the correct places, then opens the indicators
 * panel.
 *
 * @params {object} data - The indicator
 */
gisportal.refinePanel.foundIndicator = function(data)  {
   var id = data.id || data;
   if (_.indexOf(gisportal.selectedLayers, id) > -1 || (data.id && this.found)) return false;
   this.found = true;
   gisportal.indicatorsPanel.selectLayer(id);
   var tmp = {
      id: id,
      name: gisportal.layers[id].name,
   };
   if (data.interval) tmp.interval = data.interval;
   if (data.confidence) tmp.confidence = data.confidence;
   gisportal.indicatorsPanel.addToPanel(tmp);
   gisportal.refinePanel.close();
   gisportal.indicatorsPanel.open();
};

/**
 * This initiates the DOM event handlers.
 * 
 * @param {object} data - This object holds all the data needed
 */
gisportal.refinePanel.initDOM = function(data)  {
   $('.js-refine-configure').on('click', function()  {
      gisportal.configurePanel.open();
      gisportal.refinePanel.close();
   });

   var change = function()  {
      var ids = $(this).val().split(',');
      var current = gisportal.refinePanel.currentData.id;
      gisportal.refinePanel.refineData(ids, current);
   };
   
   $('#refinePanel').one('click', '.indicator-select input[type="radio"]', change);

   if (data && data.refine && data.refine.cat && data.refine.tag)  {
      var val = $('#refine-region [data-key="' + data.refine.tag + '"]').val();
      $('#refine-region [value="' + val + '"]').click();
   }

   var click = function()  {
      var id = $(this).data('id');
      var name = $(this).data('name');
      //if (id !== "none") gisportal.refinePanel.render(id);
      //else  {
         var group = gisportal.groupNames()[name];
         gisportal.refinePanel.render({
         name: name,
         id: id,
         refined: false}, group);
      //}
   };
   $('#refinePanel').one('click', '.js-reset-options', click);
};

/**
 * Currently refreshData just renders the panel
 */
gisportal.refinePanel.refreshData = function(data)  {
   gisportal.refinePanel.render(data); 
};

/**
 * The refineData function takes an array of possible ids
 * and the current id (which could possibly be deprecated
 * now that the refinePanel is split away from indicators).
 * It refines down the selection of ids to show the available
 * options (such as interval and confidence).
 *
 * @params {object} ids - Array of possible ids
 * @params {string} current - Current id (deprecate?)
 */
gisportal.refinePanel.refineData = function(ids, current)  {
   var indicator = gisportal.layers[ids[0]];
   if (indicator)  {
      var name = indicator.name.toLowerCase();
      var groupedNames = gisportal.groupNames()[name];
      var results = groupedNames;
      var names = Object.keys(groupedNames);
      for (var i = 0; i < names.length; i++)  {
         var cat = names[i];
         var tags = Object.keys(groupedNames[cat]);
         for (var j = 0; j < tags.length; j++)
         {
            var tag = groupedNames[cat][tags[j]];
            var result = _.intersection(tag, ids);
            results[cat][tags[j]] = result; 
         }
      }
      var indicator = gisportal.layers[current] || {};
      indicator.groupedNames = {};
      
      this.render({
         indicator : indicator, 
         id : current,
         name : name,
         refined: true
      }, results);
   }
};

/**
 * This function renders the refinePanel.
 *
 * @param {object} data - Object including id, name and boolean called refined
 * @param {object} group - The groupNames() making it easy to find ids with the name
 */
gisportal.refinePanel.render = function(data, group)  {
   var indicator = data.indicator || {};
   var id = data.id;
   var name = data.name;
   var refined = data.refined;
  
   if (!group) group = gisportal.groupNames()[name] || {};
   for (var cat in group)  {
      group[cat] = gisportal.utils.mustacheFormat(group[cat]);
   }
   group.region = group.region || []; 
   /*if (data.refine)  {
      var index = _.findIndex(group[data.refine.cat], function(d) { return d.key === data.refine.tag; });
      if (index > -1)  {
         group.region = [group[data.refine.cat][index]];
         var ids = [];
         _.forEach(group.region, function(d) {
            ids.push(d.value);
         });
         ids = _.flatten(ids);
         if (ids.length === 1) gisportal.refinePanel.refineData(ids, gisportal.refinePanel.currentData);
      }
   } */
      
   indicator.hasInterval = false;
   indicator.hasConfidence = false;
   if ((refined && gisportal.refinePanel.found !== false) || group.region.length === 1)  {
      indicator.refined = true;
      var found = true;

      if (group.interval.length > 1)  {
         indicator.hasInterval = true;
         found = false;
      }
      
      if (group.Confidence.length > 1)  {
         indicator.hasConfidence = true;
         found = false;
      }
      
      if (found === true)  {
         var newId = group.region[0].value[0];
         var newName;

         if (id !== "none" && id)  {
            if (_.indexOf(gisportal.selectedLayers, newId) === -1)  {
               var tmp = {};
               tmp.id = newId;
               tmp.interval = group.interval[0];
               tmp.confidence = group.Confidence[0];
               gisportal.refinePanel.foundIndicator(tmp); 
            }
            else  {
               gisportal.refinePanel.close();
               gisportal.indicatorsPanel.open();
            }
         }
      }                  
   }
   else  {
      indicator.refined = false;
   }

   indicator.id = id || "none";
   indicator.name = name;
   indicator.modified = gisportal.utils.nameToId(name);
   indicator.groupedNames = group;
   var template = '{{#tag}}<li >      <p class="grid-cell fill">{{key}}</p>      <label class="icon_checkbox icon-svg no-stroke grid-cell icon-column bg-removed" title="Enable {{key}}">      <input type="radio" class="hidden" value="{{value}}" data-key="{{key}}" />      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="svg-checkbox" viewBox="0 0 24 24" version="1.1" xml:space="preserve" x="0px" y="0px" width="24px" height="24px">	<g>		<g id="tick">			<path d="M 10.1319 18.0093 C 9.9995 18.0093 9.872 17.9565 9.7783 17.8628 L 4.7771 12.8628 C 4.5817 12.6675 4.5817 12.3511 4.7771 12.1563 C 4.9725 11.9609 5.2889 11.9609 5.4843 12.1563 L 10.0918 16.7622 L 22.2455 1.6963 C 22.4189 1.4805 22.733 1.4473 22.9488 1.6201 C 23.1637 1.7939 23.1974 2.1084 23.024 2.3232 L 10.5211 17.8228 C 10.4322 17.9341 10.3004 18.0015 10.1587 18.0083 C 10.1495 18.0093 10.1407 18.0093 10.1319 18.0093 Z"></path>		</g>		<g id="box">			<path d="M 19.6341 23.0093 L 1.6299 23.0093 C 1.3535 23.0093 1.1298 22.7856 1.1298 22.5093 L 1.1298 4.5098 C 1.1298 4.2334 1.3535 4.0098 1.6299 4.0098 L 14.6329 4.0098 C 14.9094 4.0098 15.133 4.2334 15.133 4.5098 C 15.133 4.7861 14.9094 5.0098 14.6329 5.0098 L 2.13 5.0098 L 2.13 22.0093 L 19.134 22.0093 L 19.134 11.5098 C 19.134 11.2334 19.3577 11.0098 19.6341 11.0098 C 19.9105 11.0098 20.1342 11.2334 20.1342 11.5098 L 20.1342 22.5093 C 20.1342 22.7856 19.9105 23.0093 19.6341 23.0093 Z"></path>		</g>	</g></svg></label>   </li>{{/tag}}';

   if (!refined)  {
      indicator.tag = indicator.groupedNames['region'];
      var rendered = Mustache.render(template, indicator);
      $('#refine-region').html(rendered).find('input[type="radio"]').change(function(){
         var label = $(this).parent();
	     label.addClass('active');
      });
   }else{
	   
   }
   
   $('#refine-interval').parent().toggleClass('hidden', true);
   $('#refine-confidence').parent().toggleClass('hidden', true);
   $('#refine-reliability').parent().toggleClass('hidden', true);
   
   if (indicator.hasInterval)  {
      indicator.tag = indicator.groupedNames['interval'];
      var rendered = Mustache.render(template, indicator);
      $('#refine-interval').html(rendered).parent().toggleClass('hidden', false);
   }

   if (indicator.hasConfidence && (!indicator.hasInterval || group.interval.length <= 1 )) {
      indicator.tag = indicator.groupedNames['Confidence'];
      var rendered = Mustache.render(template, indicator);
      $('#refine-reliability').html(rendered).parent().toggleClass('hidden', false); 
   } 

   if (refined)  {
      $('.js-reset-options[data-name="' + name.toLowerCase() + '"]').removeClass('hidden');
   }
   this.initDOM(data);
};
