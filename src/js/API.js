gisportal.api = {};

gisportal.api['configurepanel.scroll'] = function(data, options){
	options = options || {};
	var scrollPercent = data.params.scrollPercent;
	if(options.describeOnly){
		return "Configuration panel scrolled to " + scrollPercent + "%.";
	}
	var div = $('#configurePanel');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

gisportal.api['mapsettingspanel.scroll'] = function(data, options){
	var scrollPercent = data.params.scrollPercent;
	if(options.describeOnly){
		return "Map settings scrolled to " + scrollPercent + "%.";
	}
	var div = $('#mapSettingsPanel');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

gisportal.api['addLayersForm.scroll'] = function(data, options){
	options = options || {};
	var scrollPercent = data.params.scrollPercent;
	if(options.describeOnly){
		return "Add Layers Form scrolled to " + scrollPercent + "%.";
	}
	var div = $('.overlay-container-form');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

gisportal.api['slideout.scroll'] = function(data, options){
	options = options || {};
	var scrollPercent = data.params.scrollPercent;
	if(options.describeOnly){
		return "Slideout scrolled to " + scrollPercent + "%.";
	}
	var div = $('.js-slideout-content');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

gisportal.api['refinePanel.scroll'] = function(data, options){
	options = options || {};
	var scrollPercent = data.params.scrollPercent;
	if(options.describeOnly){
		return "Refine Panel scrolled to " + scrollPercent + "%.";
	}
	var div = $('.indicator-select');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

gisportal.api['addLayerServer.clicked'] = function(data, options){
	options = options || {};
	var layer = data.params.layer;
   var server = data.params.server;
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

gisportal.api['addLayersForm.input'] = function(data, options){
	options = options || {};
	var input = data.params.inputValue;
   var field = data.params.field;
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

gisportal.api['addLayersForm.autoScale-changed'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Autoscale changed.";
	}
	var select_elem = $('select[data-field="originalAutoScale"]');
   select_elem.val(data.params.value).trigger('change');
   if(options.highlight){
   	collaboration.highlightElement(select_elem);
   }
};

gisportal.api['addLayersForm.aboveMaxColor-changed'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Above Max Colour changed.";
	}
	var select_elem = $('select[data-field="defaultAboveMaxColor"]');
   select_elem.val(data.params.value).trigger('change');
   if(options.highlight){
   	collaboration.highlightElement(select_elem);
   }
};

gisportal.api['addLayersForm.belowMinColor-changed'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Below Min Colour changed.";
	}
	var select_elem = $('select[data-field="defaultBelowMinColor"]');
   select_elem.val(data.params.value).trigger('change');
   if(options.highlight){
   	collaboration.highlightElement(select_elem);
   }
};

gisportal.api['addLayersForm.defaultStyle-changed'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Default Style changed.";
	}
	var select_elem = $('select[data-field="defaultStyle"]');
   select_elem.val(data.params.value).trigger('change');
   if(options.highlight){
   	collaboration.highlightElement(select_elem);
   }
};

gisportal.api['addLayersForm.close'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Form closed.";
	}
	$('span.js-layer-form-close').trigger('click');
};

gisportal.api['body.keydown'] = function(data, options){
	options = options || {};
	var keyCode = data.params.code;
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

gisportal.api['date.selected'] = function(data, options){
	options = options || {};
	var date = new Date(data.params.date);

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

gisportal.api['date.zoom'] = function(data, options){
	options = options || {};
	var startDate = new Date(data.params.startDate);
	var endDate = new Date(data.params.endDate);

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

gisportal.api['ddslick.open'] = function(data, options){
	options = options || {};
	var obj = $('#' + data.params.obj);

	if(options.describeOnly){
		return "Dropdown opened";
	}
   obj.ddslick('open');
};

gisportal.api['ddslick.close'] = function(data, options){
	options = options || {};
	var obj = $('#' + data.params.obj);

	if(options.describeOnly){
		return "Dropdown closed";
	}
   obj.ddslick('close');
};

gisportal.api['ddslick.selectValue'] = function(data, options){
	options = options || {};
	var obj = $('#' + data.params.obj);
	var value = data.params.value;

	if(options.describeOnly){
		return "Value selected: " + value;
	}
   obj.ddslick('select', { "value": value });
};

gisportal.api['view.loaded'] = function(data, options){
	options = options || {};
	var view = data.params.view_name;
	var nice_val = $('.js-views-list').find('[value="' + view + '"]').html() || view;

	if(options.describeOnly){
		return 'View Loaded: "' + nice_val + '"';
	}
   gisportal.view.loadView(view);
};

gisportal.api['view.removed'] = function(data, options){
	options = options || {};
	var view = data.params.view_name;
	var nice_val = $('.js-views-list').find('[value="' + view + '"]').html() || view;

	if(options.describeOnly){
		return 'View Removed';
	}
   gisportal.view.removeView();
};

gisportal.api['indicatorspanel.scroll'] = function(data, options){
	options = options || {};
	var scrollPercent = data.params.scrollPercent;

	if(options.describeOnly){
		return "Indicators Panel scrolled to " + scrollPercent + "%.";
	}
	var div = $('#indicatorsPanel');
   // This stops the animation that scrolls to a layer
   div.trigger('mousewheel');
   div.scrollTop(scrollPercent/100*(div[0].scrollHeight - div.height()));
};

gisportal.api['layer.hide'] = function(data, options){
	options = options || {};
	var id = data.params.id;

	if(options.describeOnly){
		return 'Layer hidden - '+ data.params.layerName;
	}
	if(options.highlight){
		collaboration.highlightElement($('.js-toggleVisibility[data-id="' + id + '"]'));
	}
	gisportal.indicatorsPanel.hideLayer(id);
};

gisportal.api['panel.hide'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Panel Hidden";
	}
	$('.js-hide-panel').trigger('click');
};

gisportal.api['panel.show'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return "Panel Shown";
	}
	$('.js-show-tools').trigger('click');
};

gisportal.api['layer.remove'] = function(data, options){
	options = options || {};
	var id = data.params.id;

	if(options.describeOnly){
		return 'Layer removed - '+ data.params.layerName;
	}
	gisportal.indicatorsPanel.removeFromPanel(id);
};

gisportal.api['layer.reorder'] = function(data, options){
	options = options || {};
	var newLayerOrder = data.params.newLayerOrder;
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

gisportal.api['layer.show'] = function(data, options){
	options = options || {};
	var id = data.params.id;

	if(options.describeOnly){
		return 'Layer un-hidden - '+ data.params.layerName;
	}
	if(options.highlight){
		collaboration.highlightElement($('.js-toggleVisibility[data-id="' + id + '"]'));
	}
	gisportal.indicatorsPanel.showLayer(id);
};

gisportal.api['map.move'] = function(data, options){
	options = options || {};
	var params = data.params;

	if(options.describeOnly){
		return 'Map Moved';
	}
	var view = map.getView();
   if (view) {
      if (params.zoom) view.setZoom(params.zoom);
      if (params.centre) view.setCenter(params.centre);
   }
};

gisportal.api['panels.showpanel'] = function(data, options){
	options = options || {};
	var p = data.params.panelName;
   var nicePanelName = data.params.panelName;
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

gisportal.api['refinePanel.cancel'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return '"Cancel" clicked';
	}
	$('.js-refine-configure').trigger('click');
};

gisportal.api['panels.removeCat'] = function(data, options){
	options = options || {};
	var cat = data.params.cat;
   var nice_cat = gisportal.browseCategories[cat] || cat;

	if(options.describeOnly){
		return 'Category removed: ' + nice_cat;
	}
   $('.refine-remove[data-cat="' + cat + '"]').trigger('click');
};

gisportal.api['scalebar.autoscale'] = function(data, options){
	options = options || {};
	if(options.describeOnly){
		return 'Layer Autoscaled - ' + data.params.id;
	}
   gisportal.scalebars.autoScale(data.params.id, data.params.force);
};

gisportal.api['scalebar.autoscale-checkbox'] = function(data, options){
	options = options || {};
	var id = data.params.id;
   var isChecked = data.params.isChecked;

	if(options.describeOnly){
		return 'Autoscale set to ' + isChecked + ' - '+ id;
	}
	if(options.highlight){
   	collaboration.highlightElement($('.js-auto[data-id="' + id + '"]'));
	}
   $('.js-auto[data-id="' + id + '"]').prop( 'checked', isChecked ).trigger('change');
};

gisportal.api['scalebar.log-set'] = function(data, options){
	options = options || {};
	var id = data.params.id;
   var isLog = data.params.isLog;

	if(options.describeOnly){
		return 'Logarithmic set to ' + isLog + ' - '+ id;
	}
	if(options.highlight){
   	collaboration.highlightElement($('.js-indicator-is-log[data-id="' + id + '"]'));
	}
   $('.js-indicator-is-log[data-id="' + id + '"]').prop( 'checked', isLog ).trigger('change');
};

gisportal.api['scalebar.max-set'] = function(data, options){
	options = options || {};
	var id = data.params.id;
   var value = data.params.value;

	if(options.describeOnly){
		return 'Max set to ' + value + ' - '+ id;
	}
	if(options.highlight){
   	collaboration.highlightElement($('.js-scale-max[data-id="' + id + '"]'));
	}
   $('.js-scale-max[data-id="' + id + '"]').val(value).change();
};

gisportal.api['scalebar.min-set'] = function(data, options){
	options = options || {};
	var id = data.params.id;
   var value = data.params.value;

	if(options.describeOnly){
		return 'Min set to ' + value + ' - '+ id;
	}
	if(options.highlight){
   	collaboration.highlightElement($('.js-scale-min[data-id="' + id + '"]'));
	}
   $('.js-scale-min[data-id="' + id + '"]').val(value).change();
};