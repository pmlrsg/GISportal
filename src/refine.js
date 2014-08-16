/*------------------------------------*\
    Refine Panel
    This file is for the 'refine' 
    panel.
\*------------------------------------*/

gisportal.refinePanel = {};

gisportal.refinePanel.currentData = null;

gisportal.refinePanel.found = false;
gisportal.refinePanel.open = function(data)  {
   this.found = false;
   this.initDOM();
   $('#refinePanel').toggleClass('hidden', false).toggleClass('active', true);
   this.currentData = data;
   $('.js-refine-name').html(this.currentData.name);
   this.refreshData(data);
}; 

gisportal.refinePanel.close = function()  {
   $('#js-refine-section-interval').toggleClass('hidden', true);
   $('#js-refine-section-reliability').toggleClass('hidden', true);
   $('#refinePanel').toggleClass('hidden', true).toggleClass('active', false);
};

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

gisportal.refinePanel.initDOM = function(data)  {
   $('.js-refine-configure').on('click', function()  {
      gisportal.configurePanel.open();
      gisportal.refinePanel.close();
   });

   var change = function()  {
      var ids = $('option:selected', this).val().split(',');
      var current = gisportal.refinePanel.currentData.id;
      gisportal.refinePanel.refineData(ids, current);
   };
   
   $('#refinePanel').on('change', '.indicator-select select', change);

   if (data && data.refine && data.refine.cat && data.refine.tag)  {
      var val = $('#refine-region [data-key="' + data.refine.tag + '"]').val();
      $('#refine-region').val(val).change();
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


gisportal.refinePanel.refreshData = function(data)  {
   gisportal.refinePanel.render(data); 
};

gisportal.refinePanel.refineData = function(ids, current)  {
   var indicator = gisportal.layers[ids[0]];
   if (indicator)  {
      var name = indicator.name.toLowerCase();
      var groupedNames = gisportal.groupNames()[name];
      var results = groupedNames;
      for (var i = 0; i < Object.keys(groupedNames).length; i++)  {
         var cat = Object.keys(groupedNames)[i];
         for (var j = 0; j < Object.keys(groupedNames[cat]).length; j++)
         {
            var tag = groupedNames[cat][Object.keys(groupedNames[cat])[j]];
            console.log('Before',tag);
            var result = _.intersection(tag, ids);
            results[cat][Object.keys(groupedNames[cat])[j]] = result; 
            console.log('After', result);
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
   var template = '{{#tag}}<option value="{{value}}" data-key="{{key}}">{{key}}</option>{{/tag}}';

   if (!refined)  {
      indicator.tag = indicator.groupedNames['region'];
      var rendered = Mustache.render(template, indicator);
      var placeholder = '<option class="js-placeholder">Choose Region</option>';
      if (group.region.length <= 1) placeholder = '';
      $('#refine-region').html(placeholder + rendered);
   }
   $('#refine-interval').parent().toggleClass('hidden', true);
   $('#refine-confidence').parent().toggleClass('hidden', true);
   
   if (indicator.hasInterval)  {
      indicator.tag = indicator.groupedNames['interval'];
      var rendered = Mustache.render(template, indicator);
      var placeholder = '<option class="js-placeholder">Choose Interval</option>';
      $('#refine-interval').html(placeholder + rendered).parent().toggleClass('hidden', false);
   }

   if (indicator.hasConfidence && (!indicator.hasInterval || group.interval.length <= 1 )) {
      indicator.tag = indicator.groupedNames['Confidence'];
      var rendered = Mustache.render(template, indicator);
      var placeholder = '<option class="js-placeholder">Choose Reliability</option>';
      $('#refine-reliability').html(placeholder + rendered).parent().toggleClass('hidden', false); 
   } 

   if (refined)  {
      $('.js-reset-options[data-name="' + name.toLowerCase() + '"]').removeClass('hidden');
   }
   this.initDOM(data);
};
