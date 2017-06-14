//--------------------------------------------------------------------------------------
//  Portal Walkthrough event bindings
//--------------------------------------------------------------------------------------

gisportal.events.bind("date.selected", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind("date.zoom", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind("ddslick.open", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind("ddslick.selectValue", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind("view.loaded", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind("view.removed", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// hide the panel
gisportal.events.bind("panel.hide", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// show the panel
gisportal.events.bind("panel.show", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// hide a layer
gisportal.events.bind("layer.hide", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// layer removed from panel
gisportal.events.bind("layer.remove", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// layer order changed
gisportal.events.bind("layer.reorder", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// show a layer
gisportal.events.bind("layer.show", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// user moves the map, or zooms in/out
gisportal.events.bind("map.move", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// show a panel
gisportal.events.bind("panels.showpanel", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind("refinePanel.cancel", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind("refinePanel.removeCat", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// auto scale a layer
gisportal.events.bind("scalebar.autoscale", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// auto scale a layer
gisportal.events.bind("scalebar.autoscale-checkbox", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// indicator has logarithmic scale
gisportal.events.bind("scalebar.log-set", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// scalebar maximum value set
gisportal.events.bind("scalebar.max-set", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// scalebar minimum value set
gisportal.events.bind("scalebar.min-set", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// layer opacity changed
gisportal.events.bind("scalebar.opacity", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// layer custom above max colour changed
gisportal.events.bind("scalebar.custom-aboveMaxColor", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// layer custom below min colour changed
gisportal.events.bind("scalebar.custom-belowMinColor", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// layer colorbands changed
gisportal.events.bind("scalebar.colorbands", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// reset layer settings
gisportal.events.bind("scalebar.reset", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// apply setting changes
gisportal.events.bind("scalebar.apply-changes", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// search string changes
gisportal.events.bind("search.typing", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// wms string changes
gisportal.events.bind("wms.typing", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// geocoder search string changes
gisportal.events.bind("geocoderInput.typing", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// refresh cache box changed
gisportal.events.bind("refreshCacheBox.clicked", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// wms submitted
gisportal.events.bind("wms.submitted", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// more info clicked
gisportal.events.bind("moreInfo.clicked", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// show geocoder clicked
gisportal.events.bind("showGeocoder.clicked", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// reset list clicked
gisportal.events.bind("resetList.clicked", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// add layers form clicked
gisportal.events.bind("addLayersForm.clicked", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// search string changes
gisportal.events.bind("search.resultselected", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// Layer tab selected
gisportal.events.bind("tab.select", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

// Layer tab closed
gisportal.events.bind("layerTab.close", function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('configurepanel.scroll', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('mapsettingspanel.scroll', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('indicatorspanel.scroll', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addLayersForm.scroll', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('slideout.scroll', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('refinePanel.scroll', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addLayerServer.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addLayersForm.input', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addLayersForm.autoScale-changed', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addLayersForm.aboveMaxColor-changed', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addLayersForm.belowMinColor-changed', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addLayersForm.defaultStyle-changed', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addLayersForm.close', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('body.keydown', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('paginator.selected', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('zoomToData.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('submitLayers.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('cancelChanges.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('toggleAllLayers.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('logToAllLayers.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addToAll.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addScalePointsToAll.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addTagInput.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('userFeedback.close', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('userFeedback.submit', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('userFeedback.input', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('drawBox.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('drawPolygon.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('indicatorsPanel.geoJSONSelected', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('placeSearchFilter.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('drawFilterBox.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('drawFilterPolygon.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('geocoderRadius.changed', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('selectPolygon.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('removeGeoJSON.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('jsCoordinate.edit', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('clearSelection.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('olDraw.click', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('olDraw.drawstart', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('olDraw.drawend', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('filterDraw.drawend', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('geolocationFilter.filterByPlace', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('selectPolygon.hover', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('selectPolygon.select', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('coordinates.save', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('featureOverlay.removeType', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('dataPopup.display', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('dataPopup.close', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('newPlot.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('addToPlot.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graphs.deleteActive', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('slideout.togglePeak', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('slideout.close', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('more-info.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graphTitle.edit', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graphType.edit', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graphStyle.edit', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('layerDepth.change', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graphRange.change', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graphStartDate.change', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graphEndDate.change', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graph.submitted', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graphComponent.remove', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graphComponent.axisChange', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graph.open', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graph.copy', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graph.delete', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('graphPopup.close', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('configureInternalLayers.clicked', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});

gisportal.events.bind('configureInternalLayers.closed', function(event, data) {
   if(gisportal.walkthrough.is_recording){
      gisportal.walkthrough.addStep(data);
   }
});