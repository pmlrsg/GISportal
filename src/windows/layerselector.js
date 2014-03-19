/**
 * @constructor
 * @param {Object} placeholderID
 * @param {Object} containerID
 */
gisportal.window.layerSelector = function(placeholderID, containerID) {
   var self = this;
   
   $('#gisportal-layerSelection').extendedDialog({
      position: ['left', 'center'],
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
         gisportal.gritter.showNotification('layerSelector', null);
      },
      close: function(event, ui)  {
         console.log('layer selector closed');
         $('label[for=layerPreloader]').removeClass('ui-state-active');
      },
      open: function(event, ui)  {
         console.log('layer selector open');
         $('label[for=layerPreloader]').addClass('ui-state-active');
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
         self.$container.quicksand($(match), {
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
   }
  );
         
   $('#' + containerID + ' li').live("hover", function() {
      $(this).toggleClass('ui-state-hover');
   });
   
   $('#' + containerID + ' li').live("click", function(event, data) {
      var layerID = $(this).attr('data-id');
      var layerName = $(this).attr('data-name');
      var providerTag = $(this).attr('data-provider');
      var id = providerTag + ': ' + layerName;
      
      if(!$(this).hasClass('gisportal-selected')) {      
         self.selectLayer(layerID, $(this));
      }
      else if($(this).hasClass('gisportal-selected')) {
         self.deselectLayer(layerID, $(this));
      }
      
      return false;
   });
   
   $('#' + containerID + ' li a').live("click", function() {
       if($('span',this).hasClass('ui-icon-triangle-1-e')) $('span',this).addClass('ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-e'); 
       else $('span',this).addClass('ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-s');
       $(this).parent().children('div').toggle();
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
               if (extraInfo.tags[tag].length > 1)
                  $layer.attr('data-' + tag, JSON.stringify(extraInfo.tags[tag]));
               else
                  $layer.attr('data-' + tag, extraInfo.tags[tag]);
            }
         }
      }
      
      this.$container.append($layer);
   };
   
   /**
    * Selects a layer
    * selected should be true to add it to both panel and map
    * options will be passed to the layer once created
    */
   this.selectLayer = function(layerID, li, options) {
      var self = this;
      var options = options || {};
      if(layerID in gisportal.microLayers) {
         if(layerID in gisportal.layers) {
            // DEBUG
            console.log("Adding layer...");
            var layer = gisportal.getLayerByID(layerID);
            gisportal.addLayer(layer, options);
            gisportal.checkIfLayerFromState(layer);

            // DEBUG
            console.log("Added Layer");
         } else {
            var microlayer = gisportal.microLayers[layerID];
            if(microlayer.type == 'opLayers') {
               gisportal.getLayerData(microlayer.serverName + '_' + microlayer.origName + '.json', microlayer,options);
            } else if (microlayer.type == 'refLayers') {
               // TODO: Deal with wfs layers.
               // Convert the microlayer. 
               // COMMENT: might change the way this works in future.
               var layer = new gisportal.layer(microlayer, {}); 
               gisportal.addLayer(layer, options);
               gisportal.checkIfLayerFromState(layer);   
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
      var layer = gisportal.getLayerByID(layerID);
   
      if(layer) {            
         console.log("Removing layer..."); // DEBUG
         layer.unselect();       
         gisportal.removeLayer(layer);           
         console.log("Layer removed"); // DEBUG
         
         self.toggleLayerSelection(li);
      }
      else if(gisportal.layerStore[layerID]) {
         //layer = gisportal.layerStore[layerID];
         self.toggleLayerSelection(li);
      }
      else
         // DEBUG
         console.log("no layer data to use");
   };
   
   this.batchAddLayers = function(layers) {
      
   };
   
   this.toggleLayerSelection = function($selection) {
      //$selection.trigger('gisportal-toggle-selected');
      $selection.toggleClass('gisportal-selected gisportal-unselected')
      .toggleClass('ui-state-highlight');
      
      this.filtrify.refreshCache($selection);
   };
   
   this.toggleLayerSelectionFromLayer = function(layer) {
      var self = this;
      this.$container.children('.gisportal-selected').each(function() {
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
