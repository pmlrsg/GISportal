
gisportal.vectorLayerCount = 0;



/**
 * vector_layer.js
 * The is the base object for all vector based layers. This includes WFS
 * and SOS for now
 *
 *
 *
 *
 **/

gisportal.Vector = function(options) {
    console.log("gisportal.Vector");
    var vector = this;

    var defaults = {
        serviceType: null, // currently either SOS or WFS
        endpoint: null, // service enpoint URL
        dataType: null, // one of (point|polygon|line)
        exBoundingBox: null,
        providerTag: null, //short provider name
        serviceVersion: null, // version of OGC service
        variableName: null, // the WFS variable name
        srsName: 'EPSG:4326', // SRS for the vector layer
        defaultProperty: null,
        defaultProperties : [],
        unit : null
    };
    console.log(1);


    $.extend(true, this, defaults, options);

    this.selected = false;
    //var datetimes = 
    //this.DTCache = ["2019-11-22T02:00:00.0000", "2019-11-23T02:00:00.0000", "2019-11-25T02:00:00.0000"];
    this.DTCache = [];

    //this.styles = [];

    this.openlayers = {};
    this.name = this.tags.niceName;
    this.visibleTab = "details";
    this.currentColour = '';


    /**
     * By default the layer is visible, to hide it
     * just call layer.setVisibility(false);
     *
     * @param {boolean} visibility - True if visible, false if hidden
     */
    this.isVisible = true;
    this.setVisibility = function(visibility) {
        if (this.openlayers.anID) this.openlayers.anID.setVisible(visibility);
        this.isVisible = visibility;
    };
    console.log(4);
    console.log("this.temporal", this.temporal);


    this.init = function(options, layer) {
        console.log("this is the function caller", this.init.caller);
        console.log("this.init options layer", options, layer);
        //layer.DTCache = [];

        map.addLayer(layer.OLLayer);
        console.log(map);
        this.select();
        //console.log("select()");
        //this.getMetadata();
        this.openlayers.anID = layer.OLLayer;
        //this.openlayers.anID.g = 2;
        console.log(this.openlayers.anID.g);
        //this.getDimensions(layer);

        //gisportal.indicatorsPanel.selectTab( this.id, 'details' );

    };

    this.getDimensions = function(layerData) {
        var layer = this;
        console.log("this.getDimensions", layer.DTCache);
        
        this.temporal = true;

        if(this.temporal) {
            this.selectDateTimeLayer( gisportal.timeline.selectedDate );
            
            // Now display the layer on the timeline
            console.log("datetime", this.DTCache[0], typeof(this.DTCache[0]));
            var startDate = new Date(this.DTCache[0]);
            var endDate = new Date(this.DTCache[this.DTCache.length - 1]); //"2019-12-20T02:00:00.0000"
            gisportal.timeline.addTimeBar(this.name, this.id, this.name, startDate, endDate, this.DTCache);
            
            //gisportal.timeline.selectedDateLine
                    
            // Update map date cache now a new temporal layer has been added
            gisportal.refreshDateCache();
        }
     };


    this.select = function() {
        // Just in case it tries to add a duplicate
        console.log("select()");
        //if (_.indexOf(gisportal.selectedLayers, this.id) > -1) return false;
        var layer = this;

        layer.selected = true;

        // Adds the layer ID to the beginning of the gisportal.selectedLayers array
        gisportal.selectedLayers.unshift(layer.id);

        // If the layer has date-time data, use special select routine
        // that checks for valid data on the current date to decide if to show data
        if (!layer.temporal){
            console.log("if (!layer.temporal)", layer.temporal);
          //layer.setVisibility(true);
        }
        if (typeof(layer.preventAutoZoom) == 'undefined' || !layer.preventAutoZoom) {
            //gisportal.zoomOverall();   
        }
        
        var index = _.findIndex(gisportal.selectedLayers, function(d) {
            return d === layer.id;
        });
        console.log("this is the index", index);
        console.log("gisportal.selectedLayers", gisportal.selectedLayers);
        gisportal.setLayerIndex(layer, gisportal.selectedLayers.length - index);

        //if (true) {
        //    console.log("let's unselect the layer");
        //    this.unselect();
        //}
        //layer.setVisibility(false);

    };

    this.unselect = function() {
        console.log("unselect");
        var layer = this;
        $('#scalebar-' + layer.id).remove();
        layer.selected = false;
        layer.setVisibility(false);
        gisportal.selectedLayers = _.pull(gisportal.selectedLayers, layer.id);
        if (layer.temporal) {
            if (gisportal.timeline.timebars.filter(function(l) {
                return l.name === layer.name;
            }).length > 0) {
                gisportal.timeline.removeTimeBarByName(layer.name);
            }

            gisportal.refreshDateCache();
            console.log("right before calling gisportal.zoomOverall from vector layer");
            gisportal.zoomOverall();
        }
    };

    this.getMetadata = function() {
        console.log("this.getMetadata()");
        var layer = this;

        gisportal.layers[layer.id].metadataComplete = true;
        layer.metadataComplete = true;
        gisportal.events.trigger('layer.metadataLoaded', layer.id);
        console.log("get medatadata done");

    };

  this.styleUIBuilt = false;
  this.addedElements = false;
  
  this.setStyleUI = function(source,prop)  {
    console.log("this.setStyleUI", source, prop); //prop is null, source is the layer source
      if(!prop){
        console.log("no prop");
      }else {
         var _colour;
         if(this.currentColour.length>0){
           _colour = this.currentColour;
         }
         
         else{
            for(var colour in gisportal.vectorStyles.startingColours) {
               if(gisportal.vectorStyles.coloursInUse.indexOf(colour)==-1){
                  _colour = colour;
                  this.currentColour = colour;
                  gisportal.vectorStyles.coloursInUse.push(colour);
                  break;
               }
            }
         } 
         var opts = this.createStyleFromProp(source,prop,_colour);
         if ("unit" in this) {
           opts.unit = this.unit;
         }
         if(this.defaultProperties.length > 0){
           opts.defaultProps = true;
           opts.defaultProperties = this.defaultProperties;
         }
         gisportal.vectorStyles.cache[this.id+"__"+prop] = opts;
         opts.zoomable = true;
         if(gisportal.current_view && gisportal.current_view.noPan){
            opts.zoomable = false;
         }
         var renderedStyleUI = gisportal.templates['vector-style-ui'](opts);
         $('[data-id="' + this.id + '"] .dimensions-tab .vector-style-container').html(renderedStyleUI);
         this.styleUIBuilt = true;
      }
   }; 
  
   this.createStyleFromNumericalProp = function(source,prop,colour) {

   };


  this.createStyleFromProp = function(source,prop,colour){
      console.log("this.createStyleFromProp", source, prop, colour);
      var features = source.getFeatures();
      var possibleOptions = [];
      var x = 0, y = 0;
      var bins, style_colour;
      var featureCount = features.length;
      var isNumberProperty = false;
      for(x;x<=featureCount-1;x++) {
        var props = features[x].getProperties();

        if(!_.includes(possibleOptions, props[prop])){
            possibleOptions.push( props[prop]);
        }
      }
      var isAllNumeric = function(x) {
        return !isNaN(x);
      };
      isNumberProperty = possibleOptions.every(isAllNumeric);

      var colorPalette, legend, legend_obj;
      if(isNumberProperty) {

        var options_number = possibleOptions.map(function(x) {
            return (Number(x));//.toFixed(4);
        });
        var min = Math.min.apply(Math, options_number);
        var max = Math.max.apply(Math, options_number);
        var diff = max - min;
        var bin = Number((diff / (gisportal.vectorStyles.binSize )).toFixed(4));
        bins = [];
        for (b = 0; b <= gisportal.vectorStyles.binSize; b++) {
            bins.push((min + (bin*b)).toFixed(4));
        }
        colorPalette = gisportal.vectorStyles.createPalette(colour, bins.length);
        isNumberProperty = true;

        legend = [];
      legend_obj = {};
      for(y, x=bins.length -1; y<bins.length -1  , x> 0; y++, x--){
        var option = bins[y]+'-'+bins[y+1];
        legend.push({'option':option,'colour':colorPalette[x]});
        legend_obj[option] = colorPalette[x];
      }
      }
      else{
          if (this.defaultColour !== false){
              legend = [];
            legend_obj = {};
            legend_obj[this.name] = this.defaultColour;
            legend.push({'option':this.name,'colour':this.defaultColour});
          }
          else{
            colorPalette = gisportal.vectorStyles.createPalette(colour, possibleOptions.length);
            legend = [];
            legend_obj = {};
            for(y = possibleOptions.length, x = 0; y >= 0 , x <= possibleOptions.length  ; y--, x++){
                legend.push({'option':possibleOptions[y],'colour':colorPalette[y]});
                legend_obj[possibleOptions[y]] = colorPalette[y];
            }
          }
     }
      x = 0;
         for (x; x < featureCount; x++) {
            if (isNumberProperty) {
                console.log("point2 - it gets here", style_colour);
               var p = 0;
               var binsLength = bins.length;
               for (p; p < binsLength - 1; p++) {
                  var curVal = (Number(features[x].getProperties()[prop]));

                  if (bins[p] <= curVal && bins[p + 1] >= curVal) {
                     style_colour = legend_obj[bins[p] + '-' + bins[p + 1]];
                     style_colour = ol.color.asArray(style_colour);
                     if (this.vectorType == "POINT") {
                        console.log("point2 - it gets here", style_colour);
                        features[x].setStyle(
                        new ol.style.Style({
                           image: new ol.style.Circle({
                              radius: 5,
                              fill: new ol.style.Fill({
                                 color: style_colour
                              }),
                              stroke: new ol.style.Stroke({
                                 width: 0.5,
                                 color: 'rgba(255,0,0,1)'
                              })
                           })
                        }));
                     }
                     if (this.vectorType == "POLYGON") {
                        features[x].setStyle(
                           new ol.style.Style({
                              stroke: new ol.style.Stroke({
                                    color: 'rgba(255,0,0,1)',
                                    width: 20
                              }),
                              fill: new ol.style.Fill({
                                 color: style_colour
                              })
                           }));
                     }
                  }
               }
            }else {
                console.log("point - it gets here", style_colour);
               if(this.defaultColour !== false){
                   style_colour = this.defaultColour;
               }
               else {
                  style_colour = legend_obj[features[x].getProperties()[prop]];
                  style_colour = ol.color.asArray(style_colour);
               }
               if(gisportal.methodThatSelectedCurrentRegion.method == "selectExistingPolygon" && features[x].getId() == gisportal.methodThatSelectedCurrentRegion.value){
               }
               if (this.vectorType == "POINT") {
                    console.log("point - it gets here", style_colour);
                  features[x].setStyle(
                     new ol.style.Style({
                        image: new ol.style.Circle({
                           radius: 5,
                           fill: new ol.style.Fill({
                              color:style_colour
                           }),
                           stroke: new ol.style.Stroke({
                              width: 0.5,
                              color: style_colour
                           })
                        })
                     })
                  );

               }
               if (this.vectorType == "POLYGON") {
                  features[x].setStyle(
                     new ol.style.Style({
                        stroke: new ol.style.Stroke({
                                    color: style_colour,
                                    width: 5
                        }), 
                        fill: new ol.style.Fill({
                           color: style_colour
                        })
                     })
                  );
               }
            }
        }

      this.currentProperty = prop;
      opts = {};
      opts.currentProperty = prop ;
      opts.possibleOptions = possibleOptions;
      opts.legend = legend;
      opts.id = this.id;

      return opts;
  };

    this.addOLLayer = function(layer, id) {
        console.log("addOLLayer layer", layer, id);
        map.addLayer(layer);
        if(!this.styleUIBuilt){
            this.setStyleUI(layer.getSource(),layer.defaultProperty);
        }
        gisportal.vectorLayerCount++;
    };

    this.removeOLLayer = function(layer, id) {
        console.log("removeOLLayer", layer);
        map.removeLayer(layer);
        this.styleUIBuilt = false;

        gisportal.vectorLayerCount--;
        gisportal.vectorStyles.coloursInUse = _.without(gisportal.vectorStyles.coloursInUse,this.currentColour);

    };

    this.createOLVectorLayer = function() {
        var vec = this;

        var loadFeatures = function(response) {
            console.log("this is load features!!!", response);
            var wfsFormat = new ol.format.WFS();
            // This converts the features to the correct projection
            var feature, this_feature;
            var features = wfsFormat.readFeatures(response);
            for(feature in features){
               this_feature = features[feature];
               features[feature] = gisportal.geoJSONToFeature(gisportal.featureToGeoJSON(this_feature, "EPSG:4326", gisportal.projection));
            }
            sourceVector.addFeatures(features);
            vec.setVisibility(true);
            if(!this.styleUIBuilt){
                setup_style_ui(sourceVector,vec);
            }
        };

        var setup_style_ui = function(source) {
          var prop = 'currentProperty' in vec ? vec.currentProperty : vec.defaultProperty;
          
          //var prop ="datetime";

          vec.setStyleUI(source,prop);
        };
        var buildLoader = function($vector, $source) {
            console.log(buildLoader.caller);
            //var given_cql_filter = $('input.js-cql-filter')[0].value.split("?")[0];
            console.log("***");
            console.log("this is the cql filter", gisportal.given_cql_filter);
            //var largestBounds = [ -180, -90, 180, 90 ];
            //var extent = gisportal.reprojectBoundingBox(largestBounds, 'EPSG:4326', gisportal.projection);

            return function(extent, resolution, projection) {
                console.log("this is inside the return function in the buildloader");
                vectorSource = $source;
                var url = $vector.endpoint +
                    '%3Fservice%3DWFS' +
                    maxFeatures($vector) +
                    '%26version%3D1.1.0' +
                    '%26request%3DGetFeature' +
                    '%26typename%3D' + $vector.variableName +
                    '%26srs%3D' + $vector.srsName;
                
                console.log("$vector.id", $vector.id);

                if (gisportal.given_cql_filter) {
                    console.log("it gets here");
                    //url = "/app/settings/proxy?url=http%3A%2F%2Frsg.pml.ac.uk%2Fgeoserver%2Frsg%2Fwms%3Fservice%3DWFS%26maxFeatures%3D100000%26version%3D1.1.0%26request%3DGetFeature%26typename%3Dscipper:emission_sensible_15th_october%26srs%3DEPSG:4326";
                    url += '%26cql_filter%3D' + encodeURIComponent(gisportal.given_cql_filter);
                }
                else {
                    url += '%26bbox%3D' + extent + ',' + gisportal.projection;
                    //url = "/app/settings/proxy?url=http%3A%2F%2Frsg.pml.ac.uk%2Fgeoserver%2Frsg%2Fwms%3Fservice%3DWFS%26maxFeatures%3D100000%26version%3D1.1.0%26request%3DGetFeature%26typename%3Dscipper:emission_sensible_15th_october%26srs%3DEPSG:4326%26cql_filter%3Ddatetime%3D2020-10-15T00:42:38Z";
                }

                //url += "&outputFormat=application/json";
                console.log("this is the url", url);

                //var url = "http://localhost:6789/app/settings/proxy?url=http%3A%2F%2Frsg.pml.ac.uk%2Fgeoserver%2Frsg%2Fwms%3Fservice%3DWFS%26maxFeatures%3D100000%26version%3D1.1.0%26request%3DGetFeature%26typename%3Dscipper:emission_sensible_recent%26srs%3DEPSG:4326%26cql_filter%3Ddatetime+between+2020-12-07T10:47:32Z+and+2020-12-07T11:01:48Z";

                $.ajax({
                    url: url,
                    success: function(response){
                        if(response.getElementsByTagName("ows:ExceptionText")[0]) { //if invalid CQL filter
                            console.log(response.getElementsByTagName("ows:ExceptionText")[0].textContent);
                            $.notify("Sorry\nThere was an unexpected error thrown by the server: " + response.getElementsByTagName("ows:ExceptionText")[0].textContent, "error");
                            gisportal.validFilter = false;
                            gisportal.given_cql_filter = false;
                            gisportal.vectors.pop();
                            gisportal.vlayers.pop();
                            delete gisportal.layers[$vector.id];
                            gisportal.indicatorsPanel.removeFromPanel($vector.id);
                        } else {
                            gisportal.validFilter = true;
                            loadFeatures(response);
                        }
                        console.log("this is the final url: ", url);
                        console.log("this is the response", response);
                    },
                    error: function(e, response){
                        console.log("error", response);
                        console.log("e", e.responseText);
                        gisportal.given_cql_filter = false;
                        $.notify("Sorry\nThere was an unexpected error thrown by the server: " + e.statusText, "error");
                        gisportal.validFilter = false;
                        gisportal.indicatorsPanel.removeFromPanel($vector.id);
                     }
                });

            };
        };

        console.log("the service type is WFS");
        var sourceVector = new ol.source.Vector({
            loader: buildLoader(vec, sourceVector),
            strategy: ol.loadingstrategy.bbox,
        });
        console.log("this is the loader after the build loader is called ", sourceVector);
        var layerVector = new ol.layer.Vector({
            source: sourceVector
        });

        console.log("sourceVector && layerVector", vec, layerVector);
        console.log(sourceVector);
        //var source = layerVector.getSource();

        sourceVector.on('change', function(layer){
            console.log("this is vec", vec, layer);
            var source = layer.target;
            console.log(source);

            //adding list of properties
            if(source.getState() === 'ready'){
                var features = source.getFeatures();
                console.log("source.getState() === 'ready'", features);

            }
        });
        vec.sourceVector = sourceVector;
        vec.layerVector = layerVector;

        console.log("this is vec", vec, vec.sourceVector, vec.layerVector);
        var features = this.sourceVector.getFeatures();
        console.log("vec.getFeatures()", features);
        vec.sourceVector.addFeatures(features);
        vec.setVisibility(true); //this works for hiding the layer
        vec.sourceVector.refresh();

        this.sourceVector = sourceVector;
        this.layerVector = layerVector;
    };

    this.addUIElements = function(features) {

        var changeStyle = function(){
            //console.log("slider.noUiSlider.get()", $('#slider_range_upper')[0].innerHTML);
            //console.log("slider.noUiSlider.get()", $('#slider_range_lower')[0].innerHTML);
            //console.log("changeStyle vec", vec.sourceVector);
            console.log("var source", vec.sourceVector, vec.sourceVector.getFeatures());
            var source = vec.sourceVector;
            //var features = source.getFeatures();
            //console.log("changeStyle", features[0].style);

            var layers = map.getLayers();
            console.log(Object.keys(layers).length);

            //var lowerBoundary = '2020-10-14T23:02:12Z';
            //var upperBoundary = '2020-10-15T07:15:17Z';

            var upperBoundary =  $('#slider_range_upper')[0].innerHTML;
            var lowerBoundary =  $('#slider_range_lower')[0].innerHTML;

            console.log("this.DTCache.end", vec.DTCache.end, vec.DTCache.start, upperBoundary);

            if(upperBoundary || lowerBoundary) {
                console.log("vec.sourceVector", vec.sourceVector);
                //vec.sourceVector.clear();
                vec.setVisibility(false); //this works for hiding the layer
                var dateUpper = new Date(upperBoundary).toISOString();
                var dateLower = new Date(lowerBoundary).toISOString();
    
                console.log("dateUpper", dateUpper);
    
                //var filter = new ol.format.filter.IsBetween("datetime", lowerBoundary, upperBoundary);
                //console.log("this is the filter", filter);
    
                if(dateUpper != vec.DTCache.end && dateLower != vec.DTCache.start) {
                    console.log("a new WFS get feature should be sent");
    
                    gisportal.given_cql_filter = "datetime between 2020-10-14T23:02:12Z and 2020-10-14T23:02:12Z";
                    vec.createOLVectorLayer();
                    
                    //var features = this.sourceVector.getFeatures();
                    //console.log("vec.getFeatures()", features);
                    //vec.sourceVector.addFeatures(features);
                    //vec.setVisibility(true); //this works for hiding the layer
                    //vec.sourceVector.refresh();
                }
            } 

            

            //layers.forEach(function(f){
                //if(f instanceof ol.layer.Vector){
                   //if (f.getSource().getFeatures().length > 0) {
                        //console.log("f.getSource().getFeatures()", f.getSource().getFeatures());
                        //vec.setVisible(false);
                        //source.removeFeature(f);
                        //map.removeLayer(f);
                        //this.styleUIBuilt = false;

                        //gisportal.vectorLayerCount--;
                        //gisportal.vectorStyles.coloursInUse = _.without(gisportal.vectorStyles.coloursInUse,this.currentColour);
                //   }
               // }
                
            //});

            //for(var i=0; i<features.length; i++) {
            //    features[i].style = { display: 'none' };
            //}
            console.log("setting visibility to false");
            source.refresh({force:true});
            map.render();
        };

        var setValueUpper = function(value) {
            var date = new Date(Math.round(value));
            $(this).html(date.toISOString());
            changeStyle();
            console.log("this is the gisportal.cql_filter now", gisportal.given_cql_filter);
        };

        var setValueLower = function(value) {
            var date = new Date(Math.round(value));
            $(this).html(date.toISOString());
            changeStyle();
        };

        var vec = this;
        vec.addedElements = true;

        console.log("hello");

        console.log("$('#slider')", $('#slider'));
        var slider = $('#slider');

        vec.DTCache = [];

        Object.keys(features).forEach(function (i) {
            //console.log("fff", features[i]);
            var properties = features[i].getProperties();
            var date = new Date(properties.datetime).getTime();
            vec.DTCache.push(date);
            //console.log("datetime", properties.datetime);
        });

        //var slider_start = new Date('2020-10-15T07:25:24Z').getTime();
        //var slider_end = new Date('2020-10-15T08:59:15Z').getTime();

        console.log(vec.DTCache);
        console.log("Math.min.apply(null, vec.DTCache)", Math.min.apply(null, vec.DTCache));
        console.log("Math.max.apply(null, vec.DTCache)", Math.max.apply(null, vec.DTCache));

        var slider_start = Math.min.apply(null, vec.DTCache);
        var slider_end = Math.max.apply(null, vec.DTCache);

        vec.DTCache.start = slider_start;
        vec.DTCache.end = slider_end;


        console.log("slider_start", slider_start, slider_end);

        //var slider_range = {'min': 0,'max': 100};
        var slider_range ={min: slider_start, max: slider_end};

        try {
            slider.noUiSlider({
                connect: true,
                behaviour: 'tap-drag',
                start: [slider_start, slider_end],
                range: slider_range,
                serialization: {
                lower: [
                    $.Link({
                        target: $('#slider_range_lower'),
                        method: setValueLower
                    })
                ],
                upper: [
                    $.Link({
                        target: $('#slider_range_upper'),
                        method: setValueUpper
                    })
                ]}
            });

        } catch (e) {console.log("e", e);}

        var properties = features[0].getProperties();
        console.log("these are the properties of the layer", Object.keys(properties));
        console.log(properties);


        // Timeline - getMetadata --------
        //for(var i=0; i<10; i++) {
        //    var p = features[i].getProperties();
        //    vec.DTCache.push(p.datetime);
        //    console.log("datetime", p.datetime);
        //}

        //Object.keys(properties).forEach(function (property) {
        //    if(property == "datetime" || property == "time" || property == "Datetime" || property == "Time") {
                
        //    }
        //});
    
        //------------

        console.log("first feature", features[0]);

        //add list of properties
        var propertiesList = document.getElementById('properties-list');
        var response = "<ul>";

        Object.keys(properties).forEach(function (property) {
            response += "<li> • " + property + "</li>";
        });
        response += "</ul>";
        propertiesList.innerHTML = response;
    };

    /**
     * This function creates an Open Layers layer, such as a WMS Layer.
     * These are stored in layer.openlayers. Currently the implementation
     * only allows a single OL layer per gisportal.layer known as 'anID'
     * but in the future this should change to allow multiple OL layers.
     *
     * opLayers refer to operational layers, generally temporal WMS layers
     * refLayers refer to reference layers, generally WFS or KML.
     *
     * History:
     * The previous implementation had the idea of microlayers but over time
     * they grew into a confusing mess than has now been removed and merged
     * with gisportal.layer.
     */
    this.createOLLayer = function() {
        console.log("this.createOLLayer caller", this.createOLLayer.caller);
        createStyle = function(vec,source) {
            var styleType = vec.vectorType;
            return styles[styleType];
        };

        var maxFeatures = function(vec) {
            return vec.maxFeatures !== 'ALL' ? '%26maxFeatures%3D' + vec.maxFeatures : '';
        };

        var vec = this;

        var loadFeatures = function(response) {
            console.log("this is load features!!!", response);
            var wfsFormat = new ol.format.WFS();
            // This converts the features to the correct projection
            var feature, this_feature;
            var features = wfsFormat.readFeatures(response);
            for(feature in features){
               this_feature = features[feature];
               features[feature] = gisportal.geoJSONToFeature(gisportal.featureToGeoJSON(this_feature, "EPSG:4326", gisportal.projection));
            }
            sourceVector.addFeatures(features);
            vec.setVisibility(true);
            if(!this.styleUIBuilt){
                setup_style_ui(sourceVector,vec);
            }
        };

        var setup_style_ui = function(source) {
          var prop = 'currentProperty' in vec ? vec.currentProperty : vec.defaultProperty;
          
          //var prop ="datetime";

          vec.setStyleUI(source,prop);
        };
        var buildLoader = function($vector, $source) {
            console.log(buildLoader.caller);
            //var given_cql_filter = $('input.js-cql-filter')[0].value.split("?")[0];
            console.log("**");
            console.log("this is the cql filter", gisportal.given_cql_filter);
            //var largestBounds = [ -180, -90, 180, 90 ];
            //var extent = gisportal.reprojectBoundingBox(largestBounds, 'EPSG:4326', gisportal.projection);

            return function(extent, resolution, projection) {
                console.log("this is inside the return function in the buildloader");
                vectorSource = $source;
                var url = $vector.endpoint +
                    '%3Fservice%3DWFS' +
                    maxFeatures($vector) +
                    '%26version%3D1.1.0' +
                    '%26request%3DGetFeature' +
                    '%26typename%3D' + $vector.variableName +
                    '%26srs%3D' + $vector.srsName;
                
                console.log("$vector.id", $vector.id);

                if (gisportal.given_cql_filter) {
                    console.log("it gets here");
                    //url = "/app/settings/proxy?url=http%3A%2F%2Frsg.pml.ac.uk%2Fgeoserver%2Frsg%2Fwms%3Fservice%3DWFS%26maxFeatures%3D100000%26version%3D1.1.0%26request%3DGetFeature%26typename%3Dscipper:emission_sensible_15th_october%26srs%3DEPSG:4326";
                    url += '%26cql_filter%3D' + encodeURIComponent(gisportal.given_cql_filter);
                }
                else {
                    url += '%26bbox%3D' + extent + ',' + gisportal.projection;
                    //url = "/app/settings/proxy?url=http%3A%2F%2Frsg.pml.ac.uk%2Fgeoserver%2Frsg%2Fwms%3Fservice%3DWFS%26maxFeatures%3D100000%26version%3D1.1.0%26request%3DGetFeature%26typename%3Dscipper:emission_sensible_15th_october%26srs%3DEPSG:4326%26cql_filter%3Ddatetime%3D2020-10-15T00:42:38Z";
                }

                //url += "&outputFormat=application/json";
                console.log("this is the url", url);

                //var url = "http://localhost:6789/app/settings/proxy?url=http%3A%2F%2Frsg.pml.ac.uk%2Fgeoserver%2Frsg%2Fwms%3Fservice%3DWFS%26maxFeatures%3D100000%26version%3D1.1.0%26request%3DGetFeature%26typename%3Dscipper:emission_sensible_recent%26srs%3DEPSG:4326%26cql_filter%3Ddatetime+between+2020-12-07T10:47:32Z+and+2020-12-07T11:01:48Z";

                $.ajax({
                    url: url,
                    success: function(response){
                        if(response.getElementsByTagName("ows:ExceptionText")[0]) { //if invalid CQL filter
                            console.log(response.getElementsByTagName("ows:ExceptionText")[0].textContent);
                            $.notify("Sorry\nThere was an unexpected error thrown by the server: " + response.getElementsByTagName("ows:ExceptionText")[0].textContent, "error");
                            gisportal.validFilter = false;
                            gisportal.given_cql_filter = false;
                            gisportal.vectors.pop();
                            gisportal.vlayers.pop();
                            delete gisportal.layers[$vector.id];
                            gisportal.indicatorsPanel.removeFromPanel($vector.id);
                        } else {
                            gisportal.validFilter = true;
                            loadFeatures(response);
                        }
                        console.log("this is the final url: ", url);
                        console.log("this is the response", response);
                    },
                    error: function(e, response){
                        console.log("error", response);
                        console.log("e", e.responseText);
                        gisportal.given_cql_filter = false;
                        $.notify("Sorry\nThere was an unexpected error thrown by the server: " + e.statusText, "error");
                        gisportal.validFilter = false;
                        gisportal.indicatorsPanel.removeFromPanel($vector.id);
                     }
                });

            };
        };


        var createOLVectorLayer = function() {
            console.log("the service type is WFS");
            var sourceVector = new ol.source.Vector({
                loader: buildLoader(vec, sourceVector),
                strategy: ol.loadingstrategy.bbox,
            });
            console.log("this is the loader after the build loader is called ", sourceVector);
            var layerVector = new ol.layer.Vector({
                source: sourceVector
            });
            //var source = layerVector.getSource();
            vec.sourceVector = sourceVector;
            vec.layerVector = layerVector;

            console.log("this is vec", vec, vec.sourceVector, vec.layerVector);

            this.sourceVector = sourceVector;
            this.layerVector = layerVector;

        };

        if (this.serviceType === 'WFS') {

            createOLVectorLayer();

            sourceVector.on('change', function(layer){
                console.log("this is vec", vec, layer);
                var source = layer.target;

                //adding list of properties
                if(source.getState() === 'ready'){
                    var features = source.getFeatures();
                    console.log("source.getState() === 'ready'", features);

                    console.log("WFS layer", layer);


                    if(false) {
                        layer.selectDateTimeLayer( gisportal.timeline.selectedDate );
            
                        // Now display the layer on the timeline
                        var startDate = new Date(layer.firstDate);
                        var endDate = new Date(layer.lastDate);
                        gisportal.timeline.addTimeBar(layer.name, layer.id, layer.name, startDate, endDate, layer.DTCache);   
                                
                        // Update map date cache now a new temporal layer has been added
                        gisportal.refreshDateCache();
                        
                        $('#viewDate').datepicker("option", "defaultDate", endDate);
                    }

                    console.log("vec.addedElements", vec.addedElements);

                    if(features !== undefined && features.length > 0 && !vec.addedElements) { //check if there is anything returned for that search
                        console.log("adding the UI elements");
                        vec.addUIElements(features);

                    } else {
                        console.log("UI elements already added");
                        //$.notify("No features could be found.");
                    }
                }
                console.log("cql filtter", gisportal.given_cql_filter);
                if(gisportal.given_cql_filter) {
                    console.log("ready to add the reset button");
                    //add reset button
                    var resetDiv = document.getElementsByClassName('reset-cql-filter')[0];
                    console.log("this is the reset div", resetDiv);
                    var resetBtn = '<button type="button" class="brand small js-cql-filter-reset pull-left" id=' + vec.originalID + '>Reset</button>';
                    console.log(resetBtn);
                    resetDiv.innerHTML = resetBtn;
                    console.log("this is the reset div after adding the button", resetDiv);
                } else {
                    console.log("Reset button already added.");
                }

                console.log("vec", vec);

                //vec.getDimensions();
            });

            vector.OLLayer = layerVector;

            //this.getDimensions();

            console.log("this is the layer vector", layerVector);
            return layerVector;
        }

        if (this.serviceType === 'SOS') {
            // TODO custom support for rendering SOS
        }
    };


    return this;

};

gisportal.getVectorLayerData = function(layer, id, options) {
    console.log("gisportal.getVectorLayerData", layer);
    gisportal.layers[id].init(options, layer);

};

gisportal.vectorSelectionTest = function(id, tabname){

  var layers = map.getLayers();
      var found = false;

  layers.forEach(function(f){
      if(f instanceof ol.layer.Vector){
         if (f.getSource().getFeatures().length > 0) {
            found = true;
         }
      }
      
  });

  if(found){
      $('.draw-select-polygon-div').removeClass('hidden');
   }else {
      $('.draw-select-polygon-div').addClass('hidden');
   }

};
