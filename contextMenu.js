function createContextMenu()
{
   // Setup the context menu and any custom controls
   $(function() {

      // Create the custom control for the slider
      $.contextMenu.types.slider = function(item, opt, root) {
         $('<div id="' + item.id + '" class="context-menu slider"></div>').appendTo(this)
            .on('click', 'li', function() {
               root.$menu.trigger('contextmenu:hide');
            })
            // Setup the slider
            .slider({
               max: 1,
               min: 0,
               value: 1,
               step: 0.05,
               change: function(e, ui) {
                  var layer = map.getLayersByName($('.selectedLayer').attr('id'));
                  layer[0].setOpacity($("#" + item.id).slider("value"));
                  return true;
               }
            });

         this.on("contextmenu:show", function() {
            var layer = map.getLayersByName($('.selectedLayer').attr('id'));
            $("#" + item.id).slider("value", layer[0].opacity);        
         });
      }
      
      // Create the context menu
      $.contextMenu({
         // The class to activate on when right clicked
         selector: '.selectedLayer',
         // Dynamically creates the menu each time
         build: function($trigger, e) {
            var layer = map.getLayersByName($('.selectedLayer').attr('id'))[0];
            var menuOutput = [];
            var styles = layer.styles.slice();
            // Add a new style that will remove styles from the layer
            styles.push({
               Name: 'Remove Style',
               Abstract: '',
               LegendURL: '',
               Width: 0,
               Height: 0
            });

            // Iter through each of the styles and create an array
            $.each(styles, function(index, value) 
            {
               var styleIndex = 'style' + index;
               menuOutput[index] = [];
               menuOutput[index][styleIndex] = 
               {
                  index: styleIndex,
                  name: value.Name,
                  callbackName: value.Name,
                  // Create the callback for what happens when someone clicks on the menu button
                  callback: function() 
                  {
                     var layer = map.getLayersByName($('.selectedLayer').attr('id'))[0];
                     layer.mergeNewParams({styles: value.Name == 'Remove Style' ? '' : value.Name});
                  }
               }                       
            });

            // Return the new menu
            return {
               // The items in the menu
               items: {
                  fold1: {
                     name: "Opacity",
                     items: {
                        opacitySlider: {type: "slider", customName: "Opacity Slider", id:"opacitySlider"}
                     }
                  }, 
                  fold2: {
                     name: "Layer Styles", 
                     items: menuOutput
                  },
                  showScalebar: { 
                     name: "Show Scalebar",
                     callback: function() { 
                        // Get the selected layer
                        var layer = map.getLayersByName($('.selectedLayer').attr('id'))[0];

                        var url = null;
                        var width = 120;
                        var height = 310;
                        $.each(layer.styles, function(index, value)
                        {      
                           if(value.Name == layer.params["STYLES"] && url == null)
                           {
                              url = value.LegendURL;
                              width = value.Width;
                              height = value.Height;
                           }
                        });
                        $('#scalebar').empty();
                        $('#scalebar').css('width', width + 10);
                        $('#scalebar').css('height', height + 20);

                        if(url != null) 
                           $('#scalebar').append('<img src="' + url + '" alt="Scalebar"/>');
                        else
                           $('#scalebar').append('<img src="' + layer.url +'REQUEST=GetLegendGraphic&LAYER=' + layer.name.replace("-","/") + '" alt="Scalebar" />');
                        $('#scalebar').dialog('open');
                     }
                  },
                  showMetadata: { 
                     name: "Show Metadata",
                     callback: function() {
                        // Get the selected layer
                        var layer = map.getLayersByName($('.selectedLayer').attr('id'))[0];

                        // Clear the data from last time
                        $('#metadata').empty();
                        $('#metadata').dialog("option", "title", layer.title);

                        // Add new data
                        $('<div><label>Source: ' + '</label></div>' +
                           '<div><label>Name: ' + layer.title + '</label></div>' +
                           '<div><label>BoundingBox: ' + 
                              layer.exboundingbox.NorthBoundLatitude + 'N, ' +
                              layer.exboundingbox.EastBoundLongitude + 'E, ' +
                              layer.exboundingbox.SouthBoundLatitude + 'S, ' + 
                              layer.exboundingbox.WestBoundLongitude + 'W ' + 
                           '</label></div>' +
                           '<div><label>Date Range:</label></div>' +
                           '<div><label>Abstract: ' + layer.abstract + '</label></div>'
                        ).appendTo('#metadata');

                        $('#metadata').dialog('open');
                     }
                  }
               }
            };                           
         }
      })
   });
}
