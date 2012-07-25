<?php 
	// PHP DEBUG SETTINGS
	error_reporting(E_ALL);
	ini_set('display_errors', '1');	
	require_once('FirePHPCore/fb.php');
	ob_start();

function getLayers($xml)
{
   $returnArray = array();
   
   // Iterate over each sensor
   foreach($xml->Capability->Layer->Layer as $child) 
   {
      $sensor = (string)$child->Title;
      $layers = array();
      
      // Iterate over each layer
      foreach($child->Layer as $innerChild) 
      {
		   $name = (string)$innerChild->Name;
	      $title = (string)$innerChild->Title;
		   $abstract = (string)$innerChild->Abstract;

         $exGeographicBoundingBox = array(
            'WestBoundLongitude'=>(string)$innerChild->EX_GeographicBoundingBox->westBoundLongitude,
            'EastBoundLongitude'=>(string)$innerChild->EX_GeographicBoundingBox->eastBoundLongitude,
            'SouthBoundLatitude'=>(string)$innerChild->EX_GeographicBoundingBox->southBoundLatitude,
            'NorthBoundLatitude'=>(string)$innerChild->EX_GeographicBoundingBox->northBoundLatitude
         );

         $boundingBox = array(
            'CRS'=>(string)$innerChild->BoundingBox->attributes()->CRS,
            'MinX'=>(string)$innerChild->BoundingBox->attributes()->minx,
            'MaxX'=>(string)$innerChild->BoundingBox->attributes()->maxx,
            'MinY'=>(string)$innerChild->BoundingBox->attributes()->miny,
            'MaxY'=>(string)$innerChild->BoundingBox->attributes()->maxy
         );

         $dimensions = array();
         $styles = array();

         // Iterate over each dimension
         foreach($innerChild->Dimension as $dimension)
         {
            // Add to the dimensions array
            array_push($dimensions, array(
               'Name'=>(string)$dimension->attributes()->name,
               'Units'=>(string)$dimension->attributes()->units,
               'Default'=>(string)$dimension->attributes()->default,
               'Value'=>trim((string)$dimension)
               )             
            );
         }

         // Iterate over each style
         foreach($innerChild->Style as $style) 
         {      
            // Add to the styles array
            array_push($styles, array(
               'Name'=>(string)$style->Name,
               'Abstract'=>(string)$style->Abstract,
               'LegendURL'=>(string)$style->LegendURL->OnlineResource->attributes('xlink', true)->href,
               'Width'=>(string)$style->LegendURL->attributes()->width,
               'Height'=>(string)$style->LegendURL->attributes()->height
               )             
            );
         }

         // Add to the layers array
         array_push($layers, array(
            'Name'=>$name, 
            'Title'=>$title, 
            'Abstract'=>$abstract,
            //'EX_GeographicBoundingBox'=>$exGeographicBoundingBox,
            //'BoundingBox'=>$boundingBox,
            'Dimensions'=>$dimensions,
            //'Styles'=>$styles
            )
         );
      }

      // Add to the sensor array
      array_push($returnArray, array(
         'Sensor'=>$sensor, 
         'Layers'=>$layers
         )
      );     
   }

   return $returnArray;
}

function createCache($cacheFile, $cacheLife, $encodedArray)
{
   if (!file_exists($cacheFile) or (time() - filemtime($cacheFile) >= $cacheLife) )
   {
      $fh = fopen($cacheFile, "w") or die("can't open file");
	   fwrite($fh, $encodedArray);
		fclose($fh);
		return $encodedArray;
   }
   else
   {
      $fh = fopen($cacheFile, "r") or die("can't open file");
		$outStr = fread($fh, filesize($cacheFile));
		fclose($fh);
	   return $outStr;
   }
}

function createDateCaches($array)
{
   $location = "./json/WMSDateCache/";
   $extension = ".json";

   // Iter over sensors
   foreach($array as $i => $v) {
      foreach($v['Layers'] as $key => $value) 
      {
         $name = str_replace("/", "_", $value['Name']);
         $file = $location . $name . $extension;

         foreach($value['Dimensions'] as $dimension)
         {
            if($dimension['Name'] == 'time')
            {
               $timeDimensionArray = explode(",", $dimension['Value']);
               $jsonArray = json_encode($timeDimensionArray);
               $outStr = '{"date":' . $jsonArray . '}'; // Atention to ' and " otherwise JSON is not valid
               
               // Create the cache file
               createCache($file, 60, $outStr);
            }
         } 

         // DEBUG
         fb("*PHP* I: ".$i, FirePHP::INFO);
         fb("*PHP* V: ".$v, FirePHP::INFO);
         fb("*PHP* Key: ".$key, FirePHP::INFO);
         fb("*PHP* Value: ".$layer, FirePHP::INFO);
         fb("*PHP* Name: ".$name, FirePHP::INFO);
      }

   }
}

$wmsURL="http://rsg.pml.ac.uk/ncWMS/wms?";
$wmsGetCapabilites = $wmsURL."SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";

$str = file_get_contents($wmsGetCapabilites);
$xml = simplexml_load_string( $str );

$returnArray = getLayers($xml);
createDateCaches($returnArray);
$returnstring = createCache("./json/testLayerCache.json", 60, json_encode($returnArray));

echo json_encode($returnArray);
