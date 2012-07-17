<!DOCTYPE HTML>
<html>
<!-- http://spyrestudios.com/demos/sliding-panel-left/ -->
<head>
<meta charset="utf-8">
<title>OpEc GIS Portal (jQuery + jQuery UI)</title>
<!-- Now for the styling -->
<!-- jQuery UI theming CSS -->
<link rel="stylesheet" type="text/css" href="js-libs/jquery-ui/css/black-tie/jquery-ui-1.8.21.custom.css" />
<!-- Default OpenLayers styling -->
<link rel="stylesheet" type="text/css" href="js-libs/OpenLayers/theme/default/style.css">
<!--<link rel="stylesheet" type="text/css" href="js-libs/OpenLayers/theme/default/google.css">-->
<!-- Default styling for web app plus overrides of OpenLayers and jQuery UI styles -->
<link rel="stylesheet" type="text/css" href="css/main.css" />
<!-- JavaScript libraries -->
<!-- Custom functions and extensions to exisiting JavaScript objects -->
<script type="text/javascript" src="custom.js"></script>
<!-- Latest jQuery from jQuery.com -->
<script type="text/javascript" src="js-libs/jquery/jquery-1.7.2.js"></script>
<!-- The latest jQuery UI from jqueryui.com -->
<script type="text/javascript" src="js-libs/OpenLayers/OpenLayers.js"></script>
<!--<script src="http://maps.google.com/maps/api/js?v=3.6&amp;sensor=false"></script>-->
<script type="text/javascript" src="js-libs/jquery-ui/js/jquery-ui-1.8.21.custom.min.js"></script>
<!-- http://forum.jquery.com/topic/expand-all-zones-for-an-accordion#14737000002919405 -->
<script type="text/javascript" src="js-libs/multiAccordion.js"></script>
<!-- Custom library of extensions and functions for OpenLayers Map and Layer objects -->
<script type="text/javascript" src="maplayers.js"></script>


<!-- Use custom PHP class to create some date caches for the required data layers
	 See wmsDateCache.php for details. -->
<?php
	require('wmsDateCache.php');
	// Ensure you put all the data layers in here that have date-ranged data
	$wmsURL="http://rsg.pml.ac.uk/ncWMS/wms?";
	$wmsGetCapabilites = $wmsURL."SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";
	$wmsDateCache = array(
		new wmsDateCache("MRCS_ECOVARS/no3","./json/WMSDateCache/no3_Dates.json",$wmsGetCapabilites),
		new wmsDateCache("MRCS_ECOVARS/po4","./json/WMSDateCache/po4_Dates.json",$wmsGetCapabilites),
		new wmsDateCache("MRCS_ECOVARS/chl","./json/WMSDateCache/chl_Dates.json",$wmsGetCapabilites),
		new wmsDateCache("MRCS_ECOVARS/zoop","./json/WMSDateCache/zoop_Dates.json",$wmsGetCapabilites),
		new wmsDateCache("MRCS_ECOVARS/o2o","./json/WMSDateCache/o2o_Dates.json",$wmsGetCapabilites),
		new wmsDateCache("MRCS_ECOVARS/si","./json/WMSDateCache/si_Dates.json",$wmsGetCapabilites),
		new wmsDateCache("WECOP/Z5c","./json/WMSDateCache/Z5c_Dates.json",$wmsGetCapabilites)
	);
	foreach ($wmsDateCache as $cache) {
		//echo(method_exists($cache,"createCache"));
		$cache->createCache();
	}
?>

<!-- Custom JavaScript -->
<!-- OpenLayers Map Code-->
<script type="text/javascript">
    /*
    ====================================================================================*/
    /*
    Initialise javascript global variables and objects
    */
    // The OpenLayers map object
    var map;
	
    /*
    Helper functions
    */

    // Predefined map coordinate systems
    /*	var googp = new OpenLayers.Projection("EPSG:900913");*/
    var lonlat = new OpenLayers.Projection("EPSG:4326");

    // Quick regions array in the format "Name",W,S,E,N
    var quickRegion = [
                		["European Seas", -23.44, 20.14, 39.88, 68.82],
                		["Adriatic", 11.83, 39.00, 20.67, 45.80],
                		["Baltic", 9.00, 51.08, 30.50, 67.62],
                		["Biscay", -7.10, 44.00, -0.60, 49.00],
                		["Black Sea", 27.30, 38.50, 42.00, 49.80],
                		["English Channel", -5.00, 46.67, 4.30, 53.83],
                		["Eastern Med.", 20.00, 29.35, 36.00, 41.65],
                		["North Sea", -4.50, 50.20, 8.90, 60.50],
                		["Western Med.", -6.00, 30.80, 16.50, 48.10],
                		["Mediterranean", -6.00, 29.35, 36.00, 48.10]
                	];
    // Define a proxy for the map to allow async javascript http protocol requests
    // This will always need changing when swapping between Windows and Linux
    //OpenLayers.ProxyHost = "xDomainProxy.ashx?url=";	// Windows only using ASP.NET (C#) handler
    OpenLayers.ProxyHost = 'Proxy.php?url='; // Linux or Windows using php proxy script
    //OpenLayers.ProxyHost = '/cgi-bin/proxy.cgi?url=';	// Linux using OpenLayers proxy
    /*
    ====================================================================================*/
    /*
    Start mapInit() - the main function for setting up the map
    plus its controls, layers, styling and events.
    */
    function mapInit() {
        map = new OpenLayers.Map(
                			'map', {
                			    projection: lonlat,
                			    displayProjection: lonlat,
                			    controls: []
                			})

        // Add GEBCO base layer
        var gebco = new OpenLayers.Layer.WMS(
			"GEBCO",
			"http://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?",
			{ layers: 'gebco_08_grid' }
		)
		map.addLayer(gebco);

        // Add Cubewerx layer
        var cube = new OpenLayers.Layer.WMS(
			'CubeWerx',
			'http://demo.cubewerx.com/demo/cubeserv/cubeserv.cgi?',
			{ layers: 'Foundation.GTOPO30' }
		)
        map.addLayer(cube);

        // Add NASA Landsat layer
        var landsat = new OpenLayers.Layer.WMS(
			'Landsat',
			'http://irs.gis-lab.info/?',
			{ layers: 'landsat' }
		)
        map.addLayer(landsat);

        // Add nitrate concentration layer
        var no3 = new OpenLayers.Layer.WMS(
			'Nitrate Concentration',
			'http://rsg.pml.ac.uk/ncWMS/wms?',
			{ layers: 'MRCS_ECOVARS/no3', transparent: true }
		);
		no3.createDateCache('./json/WMSDateCache/no3_Dates.json');
        no3.setVisibility(false);
		no3.temporal = true;
		no3.selected = false;
        map.addLayer(no3);

        // Add phosphate concentration layer
        var po4 = new OpenLayers.Layer.WMS(
			'Phosphate Concentration',
			'http://rsg.pml.ac.uk/ncWMS/wms?',
			{ layers: 'MRCS_ECOVARS/po4', transparent: true	}
		);
		po4.createDateCache('./json/WMSDateCache/po4_Dates.json');
        po4.setVisibility(false);
		po4.temporal = true;
		po4.selected = false;
        map.addLayer(po4);

        // Add a chlorophyl layer
        var chl = new OpenLayers.Layer.WMS(
			'Chlorophyl-a',
			'http://rsg.pml.ac.uk/ncWMS/wms?',
			{ layers: 'MRCS_ECOVARS/chl', transparent: true	}
		);
        chl.createDateCache('./json/WMSDateCache/chl_Dates.json');
        chl.setVisibility(false);
		chl.temporal = true;
		chl.selected = false;
        map.addLayer(chl);

        // Add a zooplankton layer
        var zoo = new OpenLayers.Layer.WMS(
			'Zooplankton Biomass',
			'http://rsg.pml.ac.uk/ncWMS/wms?',
			{ layers: 'MRCS_ECOVARS/zoop', transparent: true }
		);
        zoo.createDateCache('./json/WMSDateCache/zoop_Dates.json');
        zoo.setVisibility(false);
		zoo.temporal = true;
		zoo.selected = false;
        map.addLayer(zoo);

        // Add a silicate concentration layer
        var si = new OpenLayers.Layer.WMS(
			'Silicate concentration',
			'http://rsg.pml.ac.uk/ncWMS/wms?',
			{ layers: 'MRCS_ECOVARS/si', transparent: true }
		);
        si.createDateCache('./json/WMSDateCache/si_Dates.json');
        si.setVisibility(false);
		si.temporal = true;
		si.selected = false;
        map.addLayer(si);

        // Add dissolved oxygen layer
        var o2 = new OpenLayers.Layer.WMS(
			'Dissolved Oxygen',
			'http://rsg.pml.ac.uk/ncWMS/wms?',
			{ layers: 'MRCS_ECOVARS/o2o', transparent: true	}
		);
        o2.createDateCache('./json/WMSDateCache/o2o_Dates.json');
        o2.setVisibility(false);
		o2.temporal = true; 
		o2.selected = false;      
	    map.addLayer(o2);

        // Add micro-zooplankton oxygen layer
        var uZoo = new OpenLayers.Layer.WMS(
			'Micro-Zooplankton C',
			'http://rsg.pml.ac.uk/ncWMS/wms?',
			{ layers: 'WECOP/Z5c', transparent: true }
		);
        uZoo.createDateCache('./json/WMSDateCache/Z5c_Dates.json');
        uZoo.setVisibility(false);
		uZoo.temporal = true;
		uZoo.selected = false;
        map.addLayer(uZoo);
		
        // Add AMT cruise tracks 12-19 as GML Formatted Vector layer
        for(i = 12; i <= 19; i++) {
            // skip AMT18 as it isn't available
            if(i == 18) continue;
            // Style the AMT vector layers with different colours for each one
            var AMT_style = new OpenLayers.Style({
                'strokeColor': '${colour}'
            },
                			{
                			    context: {
                			        colour: function(feature) {
                			            switch(feature.layer.name) {
                			                case 'AMT12 Cruise Track':
                			                    return 'blue';
                			                    break;
                			                case 'AMT13 Cruise Track':
                			                    return 'aqua';
                			                    break;
                			                case 'AMT14 Cruise Track':
                			                    return 'lime';
                			                    break;
                			                case 'AMT15 Cruise Track':
                			                    return 'magenta';
                			                    break;
                			                case 'AMT16 Cruise Track':
                			                    return 'red';
                			                    break;
                			                case 'AMT17 Cruise Track':
                			                    return 'orange';
                			                    break;
                			                case 'AMT19 Cruise Track':
                			                    return 'yellow';
                			                    break;
                			            }
                			        }
                			    }
                			});

            // Create a style map object and set the 'default' and 'selected' intents
            var AMT_style_map = new OpenLayers.StyleMap({ 'default': AMT_style });

                var cruiseTrack = new OpenLayers.Layer.Vector('AMT' + i + ' Cruise Track', {
                    protocol: new OpenLayers.Protocol.HTTP({
                        url: 'http://rsg.pml.ac.uk/geoserver/rsg/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=rsg:AMT' + i + '&outputFormat=GML2',
                        format: new OpenLayers.Format.GML()
                    }),
                    strategies: [new OpenLayers.Strategy.Fixed()],
                    projection: lonlat,
                    styleMap: AMT_style_map
                });
                // Make this layer a reference layer
                cruiseTrack.controlID = "refLayers";
                cruiseTrack.setVisibility(false);
                map.addLayer(cruiseTrack);
            }

            // Setup Black sea outline layer (Vector)
            var blackSea = new OpenLayers.Layer.Vector('The Black Sea (KML)', {
                projection: lonlat,
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP({
                    url: 'black_sea.kml',
                    format: new OpenLayers.Format.KML({
                        extractStyles: true,
                        extractAttributes: true
                    })
                })
            })
            // Make this layer a reference layer
            blackSea.controlID = "refLayers";
			blackSea.selected = true;
            map.addLayer(blackSea);
			
			// Add a couple of useful map controls
			var mousePos = new OpenLayers.Control.MousePosition();
            var permalink =  new OpenLayers.Control.Permalink();
			map.addControls([mousePos,permalink]);

            if(!map.getCenter()) {
                map.zoomTo(3)
            }
        }
        /*
        ====================================================================================*/
        /*
        This code runs once the page has loaded - jQuery initialised
        */
        $(document).ready(function() {

            // Need to render the jQuery UI info dialog before the map due to z-index issues!
            $('#info').dialog({
                position: ['left', 'bottom'],
                width: 230,
                height: 220,
                resizable: false
            });

            // set up the map and render it
            mapInit();
			
            /*
            Configure and generate the UI elements
            */

            // Map layers elements - add data layers in reverse order to ensure
            // last added appear topmost in the UI as they are topmost in the layer stack
			// also populate the dates of data availability for all data layers
            for(i = (map.layers.length - 1); i >= 0; i--) {
                var layer = map.layers[i];
                // if not a base layer, populate the layers panel (left slide panel)
                if(layer.displayInLayerSwitcher && !layer.isBaseLayer) {
                    var selID = '#' + layer.controlID;   // jQuery selector for the layer controlID
                    $(selID).append('<li><input type="checkbox"' + (layer.visibility ? ' checked="yes"' : '') + '" name="' + layer.name + '" value="' + layer.name + '" />' + layer.name + '</li>');
                }
            }

			// Populate the base layers drop down menu
            $.each(map.layers, function(index, value) {
                var layer = value;
                // Add map base layers to the baseLayer drop-down list from the map
                if(layer.isBaseLayer) {
                    $('#baseLayer').append('<option value="' + layer.name + '">' + layer.name + '</option>');
                }
			});

            // Populate Quick Regions from the quickRegions array
            for(i = 0; i < quickRegion.length; i++) {
                $('#quickRegion').append('<option value="' + i + '">' + quickRegion[i][0] + '</option>');
            }

            // jQuery UI elements
	   		$('#viewDate').datepicker({
                showButtonPanel: true,
                dateFormat: 'dd-mm-yy',
                changeMonth: true,
                changeYear: true,
                beforeShowDay: function(date) {return map.allowedDays(date);},
                onSelect: function(dateText, inst) { return map.filterLayersByDate(dateText, inst); }
            });
            $('#panZoom').buttonset();
            $('#pan').button({ icons: { primary: 'ui-icon-arrow-4-diag'} });
            $('#zoomIn').button({ icons: { primary: 'ui-icon-circle-plus'} });
            $('#zoomOut').button({ icons: { primary: 'ui-icon-circle-minus'} });
            $("#dataTabs").tabs();
            // Must bind the creation of accordions under the tabs in this way to avoid messing up nested controls
            $('#dataTabs').bind('tabshow', function(event, ui) {
                $("#ROI").accordion({ collapsible: true, autoHeight: false });
                $("#analyses").accordion({ collapsible: true, autoHeight: false });
                $("#spatial").accordion({ collapsible: true, autoHeight: false });
                $("#temporal").accordion({ collapsible: true, autoHeight: false });
            });

            // Custom-made jQuery interface elements: multi-accordion sections (<h3>)
            // for data layers (in left panel) and data analysis (in right panel)
            $("#layerAccordion, #dataAccordion").multiAccordion();

            /*
            Hook up the other events for the general UI
            */
            // Left slide panel show-hide functionality		
            $(".triggerL").click(function(e) {
                $(".lPanel").toggle("fast");
                $(this).toggleClass("active");
                return false;
            });
            // Right slide panel show-hide functionality
            $(".triggerR").click(function(e) {
                $(".rPanel").toggle("fast");
                $(this).toggleClass("active");
                return false;
            });

            // Add map options panel rollover functionality
            $('#mapOptionsBtn').hover(function() {
                clearTimeout($(this).data('timeout'));
                $('#mapOptions').show('fast');
            }, function() {
                var t = setTimeout(function() {
                    $('#mapOptions').hide('fast');
                }, 500);
                $(this).data('timeout', t);
            });
            $('#mapOptions').hover(function() {
                clearTimeout($('#mapOptionsBtn').data('timeout'));
                $('#mapOptions').show();
            }, function() {
                var t = setTimeout(function() {
                    $('#mapOptions').hide('fast');
                }, 300);
                $(this).data('timeout', t);
            });

            // Add toggle info dialog functionality
            $('#infoToggleBtn').click(function(e) {
                if($('#info').dialog('isOpen')) {
                    $('#info').dialog('close');
                }
                else {
                    $('#info').dialog('open');
                }
            })

            /* 
            Set up event handling for the map including as well as
            mouse-based OpenLayers controls for jQuery UI buttons
            */
            // Create  map controls identified by key values which can be activated and deactivated
			var mapControls = {
                zoomIn: new OpenLayers.Control.ZoomBox(
                				{ out: false, alwaysZoom: true }
                			),
                zoomOut: new OpenLayers.Control.ZoomBox(
                				{ out: true, alwaysZoom: true }
                			),
                pan: new OpenLayers.Control.Navigation(),
            };
            // Add the controls to the map
            var control;
            for(var key in mapControls) {
                control = mapControls[key];
                map.addControl(control);
            }
            // Function which can toggle OpenLayers controls based on the clicked jQuery UI icon button
            // The value of the "for" attribute of the label which makes the button is used to match 
            // against the key value in the mapControls array so the right cotrol is toggled
            function toggleControl(element) {
                for(key in mapControls) {
                    var control = mapControls[key];
                    if($(element).attr('for') == key && $(element).is('.ui-state-active')) {
                        control.activate();
                    }
                    else {
                        control.deactivate();
                    }
                }
            }

            // Handle jQuery UI icon button click events - each button has a class of "iconBtn"
            $('.iconBtn').click(function(e) {
                toggleControl(this);
            });
            // Select the pan button as default when page loads
            // The click action will also fire the $('.iconBtn').click() method above
            // giving the initial set-up of mouse events and associated map controls
            $('#pan').click();

            // Handle selection of visible layers
            $('.lPanel li').click(function(e) {
                var itm = $(this);
                var child = itm.children('input').first();
                if(child.is(':checked')) {
                    $('.lPanel li').each(function(index) {
                        $(this).removeClass('selectedLayer');
                    });
                    itm.addClass('selectedLayer');
                }
                else {
                    itm.removeClass('selectedLayer');
                }
            });

            // Toggle visibility of data layers
            $('#opLayers :checkbox, #refLayers :checkbox').click(function(e) {
                var v = $(this).val();
                var layer = map.getLayersByName(v)[0];
                if($(this).is(':checked')) {
					layer.selected = true;
					// If the layer has date-time data, use special select routine
					// that checks for valid data on the current date to decide if to show data
					if(layer.temporal){
						map.selectDateTimeLayer(layer, $('#viewDate').datepicker('getDate'));
						// Update map date cache now a new temporal layer has been added
						map.refreshDateCache();
					}
					else{
						layer.setVisibility(true);
					}
                }
                else {
					layer.selected = false;
                    layer.setVisibility(false);
					// Update map date cache now a new temporal layer has been removed
					if(layer.temporal){map.refreshDateCache();}
                }
            })

            // Change of base layer event handler
            $('#baseLayer').change(function(e) {
                map.setBaseLayer(map.getLayersByName($('#baseLayer').val())[0]);
            });

            // Change of quick region event handler
            $('#quickRegion').change(function(e) {
                var qr_id = $('#quickRegion').val();
                var bbox = new OpenLayers.Bounds(
                				quickRegion[qr_id][1],
                				quickRegion[qr_id][2],
                				quickRegion[qr_id][3],
                				quickRegion[qr_id][4]
                			).transform(map.displayProjection, map.projection);
                map.zoomToExtent(bbox);
            });
        });
    </script>
</head>
<body>
    <!-- The Map -->
    <div id="map"></div>
    <!-- The Top Toolbar -->
    <div id="topToolbar" class="toolbar">
        <form>
            <ul>
                <li id="panZoom">
                    <input type="radio" id="pan" name="radio" value="pan" />
                        <label class="iconBtn" for="pan" title="Pan the Map: Keep the mouse button pressed and drag the map around."></label>
                    <input type="radio" id="zoomIn" name="radio" value="+" />
                        <label class="iconBtn" for="zoomIn" title="Zoom In: Click in the map to zoom in or drag a rectangle to zoom into that selection."></label>
                    <input type="radio" id="zoomOut" name="radio"  value="-" />
                        <label class="iconBtn" for="zoomOut" title="Zoom Out: Click in the map to zoom out or drag a rectangle to zoom the map out into that selection."></label>
                </li>
                <li class="divider"></li>
                <li>
                    <fieldset>
                        <legend>View Date</legend>
                        <input size="10" type="text" name="viewDate" id="viewDate" />
                    </fieldset>
                </li>
                <li class="divider"></li>
            </ul>
        </form>
    </div>
    <!-- The Left Panels -->
    <a class="trigger triggerL" href="#">Layers</a>
    <div class="panel lPanel">
        <h3 id="layerLbl">Data Layers</h3>
        <div id="layerAccordion">
            <h3><a href="#">Operational Layers</a></h3>
            <ul id="opLayers"></ul>
            <h3><a href="#">Reference Layers</a></h3>
            <ul id="refLayers"></ul> 
        </div>
        <div style="clear: both;"> </div>
    </div>
    <!-- The Right Panels -->
    <a class="trigger triggerR" href="#">Data</a>
    <div class="panel rPanel">
        <h3 id="dataLbl">Data Analysis</h3>
        <div id="dataAccordion">
            <h3><a href="#">Current R.O.I.</a></h3>
            <div id="dispROI"></div>
            <h3><a href="#">Data Tools</a></h3>
            <div id="dataTools">
                <div id="dataTabs">
                    <ul>
                        <li><a href="#tabs-1">R.O.I.</a></li>
                        <li><a href="#tabs-2">Analyses</a></li>
                        <li><a href="#tabs-3">Export<br></a></li>
                    </ul>
                    <div id="tabs-1">
                        <div id="ROI">
                            <h3><a href="#">Point</a></h3>
                            <div id="ROIPoint"></div>
                            <h3><a href="#">Bounding Box</a></h3>
                            <div id="ROIBox"></div> 
                            <h3><a href="#">Custom Area</a></h3>
                            <div id="ROICustom"></div> 
                            <h3><a href="#">Dynamic Mask</a></h3>
                            <div id="ROIMask"></div> 
                            <h3><a href="#">Current ROI Description</a></h3>
                            <div id="ROIBounds"></div> 
                        </div>
                    </div>
                    <div id="tabs-2">
                        <div id="analyses">
                            <h3><a href="#">Basic Statistics</a></h3>
                                <table id="bStats">
                                    <tr>
                                        <td>Mean Value:</td>
                                        <td>Two</td>
                                    </tr>
                                    <tr>
                                        <td>Max Value:</td>
                                        <td>Two</td>
                                    </tr>
                                    <tr>
                                        <td>Min Value:</td>
                                        <td>Two</td>
                                    </tr>
                                    <tr>
                                        <td>Std.Dev.:</td>
                                        <td>Two</td>
                                    </tr>
                                </table>
                            <h3><a href="#">Spatial Analysis</a></h3>
                            <div id="spatial">
                                <h3><a href="#">Thresholding</a></h3>
                                <div id="threshold"></div>
                                <h3><a href="#">Data Correlation</a></h3>
                                <div id="dCorr"></div> 
                            </div> 
                            <h3><a href="#">Temporal Analysis</a></h3>
                            <div id="temporal">
                                <h3><a href="#">Time Series</a></h3>
                                <div id="tSeries"></div>
                                <h3><a href="#">Interannual Variability</a></h3>
                                <div id="IAVar"></div>
                            </div> 
                            <h3><a href="#">Risk Analysis</a></h3>
                            <div id="risk"></div> 
                        </div>
                    </div>
                    <div id="tabs-3">
                        <p>Mauris eleifend est et turpis. Duis id erat. Suspendisse potenti. Aliquam vulputate, pede vel vehicula accumsan, mi neque rutrum erat, eu congue orci lorem eget lorem. Vestibulum non ante. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Fusce sodales. Quisque eu urna vel enim commodo pellentesque. Praesent eu risus hendrerit ligula tempus pretium. Curabitur lorem enim, pretium nec, feugiat nec, luctus a, lacus.</p>
                    </div>
                </div>        
            </div>
        </div>
        <div style="clear: both;"> </div>
    </div>
    <div id="bottomToolbar" class="toolbar">
        <ul>
            <li>
                <fieldset>
                    <legend>Base Layer</legend>
                    <select id="baseLayer" name="Base Layer">
                    </select>
                </fieldset>
            </li>
            <li class="divider"></li>
            <li>
                <fieldset>
                    <legend>Quick Region</legend>
                    <select id="quickRegion" name="Quick Region">
                    </select>
                </fieldset>
            </li>
            <li class="divider"></li>
            <li>
                <a href="#" id="mapOptionsBtn"><img src="img/map-icon.png" alt="Click for Map Options"></a>
            </li>
            <li class="divider"></li>
            <li>
                <a href="#" id="infoToggleBtn"><img src="img/info32.png" alt="Toggle Information Window"></a>
            </li>   
        </ul>
    </div>
    <div class="toolbar" id="mapOptions">
    	<h2>Map Options</h2>
        <p>Mauris eleifend est et turpis. Duis id erat. Suspendisse potenti. Aliquam vulputate, pede vel vehicula accumsan.</p>
    </div>
    <div id="info" title="Information">
        <a href="http://www.marineopec.eu" target="_new" name="OpEc Main Web Site" rel="external"> <img src="img/OpEc_small.png" alt="OpEc (Operational Ecology) Logo" /></a>
        <a href="http://cordis.europa.eu/fp7/home_en.html" target="_new" name="European Union Seventh Framework Programme" rel="external"> <img src="img/fp7_small.png" alt="European Union FP7 Logo" /></a>
        <p>&copy;2012 PML Applications Ltd<br />
        EU Project supported within DG SPACE for the 7th Framework Programme for Cooperation.</p>
        <div style="clear: both;"> </div>
    </div>
</body>
</html>
