opec.window.layerSelector = function(placeholderID, containerID) {
   var self = this;
     
   this.placeholder = placeholderID;
   this.container = containerID;
   this.$placeHolder = $('#' + placeholderID);
   this.$container = $('#' + containerID);

   $.filtrify(containerID, placeholderID, {
      hide     : false,
      callback : function ( query, match, mismatch ) {
         this.$container.quicksand($(match), {
            // all the parameters have sensible defaults
            // and in most cases can be optional
            adjustHeight: false,
            adjustWidth: "auto",
            duration: 500,
            easing: "swing",
            attribute: "id"
         });
         
         setTimeout(function() {
            self.$container.css('width', '100%');
         }, 501);
      }
   });
   
   $('#' + containerID + ' li').live("hover", function() {
      $(this).toggleClass('ui-state-hover');
   });
   
   $('#' + containerID + ' li').live("click", function() {
       $(this).children('span').toggle();
       return false;
   });
   
   $('#' + containerID + ' li a').live("click", function(event, data) {
      var layerID = $(this).parent().attr('data-id');
      var layerName = $(this).parent().attr('data-name');
      var providerTag = $(this).parent().attr('data-provider');
      var id = providerTag + ': ' + layerName;
      
      // DEBUG
      console.log("selected");
      
      if($(this).find(".ui-icon").hasClass('ui-icon-plus')) {      
         if(layerID in opec.microLayers) {
            var microLayer = opec.microLayers[layerID];
      
            if(layerID in opec.layerStore) {
               // DEBUG
               console.log("Adding layer...");
               opec.addOpLayer(layerID);
               // DEBUG
               console.log("Added Layer");
            }
            else
               map.getLayerData(microLayer.serverName + '_' + microLayer.origName + '.json', microLayer);
               
            self.toggleLayerSelection($(this).parent());
         }
         else {
            // DEBUG
            console.log("no layer data to use");
         }
      }
      else if($(this).find(".ui-icon").hasClass('ui-icon-minus')) {
         // DEBUG
         console.log("deselected");
         var layer = opec.getLayerByID(layerID);

         if(layer) {
            // DEBUG
            console.log("Removing layer...");
            
            opec.removeOpLayer(layer);
            // DEBUG
            console.log("Layer removed");
            self.toggleLayerSelection($(this).parent());
         }
         else if(opec.layerStore[layerID]) {
            layer = opec.layerStore[layerID];
            self.toggleLayerSelection($(this).parent());
         }
         else
            // DEBUG
            console.log("no layer data to use");
      }
      
      return false;
   });
   
   $('#' + placeholderID + ' .ft-label').live("click", function() {
      $(this).find("> .ui-icon")
          .toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
      .next().toggle();
   });
   
};

opec.window.layerSelector.prototype.addLayer = function(layer) {
   this.$container.append(layer);
};

opec.window.layerSelector.prototype.batchAddLayers = function(layers) {

};

opec.window.layerSelector.prototype.toggleLayerSelection = function($selection) {
   $selection.find(".ui-icon")
      .toggleClass("ui-icon-plus ui-icon-minus")
   .end()
   .toggleClass('opec-selected opec-unselected')
   .toggleClass('ui-state-highlight');
};

opec.window.layerSelector.prototype.toggleSelectionFromLayer = function(layer) {
   var self = this;
   this.$container.children('.opec-selected').each(function() {
      if($(this).attr('data-id') == layer.id) {
         self.toggleLayerSelection($(this));
      }
   });
};

opec.window.layerSelector.prototype.refresh = function() {
   var self = this;
   $.filtrify(this.container, this.placeholder, {
      hide     : false,
      callback : function ( query, match, mismatch ) {
         self.$container.quicksand($(match), {
            // all the parameters have sensible defaults
            // and in most cases can be optional
            adjustHeight: false,
            adjustWidth: "auto",
            duration: 500,
            easing: "swing",
            attribute: "data-id"
         });
         
         setTimeout(function() {
            self.$container.css('width', '100%');
         }, 501);
      }
   });
};


