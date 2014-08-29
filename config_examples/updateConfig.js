#!/usr/bin/env node

/*
* Updates and combies the old wmsLayersTags.py and wmsServers.py into the new layers.py
*
*/

var currentDir = __dirname + '/';

var newConfigPath = currentDir + 'wmsLayers.py';

var fs = require('fs');
__dirname = "./";
var serverPython = fs.readFileSync( currentDir + 'wmsServers.py').toString().replace('#!/usr/bin/env python', '');
var layersPython = fs.readFileSync( currentDir + 'wmsLayerTags.py').toString().replace('#!/usr/bin/env python', '');

try{
	eval( serverPython );
}catch( e ){
	throw " wmsServers.py wasnt a valid file ";
}

try{
	eval( layersPython );
}catch( e ){
	throw " wmsLayerTags.py wasnt a valid file ";
}

var newList = [];

var map = {};

Object.keys( servers ).forEach(function( serverName ){
	var oldConfig = servers[serverName];
	
	var newServerConfig = {
		name: oldConfig.name,
		
		options: oldConfig.options,
		
		services: {
			wms: {
				url: oldConfig.url,
				params: {
					GetCapabilities: {
						'SERVICE': 'WMS',
						'request': 'GetCapabilities',
						'version': '1.3.0'
					}
					
				}
			},
			wcs: {
				url: oldConfig.wcsurl,
				params: {
					DescribeCoverage: {
						'SERVICE': 'WCS',
						'request': 'describeCoverage',
						'version': '1.0.0'
					}
					
				}
			}
		},
		indicators: {}
		
	};
	
	map[ oldConfig.name ] = newServerConfig;
	
	newList.push(newServerConfig);
	
});

console.log(map)

Object.keys( layers ).forEach(function( providerName ){

	var provider = layers[ providerName ];
	console.log(providerName)
	var serverConfig = map[ providerName ];
	
	if( ! serverConfig || ! provider )
		return;
	
	Object.keys( provider ).forEach(function( indicatorName ){
		var indicator = provider[ indicatorName ];
		//indicator.name = indicatorName;
		
		serverConfig.indicators[ indicatorName ] =  indicator ;
	})
	
});

var newConfig = "layers = " + JSON.stringify( newList , void(0), 3 );

if( fs.existsSync( newConfigPath ) )
	fs.unlinkSync( newConfigPath  );
fs.writeFileSync( newConfigPath , newConfig );