<?php 

// How long the cache files will last
define('CACHELIFE', 86400);
// Path to store cache files in
define('DATECACHEPATH', "./cache/layers/");
// Path to master cache file, extension is added by FILEEXTENSION
define('MASTERCACHEPATH', "./cache/mastercache");
// File extension to use
define('FILEEXTENSION', ".json");
// Path to wmsGetCapabilites server
define('GET_CAPABILITES_PATH', "http://vostok:8080/ncWMS-1.0RC3/wms?");
// wmsGetCapabilites params 
define('GET_CAPABILITES_PARAMS', "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0");

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
         $temporal = false;

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
            if((string)$dimension->attributes()->name == 'time')
            {
               $temporal = true;
               //$dimensionArray = explode(",", $dimension);
               //$firstDate = substr(trim((string)$dimensionArray[0]), 0, 10);
               //$lastDate = substr(trim((string)$dimensionArray[count($dimensionArray) - 1]), 0, 10);
            }

            // DEBUG
            //fb("first: ".$firstDate. " last: ". $lastDate, FirePHP::INFO);

            // Add to the dimensions array
            array_push($dimensions, array(
               'Name'=>(string)$dimension->attributes()->name,
               'Units'=>(string)$dimension->attributes()->units,
               'Default'=>(string)$dimension->attributes()->default,
               'Value'=>trim((string)$dimension))         
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

         if(!filterLayers($name))
         {
            // Add to the layers array
            array_push($layers, array(
               'Name'=>$name, 
               'Title'=>$title, 
               'Abstract'=>$abstract,
               'Temporal'=>$temporal,
               //'FirstDate'=>$firstDate,
               //'LastDate'=>$lastDate,
               'EX_GeographicBoundingBox'=>$exGeographicBoundingBox,
               'BoundingBox'=>$boundingBox,
               'Dimensions'=>$dimensions,
               'Styles'=>$styles
               )
            );
         }
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

function filterLayers($layerName)
{
   $whiteList = array(
      "WECOP/Z5c",
      "WECOP/Chl",
      "WECOP/PAR_irradiance",
      "WECOP/PAR_attenuation",
      "WECOP/EIRg",
      "WECOP/EIRb",
      "WECOP/EIRr",
      "MRCS_ECOVARS/o2o",
      "MRCS_ECOVARS/si",
      "MRCS_ECOVARS/zoop",
      "MRCS_ECOVARS/chl",
      "MRCS_ECOVARS/po4",
      "MRCS_ECOVARS/no3",
      "MRCS_ECOVARS/p1c",
      "MRCS_ECOVARS/p2c",
      "MRCS_ECOVARS/p3c",
      "MRCS_ECOVARS/p4c",
      "MRCS_ECOVARS/vis01",
      "AMT_NORTHERN/aot_869",
   );

   foreach($whiteList as $value)
   {
      if($layerName == $value)
      {
         return true;
      }
   }

   return false;
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
   // Iter over sensors
   foreach($array as $i => $v) {
      foreach($v['Layers'] as $key => $value) 
      {
         $name = str_replace("/", "-", $value['Name']);
         $file = DATECACHEPATH . $name . FILEEXTENSION;

         foreach($value['Dimensions'] as $layer => $dimension) {
            if($dimension['Name'] == 'time')
            {
               $timeDimensionArray = explode(",", $dimension['Value']);
               $jsonArray = json_encode($timeDimensionArray);
               $outStr = '{"date":' . $jsonArray . '}'; // Atention to ' and " otherwise JSON is not valid
               
               // Create the cache file
               createCache($file, CACHELIFE, $outStr);

               // Remove the date data so we don't cache it twice
               unset($array[$i]['Layers'][$key]['Dimensions'][$layer]);
            }
         } 
      }
   }

   // Return the array without the date data
   return $array;
}

function updateCache()
{
   $str = file_get_contents(GET_CAPABILITES_PATH . GET_CAPABILITES_PARAMS) or
      die("Can't contact getCapabilities Server");

   $xml = simplexml_load_string($str);

   $returnArray = getLayers($xml);
   $returnArray = createDateCaches($returnArray);
   $returnstring = createCache(MASTERCACHEPATH . FILEEXTENSION, CACHELIFE, json_encode($returnArray));

}
