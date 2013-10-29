/**
 * @constructor
 * @param {Object} placeholderID
 * @param {Object} containerID
 */
opec.window.layerSelector = function(placeholderID, containerID) {
   var self = this;
   
   $('#opec-layerSelection').extendedDialog({
      position: ['center', 'center'],
      width: 650,
      minWidth:650,
      height: 500,
      minHeight: 500,
      resizable: true,
      autoOpen: true,
      showHelp: true,
      showMinimise: true,
      dblclick: "collapse",
      restore: function(e, dlg) {
         // Used to resize content on the dialog.
         $(this).trigger("resize");
      },
      help : function(e, dlg) {
         opec.gritter.showNotification('layerSelector', null);
      }
   });
     
   this.placeholder = placeholderID;
   this.container = containerID;
   this.$placeHolder = $('#' + placeholderID);
   this.$container = $('#' + containerID);

   this.filtrify = $.filtrify(containerID, placeholderID, {
      hide     : false,
      block: ['data-id', 'data-title'],
      blockFieldMenu: ['name'],
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
      
      if($(this).find(".ui-icon").hasClass('ui-icon-plus')) {      
         self.selectLayer(layerID, $(this).parent());
      }
      else if($(this).find(".ui-icon").hasClass('ui-icon-minus')) {
         self.deselectLayer(layerID, $(this).parent());
      }
      
      return false;
   });
   
   //$('#' + placeholderID + ' .ft-label').live("click", function() {
      //$(this).find("> .ui-icon")
          //.toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
      //.next().toggle();
   //});
   
   /**
    * Used to grab the correct 'li' for the provided layer id.
    */
   this.getLayerSelectionByID = function(layerID) {
      return $('#' + containerID).find('li[data-id="' + layerID + '"]');
   };
   
   /**
    * Add layer to the layerselector
    */
   this.addLayer = function(layer, extraInfo) {
      var $layer = $(layer);
      if (typeof extraInfo.tags !== 'undefined' && extraInfo.tags !== null) {
         for(var tag in extraInfo.tags) {
            if(extraInfo.tags[tag] !== null)  {
               $layer.attr('data-' + tag, extraInfo.tags[tag]);
            }
         }
      }
      
      this.$container.append($layer);
   };
   
   /**
    * Selects a layer
    */
   this.selectLayer = function(layerID, li) {
      var self = this;
      
      if(layerID in opec.microLayers) {
         if(layerID in opec.layers) {
            // DEBUG
            console.log("Adding layer...");
            opec.addLayer(opec.getLayerByID(layerID));
            
            // DEBUG
            console.log("Added Layer");
         } else {
            var microlayer = opec.microLayers[layerID];
            if(microlayer.type == 'opLayers') {
               opec.getLayerData(microlayer.serverName + '_' + microlayer.origName + '.json', microlayer);
            } else if (microlayer.type == 'refLayers') {
               // TODO: Deal with wfs layers.
               // Convert the microlayer. 
               // COMMENT: might change the way this works in future.
               var layer = new opec.layer(microlayer, {}); 
               opec.addLayer(layer);
            }
         }
         self.toggleLayerSelection(li);
      }
      else {
         // DEBUG
         console.log("no layer data to use");
      }      
   };
   
   /**
    * Deselects a layer
    */
   this.deselectLayer = function(layerID, li) {
      var self = this;
      
      // DEBUG
      console.log("deselected");
      var layer = opec.getLayerByID(layerID);
   
      if(layer) {            
         console.log("Removing layer..."); // DEBUG
         layer.unselect();       
         opec.removeLayer(layer);           
         console.log("Layer removed"); // DEBUG
         
         self.toggleLayerSelection(li);
      }
      else if(opec.layerStore[layerID]) {
         //layer = opec.layerStore[layerID];
         self.toggleLayerSelection(li);
      }
      else
         // DEBUG
         console.log("no layer data to use");
   };
   
   this.batchAddLayers = function(layers) {
      
   };
   
   this.toggleLayerSelection = function($selection) {
      //$selection.trigger('opec-toggle-selected');
      $selection.find(".ui-icon")
         .toggleClass("ui-icon-plus ui-icon-minus")
      .end()
      .toggleClass('opec-selected opec-unselected')
      .toggleClass('ui-state-highlight');
      
      this.filtrify.refreshCache($selection);
   };
   
   this.toggleLayerSelectionFromLayer = function(layer) {
      var self = this;
      this.$container.children('.opec-selected').each(function() {
         if($(this).attr('data-id') == layer.id) {
            self.toggleLayerSelection($(this));
         }
      });  
   };
   
   this.refresh = function() {
      var self = this;
      this.filtrify = $.filtrify(this.container, this.placeholder, {
         hide     : false,
         block: ['data-id', 'data-title'],
         blockFieldMenu: ['name'],
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
};
