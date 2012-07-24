// JavaScript Document
var format;
var WMSLayers;

function init() {

   url = "./wms-capabilities.php";
   $.getJSON(url, function(data) {
      $.each(data, function(i, item){
         if(item.Name && item.Name!="") {
            console.info("Layer--> Name:" + item.Name + " Title: " + item.Title + " Abstract: " + item.Abstract);				
         }
	   });
   });

   console.info("---------------------------------------------------------------");
   
	OpenLayers.ProxyHost= function(url) {
		return './Proxy.php?url=' + encodeURIComponent(url);
    };
	
/*    format = new OpenLayers.Format.WMSCapabilities({
    	version: "1.3.0"
    });
    OpenLayers.Request.GET({
        url: "http://rsg.pml.ac.uk/ncWMS/wms",
        params: {
            SERVICE: "WMS",
            VERSION: "1.3.0",
            REQUEST: "GetCapabilities"
        },
        success: function(request) {
            var doc = request.responseXML;
            if (!doc || !doc.documentElement) {
                doc = request.responseText;
            }
            var capabilities = format.read(doc);         
            var layers = capabilities.capability.layers;
			WMSLayers = layers;
            var layersStr = "";
            for(var i=0; i<layers.length; i++) {
            	if(layers[i].name && layers[i].name!="") {
					console.info("Layer--> Name:" + layers[i].name);					
            	}
            }
        }, 
        failure: function() {            
            OpenLayers.Console.error("...error...");
        }
    });*/
}
