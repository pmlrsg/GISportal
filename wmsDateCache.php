<?php 
// PHP Cache system - modified by Martyn Atkins 29/05/2012 to provide a flexible, re-useable PHP class
// Original code - Jorge de Jesus pre 29/05/2012
 
// NO INPUT FROM OUTSIDE JUST REPLY OF JSON OBJECT
// $cacheLife=60*60*24 = 86400 as default - caching time in seconds,1 day cache

require './ParseXml.class.php';
// In case the PHP version is less than PHP 5.2x, we need to load a JSON wrapper
// to give us the json_encode functionality
require './jsonwrapper.php';

// Helper function
function array_searchRecursive( $needle, $haystack, $strict=false, $path=array() )
{
	if( !is_array($haystack) ) {
		return false;
	}
 
	foreach( $haystack as $key => $val ) {
		if( is_array($val) && $subPath = array_searchRecursive($needle, $val, $strict, $path) ) {
			$path = array_merge($path, array($key), $subPath);
			return $path;
		} elseif( (!$strict && $val == $needle) || ($strict && $val === $needle) ) {
			$path[] = $key;
			return $path;
		}
	}
	return false;
}

// WMS date cache class/object
class wmsDateCache{

	// Class variables
	var $layer, $cacheFile, $wmsURL, $cacheLife;
	
	// Default class constructor with default variables (can be changed to suit local environment)
	public function __construct(
		$layer,
		$cacheFile="./json/WMSDateCache/WMSDateCache.json",
		$wmsURL="http://rsg.pml.ac.uk/ncWMS/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0",
		$cacheLife=60
		//$cacheLife=86400
	){
		$this->layer = $layer;
		$this->cacheFile = $cacheFile;
		$this->wmsURL = $wmsURL;
		$this->cacheLife = $cacheLife;
	}
	
	public function createCache(){
		// Proceed to create the JSON cache file
		if (!file_exists($this->cacheFile) or (time() - filemtime($this->cacheFile) >= $this->cacheLife) ){
			$xml = new ParseXml();
			$xml->LoadRemote($this->wmsURL,$timeout=30); 
			// DEBUG
			echo("Returned XML string has length ".strlen($xml->GetXmlStr())." characters<br />");
			//$dataArray = $xml->ToArray(); 
			//note text() at the end doesnt work
			//ATTENTION: WMS NAMESPACE REGISTED IN LINE 106 of ParseXML.class
			$simpleXMLResult=$xml->doXPath("//wms:Layer[wms:Name/text()='".$this->layer."']/wms:Dimension[@name='time']/text()",$namespaces=array('wms'=>'http://www.opengis.net/wms'));
			// $simpleXMLResult=$xml->doXPath("//wms:Layer[wms:Name/text()='".$this->layer."']/wms:Dimension/text()",$namespaces=array('wms'=>'http://www.opengis.net/wms'));
			//DEBUG
			echo("Got the XML time dimension with a character count of ".strlen($simpleXMLResult[0][0])."<br />");			
			$timeDimension=trim($simpleXMLResult[0][0]);
			
			$timeDimensionArray=explode(",",$timeDimension);
			$fh=fopen($this->cacheFile,"w") or die("can't open file");
			//DEBUG
			echo("Time dimension array has ".count($timeDimensionArray)." members<br />");
			$jsonArr=json_encode($timeDimensionArray);
			//DEBUG
			echo("The serialised JSON data array has a character count of ".strlen($jsonArr)."<br /><hr />");
			$outStr='{"date":'.$jsonArr.'}'; //atention to ' and " otherwise JSON is not valid
			fwrite($fh,$outStr);
			fclose($fh);
			return $outStr;
			
		} else {
			//echo date("F d Y H:i:s.", filemtime($filename));
			$fh=fopen($this->cacheFile,"r") or die("can't open file");
			$outStr=fread($fh, filesize($this->cacheFile));
			fclose($fh);
			return $outStr;
		}			
	}
}
?>