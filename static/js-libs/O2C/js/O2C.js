/**
 *@module O2C 
 */

/**
 * 
 */
if (typeof OpenLayers !== 'undefined') {  
   OpenLayers.Map.prototype.globe = {
      is3D: true,
      isColumbus: false,
      canvasID: null,
      $canvas: null,
      canvas: null,
      $mapdiv: null,
      ellipsoid: null,
      scene: null,
      primitives: null,
      cb: null,
      proxyUrl: null,
      transitioner: null,
      showLabels: true,
      hasBaseLayer: false,
      currentBaseLayer: null,
      baseLayers: [],
      initialise: function (map, div, options) {
         options = options || {};
         this.canvasID = div + "_canvas";
         this.$mapdiv = $("#" + div);
         
         var is2d = false;
         if(options.canvasID){
            this.canvasID = options.canvasID;
         }
         if(options.is2d){
            is2d = options.is2d;
         }
         if(options.proxy){
            this.proxyUrl = options.proxy;
         }        
         var div1 = $('<div/>').attr("class", "fullsize");
         this.$canvas = $("<canvas/>").attr({
            "id": this.canvasID,
            "class": "fullsize",
         });
         this.canvas = this.$canvas.get(0);
         div1.append(this.$canvas);  
         this.$mapdiv.append(div1);
         
         this.ellipsoid = Cesium.Ellipsoid.WGS84;
         this.scene = new Cesium.Scene(this.canvas);
         this.primitives = this.scene.getPrimitives();
         this.cb = new Cesium.CentralBody(this.ellipsoid);
         
         //var bing = new Cesium.BingMapsImageryProvider({
            //server : "dev.virtualearth.net",
            //mapStyle : Cesium.BingMapsStyle.AERIAL
         //});
         
         //this.cb.getImageryLayers().addImageryProvider(bing);
         this.cb.nightImageSource = "img/land_ocean_ice_lights_2048.jpg";
         this.cb.specularMapSource = "img/earthspec1k.jpg";
         if (this.scene.getContext().getMaximumTextureSize() > 2048) {
             this.cb.cloudsMapSource = "img/earthcloudmaptrans.jpg";
             this.cb.bumpMapSource = "img/earthbump1k.jpg";
         }
         this.cb.showSkyAtmosphere = false;
         this.cb.showGroundAtmosphere = false;
         this.primitives.setCentralBody(this.cb);
         
         this.scene.getCamera().getControllers().addCentralBody();
         
         this.transitioner = new Cesium.SceneTransitioner(this.scene, this.ellipsoid);
         
         if(is2d) {
            map.show2D();
         }
         else {
            map.show3D();
         }
         
         var that = this;
         this.scene.setAnimation(function() {           
            var camera = that.scene.getCamera();
            var cameraPosition = new Cesium.Cartesian4(camera.position.x, camera.position.y, camera.position.z, 1.0);
            //var v = Cesium.Cartesian3.fromCartesian4(camera.transform.multiplyByVector(cameraPosition));
            that.scene.setSunPosition(Cesium.computeSunPosition(new Cesium.JulianDate()));
            
            // Add code here to update primitives based on changes to animation time, camera parameters, etc.
         });
         
         (function tick() {
            try {
               that.scene.render();
            } catch (e) {
               // Live editing can create invalid states, e.g., a conic sensor with inner half-angle
               // greater than outer half-angle, which cause exceptions.  We swallow the exceptions
               // to avoid losing the animation frame.
               console.log(e.message);
               var stack = e.stack;
               if (stack){
                  console.log(stack);
               }
            }         
            Cesium.requestAnimationFrame(tick);
         }());
         
         var onResize = function() {
            var width = that.$mapdiv.width();
            var height = that.$mapdiv.height();

            if (that.canvas.width === width && that.canvas.height === height) {
               return;
            }

            that.canvas.width = width;
            that.canvas.height = height;
            that.scene.getCamera().frustum.aspectRatio = width / height;
         };
         window.addEventListener('resize', onResize, false);
         onResize();
         
         // Prevent right-click from opening a context menu.
         this.canvas.oncontextmenu = function() {
            return false;
         };
         
         this.maxExtent = this.getMaxExtent();
         this.scene.getCamera().map = this;
      },
      
      addLayer: function(layer) {
         if (layer instanceof OpenLayers.Layer.Vector) { 
            // TODO actually implement this correctly
            //this.baseLayer = layer; // gets rid of null pointers TODO don't do this
            //layer.renderer = new OpenLayers.Renderer.GlobeRenderer(this);
            //OpenLayers.Map.prototype.addLayer.apply(this, arguments);
         } 
         else if (layer instanceof OpenLayers.Layer.WMS) {
            var url = layer.url;
            var wmsLayer = layer.params.LAYERS;
            var opts = {
               url : url,
               layers : wmsLayer
            };
            if(this.proxyUrl) {
               opts.proxy = new Cesium.DefaultProxy(this.proxyUrl);
            }
            opts.parameters = layer.params || {};
            
            var imageryProvider = new Cesium.WebMapServiceImageryProvider(opts);
                     
            if(layer.isBaseLayer) {
               var globeLayer = new Cesium.ImageryLayer(imageryProvider);
               globeLayer.alpha = 1;
               globeLayer.show = true;
               
               if(!this.hasBaseLayer) {
                  this.hasBaseLayer = true;
                  this.currentBaseLayer = globeLayer;
                  this.cb.getImageryLayers().add(globeLayer, 0);
               }
               else {
                  this.baseLayers.push(globeLayer);
               }
               
               return globeLayer;  
            }
            else {
               var globeLayer = this.cb.getImageryLayers().addImageryProvider(imageryProvider);
               globeLayer.alpha = 1;
               globeLayer.show = layer.getVisibility();
               return globeLayer;
            }
         }
      },
      
      removeLayer: function(layer) {
         var il = this.cb.getImageryLayers();
         for(var i = 0, len = il.getLength(); i < len; i++) {
            var globeLayer = il.get(i);
            if(globeLayer.getImageryProvider() instanceof Cesium.WebMapServiceImageryProvider) {
               if(globeLayer.getImageryProvider().getUrl() == layer.url) {
                  this.cb.getImageryLayers().remove(globeLayer, false);
                  return;
               }
            } 
         }   
      },
      
      pan: function(dx, dy, options) {
         var movement = {};
         movement.startPosition = new Cesium.Cartesian2(0,0);
         movement.endPosition = new Cesium.Cartesian2(dx,dy);
         movement.motion = new Cesium.Cartesian2(0,0);
         this.scene.getCamera().getControllers().get(0)._spin(movement);
      },
      
      getMaxExtent: function(){
         return new OpenLayers.Bounds(-45, -45, 45, 45); // TODO this will be wider if viewing in 2D
      },

      getExtent: function () {
         var center = this.getLonLatFromPixel({x:this.canvas.width/2,y:this.canvas.height/2});
         var topCenter = this.getLonLatFromPixel({x:this.canvas.width/2,y:0});
         var rightCenter = this.getLonLatFromPixel({x:this.canvas.width,y:this.canvas.height/2});
         var bottomCenter = this.getLonLatFromPixel({x:this.canvas.width/2,y:this.canvas.height});
         var leftCenter = this.getLonLatFromPixel({x:0,y:this.canvas.height/2});
         if (leftCenter.lon == -1000){ // left and right are bad
            leftCenter = {lat:center.lat, lon:center.lon-45};
            rightCenter = {lat:center.lat, lon:center.lon+45};
         }
         if (topCenter.lat == -1000){ // top and bottom are bad
            topCenter = {lat:center.lat+45, lon:center.lon};
            bottomCenter = {lat:center.lat-45, lon:center.lon};
         }
         return new OpenLayers.Bounds(leftCenter.lon,bottomCenter.lat,rightCenter.lon,topCenter.lat);
      },
      
      zoomIn: function() {
         
      },
      
      zoomOut: function() {
         
      },
      
      zoomToMaxExtent: function(options) {
         
      },
      
      zoomToExtent: function(bounds, closest) {
         if (!(bounds instanceof OpenLayers.Bounds)) {
            bounds = new OpenLayers.Bounds(bounds);
         }
         var west = Cesium.Math.toRadians(bounds.left),
            south = Cesium.Math.toRadians(bounds.bottom),
            east = Cesium.Math.toRadians(bounds.right),
            north = Cesium.Math.toRadians(bounds.top);

         this.scene.getCamera().viewExtent(new Cesium.Extent(west, south, east, north), this.ellipsoid);
      },
      
      setBaseLayer: function(layer) {
         var addedLayer = null, addedLayerIndex = null;
         if(this.currentBaseLayer != null && this.currentBaseLayer.getImageryProvider().getUrl() != layer.url) {
            for(var i = 0, len = this.baseLayers.length; i < len; i++) {
               if(layer.url == this.baseLayers[i].getImageryProvider().getUrl()) {
                  var globeLayer = this.cb.getImageryLayers().add(this.baseLayers[i], 0);
                  addedLayer = this.baseLayers[i];
                  addedLayerIndex = i;
               }
            }
            this.baseLayers.splice(addedLayerIndex, 1);
            
            var globeLayer = this.cb.getImageryLayers().remove(this.currentBaseLayer, false);
            this.baseLayers.push(this.currentBaseLayer);
            this.currentBaseLayer = addedLayer;
         }
      },
   };
    
   OpenLayers.Map.prototype.setupGlobe = function(map, div, options) {
      this.destroy = function() {
         OpenLayers.Map.prototype.destroy.call(this);
         $(this.globe.canvas).remove();
      };
      
      this.addLayer = function(layer) {      
         layer.setVisibility = function(visibility) {
            if(typeof this.globeLayer !== 'undefined') {
               this.globeLayer.show = visibility;
               //console.log(layer);
               //console.log(visibility);
            }
            OpenLayers.Layer.prototype.setVisibility.call(layer, visibility);
         };    
            
         var globeLayer = this.globe.addLayer(layer);
         layer.globeLayer = globeLayer;
         OpenLayers.Map.prototype.addLayer.call(this, layer);   
      };
      
      this.removeLayer = function(layer) {
         this.globe.removeLayer(layer);
         OpenLayers.Map.prototype.removeLayer.call(this, layer);
      };
      
      this.pan = function(dx, dy, options) {
         if(this.is3D) {
            this.globe.pan(dx, dy, options);
         }
         else {
            OpenLayers.Map.prototype.pan.call(this, dx, dy, options);
         }
      };
      
      this.zoomIn = function() {
         if(this.is3D) {
            this.globe.zoomIn();
         }
         else {
            OpenLayers.Map.prototype.zoomIn.call(this);
         }
      };
      
      this.zoomOut = function() {
         if(this.is3D) {
            this.globe.zoomOut();
         }
         else {
            OpenLayers.Map.prototype.zoomOut.call(this);
         }
      };
      
      this.zoomToMaxExtent = function(options) {
         if(this.is3D) {
            this.globe.zoomToMaxExtent(options);
         }
         else {
            OpenLayers.Map.prototype.zoomToMaxExtent.call(this, options);
         }
      };
      
      this.zoomToExtent = function(bounds, closest) {
         if(this.is3D) {
            this.globe.zoomToExtent(bounds, closest);
         }
         else {
            OpenLayers.Map.prototype.zoomToExtent.call(this, bounds, closest);
         }
      };
      
      this.show3D = function() {
         this.globe.isColumbus = false;
         this.globe.is3D = true;
         
         $(this.viewPortDiv).hide();
         this.globe.$canvas.parent("div").show();
         
         if(this.globe.scene !== null) {        
            var extent = this.getExtent();
            if(extent !== null) {
               this.zoomToExtent(extent, false);
            }
            else {
               this.zoomToMaxExtent();
            }
            
            this.globe.cb.showSkyAtmosphere = false;
            this.globe.cb.showGroundAtmosphere = false;
            this.globe.cb.affectedByLighting = false;
            this.globe.transitioner.to3D(); // TODO change to morphTo3D when agi works out the bugs
         }
      };
      
      this.showColumbus = function() {
         this.globe.is3D = true;
         this.globe.isColumbus = true;
         
         $(this.viewPortDiv).hide();
         this.globe.$canvas.parent("div").show();
         
         if(this.globe.scene !== null) {
            var extent = this.getExtent();
            if(extent !== null) {
               this.zoomToExtent(extent, false);
            }
            else {
               this.zoomToMaxExtent();
            }
            
            this.globe.cb.showSkyAtmosphere = false;
            this.globe.cb.showGroundAtmosphere = false;
            this.globe.transitioner.morphToColumbusView();
            this.globe.cb.affectedByLighting = false; 
         }
      };
      
      this.show2D = function() {
         this.globe.isColumbus = false;
         this.globe.is3D = false;
         
         this.globe.$canvas.parent("div").hide();
         $(this.viewPortDiv).show();
      };
      
      this.setBaseLayer = function(layer) {
         this.globe.setBaseLayer(layer);
         OpenLayers.Map.prototype.setBaseLayer.call(this, layer);
      }
      
      this.globe.initialise(map, div, options);
            
      return this.globe
   }    
}