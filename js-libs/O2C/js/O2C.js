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
         
         //var onResize = function() {
         //   var width = this.canvas.clientWidth;
         //   var height = this.canvas.clientHeight;
   
         //   if (this.canvas.width === width && this.canvas.height === height) {
         //      return;
         //   }

         //   this.canvas.width = width;
         //   this.canvas.height = height;
         //   this.scene.getCamera().frustum.aspectRatio = width / height;
         //};
         //window.addEventListener('resize', onResize, false);
         //onResize();
         
         this.maxExtent = this.getMaxExtent();
         this.scene.getCamera().map = this;
      },
      
      addLayer: function(layer) {
         if (layer instanceof OpenLayers.Layer.Vector) { //TODO actually implement this correctly
            //this.baseLayer = layer; // gets rid of null pointers TODO don't do this
            //layer.renderer = new OpenLayers.Renderer.GlobeRenderer(this);
            //OpenLayers.Map.prototype.addLayer.apply(this, arguments);
         } 
         else if (layer instanceof OpenLayers.Layer.WMS) {
            var url = layer.url;
            var wmsLayer = layer.params.LAYERS;
            var opts = {
               url : url,
               layers : wmsLayer //'Countries'
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
            }
            else {
               var globeLayer = this.cb.getImageryLayers().addImageryProvider(imageryProvider);
               globeLayer.alpha = 1;
               globeLayer.show = layer.getVisibility();
            }
         } 
         
         //this.events.triggerEvent("addlayer", {layer: layer});
         console.log("addLayer Override");
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
         this.globe.addLayer(layer);
         OpenLayers.Map.prototype.addLayer.call(this, layer);    
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

    OpenLayers.Globe = OpenLayers.Class(OpenLayers.Map, {
        canvas: null,
        ellipsoid: null,
        scene: null,
        primitives: null,
        cb: null,
        proxyUrl: null,
        transitioner: null,
        showLabels:true,
        initialize: function (div, options) {
            options = options || {};
            this.div = OpenLayers.Util.getElement(div);
            var canvasId = "glCanvas";
            var is2d = false;
            if(options.canvasId){
                canvasId = options.canvasId;
            }
            if(options.is2d){
                is2d = options.is2d;
            }
            if(options.proxy){
                this.proxyUrl = options.proxy;
            }
            this.canvas = document.getElementById(canvasId);
            if(!this.canvas) {
                this.canvas = document.createElement("canvas");
                this.canvas.id = canvasId;
                this.canvas.style.position = "absolute";
                this.canvas.style.top = this.div.offsetTop +"px";
                this.canvas.style.left = this.div.offsetLeft + "px";
                this.canvas.height = this.div.offsetHeight;
                this.canvas.width = this.div.offsetWidth;
                this.canvas.style.zIndex = this.Z_INDEX_BASE["BaseLayer"];
                this.div.appendChild(this.canvas);
            }
            this.ellipsoid = Cesium.Ellipsoid.WGS84;
            this.scene = new Cesium.Scene(this.canvas);
            this.primitives = this.scene.getPrimitives();
            this.cb = new Cesium.CentralBody(this.ellipsoid);
            var bing = new Cesium.BingMapsImageryProvider({
                server : "dev.virtualearth.net",
                mapStyle : Cesium.BingMapsStyle.AERIAL
            });
            this.cb.getImageryLayers().addImageryProvider(bing); // had to add this back in due to minTileDistance is not a function errors
            this.cb.nightImageSource = "img/land_ocean_ice_lights_2048.jpg";
            this.cb.specularMapSource = "img/earthspec1k.jpg";
            if (this.scene.getContext().getMaximumTextureSize() > 2048) {
                this.cb.cloudsMapSource = "img/earthcloudmaptrans.jpg";
                this.cb.bumpMapSource = "img/earthbump1k.jpg";
            }
            this.cb.showSkyAtmosphere = true;
            this.cb.showGroundAtmosphere = true;
            this.primitives.setCentralBody(this.cb);

            this.scene.getCamera().getControllers().addCentralBody();

            this.transitioner = new Cesium.SceneTransitioner(this.scene, this.ellipsoid);

            if(is2d){
                this.do2DView();
            }
            
            var that = this;
            this.scene.setAnimation(function() {
               
               var camera = that.scene.getCamera();
               var cameraPosition = new Cesium.Cartesian4(camera.position.x, camera.position.y, camera.position.z, 1.0);
               //var v = Cesium.Cartesian3.fromCartesian4(camera.transform.multiplyByVector(cameraPosition));
               that.scene.setSunPosition(Cesium.computeSunPosition(new Cesium.JulianDate()));

               //  In case of canvas resize
               //that.canvas.width = that.div.offsetWidth;
               //that.canvas.height = that.div.offsetHeight;
               //that.size = that.getCurrentSize();
               //that.scene.getCamera().frustum.aspectRatio = that.canvas.clientWidth / that.canvas.clientHeight;

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

            ///////////////////////////////////////////////////////////////////////////
            // Example keyboard and Mouse handlers

            var handler = new Cesium.EventHandler(this.canvas);

            handler.setMouseAction(function(movement) {
               if (typeof this.onObjectMousedOver !== 'undefined') {
                   // Don't fire multiple times for the same object as the mouse travels around the screen.
                   var mousedOverObject = this.scene.pick(movement.endPosition);
                   if (this.mousedOverObject !== mousedOverObject) {
                       this.mousedOverObject = mousedOverObject;
                       this.onObjectMousedOver(mousedOverObject);
                   }
               }
               if (typeof this.leftDown !== 'undefined' && this.leftDown && typeof this.onLeftDrag !== 'undefined') {
                   this.onLeftDrag(movement);
               } else if (typeof this.rightDown !== 'undefined' && this.rightDown && typeof this.onZoom !== 'undefined') {
                   this.onZoom(movement);
               }
            }, Cesium.MouseEventType.MOVE);

            //document.oncontextmenu = function() {
            //    return false;
            //};

            OpenLayers.Map.prototype.initialize.apply(this, arguments);
            // relocate canvas to viewport div now that superclass is initialized
            this.div.removeChild(this.canvas);
            this.viewPortDiv.appendChild(this.canvas);
            this.canvas.style.top = "0px";
            this.canvas.style.left = "0px";
            this.layerContainerDiv.style.display = "none"; // layercontainerdiv is useless now and was blocking mouse events
            this.maxExtent = this.getMaxExtent();
            this.scene.getCamera().map = this;
        },

        _setBaseLayer: function(layer){
            var opts = {fromSetLayer: true};
            this.addLayer(layer, opts);
        },

        render: function(div){
            this.div = OpenLayers.Util.getElement(div);
            this.canvas.parentNode.removeChild(this.canvas);
            this.div.appendChild(this.canvas);
        },



        getOLBaseLayer: function() {
            //return this.cb.dayTileProvider.olLayer.clone();
        },

        getLonLatFromPixel: function (pos) {
            if(pos) {
               var p = this.scene.pickEllipsoid(new Cesium.Cartesian2(pos.x, pos.y), this.ellipsoid);
               if (p) {
                  if (this.scene.mode !== Cesium.SceneMode.SCENE3D) {
                     p = this.scene.scene2D.projection.project(this.ellipsoid.cartesianToCartographic(p));
                     p = new Cartesian3(p.z, p.x, p.y);
                  }
                  var d = this.ellipsoid.cartesianToCartographic(p);
                  var px = Cesium.Transforms.pointToWindowCoordinates(this.scene.getUniformState().getViewProjection(), this.scene.getUniformState().getViewportTransformation(), this.ellipsoid.cartographicToCartesian(d));
                  px.y = this.canvas.clientHeight - px.y;
               } else {
                  console.log("position is null");
               }
            }
            return  new OpenLayers.LonLat(-1000, -1000); // avoid null pointers
        },
        
        getLonLatFromViewPortPx: function (viewPortPx) {
            return this.getLonLatFromPixel(viewPortPx);
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

        moveByPx: function(dx, dy) {},

        pan: function(dx, dy, options) {
            var movement = {};
            movement.startPosition = new Cesium.Cartesian2(0,0);
            movement.endPosition = new Cesium.Cartesian2(dx,dy);
            movement.motion = new Cesium.Cartesian2(0,0);
            this.scene.getCamera().getControllers().get(0)._spin(movement);
        },

        zoomIn: function() {
            // scroll mouse wheel twice
            var scrollwheel = this.scene.getCamera().getControllers().get(0)._zoomWheel._eventHandler._mouseEvents["WHEEL"];
            scrollwheel(360);
            scrollwheel(360);
        },

        zoomOut: function() {
            // scroll mouse wheel twice
            var scrollwheel = this.scene.getCamera().getControllers().get(0)._zoomWheel._eventHandler._mouseEvents["WHEEL"];
            scrollwheel(-360);
            scrollwheel(-360);
        },

        zoomToMaxExtent: function(options) {
            var camera = this.scene.getCamera();
            var cameraPosition = Cesium.Math.toDegrees(this.ellipsoid.cartesianToCartographic(camera.position));
            var lat = cameraPosition.latitude;
            var lon = cameraPosition.longitude;

            var maxExtent = this.getMaxExtent();

            var bounds = new OpenLayers.Bounds();
            bounds.top = lat + maxExtent.top;
            bounds.bottom = lat + maxExtent.bottom;

            var rlon = lon + maxExtent.right;
            var llon = lon + maxExtent.left;
            if(llon < -180) {
              llon += 360;
            }
            if(rlon > 180) {
              rlon -= 360;
            }
            bounds.right = rlon;
            bounds.left = llon;

            this.zoomToExtent(bounds);
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

        moveTo: function(lonlat, zoom, options) {
            var alt = 4000000;
            if (zoom>0){
                alt/=zoom;
            } else {
                alt = 6000000;
            }
            this.scene.getCamera().getControllers().addFlight({
                destination: this.ellipsoid.cartographicToCartesian(new Cesium.Cartographic.fromDegrees(lonlat.lon, lonlat.lat, alt)),
                duration: 0
            });
        },
        
        getZoom: function () {
            var alt = this.ellipsoid.cartesianToCartographic(this.scene.getCamera().position).height;
            console.log(alt); 
            if (alt>6000000){
                return 0;
            } else if (alt>4000000){
                return 1;
            }
            return Math.round(4000000/alt);
        },
        
        updateSize: function() {/* No longer needed because this is handled in the render function*/},
        
        getResolution: function () {
            var xpix = this.canvas.width/2;
            var ypix = this.canvas.height/2;
            var coord1 = this.getLonLatFromPixel({x:xpix,y:ypix});
            var coord2 = this.getLonLatFromPixel({x:xpix+1,y:ypix+1});
            var dx = coord2.lon-coord1.lon;
            var dy = coord2.lat-coord1.lat;
            return Math.sqrt((dx*dx)+(dy*dy));
        },
        getScale: function () {
            return OpenLayers.Util.getScaleFromResolution(this.getResolution(), 'dd');
        },
        
        getViewPortPxFromLonLat: function (lonlat) {
            var px = Cesium.Transforms.pointToWindowCoordinates(this.scene.getUniformState().getModelViewProjection(),this.scene.getUniformState().getViewportTransformation(),this.ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(new Cesium.Cartographic2(lonlat.lon, lonlat.lat))));
            return new OpenLayers.Pixel(px.x,this.canvas.height-px.y);  
        },
        
        getViewPortPxFromLayerPx:function(layerPx) {
            return layerPx;
        },
        
        getLayerPxFromViewPortPx:function(viewPortPx) {
            return viewPortPx;
        },
        
        addPopup: function(popup, exclusive) {
            if (exclusive) {
                //remove all other popups from screen
                for (var i = this.popups.length - 1; i >= 0; --i) {
                    this.removePopup(this.popups[i]);
                }
            }
    
            popup.map = this;
            popup.panMapIfOutOfView=false;
            this.popups.push(popup);
            var popupDiv = popup.draw();
            if (popupDiv) {
                popupDiv.style.zIndex = this.Z_INDEX_BASE['Popup'] +
                                        this.popups.length;
                //popupDiv.style.width="250px";
                this.viewPortDiv.appendChild(popupDiv);
            }
        },
        
        removePopup: function(popup) {
            if (popup.blocks){
                popup.destroy();
            }
            OpenLayers.Util.removeItem(this.popups, popup);
            if (popup.div) {
                try { this.viewPortDiv.removeChild(popup.div); }
                catch (e) { } // Popups sometimes apparently get disconnected
                          // from the layerContainerDiv, and cause complaints.
            }
            delete popup;
        },
        
        getCenter: function () {
            return this.getLonLatFromPixel({x:this.canvas.width/2,y:this.canvas.height/2});
        },
        
        getProjectionObject: function() {
            return new OpenLayers.Projection("EPSG:4326");
        },

        activateNavigation: function(){
            if (this.scene.getCamera().getControllers().getLength() > 0) {
                return false;
            }
            if (this.scene){
                if(this.scene.mode.toString() == "SCENE2D") {
                    this.scene.getCamera().getControllers().add2D(this.scene.scene2D.projection);
                } else if(this.scene.mode.toString() == "SCENE3D") {
                    var spindle = this.scene.getCamera().getControllers().addSpindle();
                    this.scene.getCamera().getControllers().addFreeLook();
                    spindle.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
                }
            }
        },

        deactivateNavigation: function(){
            if (this.scene){
                this.scene.getCamera().getControllers().removeAll();
            }
        },
        
        do2DView: function(){
           
            //this.cb.showSkyAtmosphere = false;
            //this.cb.showGroundAtmosphere = false;
            //this.transitioner.morphTo2D(); // TODO using to2D breaks image tile loading (Cesium issue #61)
            //this.cb.affectedByLighting = false;
        },
        
        doColumbusView: function(){
            this.cb.showSkyAtmosphere = false;
            this.cb.showGroundAtmosphere = false;
            this.transitioner.morphToColumbusView();
            this.cb.affectedByLighting = false;
        },

        do3DView: function(){
            this.cb.affectedByLighting = true;
            this.transitioner.to3D(); // TODO change to morphTo3D when agi works out the bugs

            //Use our own CameraSpindleControl and CameraFreeLookControl instead of the
            //CameraCentralBodyControl, since it does not currently allow access to its
            //CameraSpindleControl to constrain the Z axis.
            if (this.scene){
                this.scene.getCamera().getControllers().removeAll();
            }
            this.activateNavigation();
        },

        CLASS_NAME: "OpenLayers.Globe"
    });
}