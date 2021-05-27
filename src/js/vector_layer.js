
gisportal.vectorLayerCount = 0;

gisportal.originalVectorInfo = "";
gisportal.dateTimeNames = [];


gisportal.filteredVector = function(vector) {
    var serverUrl  = "http%3A%2F%2Frsg.pml.ac.uk%2Fgeoserver%2Frsg%2Fwms";

    var vectorOptions = {
        "name": vector.name,
        "Name": vector.name,
        "description": vector.desc,
        "endpoint" : serverUrl,
        "serviceType" : "WFS",
        "variableName" : vector.variableName,
        "maxFeatures" : vector.maxFeatures,
        "tags" : vector.tags,
        "id" : vector.id,
        "exBoundingBox" : vector.exBoundingBox,
        "abstract" : vector.abstract,
        "provider" : vector.provider,
        "contactInfo" : {
           "organization" : vector.provider
        },
        "ignoredParams" : vector.ignoredParams,
        "vectorType" : vector.vectorType,
        "styles" : vector.styles,
        "defaultProperty" : vector.defaultProperty,
        "defaultProperties" : vector.defaultProperties,
        "descriptiveName" : vector.tags.niceName,
        "unit" : vector.unit,
        "defaultColour" : vector.defaultColour || false,
        "serverName": vector.serverName, 
        "Abstract": vector.Abstract
     };

     //vectorLayer = new gisportal.Vector(vectorOptions);
     //vectorLayerOL = vectorLayer.createOLLayer();

};

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
    console.log("gisportal.Vector", options);
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

    if (this.filtered) this.addedElements = true; else this.addedElements = false;


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
  //this.addedElements = false;
  
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
        console.log("gisportal.originalVectorInfo", gisportal.originalVectorInfo);
        var vec = gisportal.originalVectorInfo;

        //vec.setVisibility(false); //this works for hiding the layer
        console.log("before calling filteredVector");
        gisportal.filteredVector(vec);
        vec.sourceVector.refresh();

        this.sourceVector = sourceVector;
        this.layerVector = layerVector;
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

        var addUIElements = function(features) {

            var vec = this;
            vec.addedElements = true;

            var properties = features[0].getProperties();
            console.log("these are the properties of the layer", Object.keys(properties));
            console.log(properties);
            console.log("first feature", features[0]);

            //add list of properties
            var propertiesList = document.getElementById('properties-list');
            var response = "<ul>";

            Object.keys(properties).forEach(function (property) {
                response += "<li> • " + property + "</li>";
            });
            response += "</ul>";
            propertiesList.innerHTML = response;

            //add dropdown for properties
            var propertiesDropdown = document.getElementById('properties-dropdown');
            console.log("propertiesDropdown", propertiesDropdown);

            var variableOptions = '<label for="displayVariables"><h3>Select a variable to display:</h3></label><select name="displayVariables" id="displayVariables">';

            Object.keys(properties).forEach(function (property) {
                console.log("propertiesDropdown", property);
                variableOptions += '<option value="' + property + '">' + property + '</option>';
            });            

            propertiesDropdown.innerHTML = variableOptions;

            checkTimedate(features);


            $('button.apply-colorbar-changes-button').on('click', function(e)  {
                console.log("apply colorbar changes button clicked");
                console.log($('#variable-belowMinColor').find(":selected").text());
                console.log($('#variable-aboveMaxColor').find(":selected").text());

                var minColor = $('#variable-belowMinColor').find(":selected").text();
                var maxColor = $('#variable-aboveMaxColor').find(":selected").text();
                var propertySelected = $('#properties-dropdown').find(":selected").text();
                console.log(propertySelected);


                console.log("document.getElementById('grad-scalebar')", document.getElementById('grad-scalebar').style);

                document.getElementById('grad-scalebar').style.backgroundImage = 'linear-gradient(to right, ' + minColor + ', ' + maxColor + ')';

                var propertyValues = [];
                var values = [];

                Object.keys(features).forEach(function (feature) {
                    var featureProperties = features[feature].getProperties();
                    Object.keys(featureProperties).forEach(function (property) {
                        if(property == propertySelected) propertyValues.push(featureProperties[property]);
                    });
                });

                var maxValue = parseFloat(Math.max.apply(null, propertyValues));
                Object.keys(propertyValues).forEach(function (value) {
                    var floatValue = parseFloat(propertyValues[value]);
                    values.push(floatValue * 240/maxValue);
                });
                console.log(maxValue, typeof(maxValue));
                console.log(propertyValues);
                console.log(values);
            });


        };

        var updateSlider = function(updatedRange) {
            var slider = $('#slider');

            console.log("updatedRange", updatedRange);
            console.log(updatedRange[0], updatedRange[-1]);

            var slider_start = Math.min.apply(null, updatedRange);
            var slider_end = Math.max.apply(null, updatedRange);

            var slider_range ={min: slider_start, max: slider_end};

        };

        var getDateTimes = function(timeProperty){
            vec.DTCache = [];

            Object.keys(vec.layerFeatures).forEach(function (i) {
                //console.log("fff", features[i]);
                var properties = vec.layerFeatures[i].getProperties();
                var date = new Date(properties[timeProperty]).getTime();
                vec.DTCache.push(date);
                //console.log("datetime", properties.datetime);
            });
        };

        var addSlider = function() {

            var selectedProperty;
            if($('#timedates-dropdown').find(":selected").text()) selectedProperty = $('#timedates-dropdown').find(":selected").text();
            else selectedProperty = gisportal.dateTimeNames[0];

            console.log("addSlider selectedProperty", selectedProperty);

            $('#slider-container').show();

            console.log("$('#slider')", $('#slider'));
            var slider = $('#slider');

            getDateTimes(selectedProperty);

            console.log(vec.DTCache);
            console.log("Math.min.apply(null, vec.DTCache)", Math.min.apply(null, vec.DTCache));
            console.log("Math.max.apply(null, vec.DTCache)", Math.max.apply(null, vec.DTCache));

            var slider_start = Math.min.apply(null, vec.DTCache);
            var slider_end = Math.max.apply(null, vec.DTCache);

            vec.DTCache.start = slider_start;
            vec.DTCache.end = slider_end;


            console.log("slider_start", slider_start, slider_end);

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


            var button = '<button type="button" class="brand small apply-slider-changes-button pull-right">Apply</button>';

            console.log($('#apply-slider-changes'));
            $('#apply-slider-changes').html(button);

            $('button.apply-slider-changes-button').on('click', function(e)  {
                console.log("apply changes button clicked");
                console.log("dropdown selected");
                console.log($('#timedates-dropdown').find(":selected").text());
                var slider = $('#slider');

                vec.propertySelected = $('#timedates-dropdown').find(":selected").text();

                getDateTimes(vec.propertySelected);
                addSlider();

                //updateSlider();

                //vec.setVisibility(false);
                changeStyle();
            });
        };

        var addDropdown = function() {
            var dateTimesOptions = '<label for="datetimes">Select time property field:</label><select name="datetimes" id="datetimes">';

            for (var i = 0; i < gisportal.dateTimeNames.length; i++){
                console.log("dateTimeNames[i]", gisportal.dateTimeNames[i]);
                dateTimesOptions += '<option value="' + gisportal.dateTimeNames[i] + '">' + gisportal.dateTimeNames[i] + '</option>';
            }

            $('#timedates-dropdown').html(dateTimesOptions);

            console.log("addDropdown has been called");

            $('#datetimes').on('click', function(e)  {
                console.log("dropdown has been changed");
                var propertySelected = $('#timedates-dropdown').find(":selected").text();
                console.log("propertySelected", propertySelected);
                getDateTimes(propertySelected);
                var updatedRange = vec.DTCache;
                console.log("updatedRange", updatedRange);
                //updateSlider(updatedRange);

                $('#slider').empty();
                $('#slider').removeAttr('class');

                addSlider();

            });

        };

        var checkTimedate = function(features) {
            //var url = "https://rsg.pml.ac.uk/geoserver/rsg/wfs?service=WFS&version=1.1.0&request=DescribeFeatureType&TypeName=scipper:met_sensible_15th_october";

            var url = vec.endpoint +
            '%3Fservice%3DWFS' +
            maxFeatures(vec) +
            '%26version%3D1.1.0' +
            '%26request%3DDescribeFeatureType' +
            '%26TypeName%3D' + vec.variableName;

            console.log("datetime url", url);

            $.ajax({
                url: url,
                success: function(response){
                    console.log("response checkTimedate", response.getElementsByTagName("xsd:sequence")[0].children);
                    console.log(response.getElementsByTagName("xsd:sequence")[0].children[1].attributes);
                    console.log(response.getElementsByTagName("xsd:sequence")[0].children[1].attributes.type.value);
                    var sequenceNodes = response.getElementsByTagName("xsd:sequence")[0].children;
                    $('#timedates-dropdown').empty();
                    //$('#slider-container').show();
                    $('#slider-container').show();
                    gisportal.dateTimeNames = [];
                    var sliderAdded = false;

                    for (var i = 0; i < sequenceNodes.length; i++){
                        var nodeType = sequenceNodes[i].attributes.type.value;
                        console.log("nodeType", nodeType, sequenceNodes[i].attributes.name.value);
                        if(nodeType == "xsd:dateTime") {
                            $('#slider-container').show();
                            gisportal.dateTimeNames.push(sequenceNodes[i].attributes.name.value);
                            console.log("datetimes ", sequenceNodes[i].attributes.name.value);
                            if(!sliderAdded) {
                                addSlider();
                                sliderAdded = true;
                            }
                        }
                    }
                    if(!sliderAdded) $('#slider-container').hide();
                    if(gisportal.dateTimeNames.length > 1) addDropdown(gisportal.dateTimeNames);
                    console.log("dateTimeNames", gisportal.dateTimeNames);
                },
                error: function(e, response){
                    console.log("error checkTimedate", e);
                 }
            });
        };

        var changeStyle = function(){
            console.log("var source", vec.sourceVector, vec.sourceVector.getFeatures());
            var source = vec.sourceVector;

            var layers = map.getLayers();
            console.log(Object.keys(layers).length);
            

            var upperBoundary =  $('#slider_range_upper')[0].innerHTML;
            var lowerBoundary =  $('#slider_range_lower')[0].innerHTML;

            console.log("this.DTCache.end", vec.DTCache.end, vec.DTCache.start, upperBoundary);

            if(upperBoundary || lowerBoundary) {
                console.log("vec.sourceVector", vec.sourceVector);
                vec.sourceVector.clear();
                //vec.setVisibility(false); //this works for hiding the layer
                var dateUpper = new Date(upperBoundary).toISOString();
                var dateLower = new Date(lowerBoundary).toISOString();
    
                console.log("dateUpper", dateUpper);

                var features = source.getFeatures();

                //for (var feature in features) {
                    
                    //var featureDate = new Date(features[feature].U.datetime).toISOString();
                    //console.log("feature in features", featureDate);

                    //if(featureDate > dateUpper || featureDate < dateLower) {
                    //    features[feature].setStyle(new ol.style.Style({}));
                    //} else features[feature].setStyle(null);

                //}
    
                if(dateUpper != vec.DTCache.end && dateLower != vec.DTCache.start) {
                    console.log("a new WFS get feature should be sent", vec);

                    var propertySelected = $('#timedates-dropdown').find(":selected").text();
                    var datetimeName;

                    if(propertySelected) datetimeName = propertySelected;
                    else datetimeName = gisportal.dateTimeNames[0];
    
                    gisportal.given_cql_filter = datetimeName + " between " + dateLower + " and " + dateUpper;
                    //createOLVectorLayer();

                    var url = vec.endpoint +
                    '%3Fservice%3DWFS' +
                    maxFeatures(vec) +
                    '%26version%3D1.1.0' +
                    '%26request%3DGetFeature' +
                    '%26typename%3D' + vec.variableName +
                    '%26srs%3D' + vec.srsName +
                    '%26cql_filter%3D' + encodeURIComponent(gisportal.given_cql_filter);

                    $.ajax({
                        url: url,
                        success: function(response){
                            if(response.getElementsByTagName("ows:ExceptionText")[0]) { //if invalid CQL filter
                                console.log(response.getElementsByTagName("ows:ExceptionText")[0].textContent);
                                $.notify("Sorry\nThere was an unexpected error thrown by the server1: " + response.getElementsByTagName("ows:ExceptionText")[0].textContent, "error");
                                gisportal.validFilter = false;
                                gisportal.given_cql_filter = false;

                            } else {
                                console.log("this is the response", response);
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
                            $.notify("Sorry\nThere was an unexpected error thrown by the server2: " + e.statusText, "error");
                            gisportal.validFilter = false;
                            gisportal.indicatorsPanel.removeFromPanel($vector.id);
                         }
                    });

                }
            } 
            console.log("setting visibility to false");
            source.refresh({force:true});
            map.render();
        };

        var setValueUpper = function(value) {
            var date = new Date(Math.round(value));
            $(this).html(date.toISOString());
            //changeStyle();
        };

        var setValueLower = function(value) {
            var date = new Date(Math.round(value));
            $(this).html(date.toISOString());
            //changeStyle();
        };

        console.log("this.createOLLayer caller", this.createOLLayer.caller);
        createStyle = function(vec,source) {
            var styleType = vec.vectorType;
            return styles[styleType];
        };

        var maxFeatures = function(vec) {
            return vec.maxFeatures !== 'ALL' ? '%26maxFeatures%3D' + vec.maxFeatures : '';
            //return vec.maxFeatures !== 'ALL' ? '%26maxFeatures%3D' + '100' : '';
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
                            $.notify("Sorry\nThere was an unexpected error thrown by the server3: " + response.getElementsByTagName("ows:ExceptionText")[0].textContent, "error");
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
                        $.notify("Sorry\nThere was an unexpected error thrown by the server4: " + e.statusText, "error");
                        gisportal.validFilter = false;
                        gisportal.indicatorsPanel.removeFromPanel($vector.id);
                     }
                });

            };
        };


        if (this.serviceType === 'WFS') {

            gisportal.originalVectorInfo = this;
            var sourceVector = new ol.source.Vector({
                loader: buildLoader(vec, sourceVector),
                strategy: ol.loadingstrategy.bbox,
            });
            console.log("this is the loader after the build loader is called 2", sourceVector);
            var layerVector = new ol.layer.Vector({
                source: sourceVector
            });
            //var source = layerVector.getSource();
            vec.sourceVector = sourceVector;
            vec.layerVector = layerVector;

            console.log("sourceVector && layerVector 2", sourceVector, layerVector);

            this.sourceVector = sourceVector;
            this.layerVector = layerVector;

            sourceVector.on('change', function(layer){
                console.log("this is vec", vec, layer);
                var source = layer.target;
                //source.refresh({force:true});
                //source.updateParams({"time": Date.now()});
                //layer.clear();
                var features = source.getFeatures();

                //adding list of properties
                if(source.getState() === 'ready'){
                    console.log("sourceVector && layerVector 2", sourceVector, layerVector, layer.target);
                    console.log(sourceVector);
                    console.log("this is vec", vec, layer);
                    
                    console.log(source);
                    console.log("source.getState() === 'ready'", features);

                    console.log("WFS layer", layer);
                    //vec.setVisibility(true);


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

                    vec.layerFeatures = features;

                    if(features !== undefined && features.length > 0 && !vec.addedElements) { //check if there is anything returned for that search
                        console.log("adding the UI elements");
                        addUIElements(features);

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
                    //vec.setVisibility(true);
                    //source.removeFeatures(features);
                    //layerVector.getSource().removeFeature(features[0]);
                    //layerVector.setVisible(false);
                    //layerVector.setVisible(true);
                    //source.clear();
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
