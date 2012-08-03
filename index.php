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
<link rel="stylesheet" type="text/css" href="js-libs/OpenLayers/theme/default/style.css" />
<!-- Context Menu styling -->
<Link rel="stylesheet" type="text/css" href="js-libs/jquery-contextMenu/css/jquery-contextMenu.css" />
<!-- Gritter styling -->
<Link rel="stylesheet" type="text/css" href="js-libs/jquery-gritter/css/jquery.gritter.css" />
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
<!-- http://medialize.github.com/jQuery-contextMenu/ -->
<script type="text/javascript" src="js-libs/jquery-contextMenu/js/jquery-contextMenu.js"></script>
<!-- https://github.com/jboesch/Gritter -->
<script type="text/javascript" src="js-libs/jquery-gritter/js/jquery.gritter.min.js"></script>
<!-- Custom JavaScript -->
<!-- OpenLayers Map Code-->
<script type="text/javascript" src="opecportal.js"></script>

<!-- Use custom PHP class to create cache the getCapabilities call and create some
   date caches for the required data layers.
   See wms-capabilities.php for details. -->
<?php
//--------PHP-DEBUG-SETTINGS--------
   // Log file location
   //define("LOG_FILE", "/errors.log");

   ini_set('error_reporting', E_ALL);
   ini_set('display_errors', '1');
   //ini_set("log_errors", "1");
   //ini_set('error_log', LOG_FILE)

   // Setup firebug php  
   require_once('FirePHPCore/fb.php');
   ob_start();
//----------------------------------

   require('wms-capabilities.php');

   // Generate cache files
   updateCache();
?>

</head>
<body>
   <!-- CSS check and info for screen readers -->
   <div id="nocss-info">
      <h1>Opec Visualisation</h1>
      <span>Operational Ecology Marine Ecosystem Forecasting</span>
      <div class="css-check">
         This website requires css to work. Please enable it in your browser.
      </div>
   </div>
   <!-- JavaScript check -->
   <noscript>
      <div id="noscript-warning">
         This website requires JavaScript to work. Please enable it in your browser.
      </div>
   </noscript>

   <!-- The Map -->
   <div id="map"></div>
   <!-- The Top Toolbar -->
   <div id="topToolbar" class="toolbar">
      <ul>
         <li id="panZoom">
            <input type="radio" id="pan" name="radio" value="pan" checked="checked" />
               <label class="iconBtn" for="pan" title="Pan the Map: Keep the mouse button pressed and drag the map around."></label>
            <input type="radio" id="zoomIn" name="radio" value="zoomIn"/>
               <label class="iconBtn" for="zoomIn" title="Zoom In: Click in the map to zoom in or drag a rectangle to zoom into that selection."></label>
            <input type="radio" id="zoomOut" name="radio" value="zoomOut" />
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
         <li>
            <input type="button" title="Toggle Map Information Window"/>
         </li>
      </ul>
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
   	<h2>Draw Region Of Interest (ROI)</h2>
      <div id="drawingControls">
         <input type="radio" name="type" value="point" id="point" />
         <label class="iconBtn"  for="pointToggle">draw point</label><br />
         <input type="radio" name="type" value="box" id="box" />
         <label class="iconBtn" for="boxToggle">draw box</label><br />
         <input type="radio" name="type" value="circle" id="circle" />
         <label class="iconBtn" for="circleToggle">draw circle</label><br />
         <input type="radio" name="type" value="polygon" id="polygon" />
         <label class="iconBtn" for="polygonToggle">draw polygon</label>
      </div> 
   </div>
   <div id="info" title="Information">
      <a href="http://www.marineopec.eu" target="_new" name="OpEc Main Web Site" rel="external"> <img src="img/OpEc_small.png" alt="OpEc (Operational Ecology) Logo" /></a>
      <a href="http://cordis.europa.eu/fp7/home_en.html" target="_new" name="European Union Seventh Framework Programme" rel="external"> <img src="img/fp7_small.png" alt="European Union FP7 Logo" /></a>
      <p>&copy;2012 PML Applications Ltd<br />
      EU Project supported within DG SPACE for the 7th Framework Programme for Cooperation.</p>
      <div style="clear: both;"> </div>
   </div>
   <div id="scalebar" title="Scalebar Info">
      <img src="http://maelstrom.npm.ac.uk:8080/ncWMS/wms?REQUEST=GetLegendGraphic&LAYER=MRCS_ECOVARS/si&PALETTE=nasa_rainbow" alt="Scalebar"/>
   </div>
   <div id="metadata" title="Metadata">
   </div>
</body>
</html>
