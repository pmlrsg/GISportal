$wmsURL="http://rsg.pml.ac.uk/ncWMS/wms?";
$wmsGetCapabilites = $wmsURL."SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";

$str = file_get_contents($wmsGetCapabilites);
$xml = simplexml_load_string( $str );


$returnArray = array();

foreach($xml->Capability->Layer->Layer as $child) { 	
	if (strlen(strpos($child->Name, "postgis:")) > 0 ) { 
  		array_push($returnArray, array('name' => (string)$child->Name, 'title' => (string)$child->Title));
 	}
}

echo json_encode($returnArray);
