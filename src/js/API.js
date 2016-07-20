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
	var div = $('#configurePanel');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

 /*
 'data' must contain the following:

 state: The state for the joining member to load
 joining-member: The email of the user who is joining
  */
gisportal.api['room.presenter-state-update'] = function(data, options){
	options = options || {};
	var state = data.state;
	if(options.describeOnly){
		return "Member Joining";
	}
	if(data['joining-member'] == gisportal.user.info.email){
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
   var add_elem = $('.js-add-layer-server[data-layer="' + layer + '"][data-server="' + server + '"]');
	if(options.describeOnly){
		return "'" + input + "' input to '" + field +  "' field.";
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
		return "Date changed to " + moment(date).format('YYYY-MM-DD hh:mm');
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
  */
gisportal.api['date.zoom'] = function(data, options){
	options = options || {};
	var startDate = new Date(data.startDate);
	var endDate = new Date(data.endDate);

	if(options.describeOnly){
		return "Date zoomed to " + moment(startDate).format('YYYY-MM-DD hh:mm') + " - " + moment(endDate).format('YYYY-MM-DD hh:mm');
	}
	if(options.highlight){
		collaboration.highlightElement($('#timeline'));
	}
   if(gisportal.timeline && gisportal.timeline.timebars && gisportal.timeline.timebars.length > 0){
      gisportal.timeline.zoomDate(startDate, endDate);
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
   obj.ddslick('open');
};

 /*
 'data' must contain the following:

 obj: The id of the ddslick to be closed
  */
gisportal.api['ddslick.close'] = function(data, options){
	options = options || {};
	var obj = $('#' + data.obj);

	if(options.describeOnly){
		return "Dropdown closed";
	}
   obj.ddslick('close');
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

	if(options.describeOnly){
		return "Value selected: " + value;
	}
   obj.ddslick('select', { "value": value });
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
   gisportal.view.loadView(view);
};

 /*
 'data' must contain the following:

 view_name: The name of the view to remove
  */
gisportal.api['view.removed'] = function(data, options){
	options = options || {};
	var view = data.view_name;
	var nice_val = $('.js-views-list').find('[value="' + view + '"]').html() || view;

	if(options.describeOnly){
		return 'View Removed';
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
   var panel_div = $('.js-show-panel[data-panel-name="'+ nicePanelName +'"]');
   if(panel_div.find('span').length > 0){
      nicePanelName = panel_div.find('span').attr('title');
   }else if(panel_div.html() && panel_div.html().length > 0){
      nicePanelName = panel_div.html();
   }

	if(options.describeOnly){
		return 'Panel selected - '+ nicePanelName;
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
		return 'Layer Autoscaled - ' + data.id;
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
		return 'Autoscale set to ' + isChecked + ' - '+ id;
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
		return 'Logarithmic set to ' + isLog + ' - '+ id;
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
		return 'Max set to ' + value + ' - '+ id;
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
		return 'Min set to ' + value + ' - '+ id;
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
		return 'Opacity set to ' + opacity + '% - '+ id;
	}
	if(options.highlight){
   	collaboration.highlightElement($('#tab-' + id + '-opacity'));
	}
	if(opacity){
	   $('#tab-' + id + '-opacity').val(opacity);
	   gisportal.layers[id].setOpacity(value);
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
		return 'Colorbands value set to ' + opacity + ' - '+ id;
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
		return 'Scalebar reset - '+ id;
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
		return 'Changes Applied - '+ id;
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
	if(options.highlight){
   	collaboration.highlightElement($('.js-search'));
	}
   $('.js-search').val(searchValue).trigger('change');
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
	if(options.highlight){
   	collaboration.highlightElement($('input.js-wms-url'));
	}
   $('input.js-wms-url').val(typedValue).trigger(eType);
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
	if(options.highlight){
   	collaboration.highlightElement($('.more-info'));
	}
   $('.more-info').trigger('click');
};

 /*
 data' does not need to contain anything
  */
gisportal.api['addLayersForm.clicked'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return '"Add layers" Clicked';
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
		return tabName + ' tab selected for ' + layerId;
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
		return tabName + ' tab closed for ' + layerId;
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
	var page = data.page

	if(options.describeOnly){
		return 'Page ' + page + ' selected';
	}
	$('.js-go-to-form-page').find('a[data-page="' + data.page + '"]').trigger('click');
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
		return 'Zoom to data clicked: ' + id;
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
		return 'Draw click at coordinate: ' + coordinate;
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
      // Only if drawing a polygon
      if($('.js-draw-polygon').hasClass('drawInProgress')){
         geom = new ol.geom.LineString(gisportal.drawingPoints);
      }
   }
   if(gisportal.drawingPoints.length > 2){
      var polygon_array = _.clone(gisportal.drawingPoints);
      polygon_array.push(polygon_array[0]);
      geom = new ol.geom.Polygon([polygon_array]);
   }
   if(geom && drawOverlay){
      gisportal.drawingOverlaySource.addFeature(new ol.Feature({geometry:geom}));
   }
   for(var point in gisportal.drawingPoints){
      gisportal.drawingOverlaySource.addFeature(new ol.Feature({geometry:new ol.geom.Point(gisportal.drawingPoints[point])}));
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
	gisportal.vectorLayer.getSource().clear();
   gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'hover');
   gisportal.removeTypeFromOverlay(gisportal.featureOverlay, 'selected');
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
	gisportal.selectionTools.ROIAdded(sketch);
	gisportal.vectorLayer.getSource().addFeature(sketch);
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
		return 'Polygon hovered: ' + id;
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
		return 'Polygon selected: ' + id;
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
		return 'Data popup shown at coordinate: ' + coordinate;
	}
	gisportal.displayDataPopup(pixel);
};

 /*
 'data' does not need to contain anything
  */
gisportal.api['dataPopup.display'] = function(data, options){
	options = options || {};

	if(options.describeOnly){
		return 'Data popup closed';
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
	var button_elem = $('.js-add-to-plot[data-id="' + id + '"]');

	if(options.describeOnly){
		return 'Closed plot';
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
	var clicked_elem = $('.show-more[data-id="' + id + '"]')

	if(options.describeOnly){
		return 'More Info: ' + id;
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
	if(options.highlight){
		collaboration.highlightElement(input_elem);
	}
	input_elem.val(value);
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
	if(options.highlight){
		collaboration.highlightElement(input_elem);
	}
	input_elem.val(value).trigger('change');
};

 /*
 'data' must contain the following:

 value: An array of 2 dates, start and end, to be set as the range for the graph
  */
gisportal.api['graphRange.change'] = function(data, options){
	options = options || {};
	var value = data.value;
   var start_date_elem = $('.js-active-plot-start-date');
   var end_date_elem = $('.js-active-plot-end-date');
   var slider_elem = $('.js-range-slider');
   var dates = value.map(Number).map(function(stamp){ return new Date(stamp).toISOString().split("T")[0];});

	if(options.describeOnly){
		return 'Graph date range set to: "' + dates.join(' - ') + '"';
	}
	if(options.highlight){
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
	if(options.highlight){
		collaboration.highlightElement(select_elem);
	}
	select_elem.val(value).trigger('click');
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
	if(options.highlight){
		collaboration.highlightElement(date_elem);
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
	collaboration.forcePopupClose = true;
   $('.js-plot-popup-close').trigger('click');
};