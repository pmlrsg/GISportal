<?php
/**
 *	@File name:	ParseXml.class.php
 *	@todo: 	parsing XML(string or file or url)
 *	@author:	zhys9 @ 2008-03-24 <email>zhys99@gmail.com</email>
 *	example:
 *	<code>
 *			$xml = new ParseXml();
 *			$xml->LoadFile("test.xml");
 *			//$xml->LoadString($xmlString);
 *			$dataArray = $xml->ToArray();
 *			print_r($dataArray);
 *	</code>
 */
 class ParseXml {
	var $xmlStr;
	var $xmlFile;
	var $obj;
	var $aArray;
	var $timeOut;
	var $charsetOutput;
	
	function ParseXml() {

	}
	
	/**
	 * @param String xmlString xml string to parsing
	 */
	function LoadString($xmlString) {
		$this->xmlStr = $xmlString;
	}
	
	/**
	 * @param String Path and file name which you want to parsing, 
	 *	Also, if fopen wrappers  is activated, you can fetch a remote document, but timeout not be supported.
	 */
	function LoadFile ($file) {
		$this->xmlFile = $file;
		$this->xmlStr = @file_get_contents($file);
	}
	
	/**
	 * @todo Load remote xml document
	 * @param string $url URL of xml document.
	 * @param int $timeout timeout  default:5s
	 */
	function LoadRemote ($url, $timeout=5) {
		$this->xmlFile = $url;
		$p=parse_url($url);
		if($p['scheme']=='http'){
			$host = $p['host'];
			$pos = $p['path'];
			$pos .= isset($p['query']) ? sprintf("?%s",$p['query']) : '';
			$port = isset($p['port'])?$p['port']:80;
			$this->xmlStr = $this->Async_file_get_contents($host, $pos, $port, $timeout);
		}else{
			return false;
		}
		
	}
	
	/**
	 * @todo Set attributes.
	 * @param array $set array('attribute_name'=>'value')
	 */
	function Set (array $set) {
		foreach($set as $attribute=>$value) {
			if($attribute=='charsetOutput'){
				$value = strtoupper($value);
			}
			$this->$attribute = $value;
		}
	}
	
	/**
	 * @todo Convert charset&#65292;if you want to output data with a charset not "UTF-8",
	 *	this member function must be useful.
	 * @param string $string &#38656;&#36716;&#25442;&#30340;&#23383;&#31526;&#20018;
	 */
	function ConvertCharset ($string) {
		if('UTF-8'!=$this->charsetOutput) {
			if(function_exists("iconv")){
				$string = iconv('UTF-8', $this->charsetOutput, $string);
			}elseif(function_exists("mb_convert_encoding")){
				$string = mb_convert_encoding($string, $this->charsetOutput, 'UTF-8');
			}else{
				die('Function "iconv" or "mb_convert_encoding" needed!');
			}
		}
		return $string;
	}
	
	/**
	 * &#35299;&#26512;xml
	 */
	function Parse () {
		$this->obj = simplexml_load_string($this->xmlStr);
	
	}
	
	function doXPath($str,$namespaces){
		if(empty($this->obj)){
			$this->Parse();
		}
		foreach ($namespaces as $key => $value){$this->obj->registerXPathNamespace($key, $value);}
		return $this->obj->xpath($str);
		
		
	}
	
	/**
	 * @return Array Result of parsing.
	 */
	function ToArray(){
		if(empty($this->obj)){
			$this->Parse();
		}
		$this->aArray = $this->Object2array($this->obj);
		return $this->aArray;
	}
	/*
	function doXpath(xpathStr){
	if(empty($this->obj)){
			$this->Parse();
		}
	//simplexml object	
	};
	*/
	
	/**
	 * @param Object object Objects you want convert to array.
	 * @return Array
	 */
	function Object2array($object) {
		$return = array();
		if(is_array($object)){
			foreach($object as $key => $value){
				$return[$key] = $this->Object2array($value);
			}
		}else{
			$var = get_object_vars($object);
			if($var){
				foreach($var as $key => $value){
					$return[$key] = ($key && ($value==null)) ? null : $this->Object2array($value);
				}
			}else{
				return $this->ConvertCharset((string)$object);
			}
		}
		return $return;
	}
	
	/**
	 * @todo Fetch a remote document with HTTP protect.
	 * @param string $site Server's IP/Domain
	 * @param string $pos URI to be requested
	 * @param int $port Port default:80
	 * @param int $timeout Timeout  default:5s
	 * @return string/false Data or FALSE when timeout.
	 */
	function Async_file_get_contents($site,$pos,$port=80,$timeout=5) {
		$fp = fsockopen($site, $port, $errno, $errstr, 5);
		
		if (!$fp) {
			return false;		
		}else{
			fwrite($fp, "GET $pos HTTP/1.0\r\n");
			fwrite($fp, "Host: $site\r\n\r\n");
			stream_set_timeout($fp, $timeout);
			$res = stream_get_contents($fp);
			$info = stream_get_meta_data($fp);
			fclose($fp);
			
			if ($info['timed_out']) {
				echo("oops, the XML request timed out...");
				return false;    	
			}else{
				echo("Got the XML with character count of".strlen($res));
				return substr(strstr($res, "\r\n\r\n"),4);
			}
		}
	}
	
	/**
	 * @todo Get xmlStr of current object.
	 * @return string xmlStr
	 */
	function GetXmlStr() {
		return $this->xmlStr;
	}
}
?>