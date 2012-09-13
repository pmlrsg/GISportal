<?php 

//--------PHP-DEBUG-SETTINGS--------
   // Log file location
   //define("LOG_FILE", "/errors.log");

   //ini_set('error_reporting', E_ALL);
   //ini_set('display_errors', '1');
   //ini_set("log_errors", "1");
   //ini_set('error_log', LOG_FILE)

   // Setup firebug php  
   require_once('FirePHPCore/fb.php');
   ob_start();
//----------------------------------

// set socket timeout
ini_set('default_socket_timeout', 120);

// How long the cache files will last
define('CACHELIFE', 10); // 86400
// Path to store cache files in
define('LAYERCACHEPATH', "./cache/layers/");
// Server cache path
define('SERVERCACHEPATH', "./cache/");
// Path to master cache file, extension is added by FILEEXTENSION
define('MASTERCACHEPATH', "./cache/mastercache");
// File extension to use
define('FILEEXTENSIONJSON', ".json");
// File extension to use
define('FILEEXTENSIONXML', ".xml");
// wmsGetCapabilites params 
define('GET_CAPABILITES_PARAMS', "SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0");
// Server list path
define('GET_SERVERLIST_PATH', "serverlist.csv");

function updateCache()
{
   // Get the list of servers from file
   $serverArray = csvToArray(GET_SERVERLIST_PATH, ',');
   $mastercache = array();
   $change = FALSE;

   //DEBUG
   //fb($serverArray, FirePHP::INFO);

   foreach($serverArray as $i => $row)
   {
      // DEBUG
      //fb("server: ".$row['name'], FirePHP::INFO);
      //fb("url: ".$row['url'], FirePHP::INFO);

      if(!CheckCacheValid(SERVERCACHEPATH.$row['name'].FILEEXTENSIONXML, CACHELIFE))
      {
         $newXML = file_get_contents($row['url'].GET_CAPABILITES_PARAMS) or
            die("Can't contact getCapabilities Server");

         $oldXML = getFile(SERVERCACHEPATH.$row['name'].FILEEXTENSIONXML);

         $newMD5 = md5($newXML);
         $oldMD5 = md5($oldXML);

         //DEBUG
         //fb("newMD5: ".$newMD5, FirePHP::INFO);
         //fb("oldMD5: ".$oldMD5, FirePHP::INFO);

         // If the checksum does not match then we should recreate the cache files
         if($oldMD5 != $newMD5)
         {
            //DEBUG
            //fb("creating xml cache...", FirePHP::INFO);
            saveFile(SERVERCACHEPATH.$row['name'].FILEEXTENSIONXML, $newXML);

            //DEBUG
            //fb("xml cache created", FirePHP::INFO);
            //fb("creating cache...", FirePHP::INFO);
            //$mastercache[] = json_decode(createCache($row['name'], $row['url'], $newXML));
            createCache($row['name'], $row['url'], $newXML);
            //DEBUG
            //fb("cache created", FirePHP::INFO);

            //--------------- Needed for editing files -----------------
            //$cmd = "chmod 777 ".SERVER_CACHE_PATH.$row['name'].".xml";
            //$return = `$cmd`;
            // ---------------------------------------------------------

            $change = TRUE;
         }
      }
   }

   //DEBUG
   //fb($mastercache, FirePHP::INFO);

   if($change)
   {
      foreach($serverArray as $i => $row)
      {
         $mastercache[] = json_decode(getFile(SERVERCACHEPATH.$row['name'].FILEEXTENSIONJSON));
      }

      saveFile(MASTERCACHEPATH.FILEEXTENSIONJSON, json_encode($mastercache));
   }
}

function CheckCacheValid($cacheFile, $cacheLife)
{
   if (!file_exists($cacheFile) or (time() - filemtime($cacheFile) >= $cacheLife) )
      return FALSE;
   else
      return TRUE;
}

function createCache($serverName, $serverURL, $xmlStr)
{
   $subMasterCache = array();

   $xml = simplexml_load_string($xmlStr);

   // Using the provided server name as a default
   $serviceName = $serverName;
   $serverTitle = $serverName;
   $serverAbstract = $serverName;

   foreach($xml->Service as $child) 
   {
      $serviceName = $child->Name;
      $serverTitle = $child->Title;
      $serverAbstract = $child->abstract;
   }

   // Iterate over each sensor
   foreach($xml->Capability->Layer->Layer as $child) 
   {
      $sensorName = (string)$child->Title;
      $layers = array();
      
      // Iterate over each layer
      foreach($child->Layer as $innerChild) 
      {
         $name = (string)$innerChild->Name;
         $title = (string)$innerChild->Title;
         $abstract = (string)$innerChild->Abstract;
         $temporal = FALSE;

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

         $temp = createDimensionsArray($innerChild->Dimension);
         $dimensions = $temp['dimensions'];
         $temporal = $temp['temporal'];
         $styles = createStylesArray($innerChild->Style);

         if(!filterLayers($name))
         {
            // Add to the layers array
            $layer = array(
               //'SensorName'=>$sensorName,
               'Name'=>$name,
               'URL'=>$serverURL,
               'Title'=>$title, 
               'Abstract'=>$abstract,
               //'Temporal'=>$temporal,
               'FirstDate'=>$temp['firstDate'],
               'LastDate'=>$temp['lastDate'],
               'EX_GeographicBoundingBox'=>$exGeographicBoundingBox,
               'BoundingBox'=>$boundingBox,
               'Dimensions'=>$dimensions,
               'Styles'=>$styles
            );

            $ln = str_replace("/", "-", $name);
            $sn = str_replace("/", "-", $serverName);
            saveFile(LAYERCACHEPATH.$sn."_".$ln.FILEEXTENSIONJSON, json_encode($layer));

            // Add to the layers array
            array_push($layers, array(
               //'SensorName'=>$sensorName,
               'Name'=>$name,
               'Title'=>$title, 
               'Abstract'=>$abstract,
               //'Temporal'=>$temporal,
               //'FirstDate'=>$firstDate,
               //'LastDate'=>$lastDate,
               'EX_GeographicBoundingBox'=>$exGeographicBoundingBox,
               //'BoundingBox'=>$boundingBox,
               //'Dimensions'=>$dimensions,
               //'Styles'=>$styles
               )
            );
         }
      }  

      $subMasterCache['server'][$sensorName] = $layers;
   }

   $subMasterCache['url'] = $serverURL;
   $subMasterCache['serverName'] = $serverName;
   $sn = str_replace("/", "-", $serviceName);
   return saveFile(SERVERCACHEPATH.$serverName.FILEEXTENSIONJSON, json_encode($subMasterCache)); 
}

function createDimensionsArray($dimensions)
{
   $returnArray = array();
   $returnArray['dimensions'] = array();
   $returnArray['temporal'] = FALSE;
   $returnArray['firstDate'] = NULL;
   $returnArray['lastDate'] = NULL;

   // Iterate over each dimension
   foreach($dimensions as $dimension)
   {
      if((string)$dimension->attributes()->name == 'time')
      {
         $temporal = true;
         $dimensionArray = explode(",", $dimension);
         $firstDate = substr(trim((string)$dimensionArray[0]), 0, 10);
         $lastDate = substr(trim((string)$dimensionArray[count($dimensionArray) - 1]), 0, 10);
         
         if(!isISO8601Date($firstDate))
         {
            fb("First Date not in ISO8601 format: ".array_shift($dimensionArray), FirePHP::ERROR);
         }

         $returnArray['temporal'] = $temporal;
         $returnArray['firstDate'] = $firstDate;
         $returnArray['lastDate'] = $lastDate;     
      }

      // Add to the dimensions array
      array_push($returnArray['dimensions'], array(
         'Name'=>(string)$dimension->attributes()->name,
         'Units'=>(string)$dimension->attributes()->units,
         'Default'=>(string)$dimension->attributes()->default,
         'Value'=>trim((string)$dimension))         
      );
   }

   return $returnArray;
}

function createStylesArray($styles)
{
   $returnArray = array();

   // Iterate over each style
   foreach($styles as $style) 
   {      
      // Add to the styles array
      array_push($returnArray, array(
         'Name'=>(string)$style->Name,
         'Abstract'=>(string)$style->Abstract,
         'LegendURL'=>(string)$style->LegendURL->OnlineResource->attributes('xlink', true)->href,
         'Width'=>(string)$style->LegendURL->attributes()->width,
         'Height'=>(string)$style->LegendURL->attributes()->height
         )             
      );
   }

   return $returnArray;
}

/**
 * @link http://gist.github.com/385876
 */
function csvToArray($filename='', $delimiter=',')
{
    if(!file_exists($filename) || !is_readable($filename))
        return FALSE;

    $header = NULL;
    $data = array();
    if (($handle = fopen($filename, 'r')) !== FALSE)
    {
        while (($row = fgetcsv($handle, 1000, $delimiter)) !== FALSE)
        {
            if(!$header)
                $header = $row;
            else
                $data[] = array_combine($header, $row);
        }
        fclose($handle);
    }
    return $data;
}

function filterLayers($layerName)
{
   $whiteList = array(
      //"WECOP/Z5c",
      //"WECOP/Chl",
      //"WECOP/PAR_irradiance",
      //"WECOP/PAR_attenuation",
      //"WECOP/EIRg",
      //"WECOP/EIRb",
      //"WECOP/EIRr",
      //"MRCS_ECOVARS/o2o",
      //"MRCS_ECOVARS/si",
      //"MRCS_ECOVARS/zoop",
      //"MRCS_ECOVARS/chl",
      //"MRCS_ECOVARS/po4",
      //"MRCS_ECOVARS/no3",
      //"MRCS_ECOVARS/p1c",
      //"MRCS_ECOVARS/p2c",
      //"MRCS_ECOVARS/p3c",
      //"MRCS_ECOVARS/p4c",
      //"MRCS_ECOVARS/vis01",
      //"AMT_NORTHERN/aot_869",
   );

   foreach($whiteList as $value)
   {
      if($layerName == $value)
      {
         return TRUE;
      }
   }
   return FALSE;
}

// Regex from http://www.pelagodesign.com/blog/2009/05/20/iso-8601-date-validation-that-doesnt-suck/ 
function isISO8601Date($dateStr)
{
   if (preg_match('/^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/', $dateStr) > 0)
   {
      return TRUE;
   }
   else
   {
      return FALSE;
   }
}

function getFile($filePath)
{
   if (file_exists($filePath))
   {
      $fh = fopen($filePath, "r") or die("can't open file");
      $outStr = fread($fh, filesize($filePath));
      fclose($fh);
      return $outStr;
   }

   return FALSE;
}

function saveFile($filePath, $data)
{
   $fh = fopen($filePath, "w") or die("can't open file");
   fwrite($fh, $data);
   fclose($fh);
   return $data;
}