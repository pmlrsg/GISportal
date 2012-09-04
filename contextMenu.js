function createContextMenu()
{
   // Setup the context menu and any custom controls
   $(function() {

      // Create the custom control for the slider
      $.contextMenu.types.slider = function(item, opt, root) {
         $('<div id="' + item.id + '" class="context-menu slider"></div>').appendTo(this)
         .on('click', '> li', function() {
            console.log('Clicked on ' + $(this).text());
            root.$menu.trigger('contextmenu:hide');
         })
         // Setup the slider
         .slider({
            max: 1,
            min: 0,
            value: 1,
            step: 0.05,
            change: function(e, ui) {
               var layer = map.getLayersByName($('.selectedLayer').attr('id'))[0];
               layer.setOpacity($("#" + item.id).slider("value"));
               return true;
            }
         });

         root.$menu.on('contextmenu:focus', function() {
            var layer = map.getLayersByName($('.selectedLayer').attr('id'))[0];
            $("#" + item.id).slider("value", layer.opacity);        
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
                     updateScalebar(layer);
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
                        var width = 110;
                        var height = 310;

                        $.each(layer.styles, function(index, value)
                        {    
                           if(value.Name == layer.params["STYLES"] && url == null)
                           {
                              url = value.LegendURL;
                              width = parseInt(value.Width);
                              height = parseInt(value.Height);
                              return false; // Break loop
                           }
                        });

                        if($('#scalebar-' + layer.name).length)
                           $('#scalebar-' + layer.name).dialog('close');

                        if(url == null) 
                           url = layer.url +'REQUEST=GetLegendGraphic&LAYER=' + layer.name.replace("-","/");

                        $(document.body).append(
                           '<div id="scalebar-' + layer.name +'" class="scalebar" title="Scalebar Info">' +
                              '<img src="' + url + '" alt="Scalebar"/>' +
                              '<div id="' + layer.name + '-range-slider"></div>' +
                              '<input id="' + layer.name + '-maxvalue" type="text" name="max"/>' +
                              '<label for="' + layer.name + '-maxvalue" title="The maximum value to be used"></label>' +
                              '<input id="' + layer.name + '-minvalue" type="text" name="min"/>' +
                              '<label for="' + layer.name + '-minvalue" title="The minimum value to be used"></label>' +
                           '</div>'
                        );

                        // Show the scalebar for a selected layer
                        $('#scalebar-' + layer.name).dialog({
                           position: ['center', 'center'],
                           //width: width,
                           //height: height,
                           resizable: true,
                           autoOpen: false,
                           close: function() {
                              $('#scalebar-' + layer.name).remove();
                           }
                        });

                        $('#' + layer.name + '-range-slider').slider({
                           orientation: "vertical",
                           range: true,
                           values: [ 17, 67 ],
                        });

                        $('#' + layer.name + '-range-slider').css('height', 256);
                        $('#' + layer.name + '-range-slider').css('margin', '5px 0px 0px ' + (10) + 'px');
                        $('#' + layer.name + '-maxvalue').css('margin', '10px 0px 200px ' + (10) + 'px');
                        $('#' + layer.name + '-minvalue').css('margin', '0px 0px 0px ' + (10) + 'px');
                        $('#scalebar-' + layer.name).dialog('open');
                     }
                  },
                  showMetadata: { 
                     name: "Show Metadata",
                     callback: function() {
                        // Get the selected layer
                        var layer = map.getLayersByName($('.selectedLayer').attr('id'))[0];

                        var dateRange = function() {
                           return layer.temporal ? '<div><label>Date Range: ' + layer.firstDate + ' to ' + layer.lastDate + '</label></div>' : '';
                        }

                        // Check if already open
                        if($('#metadata-' + layer.name).length)
                           $('#metadata-' + layer.name).dialog('close');

                        $(document.body).append(
                           '<div id="metadata-' + layer.name + '" title="' + layer.title + '">' +
                           '</div>'
                        );

                        // Show metadata for a selected layer
                        $('#metadata-' + layer.name).dialog({
                           position: ['center', 'center'],
                           width: 400,
                           height: 250,
                           resizable: true,
                           autoOpen: false,
                           close: function() {
                              $('#metadata-' + layer.name).remove();
                           }
                        });

                        $('#metadata-' + layer.name).dialog();

                        // Add new data
                        $('<div><label>Source: ' + '</label></div>' +
                           '<div><label>Name: ' + layer.title + '</label></div>' +
                           '<div><label>BoundingBox: ' + 
                              layer.exBoundingBox.NorthBoundLatitude + 'N, ' +
                              layer.exBoundingBox.EastBoundLongitude + 'E, ' +
                              layer.exBoundingBox.SouthBoundLatitude + 'S, ' + 
                              layer.exBoundingBox.WestBoundLongitude + 'W ' + 
                           '</label></div>' +
                           dateRange() +
                           '<div><label>Abstract: ' + layer.abstract + '</label></div>'
                        ).appendTo('#metadata-' + layer.name);

                        // Open dialog
                        $('#metadata-' + layer.name).dialog('open');
                     }
                  }
               }
            };                           
         }
      })
   });
}

function updateScalebar(layer)
{
   // Check we have something to update
   if($('#scalebar-' + layer.name).length)
   {
      var url = null;
      var width = 110;
      var height = 310;

      $.each(layer.styles, function(index, value)
      {      
         if(value.Name == layer.params["STYLES"] && url == null)
         {
            url = value.LegendURL;
            width = parseInt(value.Width);
            height = parseInt(value.Height);
         }
      });

      if(url != null)
      {
         $('#scalebar-' + layer.name + '> img').attr('src', url);
         console.info('url: ' + url);
      }
      else
      {
         $('#scalebar-' + layer.name + '> img').attr('src', layer.url +'REQUEST=GetLegendGraphic&LAYER=' + layer.name.replace("-","/"));
         console.info('url: ' + layer.url +'REQUEST=GetLegendGraphic&LAYER=' + layer.name.replace("-","/"));
      }

      $('#' + layer.name + '-range-slider').css('height', 256);
      $('#' + layer.name + '-range-slider').css('margin', '5px 0px 0px ' + (10) + 'px');
      $('#' + layer.name + '-maxvalue').css('margin', '10px 0px 200px ' + (10) + 'px');
      $('#' + layer.name + '-minvalue').css('margin', '0px 0px 0px ' + (10) + 'px');
   }
}
