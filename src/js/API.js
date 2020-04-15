gisportal.api = {};

 /*
 ==========API DOCUMENT WIDE COMMENT==========
 Each function takes a compulsary data object that contains all of the data for the function to run.
 The options object is an optional parameter. If option is empty, the functionallity will be run.
 Adding the option 'describeOnly' will make the function return a description of what it would do using the 'data' parameter
 Adding the option 'highlight' will mean that when the function runs, it will highlight the corresponding element
 The heading for each function tells you what data is needed for the function to run succesfully.

 */

 /*
 'data' must contain the following:

 scrollPercent: The percentage of the configuration panel to scroll to
  */
gisportal.api['configurepanel.scroll'] = function(data, options){
	options = options || {};
	var scrollPercent = data.scrollPercent;
	if(options.describeOnly){
		return "Configuration panel scrolled to " + scrollPercent + "%.";
	}
	if(options.selectorOnly){
		return '#configurePanel';
	}
	var div = $('#configurePanel');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

 /*
 'data' must contain the following:

 state: The state for the joining member to load
 [One of the following:]
 joining-member: The email of the user who is joining and should update their state
 force: Should everybody be forced to load the state
  */
gisportal.api['room.presenter-state-update'] = function(data, options){
	options = options || {};
	var state = data.state;
	if(options.describeOnly){
		return "Member Joining";
	}
	if(options.selectorOnly){
		return '';
	}
	if(data.force || data['joining-member'] == gisportal.user.info.email){
		gisportal.stopLoadState = false;
      gisportal.loadState(state);
	}
};

 /*
 'data' must contain the following:

 scrollPercent: The percentage of the map settings panel to scroll to
  */
gisportal.api['mapsettingspanel.scroll'] = function(data, options){
	var scrollPercent = data.scrollPercent;
	if(options.describeOnly){
		return "Map settings scrolled to " + scrollPercent + "%.";
	}
	if(options.selectorOnly){
		return '#mapSettingsPanel';
	}
	var div = $('#mapSettingsPanel');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

 /*
 'data' must contain the following:

 scrollPercent: The percentage of the Add Layers Form to scroll to
  */
gisportal.api['addLayersForm.scroll'] = function(data, options){
	options = options || {};
	var scrollPercent = data.scrollPercent;
	if(options.describeOnly){
		return "Add Layers Form scrolled to " + scrollPercent + "%.";
	}
	if(options.selectorOnly){
		return '.overlay-container-form';
	}
	var div = $('.overlay-container-form');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

 /*
 'data' must contain the following:

 scrollPercent: The percentage of the open slideout to scroll to
  */
gisportal.api['slideout.scroll'] = function(data, options){
	options = options || {};
	var scrollPercent = data.scrollPercent;
	if(options.describeOnly){
		return "Slideout scrolled to " + scrollPercent + "%.";
	}
	if(options.selectorOnly){
		return '.js-slideout-content';
	}
	var div = $('.js-slideout-content');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

 /*
 'data' must contain the following:

 scrollPercent: The percentage of the map settings panel to scroll to
  */
gisportal.api['refinePanel.scroll'] = function(data, options){
	options = options || {};
	var scrollPercent = data.scrollPercent;
	if(options.describeOnly){
		return "Refine Panel scrolled to " + scrollPercent + "%.";
	}
	if(options.selectorOnly){
		return '.indicator-select';
	}
	var div = $('.indicator-select');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

 /*
 'data' must contain the following:

 layer: The id of the layer you would like to add the server for
 layer: The server you would like to add
  */
gisportal.api['addLayerServer.clicked'] = function(data, options){
	options = options || {};
	var layer = data.layer;
   var server = data.server;
   var add_elem = $('.js-add-layer-server[data-layer="' + layer + '"][data-server="' + server + '"]');
	if(options.describeOnly){
		return "Add Server clicked: layer";
	}
	if(options.selectorOnly){
		return '.js-add-layer-server[data-layer="' + layer + '"][data-server="' + server + '"]';
	}
	if(add_elem.length > 0){
		if(options.highlight){
      	collaboration.highlightElement(add_elem);
		}
      add_elem.trigger('click');
   }
};

 /*
 'data' must contain the following:

 inputValue: The input value to put into the field
 field: The field name to add the value to
  */
gisportal.api['addLayersForm.input'] = function(data, options){
	options = options || {};
	var input = data.inputValue;
   var field = data.field;
	if(options.describeOnly){
		return "'" + input + "' input to '" + field +  "' field.";
	}
	if(options.selectorOnly){
		return 'textarea[data-field="' + field + '"],input[data-field="' + field + '"]';
	}
   var input_elem = $('textarea[data-field="' + field + '"],input[data-field="' + field + '"]');
   var highlight_elem = input_elem;
   if(field == "Rotation"){
      input_elem = input_elem.filter('[value="' + input + '"]');
      highlight_elem = input_elem.parent();
   }else if(input_elem.is(':checkbox')){
      input_elem.prop('checked', input);
   }else{
      // Makes sure the element is only highlighted if there has been a change
      if(input_elem.val() == input){
         highlight_elem = undefined;
      }
      input_elem.val(input);
   }
   input_elem.trigger('change');
   if(highlight_elem && options.highlight){
      collaboration.highlightElement(highlight_elem);
   }
};

 /*
 'data' must contain the following:

 value: The boolean value to change autoscale to
  */
gisportal.api['addLayersForm.autoScale-changed'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Autoscale changed.";
	}
	if(options.selectorOnly){
		return 'select[data-field="originalAutoScale"]';
	}
	var select_elem = $('select[data-field="originalAutoScale"]');
   select_elem.val(data.value).trigger('change');
   if(options.highlight){
   	collaboration.highlightElement(select_elem);
   }
};

 /*
 'data' must contain the following:

 value: The boolean value to change aboveMaxColor to
  */
gisportal.api['addLayersForm.aboveMaxColor-changed'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Above Max Colour changed.";
	}
	if(options.selectorOnly){
		return 'select[data-field="defaultAboveMaxColor"]';
	}
	var select_elem = $('select[data-field="defaultAboveMaxColor"]');
   select_elem.val(data.value).trigger('change');
   if(options.highlight){
   	collaboration.highlightElement(select_elem);
   }
};

 /*
 'data' must contain the following:

 value: The boolean value to change belowMinColor to
  */
gisportal.api['addLayersForm.belowMinColor-changed'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Below Min Colour changed.";
	}
	if(options.selectorOnly){
		return 'select[data-field="defaultBelowMinColor"]';
	}
	var select_elem = $('select[data-field="defaultBelowMinColor"]');
   select_elem.val(data.value).trigger('change');
   if(options.highlight){
   	collaboration.highlightElement(select_elem);
   }
};

 /*
 'data' must contain the following:

 value: The boolean value to change defaultStyle to
  */
gisportal.api['addLayersForm.defaultStyle-changed'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Default Style changed.";
	}
	if(options.selectorOnly){
		return 'select[data-field="defaultStyle"]';
	}
	var select_elem = $('select[data-field="defaultStyle"]');
   select_elem.val(data.value).trigger('change');
   if(options.highlight){
   	collaboration.highlightElement(select_elem);
   }
};

 /*
 'data' does not need to contain anything.
  */
gisportal.api['addLayersForm.close'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Form closed.";
	}
	if(options.selectorOnly){
		return 'span.js-layer-form-close';
	}
	$('span.js-layer-form-close').trigger('click');
};

 /*
 'data' must contain the following:

 code: The keyCode that you would like to replicate
  */
gisportal.api['body.keydown'] = function(data, options){
	options = options || {};
	var keyCode = data.code;
	var keyName;
   switch(keyCode){
      case 27:
         keyName = "Esc";
         break;
      case 37:
         keyName = "LEFT Arrow";
         break;
      case 39:
         keyName = "RIGHT Arrow";
         break;
   }

	if(options.describeOnly){
		return "Keydown: "+ keyName;
	}
	if(options.selectorOnly){
		return '';
	}
	var e = jQuery.Event("keydown");
   e.which = keyCode; // # Some key code value
   e.keyCode = keyCode;
   document.activeElement.blur();
   $('body').trigger(e);
};

 /*
 'data' must contain the following:

 date: The date you would like to be selected
  */
gisportal.api['date.selected'] = function(data, options){
	options = options || {};
	var date = new Date(data.date);

	if(options.describeOnly){
		return "Date changed to " + moment.utc(date).format('YYYY-MM-DD hh:mm');
	}
	if(options.selectorOnly){
		return '.js-current-date';
	}
	if(options.highlight){
		collaboration.highlightElement($('.js-current-date'));
	}
   if(gisportal.timeline && gisportal.timeline.timebars && gisportal.timeline.timebars.length > 0){
      gisportal.timeline.setDate(date);
   }
};

 /*
 'data' must contain the following:

 startDate: The start date you would like to zoom to
 endDate: The end date you would like to zoom to
 noPadding: (optional) whether padding should be added at either side
  */
gisportal.api['date.zoom'] = function(data, options) {
   options = options || {};
   var startDate = null;
   var endDate = null;
   var oldStartDate = gisportal.timeline.xScale.invert(0);
   var oldEndDate = gisportal.timeline.xScale.invert(gisportal.timeline.width);

   if (data.startDate !== null) {
      startDate = new Date(data.startDate);
   }
   if (data.endDate !== null) {
      endDate = new Date(data.endDate);
   }
   var noPadding = data.noPadding;

   if (startDate === null || endDate === null || startDate.getTime() != oldStartDate.getTime() || endDate.getTime() != oldEndDate.getTime()) {
      if (options.describeOnly) {
         if (startDate === null) {
            return "Date zoomed to " + moment.utc(oldStartDate).format('YYYY-MM-DD hh:mm') + " - " + moment.utc(endDate).format('YYYY-MM-DD hh:mm');
         } else if (endDate === null) {
            return "Date zoomed to " + moment.utc(startDate).format('YYYY-MM-DD hh:mm') + " - " + moment.utc(oldEndDate).format('YYYY-MM-DD hh:mm');
         }
         return "Date zoomed to " + moment.utc(startDate).format('YYYY-MM-DD hh:mm') + " - " + moment.utc(endDate).format('YYYY-MM-DD hh:mm');
      }
      if (options.selectorOnly) {
         return '#timeline';
      }
      if (options.highlight) {
         collaboration.highlightElement($('#timeline'));
      }
      if (gisportal.timeline && gisportal.timeline.timebars && gisportal.timeline.timebars.length > 0) {
         gisportal.timeline.zoomDate(startDate, endDate, noPadding);
      }
   }
};

 /*
 'data' must contain the following:

 obj: The id of the ddslick to be opened
  */
gisportal.api['ddslick.open'] = function(data, options){
	options = options || {};
	var obj = $('#' + data.obj);

	if(options.describeOnly){
		return "Dropdown opened";
	}
	if(options.selectorOnly){
		return '#' + data.obj;
	}
   obj.ddslick('open');
};

 /*
 'data' must contain the following:

 obj: The id of the ddslick to be selected
 value: The value to be selected
  */
gisportal.api['ddslick.selectValue'] = function(data, options){
	options = options || {};
	var obj = $('#' + data.obj);
	var value = data.value;
	var niceVal = obj.find('[value="' + data.value + '"]').siblings('label').html();

	if(options.describeOnly){
		return "Value selected: " + niceVal || value;
	}
	if(options.selectorOnly){
		return '#' + data.obj;
	}
	var selected_elem = obj.find('.dd-options input[value="' + value + '"]').closest('li');
	selected_elem.toggleClass('dd-selected-soon', true);
	setTimeout(function(){
		obj.ddslick('select', { "value": value });
		selected_elem.toggleClass('dd-selected-soon', false);
	}, 200);
};

 /*
 'data' must contain the following:

 view_name: The name of the view to load
  */
gisportal.api['view.loaded'] = function(data, options){
	options = options || {};
	var view = data.view_name;
	var nice_val = $('.js-views-list').find('[value="' + view + '"]').html() || view;

	if(options.describeOnly){
		return 'View Loaded: "' + nice_val + '"';
	}
	if(options.selectorOnly){
		return '';
	}
   gisportal.view.loadView(view);
};

 /*
 'data' must contain the following:

 view_name: The name of the view to remove
  */
gisportal.api['view.removed'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return 'View Removed';
	}
	if(options.selectorOnly){
		return '';
	}
   gisportal.view.removeView();
};

 /*
 'data' must contain the following:

 scrollPercent: The percentage of the map indicators panel to scroll to
  */
gisportal.api['indicatorspanel.scroll'] = function(data, options){
	options = options || {};
	var scrollPercent = data.scrollPercent;

	if(options.describeOnly){
		return "Indicators Panel scrolled to " + scrollPercent + "%.";
	}
	if(options.selectorOnly){
		return '#indicatorsPanel';
	}
	var div = $('#indicatorsPanel');
   // This stops the animation that scrolls to a layer
   div.trigger('mousewheel');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

 /*
 'data' must contain the following:

 id: The id of the layer to be hidden
 layerName: The name of the layer to be hidden
  */
gisportal.api['layer.hide'] = function(data, options){
	options = options || {};
	var id = data.id;

	if(options.describeOnly){
		return 'Layer hidden - '+ data.layerName;
	}
	if(options.selectorOnly){
		return '.js-toggleVisibility[data-id="' + id + '"]';
	}
	if(options.highlight){
		collaboration.highlightElement($('.js-toggleVisibility[data-id="' + id + '"]'));
	}
	gisportal.indicatorsPanel.hideLayer(id);
};

 /*
 'data' does not need to contain anything.
  */
gisportal.api['panel.hide'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Panel Hidden";
	}
	if(options.selectorOnly){
		return '.js-hide-panel';
	}
	$('.js-hide-panel').trigger('click');
};

 /*
 'data' does not need to contain anything.
  */
gisportal.api['panel.show'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Panel Shown";
	}
	if(options.selectorOnly){
		return '.js-show-tools';
	}
	$('.js-show-tools').trigger('click');
};

 /*
 'data' must contain the following:

 id: The id of the layer to be removed
 layerName: The name of the layer to be removed
  */
gisportal.api['layer.remove'] = function(data, options){
	options = options || {};
	var id = data.id;

	if(options.describeOnly){
		return 'Layer removed - '+ data.layerName;
	}
	if(options.selectorOnly){
		return '[data-id="' + id + '"] .js-remove';
	}
	$('[data-id="' + id + '"] .js-remove').trigger('click');
};

 /*
 'data' must contain the following:

 newLayerOrder: A list of layer ids in the new order.
  */
gisportal.api['layer.reorder'] = function(data, options){
	options = options || {};
	var newLayerOrder = data.newLayerOrder;
	var ul = $('ul.js-indicators');

	if(options.describeOnly){
		return 'Layers re-ordered';
	}
	if(options.selectorOnly){
		return 'ul.js-indicators';
	}
	for (var i = newLayerOrder.length; i > -1; i--) {
      var li = $('.indicator-header').parent('[data-id="'+ newLayerOrder[i] +'"]');
      li.remove();                            // take it out of its current position 
      ul.prepend(li).hide().slideDown();      // and put it back at the start of the list
   }
   gisportal.indicatorsPanel.reorderLayers();
};

 /*
 'data' must contain the following:

 id: The id of the layer to be shown
 layerName: The name of the layer to be shown
  */
gisportal.api['layer.show'] = function(data, options){
	options = options || {};
	var id = data.id;

	if(options.describeOnly){
		return 'Layer un-hidden - '+ data.layerName;
	}
	if(options.selectorOnly){
		return '.js-toggleVisibility[data-id="' + id + '"]';
	}
	if(options.highlight){
		collaboration.highlightElement($('.js-toggleVisibility[data-id="' + id + '"]'));
	}
	gisportal.indicatorsPanel.showLayer(id);
};

 /*
 'data' must contain the following:

 zoom: The zoom level of the map
 center: The center of the map
  */
gisportal.api['map.move'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return 'Map Moved';
	}
	if(options.selectorOnly){
		return '';
	}
	var view = map.getView();
   if (view) {
      if (data.zoom) view.setZoom(data.zoom);
      if (data.centre) view.setCenter(data.centre);
   }
};

 /*
 'data' must contain the following:

 panelName: The name of the panel to be shown
  */
gisportal.api['panels.showpanel'] = function(data, options){
	options = options || {};
	var p = data.panelName;
   var nicePanelName = p;
   var panel_div = $('.js-show-panel[data-panel-name="'+ p +'"]');
   if(panel_div.find('span').length > 0){
      nicePanelName = panel_div.find('span').attr('title');
   }else if(panel_div.html() && panel_div.html().length > 0){
      nicePanelName = panel_div.html();
   }

	if(options.describeOnly){
		return 'Panel selected - '+ nicePanelName;
	}
	if(options.selectorOnly){
		return '[data-panel-name="' + p + '"].tab';
	}
	if(options.highlight){
		collaboration.highlightElementShake($('[data-panel-name="' + p + '"].tab'));
	}
   gisportal.panels.showPanel(p);
};

 /*
 'data' does not need to contain anything.
  */
gisportal.api['refinePanel.cancel'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return '"Cancel" clicked';
	}
	if(options.selectorOnly){
		return '.js-refine-configure';
	}
	$('.js-refine-configure').trigger('click');
};

 /*
 'data' must contain the following:

 cat: The cattegory to be removed from the refinement
  */
gisportal.api['panels.removeCat'] = function(data, options){
	options = options || {};
	var cat = data.cat;
   var nice_cat = gisportal.browseCategories[cat] || cat;

	if(options.describeOnly){
		return 'Category removed: ' + nice_cat;
	}
	if(options.selectorOnly){
		return '.refine-remove[data-cat="' + cat + '"]';
	}
   $('.refine-remove[data-cat="' + cat + '"]').trigger('click');
};

 /*
 'data' must contain the following:

 id: The id of the layer to autoscale
 force: A boolean value. If true the layer will definately be autoscaled without checks.
  */
gisportal.api['scalebar.autoscale'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return 'Layer Autoscaled - ' + gisportal.layers[data.id].descriptiveName;
	}
	if(options.selectorOnly){
		return '';
	}
   gisportal.scalebars.autoScale(data.id, data.force);
};

 /*
 'data' must contain the following:

 id: The id of the layer to check the autoscale checkbox
 isChecked: A bollean value to say wether the box should be checked or not
  */
gisportal.api['scalebar.autoscale-checkbox'] = function(data, options){
	options = options || {};
	var id = data.id;
   var isChecked = data.isChecked;

	if(options.describeOnly){
		return 'Autoscale set to ' + isChecked + ' - ' + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '.js-auto[data-id="' + id + '"]';
	}
	if(options.highlight){
   	collaboration.highlightElement($('.js-auto[data-id="' + id + '"]'));
	}
   $('.js-auto[data-id="' + id + '"]').prop( 'checked', isChecked ).trigger('change');
};

 /*
 'data' must contain the following:

 id: The id of the layer to check the log checkbox
 isLog: A bollean value to say wether the box should be checked or not
  */
gisportal.api['scalebar.log-set'] = function(data, options){
	options = options || {};
	var id = data.id;
   var isLog = data.isLog;

	if(options.describeOnly){
		return 'Logarithmic set to ' + isLog + ' - ' + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '.js-indicator-is-log[data-id="' + id + '"]';
	}
	if(options.highlight){
   	collaboration.highlightElement($('.js-indicator-is-log[data-id="' + id + '"]'));
	}
   $('.js-indicator-is-log[data-id="' + id + '"]').prop( 'checked', isLog ).trigger('change');
};

 /*
 'data' must contain the following:

 id: The id of the layer to change the max value
 value: The value for the max value to be set to
  */
gisportal.api['scalebar.max-set'] = function(data, options){
	options = options || {};
	var id = data.id;
   var value = data.value;

	if(options.describeOnly){
		return 'Max set to ' + value + ' - ' + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '.js-scale-max[data-id="' + id + '"]';
	}
	if(options.highlight){
   	collaboration.highlightElement($('.js-scale-max[data-id="' + id + '"]'));
	}
   $('.js-scale-max[data-id="' + id + '"]').val(value).change();
};

 /*
 'data' must contain the following:

 id: The id of the layer to change the min value
 value: The value for the min value to be set to
  */
gisportal.api['scalebar.min-set'] = function(data, options){
	options = options || {};
	var id = data.id;
   var value = data.value;

	if(options.describeOnly){
		return 'Min set to ' + value + ' - ' + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '.js-scale-min[data-id="' + id + '"]';
	}
	if(options.highlight){
   	collaboration.highlightElement($('.js-scale-min[data-id="' + id + '"]'));
	}
   $('.js-scale-min[data-id="' + id + '"]').val(value).change();
};

 /*
 'data' must contain the following:

 id: The id of the layer to change the opacity value
 value: The value for the opacity value to be set to (0-1)
  */
gisportal.api['scalebar.opacity'] = function(data, options){
	options = options || {};
	var id = data.id;
   var value = data.value;
   var opacity;
   if (typeof value != 'undefined') {
   	opacity = value * 100;
	}

	if(options.describeOnly){
		return 'Opacity set to ' + opacity + '% - ' + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '#tab-' + id + '-opacity';
	}
	if(options.highlight){
   	collaboration.highlightElement($('#tab-' + id + '-opacity'));
	}
	if(opacity){
	   $('#tab-' + id + '-opacity').val(opacity);
	   gisportal.layers[id].setOpacity(value);
	}
};

gisportal.api['scalebar.custom-aboveMaxColor'] = function(data, options) {
   options = options || {};
   var id = data.id;
   var colour = data.value;

   if(options.describeOnly){
      return 'Custom Above Max Colour set to ' + colour + '% - ' + gisportal.layers[id].descriptiveName;
   }
   if(options.selectorOnly){
      return '.js-custom-aboveMaxColor[data-id="' + id + '"]';
   }
   if(options.highlight){
      collaboration.highlightElement($('.js-custom-aboveMaxColor[data-id="' + id + '"]'));
   }
   if(colour){
      $('.js-custom-aboveMaxColor[data-id="' + id + '"]').val(colour);
      gisportal.layers[id].aboveMaxColor = colour;
      gisportal.layers[id].setScalebarTimeout();
   }
};

gisportal.api['scalebar.custom-belowMinColor'] = function(data, options) {
   options = options || {};
   var id = data.id;
   var colour = data.value;

   if(options.describeOnly){
      return 'Custom Above Max Colour set to ' + colour + '% - ' + gisportal.layers[id].descriptiveName;
   }
   if(options.selectorOnly){
      return '.js-custom-belowMinColor[data-id="' + id + '"]';
   }
   if(options.highlight){
      collaboration.highlightElement($('.js-custom-belowMinColor[data-id="' + id + '"]'));
   }
   if(colour){
      $('.js-custom-belowMinColor[data-id="' + id + '"]').val(colour);
      gisportal.layers[id].belowMinColor = colour;
      gisportal.layers[id].setScalebarTimeout();
   }
};

 /*
 'data' must contain the following:

 id: The id of the layer to change the colorbands value
 value: The value for the colorbands value to be set to (1-255)
  */
gisportal.api['scalebar.colorbands'] = function(data, options){
	options = options || {};
	var id = data.id;
   var value = data.value;

	if(options.describeOnly){
		return 'Colorbands value set to ' + value + ' - ' + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '#tab-' + id + '-colorbands-value';
	}
	if(options.highlight){
   	collaboration.highlightElement($('#tab-' + id + '-colorbands'));
      collaboration.highlightElement($('#tab-' + id + '-colorbands-value'));
	}
	$('#tab-' + id + '-colorbands-value').val(value).trigger('change');
};

 /*
 'data' must contain the following:

 id: The id of the layer to reset the scalebar for
  */
gisportal.api['scalebar.reset'] = function(data, options){
	options = options || {};
	var id = data.id;

	if(options.describeOnly){
		return 'Scalebar reset - ' + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '.js-reset[data-id="'+ id +'"]';
	}
	var elem = $('.js-reset[data-id="'+ id +'"]');
	if(options.highlight){
   	collaboration.highlightElement(elem);
	}
   elem.click();
};

 /*
 'data' must contain the following:

 id: The id of the layer to apply the scalebar changes for
  */
gisportal.api['scalebar.apply-changes'] = function(data, options){
	options = options || {};
	var id = data.id;

	if(options.describeOnly){
		return 'Changes Applied - ' + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '.js-apply-changes[data-id="'+ data.id +'"]';
	}
	var elem = $('.js-apply-changes[data-id="'+ data.id +'"]');
	if(options.highlight){
   	collaboration.highlightElement(elem);
	}
   elem.click();
};

 /*
 'data' must contain the following:

 searchValue: The value to search for
  */
gisportal.api['search.typing'] = function(data, options){
	options = options || {};
	var searchValue = data.searchValue;

	if(options.describeOnly){
		return 'Search: '+ searchValue;
	}
	if(options.selectorOnly){
		return '.js-search input';
	}
	if(options.highlight){
   	collaboration.highlightElement($('.js-search input'));
	}
   $('.js-search input').val(searchValue).trigger('change');
};

 /*
 'data' must contain the following:

 eType: The event type to trigger on the wml textbox
 typedValue: the value to input to the WMS textbox
  */
gisportal.api['wms.typing'] = function(data, options){
	options = options || {};
	var eType = data.eType;
	var typedValue = data.typedValue;

	if(options.describeOnly){
		return 'WMS entry: ' + typedValue;
	}
	if(options.selectorOnly){
		return 'input.js-wms-url';
	}
	if(options.highlight){
   	collaboration.highlightElement($('input.js-wms-url'));
	}
   $('input.js-wms-url').val(typedValue).trigger(eType);
};

 /*
 'data' must contain the following:

 value: the value to input to the geocoder textbox
  */
gisportal.api['geocoderInput.typing'] = function(data, options){
	options = options || {};
	var value = data.value;

	if(options.describeOnly){
		return 'Search entry: ' + value;
	}
	if(options.selectorOnly){
		return '.ol3-geocoder-input-search';
	}
	if(options.highlight){
   	collaboration.highlightElement($('.ol3-geocoder-input-search'));
	}
   $('.ol3-geocoder-input-search').val(value)[0].dispatchEvent(new CustomEvent('input'));
};

 /*
 'data' must contain the following:

 checked: Should the refreshCache box be chacked?
  */
gisportal.api['refreshCacheBox.clicked'] = function(data, options){
	options = options || {};
	var checked = data.checked;

	if(options.describeOnly){
		return 'refreshCacheBox: ' + checked;
	}
	if(options.selectorOnly){
		return '#refresh-cache-box';
	}
	if(options.highlight){
   	collaboration.highlightElement($('#refresh-cache-box'));
	}
   $('#refresh-cache-box')[0].checked = checked;
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['wms.submitted'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return 'WMS submitted';
	}
	if(options.selectorOnly){
		return 'button.js-wms-url';
	}
	if(options.highlight){
   	collaboration.highlightElement($('button.js-wms-url'));
	}
   $('button.js-wms-url').trigger('click');
};

 /*
 data' does not need to contain anything
  */
gisportal.api['moreInfo.clicked'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return '"More Info" Clicked';
	}
	if(options.selectorOnly){
		return '.more-info';
	}
	if(options.highlight){
   	collaboration.highlightElement($('.more-info'));
	}
   $('.more-info').trigger('click');
};

 /*
 data' does not need to contain anything
  */
gisportal.api['resetList.clicked'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return '"Reset" Clicked';
	}
	if(options.selectorOnly){
		return '.button#reset-list';
	}
   $('button.reset-list').trigger('click');
};

 /*
 data' does not need to contain anything
  */
gisportal.api['showGeocoder.clicked'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return '"Show Geocoder" Clicked';
	}
	if(options.selectorOnly){
		return '.show-geocoder';
	}
	if(options.highlight){
   	collaboration.highlightElement($('.show-geocoder'));
	}
   $('.show-geocoder').trigger('click');
};

 /*
 'data' must contain the following:

 value: The value to be entered into the radius field
  */
gisportal.api['geocoderRadius.changed'] = function(data, options){
	options = options || {};
	var value = data.value;

	if(options.describeOnly){
		return 'Radius value set to: "' + value + '"';
	}
	if(options.selectorOnly){
		return '.js-place-search-filter-radius';
	}
	if(options.highlight){
   	collaboration.highlightElement($('.js-place-search-filter-radius'));
	}
   $('.js-place-search-filter-radius').val(value).trigger('change');
};

 /*
 data' does not need to contain anything
  */
gisportal.api['addLayersForm.clicked'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return '"Add layers" Clicked';
	}
	if(options.selectorOnly){
		return 'button#js-add-layers-form';
	}
	if(options.highlight){
		collaboration.highlightElement($('button#js-add-layers-form'));
	}
	$('button#js-add-layers-form').trigger('click');
};

 /*
 'data' must contain the following:

 searchResult: The search result to be selected
  */
gisportal.api['search.resultselected'] = function(data, options){
	options = options || {};
	var searchResult = data.searchResult;

	if(options.describeOnly){
		return 'Search result selected: ' + searchResult;
	}
	if(options.selectorOnly){
		return '.js-search-results';
	}
	gisportal.configurePanel.toggleIndicator(searchResult, '');
	$('.js-search-results').css('display', 'none');
};

 /*
 'data' must contain the following:

 layerId: The id of the layer to select the tab for
 tabName: The tab to select
  */
gisportal.api['tab.select'] = function(data, options){
	options = options || {};
	var layerId = data.layerId;
	var tabName = data.tabName;

	if(options.describeOnly){
		return gisportal.utils.titleCase(tabName) + ' tab selected for ' + gisportal.layers[layerId].descriptiveName;
	}
	if(options.selectorOnly){
		return '[data-tab-name="'+ tabName +'"][for="tab-'+ layerId + '-' + tabName +'"]';
	}
	if(options.highlight){
		collaboration.highlightElement($('[data-tab-name="'+ tabName +'"][for="tab-'+ layerId + '-' + tabName +'"]'));
	}
	gisportal.indicatorsPanel.selectTab( layerId, tabName );
};

 /*
 'data' must contain the following:

 layerId: The id of the layer to close the tab for
 tabName: The tab to close
  */
gisportal.api['layerTab.close'] = function(data, options){
	options = options || {};
	var layerId = data.layerId;
	var tabName = data.tabName;

	if(options.describeOnly){
		return gisportal.utils.titleCase(tabName) + ' tab closed for ' + gisportal.layers[layerId].descriptiveName;
	}
	if(options.selectorOnly){
		return '[data-tab-name="'+ tabName +'"][for="tab-'+ layerId + '-' + tabName +'"]';
	}
	var tab_elem = $('[data-tab-name="'+ tabName +'"][for="tab-'+ layerId + '-' + tabName +'"]');
   var button_elem = $('#'+$(tab_elem).attr('for'));
   button_elem.removeAttr('checked');
   tab_elem.removeClass('active');
};

 /*
 'data' must contain the following:

 page: The page to go to
  */
gisportal.api['paginator.selected'] = function(data, options){
	options = options || {};
	var page = data.page;

	if(options.describeOnly){
		return 'Page ' + page + ' selected';
	}
	if(options.selectorOnly){
		return '.js-go-to-form-page a[data-page="' + data.page + '"]';
	}
	$('.js-go-to-form-page a[data-page="' + data.page + '"]').trigger('click');
};

 /*
 'data' must contain the following:

 layer: The id of the layer to zoom to the data of
  */
gisportal.api['zoomToData.clicked'] = function(data, options){
	options = options || {};
	var id = data.layer;
	var zoom_elem = $('.js-zoom-data[data-id="' + id + '"]');

	if(options.describeOnly){
		return 'Zoom to data clicked: '  + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '.js-zoom-data[data-id="' + id + '"]';
	}
	if(options.highlight){
		collaboration.highlightElement(zoom_elem);
	}
	zoom_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['submitLayers.clicked'] = function(data, options){
	options = options || {};
	var submit_elem = $('.js-layers-form-submit');

	if(options.describeOnly){
		return '"Submit Layers" clicked';
	}
	if(options.selectorOnly){
		return '.js-layers-form-submit';
	}
	if(options.highlight){
		collaboration.highlightElement(submit_elem);
	}
	submit_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['cancelChanges.clicked'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return '"Cancel Changes" clicked';
	}
	if(options.selectorOnly){
		return '.js-layers-form-cancel';
	}
	$('.js-layers-form-cancel').trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['toggleAllLayers.clicked'] = function(data, options){
	options = options || {};
	var toggle_all_elem = $('.toggle-all-layers');

	if(options.describeOnly){
		return '"Copy to all" clicked';
	}
	if(options.selectorOnly){
		return '.toggle-all-layers';
	}
	if(options.highlight){
		collaboration.highlightElement(toggle_all_elem);
	}
	toggle_all_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['logToAllLayers.clicked'] = function(data, options){
	options = options || {};
	var toggle_all_elem = $('.log-to-all-layers');

	if(options.describeOnly){
		return '"Add to all" clicked';
	}
	if(options.selectorOnly){
		return '.log-to-all-layers';
	}
	if(options.highlight){
		collaboration.highlightElement(toggle_all_elem);
	}
	toggle_all_elem.trigger('click');
};

 /*
 'data' must contain the following:

 field: The field to copy to all layers
  */
gisportal.api['addToAll.clicked'] = function(data, options){
	options = options || {};
	var field = data.field;
	var add_to_all_elem = $('.add-to-all-layers[data-field="' + field + '"]');

	if(options.describeOnly){
		return '"Add to all" clicked';
	}
	if(options.selectorOnly){
		return '.add-to-all-layers[data-field="' + field + '"]';
	}
	if(options.highlight){
		collaboration.highlightElement(add_to_all_elem);
	}
	add_to_all_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['addScalePointsToAll.clicked'] = function(data, options){
	options = options || {};
	var add_to_all_elem = $('.scale-to-all-layers');

	if(options.describeOnly){
		return '"Add Scale Points to all" clicked';
	}
	if(options.selectorOnly){
		return '.scale-to-all-layers';
	}
	if(options.highlight){
		collaboration.highlightElement(add_to_all_elem);
	}
	add_to_all_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['addTagInput.clicked'] = function(data, options){
	options = options || {};
	var add_tag_elem = $('.add-tag-input');

	if(options.describeOnly){
		return '"Add Another Tag" clicked';
	}
	if(options.selectorOnly){
		return '.add-tag-input';
	}
	if(options.highlight){
		collaboration.highlightElement(add_tag_elem);
	}
	add_tag_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['userFeedback.close'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return 'User feedback closed';
	}
	if(options.selectorOnly){
		return '.js-user-feedback-close';
	}
	$('.js-user-feedback-close').trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['userFeedback.submit'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return 'User feedback submitted';
	}
	if(options.selectorOnly){
		return '.js-user-feedback-submit';
	}
	$('.js-user-feedback-submit').trigger('click');
};

 /*
 'data' must contain the following:

 inputValue: The input value to put into the user feedback field
  */
gisportal.api['userFeedback.input'] = function(data, options){
	options = options || {};
	var input = data.inputValue;
	var input_elem = $('.user-feedback-input');

	if(options.describeOnly){
		return 'User feedback input: ' + input;
	}
	if(options.selectorOnly){
		return '.user-feedback-input';
	}
	if(options.highlight){
		collaboration.highlightElement(input_elem);
	}
	input_elem.val(input);
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['drawBox.clicked'] = function(data, options){
	options = options || {};
	var button_elem = $('.js-draw-box');

	if(options.describeOnly){
		return '"Draw Polygon" Clicked';
	}
	if(options.selectorOnly){
		return '.js-draw-box';
	}
	if(options.highlight){
		collaboration.highlightElement(button_elem);
	}
	button_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['drawPolygon.clicked'] = function(data, options){
	options = options || {};
	var button_elem = $('.js-draw-polygon');

	if(options.describeOnly){
		return '"Draw Irregular Polygon" Clicked';
	}
	if(options.selectorOnly){
		return '.js-draw-polygon';
	}
	if(options.highlight){
		collaboration.highlightElement(button_elem);
	}
	button_elem.trigger('click');
};

/*
 'data' must contain the following:

 geojson: the geoJSON to load
 selectedValue: the name of the geoJSON selected
 fromSavedState: if this selection was from a saved state
  */
gisportal.api['indicatorsPanel.geoJSONSelected'] = function(data, options){
   options = options || {};

   if(options.describeOnly){
      return 'Saved geoJSON selected';
   }
   if(options.selectorOnly){
      return '.users-geojson-files';
   }
   if(options.highlight){
      collaboration.highlightElement($('.users-geojson-files'));
   }

   gisportal.selectionTools.loadGeoJSON(data.geojson, false, data.selectedValue, data.fromSavedState);
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['placeSearchFilter.clicked'] = function(data, options){
	options = options || {};
	var button_elem = $('.js-place-search-filter');

	if(options.describeOnly){
		return '"Filter By Place" Clicked';
	}
	if(options.selectorOnly){
		return '.js-place-search-filter';
	}
	if(options.highlight){
		collaboration.highlightElement(button_elem);
	}
	button_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['drawFilterBox.clicked'] = function(data, options){
	options = options || {};
	var button_elem = $('.js-box-search-filter');

	if(options.describeOnly){
		return '"Filter Polygon" Clicked';
	}
	if(options.selectorOnly){
		return '.js-box-search-filter';
	}
	if(options.highlight){
		collaboration.highlightElement(button_elem);
	}
	button_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['drawFilterPolygon.clicked'] = function(data, options){
	options = options || {};
	var button_elem = $('.js-polygon-search-filter');

	if(options.describeOnly){
		return '"Filter Irregular Polygon" Clicked';
	}
	if(options.selectorOnly){
		return '.js-polygon-search-filter';
	}
	if(options.highlight){
		collaboration.highlightElement(button_elem);
	}
	button_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['selectPolygon.clicked'] = function(data, options){
	options = options || {};
	var button_elem = $('.js-draw-select-polygon');

	if(options.describeOnly){
		return '"Select Existing Polygon" Clicked';
	}
	if(options.selectorOnly){
		return '.js-draw-select-polygon';
	}
	if(options.highlight){
		collaboration.highlightElement(button_elem);
	}
	button_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['removeGeoJSON.clicked'] = function(data, options){
	options = options || {};
	var button_elem = $('.js-remove-geojson');

	if(options.describeOnly){
		return '"Delete Selected Polygon" Clicked';
	}
	if(options.selectorOnly){
		return '.js-remove-geojson';
	}
	if(options.highlight){
		collaboration.highlightElement(button_elem);
	}
	button_elem.trigger('click');
};

 /*
 'data' must contain the following:

 eventType: The event type to be triggered on the coordinates textbox
 value: The value to input into the coordinates textbox
  */
gisportal.api['jsCoordinate.edit'] = function(data, options){
	options = options || {};
	var eType = data.eventType;
	var value = data.value;
	var input_elem = $('.js-coordinates');

	if(options.describeOnly){
		return 'Coordinates value set to: "' + value + '"';
	}
	if(options.selectorOnly){
		return '.js-coordinates';
	}
	if(options.highlight){
		collaboration.highlightElement(input_elem);
	}
	input_elem.val(value).trigger(eType);
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['clearSelection.clicked'] = function(data, options){
	options = options || {};
	var button_elem = $('.js-clear-selection');

	if(options.describeOnly){
		return '"Clear Selection" Clicked';
	}
	if(options.selectorOnly){
		return '.js-clear-selection';
	}
	if(options.highlight){
		collaboration.highlightElement(button_elem);
	}
	button_elem.trigger('click');
};

 /*
 'data' must contain the following:

 coordinate: The the coordinate to click draw on
  */
gisportal.api['olDraw.click'] = function(data, options){
	options = options || {};
	var coordinate = data.coordinate;

	if(options.describeOnly){
		return 'Draw click at coordinate: [' + coordinate[0].toFixed(2) + ", " + coordinate[1].toFixed(2) + "]";
	}
	if(options.selectorOnly){
		return '';
	}
	gisportal.drawingPoints.push(coordinate);

   // Makes sure that this is not the last (completion) click
   var drawOverlay = true;
   if(gisportal.vectorLayer.getSource().getFeatures().length > 0){
      drawOverlay = false;
   }

   gisportal.drawingOverlaySource.clear();
   var geom;
   if(gisportal.drawingPoints.length === 2){
        geom = new ol.geom.LineString(gisportal.drawingPoints);
   }
   if(gisportal.drawingPoints.length > 2){
      var polygon_array = _.clone(gisportal.drawingPoints);
      polygon_array.push(polygon_array[0]);
      geom = new ol.geom.Polygon([polygon_array]);
   }
   if(gisportal.selectionTools.isDrawing || gisportal.geolocationFilter.filteringByPolygon){
   	if(geom && drawOverlay){
         gisportal.drawingOverlaySource.addFeature(new ol.Feature({geometry:geom}));
      }
      for(var point in gisportal.drawingPoints){
         gisportal.drawingOverlaySource.addFeature(new ol.Feature({geometry:new ol.geom.Point(gisportal.drawingPoints[point])}));
      }
   }
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['olDraw.drawstart'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return 'Draw Started';
	}
	if(options.selectorOnly){
		return '';
	}
	gisportal.vectorLayer.getSource().clear();
   gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
   gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
   gisportal.currentSearchedPoint = null;
};

 /*
 'data' must contain the following:

 coordinates: The coordinates of the polygon to be drawn
  */
gisportal.api['olDraw.drawend'] = function(data, options){
	options = options || {};
	var coordinates = data.coordinates;
	var sketch = new ol.Feature({geometry:new ol.geom.Polygon(coordinates)});

	if(options.describeOnly){
		return 'Polygon drawn';
	}
	if(options.selectorOnly){
		return '';
	}
	gisportal.drawingOverlaySource.clear();
	gisportal.selectionTools.ROIAdded(sketch);
	gisportal.vectorLayer.getSource().addFeature(sketch);
};

 /*
 'data' must contain the following:

 wkt: The wkt of the polygon to be drawn
  */
gisportal.api['filterDraw.drawend'] = function(data, options){
	options = options || {};
	var wkt = data.wkt;

	if(options.describeOnly){
		return 'Polygon drawn';
	}
	if(options.selectorOnly){
		return '';
	}
	gisportal.geolocationFilter.cancelDraw();
	gisportal.drawingOverlaySource.clear();
	gisportal.currentSearchedBoundingBox = wkt;
   gisportal.geolocationFilter.drawCurrentFilter();
};

 /*
 'data' must contain the following:

 coordinate: The coordinate of the place to filter by.
 address_details (optional): The details of the address from the geocoder to work out a sensible zoom level
  */
gisportal.api['geolocationFilter.filterByPlace'] = function(data, options){
	options = options || {};
	var coordinate = data.coordinate;
	var address = data.address;

	if(options.describeOnly){
		return 'Place Filtered';
	}
	if(options.selectorOnly){
		return '';
	}
	gisportal.geolocationFilter.filterByPlace(coordinate, address);
};

 /*
 'data' must contain the following:

 coordinate: The coordinate of the hover event
 id: The id of the hovered polygon
  */
gisportal.api['selectPolygon.hover'] = function(data, options){
	options = options || {};
	var coordinate = data.coordinate;
	var id = data.id;
	var pixel = map.getPixelFromCoordinate(coordinate);

	if(options.describeOnly){
		return 'Polygon hovered: '  + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '';
	}
	var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
      // Gets the first vector layer it finds
      if(feature.getKeys().length !== 1 && feature.getId() && feature.getId() == id){
         return feature;
      }
   });
   gisportal.hoverFeature(feature);
};

 /*
 'data' must contain the following:

 coordinate: The coordinate of the select event
 id: The id of the selected polygon
  */
gisportal.api['selectPolygon.select'] = function(data, options){
	options = options || {};
	var coordinate = data.coordinate;
	var id = data.id;
	var pixel = map.getPixelFromCoordinate(coordinate);

	if(options.describeOnly){
		return 'Polygon selected: '  + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '';
	}
	var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
      // Gets the first vector layer it finds
      if(feature.getKeys().length !== 1 && feature.getId() && feature.getId() == id){
         return feature;
      }
   });
   gisportal.selectFeature(feature);
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['coordinates.save'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return 'Save Coordinates clicked';
	}
	if(options.selectorOnly){
		return '.js-add-coordinates-to-profile';
	}
	$('.js-add-coordinates-to-profile').trigger('click');
};

 /*
 'data' must contain the following:

 overlayType: The overlay type to remove
  */
gisportal.api['featureOverlay.removeType'] = function(data, options){
	options = options || {};
	var overlayType = data.overlayType;

	if(options.describeOnly){
		return 'Remove ' + overlayType;
	}
	if(options.selectorOnly){
		return '';
	}
	gisportal.removeTypeFromOverlay(gisportal.featureOverlay, overlayType);
};

 /*
 'data' must contain the following:

 coordinate: The coordinate to be clicked to popup an information display
  */
gisportal.api['dataPopup.display'] = function(data, options){
	options = options || {};
	var coordinate = data.coordinate;
	var pixel = map.getPixelFromCoordinate(coordinate);

	if(options.describeOnly){
		return 'Data popup shown at coordinate: [' + coordinate[0].toFixed(2) + ", " + coordinate[1].toFixed(2) + "]";
	}
	if(options.selectorOnly){
		return '';
	}
	gisportal.displayDataPopup(pixel);
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['dataPopup.close'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return 'Data popup closed';
	}
	if(options.selectorOnly){
		return '';
	}
	gisportal.dataReadingPopupCloser.click();
};

 /*
 'data' must contain the following:

 id: The id of the layer to start off the graph with
  */
gisportal.api['newPlot.clicked'] = function(data, options){
	options = options || {};
	var id = data.id;
	var button_elem = $('.js-make-new-plot[data-id="' + id + '"]');

	if(options.describeOnly){
		return '"Make new graph" Clicked';
	}
	if(options.selectorOnly){
		return '.js-make-new-plot[data-id="' + id + '"]';
	}
	if(options.highlight){
		collaboration.highlightElement(button_elem);
	}
	button_elem.trigger('click');
};

 /*
 'data' must contain the following:

 id: The id of the layer to add to the graph
  */
gisportal.api['addToPlot.clicked'] = function(data, options){
	options = options || {};
	var id = data.id;
	var button_elem = $('.js-add-to-plot[data-id="' + id + '"]');

	if(options.describeOnly){
		return '"Add to graph" Clicked';
	}
	if(options.selectorOnly){
		return '.js-add-to-plot[data-id="' + id + '"]';
	}
	if(options.highlight){
		collaboration.highlightElement(button_elem);
	}
	button_elem.trigger('click');
};

 /*
 'data' must contain the following:

 id: The id of the layer to be removed from the graph
  */
gisportal.api['graphs.deleteActive'] = function(data, options){
	options = options || {};
	var id = data.id;

	if(options.describeOnly){
		return 'Closed plot';
	}
	if(options.selectorOnly){
		return '.js-add-to-plot[data-id="' + id + '"]';
	}
	gisportal.graphs.deleteActiveGraph();
};

 /*
 'data' must contain the following:

 slideoutName: The name of the slideout to be toggled
  */
gisportal.api['slideout.togglePeak'] = function(data, options){
	options = options || {};
	var slideoutName = data.slideoutName;
	var clicked_elem = $('[data-slideout-name="' + slideoutName + '"] .js-slideout-toggle-peak');

	if(options.describeOnly){
		return 'Show panel: ' + slideoutName;
	}
	if(options.selectorOnly){
		return '[data-slideout-name="' + slideoutName + '"] .js-slideout-toggle-peak';
	}
	if(options.highlight){
		collaboration.highlightElement(clicked_elem);
	}
	gisportal.panelSlideout.togglePeak(slideoutName);
};

 /*
 'data' must contain the following:

 slideoutName: The name of the slideout to be closed
  */
gisportal.api['slideout.close'] = function(data, options){
	options = options || {};
	var slideoutName = data.slideoutName;
	var clicked_elem = $('[data-slideout-name="' + slideoutName + '"] .js-slideout-close');

	if(options.describeOnly){
		return 'Close panel: ' + slideoutName;
	}
	if(options.selectorOnly){
		return '[data-slideout-name="' + slideoutName + '"] .js-slideout-close';
	}
	if(options.highlight){
		collaboration.highlightElement(clicked_elem);
	}
	gisportal.panelSlideout.closeSlideout(slideoutName);
};

 /*
 'data' must contain the following:

 layerId: The id of the layer to see more information about
  */
gisportal.api['more-info.clicked'] = function(data, options){
	options = options || {};
	var id = data.layerId;
	var clicked_elem = $('.show-more[data-id="' + id + '"]');

	if(options.describeOnly){
		return 'More Info: '  + gisportal.layers[id].descriptiveName;
	}
	if(options.selectorOnly){
		return '.show-more[data-id="' + id + '"]';
	}
	if(options.highlight){
		collaboration.highlightElement(clicked_elem);
	}
	clicked_elem.trigger('click');
};

 /*
 'data' must contain the following:

 value: The value to be entered into the graph title field
  */
gisportal.api['graphTitle.edit'] = function(data, options){
	options = options || {};
	var value = data.value;
	var input_elem = $('.js-active-plot-title');

	if(options.describeOnly){
		return 'Title value set to: "' + value + '"';
	}
	if(options.selectorOnly){
		return '.js-active-plot-title';
	}
	if(options.highlight){
		collaboration.highlightElement(input_elem);
	}
	input_elem.val(value).trigger('change');
};

 /*
 'data' must contain the following:

 value: The value of the graph type to be selected
  */
gisportal.api['graphType.edit'] = function(data, options){
	options = options || {};
	var value = data.value;
   var input_elem = $('.js-active-plot-type');
   var nice_val = input_elem.find('[value="' + value + '"]').html() || value;

	if(options.describeOnly){
		return 'Graph type set to: "' + nice_val + '"';
	}
	if(options.selectorOnly){
		return '.js-active-plot-type';
	}
	if(options.highlight){
		collaboration.highlightElement(input_elem);
	}
	input_elem.val(value).trigger('change');
};

 /*
 'data' must contain the following:

 value: The value of the graph style to be selected
  */
gisportal.api['graphStyle.edit'] = function(data, options){
	options = options || {};
	var value = data.value;
   var input_elem = $('.js-active-plot-style');
   var nice_val = input_elem.find('[value="' + value + '"]').html() || value;

	if(options.describeOnly){
		return 'Graph style set to: "' + nice_val + '"';
	}
	if(options.selectorOnly){
		return '.js-active-plot-style';
	}
	if(options.highlight){
		collaboration.highlightElement(input_elem);
	}
	input_elem.val(value).trigger('change');
};

 /*
 'data' must contain the following:

 value: The value of the layer depth to be selected
  */
gisportal.api['layerDepth.change'] = function(data, options){
	options = options || {};
	var value = data.value;
	// May need to have an ID also to make it more specific
   var input_elem = $('.js-analysis-elevation');
   var nice_val = input_elem.find(':selected').html() || value;

	if(options.describeOnly){
		return 'Layer Depth set to: "' + nice_val + '"';
	}
	if(options.selectorOnly){
		return '.js-analysis-elevation';
	}
	if(options.highlight){
		collaboration.highlightElement(input_elem);
	}
	input_elem.val(value).trigger('change');
};

gisportal.api['graphFramerate.change'] = function(data, options){
   options = options || {};
   var value = data.value;
   var input_elem = $('.js-active-plot-framerate');
   var slider_elem = $('.js-framerate-slider');

   if(options.describeOnly){
      return 'Framerate set to: ' + value;
   }
   if(options.selectorOnly){
      return '.js-framerate-slider';
   }
   if(options.highlight){
      collaboration.highlightElement(slider_elem);
   }
   input_elem.val(value).trigger('change');
};

 /*
 'data' must contain the following:

 value: An array of 2 dates, start and end, to be set as the range for the graph
  */
gisportal.api['graphRange.change'] = function(data, options) {
   options = options || {};
   var value = data.value;
   var start_date_elem = $('.js-active-plot-start-date');
   var end_date_elem = $('.js-active-plot-end-date');
   var slider_elem = $('.js-range-slider');
   // Convert both date number strings in the array into ISOStrings
   var dates = value.map(Number).map(function(dateNum) {
      return new Date(dateNum).toISOString();
   });

   if (options.describeOnly) {
      return 'Graph date range set to: "' + dates.join(' - ') + '"';
   }
   if (options.selectorOnly) {
      return '.js-range-slider';
   }
   if (options.highlight) {
      collaboration.highlightElement(slider_elem);
   }
   start_date_elem.val(dates[0]).trigger('change');
   end_date_elem.val(dates[1]).trigger('change');
   slider_elem.val(value);
};

 /*
 'data' must contain the following:

 index: the index of the component to be removed from the graph
  */
gisportal.api['graphComponent.remove'] = function(data, options){
	options = options || {};
	var index = data.index;
   var tr_elem = $('.js-components tr:eq(' + index + ')');
   var title = tr_elem.find('td span').html() || "Component";
   var del_elem = tr_elem.find('.js-close-acitve-plot-component');

	if(options.describeOnly){
		return title + ' removed"';
	}
	if(options.selectorOnly){
		return '.js-components tr:eq(' + index + ')';
	}
	del_elem.trigger('click');
};

 /*
 'data' must contain the following:

 index: The index of the component to have the axis changed
 value: The value of the axis for the index to be changed to
  */
gisportal.api['graphComponent.axisChange'] = function(data, options){
	options = options || {};
	var index = data.index;
   var value = data.value;
   var tr_elem = $('.js-components tr:eq(' + index + ')');
   var title = tr_elem.find('td span').html() || "Component";
   var select_elem = tr_elem.find('.js-y-axis');
   var select_value = select_elem.find("option:selected").text();

	if(options.describeOnly){
		return title + ': axis changed to "' + select_value;
	}
	if(options.selectorOnly){
		return '.js-components tr:eq(' + index + ')';
	}
	if(options.highlight){
		collaboration.highlightElement(select_elem);
	}
	select_elem.val(value).trigger('click');
};


/*
api call for changing the axis label text field
*/
gisportal.api['graphComponent.axisLabelChange'] = function(data, options){
   options = options || {};
   var index = data.index;
   var value = data.value;

   var tr_elem = $('.js-components tr:eq(' + index + ')');
   var axis_label_input = tr_elem.find('input [type=text');
   axis_label_input.val(value);
   axis_label_input.trigger('unfocus');
};

 /*
 'data' must contain the following:

 value: The value for the start date to be set to
  */
gisportal.api['graphStartDate.change'] = function(data, options){
	options = options || {};
	var value = new Date(data.value).toISOString().split("T")[0];
	var date_elem = $('.js-active-plot-start-date');

	if(options.describeOnly){
		return 'Graph start date set to: "' + value + '"';
	}
	if(options.selectorOnly){
		return '.js-active-plot-start-date';
	}
	if(options.highlight){
		collaboration.highlightElement(date_elem);
	}
	date_elem.val(value).trigger('change');
};

 /*
 'data' must contain the following:

 value: The value for the end date to be set to
  */
gisportal.api['graphEndDate.change'] = function(data, options){
	options = options || {};
	var value = new Date(data.value).toISOString().split("T")[0];
	var date_elem = $('.js-active-plot-end-date');

	if(options.describeOnly){
		return 'Graph end date set to: "' + value + '"';
	}
	if(options.selectorOnly){
		return '.js-active-plot-end-date';
	}
	if(options.highlight){
		collaboration.highlightElement(date_elem);
	}
	date_elem.val(value).trigger('change');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['graph.submitted'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return '"Create Graph" clicked';
	}
	if(options.selectorOnly){
		return '.js-create-graph';
	}
	$('.js-create-graph').trigger('click');
};

 /*
 'data' must contain the following:

 hash: The hash of the graph to open
  */
gisportal.api['graph.open'] = function(data, options){
	options = options || {};
	var hash = data.hash;
   var open_elem = $('.js-graph-status-open[data-hash="' + hash + '"]');
   var title = open_elem.data('title');

	if(options.describeOnly){
		return '"' + title + '": "Open" clicked';
	}
	if(options.selectorOnly){
		return '.js-graph-status-open[data-hash="' + hash + '"]';
	}
	open_elem.trigger('click');
};

 /*
 'data' must contain the following:

 hash: The hash of the graph to copy/edit
  */
gisportal.api['graph.copy'] = function(data, options){
	options = options || {};
	var hash = data.hash;
   var copy_elem = $('.js-graph-status-copy[data-hash="' + hash + '"]');
   var title = copy_elem.data('title');

	if(options.describeOnly){
		return '"' + title + '": "Copy/Edit" clicked';
	}
	if(options.selectorOnly){
		return '.js-graph-status-copy[data-hash="' + hash + '"]';
	}
	copy_elem.trigger('click');
};

 /*
 'data' must contain the following:

 hash: The hash of the graph to delete
  */
gisportal.api['graph.delete'] = function(data, options){
	options = options || {};
	var hash = data.hash;
   var delete_elem = $('.js-graph-status-delete[data-hash="' + hash + '"]');
   var title = delete_elem.data('title');

	if(options.describeOnly){
		return '"' + title + '": "Delete" clicked';
	}
	if(options.selectorOnly){
		return '.js-graph-status-delete[data-hash="' + hash + '"]';
	}
	delete_elem.trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['graphPopup.close'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return 'Plot closed';
	}
	if(options.selectorOnly){
		return '.js-plot-popup-close';
	}
	collaboration.forcePopupClose = true;
   $('.js-plot-popup-close').trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['configureInternalLayers.clicked'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return '"Configure Internal Layers" Clicked';
	}
	if(options.selectorOnly){
		return 'button.js-edit-layers';
	}
	$('button.js-edit-layers').trigger('click');
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['configureInternalLayers.closed'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return '"Configure Internal Layers" Closed';
	}
	if(options.selectorOnly){
		return '.js-edit-layers-close';
	}
	$('.js-edit-layers-close').trigger('click');
};