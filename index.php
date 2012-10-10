<!DOCTYPE HTML>
<html>
<!-- http://spyrestudios.com/demos/sliding-panel-left/ -->
<head>
<meta charset="utf-8">
<title>OPEC Visualisation Portal Prototype</title>

<!-- ============================ Now for the styling ============================ -->
<!-- jQuery UI theming CSS -->
<link rel="stylesheet" type="text/css" href="js-libs/jquery-ui/css/black-tie/jquery-ui-1.8.23.custom.css" />

<!-- Default OpenLayers styling -->
<link rel="stylesheet" type="text/css" href="js-libs/OpenLayers/theme/default/style.css" />

<!-- Context Menu styling -->
<Link rel="stylesheet" type="text/css" href="js-libs/jquery-contextMenu/css/jquery-contextMenu.css" />

<!-- Gritter styling -->
<Link rel="stylesheet" type="text/css" href="js-libs/jquery-gritter/css/jquery.gritter.css" />

<!-- Multiselect styling -->
<Link rel="stylesheet" type="text/css" href="js-libs/jquery-multiselect/css/jquery.multiselect.css" />

<!-- jQuery UI dialog extension styling -->
<link rel="stylesheet" type="text/css" href="js-libs/jquery-dialogextend/css/jquery.dialogextend.css"/>

<!--<link rel="stylesheet" type="text/css" href="js-libs/OpenLayers/theme/default/google.css">-->

<!-- Default styling for web app plus overrides of OpenLayers and jQuery UI styles -->
<link rel="stylesheet" type="text/css" href="css/main.css" />

<!-- ============================ JavaScript libraries ============================ -->
<!-- Custom functions and extensions to exisiting JavaScript objects -->
<script type="text/javascript" src="custom.js"></script>

<!-- Latest jQuery from jQuery.com -->
<script type="text/javascript" src="js-libs/jquery/jquery-1.8.2.min.js"></script>

<!-- The latest jQuery UI from jqueryui.com -->
<script type="text/javascript" src="js-libs/jquery-ui/js/jquery-ui-1.8.23.custom.min.js"></script>

<!-- OpenLayers Map Code-->
<script type="text/javascript" src="js-libs/OpenLayers/OpenLayers.js"></script>

<!-- Flotr2 -->
<script type="text/javascript" src="js-libs/Flotr2/js/flotr2.min.js"></script>

<!-- http://forum.jquery.com/topic/expand-all-zones-for-an-accordion#14737000002919405 -->
<!-- <script type="text/javascript" src="js-libs/multiAccordion.js"></script> -->

<!-- http://code.google.com/p/jquery-multi-open-accordion -->
<script type="text/javascript" src="js-libs/jquery.multi-open-accordion-1.5.2.js"></script>

<!-- Old Custom library of extensions and functions for OpenLayers Map and Layer objects -->
<script type="text/javascript" src="maplayers.js"></script>

<!-- http://medialize.github.com/jQuery-contextMenu/ -->
<script type="text/javascript" src="js-libs/jquery-contextMenu/js/jquery-contextMenu.js"></script>

<!-- https://github.com/jboesch/Gritter -->
<script type="text/javascript" src="js-libs/jquery-gritter/js/jquery.gritter.js"></script>

<!-- https://github.com/michael/multiselect -->
<script type="text/javascript" src="js-libs/jquery-multiselect/js/jquery.multiselect.js"></script>

<!-- jQuery UI dialog extension -->
<script type="text/javascript" src="js-libs/jquery-dialogextend/js/jquery.dialogextend.1.0.1.js"></script>

<!-- Custom JavaScript -->
<script type="text/javascript" src="opecportal.js"></script>
<script type="text/javascript" src="gritter.js"></script>
<script type="text/javascript" src="contextMenu.js"></script>
<script type="text/javascript" src="graphing.js"></script>

<!-- Use custom PHP class to create cache the getCapabilities call and create some
   date caches for the required data layers.
   See wms-capabilities.php for details. -->

<?php
//--------PHP-DEBUG-SETTINGS-------------
   // DEFINED in wms-capabilities.php
//---------------------------------------
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
   <div id="topToolbar" class="toolbar unselectable">
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
         <!-- Placeholder ROI radio buttons -->
         <li id="ROIButtonSet">
            <input type="radio" id="point" name="radio" value="point" />
               <label class="iconBtn" for="point" title="Draw Point: Click in the map to draw a point as a region of interest centred on the click point."></label>
            <input type="radio" id="box" name="radio" value="box"/>
               <label class="iconBtn" for="box" title="Draw Box: Click and drag on the map to draw a rectangle as a region of interest with the click point at its top-left."></label>
            <input type="radio" id="circle" name="radio" value="circle" />
               <label class="iconBtn" for="circle" title="Draw Circle: Click and drag on the map to draw a circle as a region of interest with the click point at its centre."></label>
            <input type="radio" id="polygon" name="radio" value="polygon" />
               <label class="iconBtn" for="polygon" title="Draw Polygon: Click repeatedly on the map to draw a polygon as a region of interest. Double-click to finish drawing the polygon"></label>
         </li>
         <li class="divider"></li>
         <li>
            <a href="#" id="mapInfoToggleBtn"><img src="img/info32.png" alt="Toggle Map Information Window"/></a>        
         </li>
         <li>
            <a href="#" id="shareMapToggleBtn"><img src="img/mapLink.png" alt="Toggle Share Map Window"/></a>
         </li>
         <li>
            <a href="#" id="layerPreloader"><img src="img/layers32.png" alt="Toggle Layer Preloader Window"/></a>
         </li>
      </ul>
   </div>
   <!-- The Left Panels -->
   <a class="trigger triggerL unselectable" href="#">Layers</a>
   <div class="panel lPanel unselectable">
      <h3 id="layerLbl">Data Layers</h3>
      <div id="layerAccordion">
         <h3><a href="#">Operational Layers</a></h3>
         <div id="opLayers"></div>
         <h3><a href="#">Reference Layers</a></h3>
         <div id="refLayers"></div> 
      </div>
      <div style="clear: both;"> </div>
   </div>
   <!-- The Right Panels -->
   <a class="trigger triggerR unselectable" href="#">Data</a>
   <div class="panel rPanel unselectable">
      <h3 id="dataLbl">Data Analysis</h3>
      <div id="dataAccordion">
         <h3><a href="#">Current R.O.I.</a></h3>
         <div id="dispROI"></div>
         <h3><a href="#">Data Tools</a></h3>
         <div id="dataTools">
            <div id="dataTabs">
               <ul>
                  <li><a href="#tabs-1">Analyses</a></li>
                  <li><a href="#tabs-2">Export<br></a></li>
               </ul>
               <div id="tabs-1">
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
               <div id="tabs-2">
                  <p>Mauris eleifend est et turpis. Duis id erat. Suspendisse potenti. Aliquam vulputate, pede vel vehicula accumsan, mi neque rutrum erat, eu congue orci lorem eget lorem. Vestibulum non ante. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Fusce sodales. Quisque eu urna vel enim commodo pellentesque. Praesent eu risus hendrerit ligula tempus pretium. Curabitur lorem enim, pretium nec, feugiat nec, luctus a, lacus.</p>
               </div>
            </div>      
         </div>
      </div>
      <div style="clear: both;"> </div>
   </div>
   <div id="bottomToolbar" class="toolbar unselectable">
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
               <legend class="ui-widget-header">Quick Region</legend>
               <select class="ui-corner-all" id="quickRegion" name="Quick Region">
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
   	<h2>Some header text</h2>
      <p>Some stuff can go here in the future...</p>
   </div>
   <div class="toolbar" id="shareOptions">
   	<h3>Share</h3>
      <div>
         <input type="text" name="shareLink" value="Permalink would go here!" id="shareLink" />
         <label class="iconBtn" for="shareLink" />
      </div> 
   </div>
   <div id="info" class="unselectable" title="Information">
      <a href="http://www.marineopec.eu" target="_new" name="OpEc Main Web Site" rel="external"> <img src="img/OpEc_small.png" alt="OpEc (Operational Ecology) Logo" /></a>
      <a href="http://cordis.europa.eu/fp7/home_en.html" target="_new" name="European Union Seventh Framework Programme" rel="external"> <img src="img/fp7_small.png" alt="European Union FP7 Logo" /></a>
      <p>&copy;2012 PML Applications Ltd<br />
      EU Project supported within DG SPACE for the 7th Framework Programme for Cooperation.</p>
      <div style="clear: both;"> </div>
   </div>
   <div id="mapInfo" title="MapInfo">
      <div>
         <span id="latlng"></span>
      </div>
   </div>
   <div id="layerSelection" class="layer-selection unselectable" title="Layer Selection">
      <span>Please select which layers you would like to use with the map. You can change these layers at any time.</span>
      <div id="layers"></div>
   </div>
</body>
</html>
