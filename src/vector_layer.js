
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
    ////console.log("creating vector layer");
    ////console.log(options);
    var vector = this;

    var defaults = {
        serviceType: null, // currently either SOS or WFS
        endpoint: null, // service enpoint URL
        dataType: null, // one of (point|polygon|line)
        exBoundingBox: null,
        boundingBox: null, // bounding box of layer
        providerTag: null, //short provider name
        serviceVersion: null, // version of OGC service
        variableName: null, // the WFS variable name
        srsName: 'EPSG:4326', // SRS for teh vector layer
        defaultStyle: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 255, 1.0)',
                width: 2
            })
        }),
        defaultProperty: null,
        defaultProperties : []
    };


    $.extend(true, this, defaults, options);

    this.selected = false;

    //this.styles = [];

    this.openlayers = {};

    this.metadataQueue = [];
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
        if (this.openlayers['anID']) this.openlayers['anID'].setVisible(visibility);
        this.isVisible = visibility;
    };

    this.init = function(options, layer) {
        ////console.log('initialiseing"');
        map.addLayer(layer.OLLayer)
        this.select();
        this.getMetadata();
        //gisportal.indicatorsPanel.selectTab( this.id, 'details' );
        ////console.log('+=+++++++++++++++++++++++++');
        ////console.log(layer.OLLayer.getSource().getFeatures());

    };

    this.select = function() {
        // Just in case it tries to add a duplicate
        if (_.indexOf(gisportal.selectedLayers, this.id) > -1) return false;
        var layer = this;

        layer.selected = true;

        // Adds the layer ID to the beginning of the gisportal.selectedLayers array
        gisportal.selectedLayers.unshift(layer.id);

        // If the layer has date-time data, use special select routine
        // that checks for valid data on the current date to decide if to show data
        if (layer.temporal) {
            ////console.log("inside setting timescale");
            // var currentDate = gisportal.timeline.getDate();

            // //Nope
            // //this.selectedDateTime = gisportal.timeline.selectedDate.toISOString();
            // layer.selectDateTimeLayer( gisportal.timeline.selectedDate );

            // // Now display the layer on the timeline
            // var startDate = new Date(layer.firstDate);
            // var endDate = new Date(layer.lastDate);
            // gisportal.timeline.addTimeBar(layer.name, layer.id, layer.name, startDate, endDate, layer.DTCache);   

            // // Update map date cache now a new temporal layer has been added
            // gisportal.refreshDateCache();

            // $('#viewDate').datepicker("option", "defaultDate", endDate);

        } else {
            layer.setVisibility(true);
        }
        if (typeof(layer.preventAutoZoom) == 'undefined' || !layer.preventAutoZoom) {
            //gisportal.zoomOverall();   
        }


        var index = _.findIndex(gisportal.selectedLayers, function(d) {
            return d === layer.id;
        });
        gisportal.setLayerIndex(layer, gisportal.selectedLayers.length - index);

    };

    this.unselect = function() {
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
            gisportal.zoomOverall();
        }
    };

    this.getMetadata = function() {
        var layer = this;
        //gisportal.indicatorsPanel.vectorStyleTab(layer.id);

        gisportal.layers[layer.id].metadataComplete = true;
        layer.metadataComplete = true;
        //      ////console.log("in metadat");
        //        ////console.table(gisportal.layers[layer.id]);
        _.each(gisportal.layers[layer.id].metadataQueue, function(d) {
            d();
            delete d;
        });
        //gisportal.indicatorsPanel.selectTab( layer.id, "details" );

    };

  this.styleUIBuilt = false;
  
  this.setStyleUI = function(source,prop)  {
  
      ////console.log("******************************");
      ////console.log(prop);
      if(!prop){

      }
      else {
      var _colour;
      if(this.currentColour.length>0){
        _colour = this.currentColour;
      }
      else{
          for(colour in gisportal.vectorStyles.startingColours) {
            if(gisportal.vectorStyles.coloursInUse.indexOf(colour)==-1){
                _colour = colour;
                this.currentColour = colour;
                gisportal.vectorStyles.coloursInUse.push(colour);
                break;
            }
          }
      } 
      var opts = this.createStyleFromProp(source,prop,_colour)
      if(this.defaultProperties.length > 0){
        opts['defaultProps'] = true;
        opts['defaultProperties'] = this.defaultProperties;
      }
      gisportal.vectorStyles.cache[this.id+"__"+prop] = opts;
      var renderedStyleUI = gisportal.templates['vector-style-ui'](opts);
      $('[data-id="' + this.id + '"] .dimensions-tab .vector-style-container').html(renderedStyleUI);
      this.styleUIBuilt = true;
      }
   }; 
  
// gisportal.layers['rsg_MMO_Fish_Shellfish_Cages_A'].setStyleUI(gisportal.layers['rsg_MMO_Fish_Shellfish_Cages_A'].OLLayer.getSource(), 'CATMFA')
  this.createStyleFromProp = function(source,prop,colour){
      var features = source.getFeatures();
      var possibleOptions = [];
      var x = 0;
      var featureCount = features.length;
      ////console.log(featureCount);
      for(x;x<featureCount-1;x++) {
        var props = features[x].getProperties();
        //////console.log(props);
        if(!_.contains(possibleOptions, props[prop])){
            ////console.log("adding property value");
            ////console.log(props[this.defaultProperty]);
            possibleOptions.push( props[prop]);
        }
      }
      ////console.log(possibleOptions);

      var colorPalette = gisportal.vectorStyles.createPalette(colour, possibleOptions.length);
      ////console.log(colorPalette);
      var legend = [];
      var legend_obj = {};
      var y = 0;
      for(y;y<possibleOptions.length  ; y++){
        legend.push({'option':possibleOptions[y],'colour':colorPalette[y]});
        legend_obj[possibleOptions[y]] = colorPalette[y];
      }
      ////console.log(legend);
      var x = 0;
      for(x;x<featureCount;x++) {
        ////console.log("setting style for feature");
        features[x].setStyle(
            new ol.style.Style({
                fill : new ol.style.Fill({
                    color: legend_obj[features[x].getProperties()[prop]]
                })
            })
        );
      }

      opts = {};
      opts['currentProperty'] = prop ;
      opts['possibleOptions'] = possibleOptions;
      opts['legend'] = legend;
      opts['id'] = this.id;

      return opts;
  }

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
        var fillColour = "rgba(0,0,255,1)";
        var styles = {
            "POINT": new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 2,
                    fill: new ol.style.Fill({
                        color: 'rgba(0,0,255,0.5)'
                    }),
                    stroke: new ol.style.Stroke({
                        width: 0.5,
                        color: 'rgba(255,0,0,1)'
                    })
                })
            }),
            "POLYGON": gisportal.vectorStyles.defaultPoly
        };
        createStyle = function(vec,source) {
            ////console.log("#############################");

            if (vec.styles) {
                ////console.log(vec.styles);
                ////console.log(vec.styleParam)
            }
            var styleType = vec.vectorType;
            return styles[styleType];

            // use new style library here
            // then in setStyleUI take info from here to build ui
            // for catagories just use fill for default

        };

        var maxFeatures = function(vec) {
            ////console.log('testing maxFeatures');
            ////console.log(vec.maxFeatures);
            ////console.log(vec.maxFeatures !== 'ALL' ? '%26maxFeatures%3D' + vec.maxFeatures : '');
            return vec.maxFeatures !== 'ALL' ? '%26maxFeatures%3D' + vec.maxFeatures : '';
        };

        var vec = this;

        var loadFeatures = function(response) {
            var wfsFormat = new ol.format.WFS();
            sourceVector.addFeatures(wfsFormat.readFeatures(response));
            if(!this.styleUIBuilt){
                setup_style_ui(sourceVector,vec);
            }
        };

        var setup_style_ui = function(source) {
          vec.setStyleUI(source,vec.defaultProperty);
          //////console.table(source.getFeatures()[0].getProperties());
          //////console.log('[data-id="' + id + '"] .js-tab-dimensions');
        }
        var buildLoader = function($vector, $source) {
            return function(extent, resolution, projection) {
                ////console.log('inside loader');
                vectorSource = $source;
                ////console.log(vectorSource);
                ////console.log($source);
                var url = $vector.endpoint +
                    '%3Fservice%3DWFS' +
                    maxFeatures($vector) +
                    '%26version%3D1.1.0' +
                    '%26request%3DGetFeature' +
                    '%26typename%3D' + $vector.variableName +
                    '%26srs%3D' + $vector.srsName +
                    '%26bbox%3D' + extent + ',EPSG:4326';

                $.ajax({
                    url: url
                })
                    .done(loadFeatures);
            };
        };


        if (this.serviceType === 'WFS') {

            ////console.log("================================");

            var sourceVector = new ol.source.Vector({
                loader: buildLoader(vec, sourceVector),
                strategy: ol.loadingstrategy.bbox,
            });


            var layerVector = new ol.layer.Vector({

                source: sourceVector,
                style: createStyle(vec,sourceVector)


            });


            vector.OLLayer = layerVector;
            return layerVector;
        }




        if (this.serviceType === 'SOS') {
            // TODO custom support for rendering SOS
        }


    };

    this.addOLLayer = function(layer, id) {
        map.addLayer(layer);
        console.log('adding and redoing ui');
        if(!this.styleUIBuilt){
            this.setStyleUI(layer.getSource(),layer.defaultProperty);

        }
        gisportal.vectorLayerCount++;
    };

    this.removeOLLayer = function(layer, id) {
        map.removeLayer(layer);
        console.log("removing ui flag");
        this.styleUIBuilt = false;

        gisportal.vectorLayerCount--;
        gisportal.vectorStyles.coloursInUse = _.without(gisportal.vectorStyles.coloursInUse,this.currentColour)

    };

    this.loadFeatures = function(reponse) {
        ////console.log("attempting to load features into");
        formatWFS = ol.format.WFS();
        var features = formatWFS.readFeatures(response);
        for (var i = 0; i < features.length; i++) {
            features[i].getGeometry().applyTransform(function(coords, coords2, stride) {
                for (var j = 0; j < coords.length; j += stride) {
                    var y = coords[j];
                    var x = coords[j + 1];
                    coords[j] = x;
                    coords[j + 1] = y;
                }
            });
        }
        this.sourcevector.addFeatures(features);
    };

    return this;

};

gisportal.getVectorLayerData = function(layer) {
    gisportal.layers[id].init(options, layer)

};


gisportal.addVectorLayers = function(layers) {
    ////console.log(layers);
};

gisportal.vectorSelectionTest = function(id, tabname){

var layers = map.getLayers();
    var found = false;

layers.forEach(function(f){
    console.log("testing layer");
    console.log(f);
    if(f instanceof ol.layer.Vector){
        if (f.getSource().getFeatures().length > 0) {
        console.log("adding vector select button")
        //gisportal.indicatorsPanel.vectorSelectSwitch(id, tabname)
        found = true;
    }
    }
    else {
        console.log("skipping as not vector");
    }
    
})

if(found){
        $('.js-draw-select-polygon').removeClass('hidden');
    }
    else {
        $('.js-draw-select-polygon').addClass('hidden');
    }

};