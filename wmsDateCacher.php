<?php 
// PHP Cache system 
//NO INPUT FROM OUTSIDE JUST REPLY OF JSON OBJECT

//getCapabilities request of WMS
$wmsURL="http://192.171.162.66/ncWMS/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";
//layer to process
$layer="MYOCEAN_MODIS_NWS_DAILY/chl_oc5";
//file where json will be dumped
$cacheFile="./cacheFileDate.json";
//how long the cache will last
//$cacheLife=60*60*24; //caching time in seconds,1 day cache
$cacheLife=60*60*24;
require './ParseXml.class.php'; 

#XPATH in Python's lxml
#doc.xpath("//wms:Layer[wms:Name/text()='MYOCEAN_MODIS_NWS_DAILY/chl_oc5']/wms:Dimension/text()",namespaces={'wms': 'http://www.opengis.net/wms'}) 

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

function splitTime(&$val)
{$tmp = explode("T",$val);
 $val=$tmp[0];
}


if (!file_exists($cacheFile) or (time() - filemtime($cacheFile) >= $cacheLife) ){
	$xml = new ParseXml();
	$xml->LoadRemote($wmsURL,$timeout=5); 
	#$dataArray = $xml->ToArray(); 
	//note text() at the end doesnt work
	//ATTENTION: WMS NAMESPACE REGISTED IN LINE 106 of ParseXML.class
	$simpleXMLResult=$xml->doXPath("//wms:Layer[wms:Name/text()='".$layer."']/wms:Dimension/text()",$namespaces=array('wms'=>'http://www.opengis.net/wms'));
	$timeDimension=trim($simpleXMLResult[0][0]);
	
	$timeDimensionArray=explode(",",$timeDimension);
	array_walk($timeDimensionArray, 'splitTime'); 
	$fh=fopen($cacheFile,"w") or die("can't open file");
	$jsonArr=json_encode($timeDimensionArray);
	$outStr='{"date":'.$jsonArr.'}'; //atention to ' and " otherwise JSON is not valid
	fwrite($fh,$outStr);
	fclose($fh);
	echo $outStr;
	
} else {
	//echo date("F d Y H:i:s.", filemtime($filename));
	$fh=fopen($cacheFile,"r") or die("can't open file");
	$outStr=fread($fh, filesize($cacheFile));
	fclose($fh);
	echo $outStr;
	}
?>