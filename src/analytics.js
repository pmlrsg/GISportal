
gisportal.analytics = {}


gisportal.analytics.initGA = function(){
	
	//Load UA
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

	ga('create', gisportal.config.UATrackingId , 'auto');
	ga('send', 'pageview');
	
	gisportal.analytics.initDomEvents();
}

/**
* Adds events to the DOM. (requires the <body> to exist)
*/
gisportal.analytics.initDomEvents = function(){
	
	$( 'body' ).on( 'click' ,'.js-start, .panel-footer button', function(){
		ga('send', {
			'hitType': 'event',
			'eventCategory': 'Generic',
			'eventAction': 'Click',
			'eventLabel': $(this).text()
		});
	});
	
	
	
	// Someone drew a bounding box
	$('body').on( 'click', '.js-draw-box', function(){
		var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
		if( layer != null )
			gisportal.analytics.events.selectionBoxDrawn( layer )
	})
	
	// Someone typed a bounding box
	$('body').on( 'change', '.js-coordinates', function(){
		var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
		if( layer != null )
			gisportal.analytics.events.selectionBoxTyped( layer )
	})
	
	// Someone used the date range cool
	$('body').on( 'mouseup', '.range-slider[data-id]', function(){
		var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
		if( layer != null )
			gisportal.analytics.events.dataRangeUsed( layer )
	})
	
	
	// Changes to indicators
	$('body').on( 'change', '.indicator-option select, .indicator-select select', function(){
		var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
		if( layer != null )
			gisportal.analytics.events.layerChange( layer )
	})
	
	
	// Someone drew a bounding box
	$('body').on( 'click', '.js-draw-box', function(){
		var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
		if( layer != null )
			gisportal.analytics.events.selectionBoxDrawn( layer )
	})
	
	// User hides and openLayer
	$('body').on( 'mousedown', '.indicator-header .js-toggleVisibility.active', function(){
		var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
		if( layer != null )
			gisportal.analytics.events.showLayer( gisportal.layers[id] );
	})
	
	
	// User shows an openLayer
	$('body').on( 'mousedown', '.indicator-header .js-toggleVisibility:not(.active)', function(){
		var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
		if( layer != null )
			gisportal.analytics.events.hideLayer( gisportal.layers[id] );
	})
	
    
	
	// Adding an indicator panel
	$('body').on( 'click', '.js-toggleVisibility.active', function(){
		var microLayer = gisportal.microLayers[ $(this).data('id') ];
		gisportal.analytics.events.selectLayer( { name: $(this).data('name') } );
	})
	
	// Removing an indicator panel
	$('body').on( 'click', '.js-toggleVisibility:not(.active), .js-remove', function(){
		gisportal.analytics.events.deselectLayer( { name: $(this).data('name') } );
	})
	
	
	// Timeline events
	$('#timeline').on( 'mouseup', function(){
		gisportal.analytics.events.timelineUpdate();
		
		gisportal.layers.forEach(function( layer ){
			gisportal.analytics.events.layerChange( layer )
		})
	})
	
	
	// Created a graph button
	$('body').on( 'click', '.js-create-graph', function(){
		gisportal.analytics.createGraph( gisportal.layers[ $(this).data('id') ] )
	})
}

//Settigns for the custom dimesion ids and what the values shoudl be
gisportal.analytics.customDimensions  = {
	layerChange: {
		/**
		*  Layout:
		*     {{ cd_index : ( function(){} | predefined_function )
		*  Example:
		*     2 : 'indicator_name' //Call the indicator_name default function and apply to dimension 2
		*     3 : function( indicator ){ return indicator.name + "-" + indicator.id  } // Sets dimension 3 to the indicator name + id
		*/
		8: 'indicator_name',
		9: 'indicator_id',
		2: 'indicator_region',
		3: 'indicator_interval',
		7: 'indicator_confidence',
		4: 'indicator_elevation',
		5: 'indicator_layer_style',
		10:'indicator_year'
	},
	
	selectionBoxDrawn: {
		8: 'indicator_name',
		9: 'indicator_id',
		2: 'indicator_region',
		3: 'indicator_interval'
	},
	
	dateRangeUsed: {
		8: 'indicator_name',
		9: 'indicator_id',
		2: 'indicator_region',
		3: 'indicator_interval'
	},
	
	createGraph: {
		8: 'indicator_name',
		9: 'indicator_id',
		2: 'indicator_region',
		3: 'indicator_interval',
		6: 'graph_type'
	},
	
	
	//Does not a get a true gisportal.layer. Only: { 'name': 'Oxygen' }.
	selectLayer: {
		8: 'indicator_name'
	},
	
	//Does not a get a true gisportal.layer. Only: { 'name': 'Oxygen' }.
	deselectLayer: {
		8: 'indicator_name'
	},
	
	
	showLayer: {
		8: 'indicator_name'
	},
	
	hideLayer: {
		8: 'indicator_name'
	},
	
	timelineUpdate: {
		10: 'timeline_year'
	}
	
}

//A list of common functions used when tracking anayltics
gisportal.analytics.customDimensionFunctions= {
	//Indicator nice name
	'indicator_name': function( indicator ){ return indicator.name },
	
	//Indicator ID
	'indicator_id': function( indicator ){ return indicator.id },
	
	//Indicator region
	'indicator_region': function( indicator ){ return indicator.tags.region },
	
	//Indicator interval
	'indicator_interval': function( indicator ){ return indicator.tags.interval },
	
	//Indicator confidence
	'indicator_confidence': function( indicator ){ return indicator.tags.Confidence },
	
	//Indicator elevation
	'indicator_elevation': function( indicator ){
		var elevation = gisportal.layers.Oxy1.openlayers.anID.params.ELEVATION;
		if( typeof elevation == "string" && elevation != "" )
			return elevation;
		else
			return indicator.elevationDefault;
	},
	
	//Current year of the data thats showing
	'indicator_year': function( indicator ){
		return indicator.selectedDateTime.substr(0,4)
	},
	
	//Indicator Layer Style
	'indicator_layer_style': function( indicator ){
		var style = gisportal.layers.Oxy1.openlayers.anID.params.STYLES;
		if( typeof style == "string" && style != ""  )
			return style;
		else
			return indicator.styles[0].Name;
	},
	
	//Current year of the time line
	'timeline_year': function(){
		return gisportal.timeline.getDate().getFullYear()
	},
	
	'graph_type': function( indicator ){
		return $('#tab-' + gisportal.utils.nameToId( indicator.name ) + '-graph-type').val()
	},
};


/**
 * Logs a change in the gisportal.layer parameters 
 * 
 * @param {gisportal.layer} indicator - The layer object
 * @param {string} nameSet - The set of customDimesion indexes to read from the settings.
 */
gisportal.analytics.getCustomDimenstionValues = function( nameSet, indicator ){
	var indicator = indicator || {};
	var toSend = {};
	
	// Add our custom dimesions 
	var dimensionIndexKeys = Object.keys( gisportal.analytics.customDimensions[ nameSet ] );
	for( i in dimensionIndexKeys){
		var  dimensionIndex = dimensionIndexKeys[ i ];
	
		try{
			
			var mapped_name = gisportal.analytics.customDimensions[ nameSet ][ dimensionIndex ];
			
			if( typeof mapped_name == "function" )
				mapped_function = mapped_name;
			else if ( typeof mapped_name == "string" )
				var mapped_function  = gisportal.analytics.customDimensionFunctions[ mapped_name ]
			else
				throw "Not a valid key";
			
			var value = mapped_function( indicator );
			
			if( value != null && value.toString().length > 0 )
				toSend[ "dimension" + dimensionIndex ] = value.toString();
			
		}catch(e){
			console.log( "Error processing dimension " + dimensionIndex + ": " + e.toString() );
		};
		
	}
	
	return toSend;
	
}

gisportal.analytics.send = function( toSend ){
	if( toSend['eventLabel'] == void( 0 ) ){
		var buffer = [];
		
		for( var i in toSend ){
			if( toSend.hasOwnProperty( i ) == false )
				continue;
			
			buffer.push( toSend[ i ] );
		}
		
		toSend['eventLabel'] = buffer.join( '*' )
	}
	ga('send', toSend );
}

gisportal.analytics.events = {};
gisportal.analytics.events.pendingChanges = {};

//Events relating to choosing / changing indactor layers

//Called when a layer is added
gisportal.analytics.events.selectLayer = function( indicator ){
	var toSend = {
		'hitType': 'event',
		'eventCategory': 'Indicators',
		'eventAction': 'Add'
	};
	
	var CDs = gisportal.analytics.getCustomDimenstionValues( 'selectLayer', indicator  );
	
	toSend = $.extend( toSend, CDs );
	gisportal.analytics.send( toSend );
}

//Called when a layer is removed
gisportal.analytics.events.deselectLayer = function( indicator ){
	var toSend = {
		'hitType': 'event',
		'eventCategory': 'Indicators',
		'eventAction': 'Remove'
	};
	
	var CDs = gisportal.analytics.getCustomDimenstionValues( 'deselectLayer', indicator );
	
	toSend = $.extend( toSend, CDs );
	gisportal.analytics.send( toSend );
}

//Called when a the openLayer is hidden
gisportal.analytics.events.hideLayer = function( indicator ){
	var toSend = {
		'hitType': 'event',
		'eventCategory': 'Indicators',
		'eventAction': 'Remove'
	};
	
	var CDs = gisportal.analytics.getCustomDimenstionValues( 'selectLayer', indicator );
	
	toSend = $.extend( toSend, CDs );
	gisportal.analytics.send( toSend );
}

// Called when the open layer is show
gisportal.analytics.events.showLayer = function( indicator ){
	var toSend = {
		'hitType': 'event',
		'eventCategory': 'Indicators',
		'eventAction': 'Remove'
	};
	
	var CDs = gisportal.analytics.getCustomDimenstionValues( 'selectLayer', indicator );
	
	toSend = $.extend( toSend, CDs );
	gisportal.analytics.send( toSend );
}

// Called when the timeline is updated
gisportal.analytics.events.timelineUpdate = function(  ){
	var toSend = {
		'hitType': 'event',
		'eventCategory': 'Timeline',
		'eventAction': 'Date change'
	};
	
	var CDs = gisportal.analytics.getCustomDimenstionValues( 'timelineUpdate' );
	
	toSend = $.extend( toSend, CDs );
	gisportal.analytics.send( toSend );
}

/**
 * Logs a change in the gisportal.layer parameters. Includes timesline changes, region, internval, elevation, etc....
 * 
 * @param {gisportal.layer} indicator - The layer object
 * @param {boolean} avoidSetTimeout - Whether or not to avoid the setTimeout. Used internally for self recall.
 */
gisportal.analytics.events.layerChange = function( indicator, avoidSetTimeout ){
	
	var avoidSetTimeout = avoidSetTimeout || false;
	
	if( avoidSetTimeout == false ){
		//By using time outs it avoids logging states which users are just using as a steping stones to other states
		
		if( gisportal.analytics.events.pendingChanges[ 'layerChange-' + indicator.name ] != null )
			clearTimeout( gisportal.analytics.events.pendingChanges[ 'layerChange-' + indicator.name ] );
		
		gisportal.analytics.events.pendingChanges[ 'layerChange-' + indicator.name ] = setTimeout(function(){
			gisportal.analytics.events.layerChange( indicator, true );
		}, 10000);
	}
	
	var toSend = {
		'hitType': 'event',
		'eventCategory': 'Graph',
		'eventAction': 'Updated'
	};
	
	var CDs = gisportal.analytics.getCustomDimenstionValues( 'layerChange', indicator );
	
	toSend = $.extend( toSend, CDs );
	gisportal.analytics.send('send', toSend );
}


////// Events relateing to the graph

// Called when a used uses the the draw a bounding box tool
gisportal.analytics.events.selectionBoxDrawn = function( indicator ){
	var toSend = {
		'hitType': 'event',
		'eventCategory': 'Graph',
		'eventAction': 'Tool used',
		'eventLabel': 'Selection box'
	};
	
	var CDs = gisportal.analytics.getCustomDimenstionValues( 'selectionBoxDrawn', indicator );
	
	toSend = $.extend( toSend, CDs );
	gisportal.analytics.send( toSend );
}

// Called when a user manually inserts a bounding box
gisportal.analytics.events.selectionBoxTyped = function( indicator ){
	var toSend = {
		'hitType': 'event',
		'eventCategory': 'Graph',
		'eventAction': 'Tool used',
		'eventLabel': 'Selection box'
	};
	
	var CDs = gisportal.analytics.getCustomDimenstionValues( 'selectionBoxTyped', indicator );
	
	toSend = $.extend( toSend, CDs );
	gisportal.analytics.send( toSend );
}

// Called with the date range tool is used
gisportal.analytics.events.dateRangeUsed = function( indicator ){
	var toSend = {
		'hitType': 'event',
		'eventCategory': 'Graph',
		'eventAction': 'Tool used'
	};
	
	var CDs = gisportal.analytics.getCustomDimenstionValues( 'dateRangeUsed', indicator );
	
	toSend = $.extend( toSend, CDs );
	gisportal.analytics.send( toSend );
}

/*
* Called when a graph is actaully crated.
* Sends all the graph paramters
*/ 
gisportal.analytics.events.createGraph = function( indicator ){
	var toSend = {
		'hitType': 'event',
		'eventCategory': 'Graph',
		'eventAction': 'Created'
	};
	
	var CDs = gisportal.analytics.getCustomDimenstionValues( 'createGraph', indicator );
	
	toSend = $.extend( toSend, CDs );
	gisportal.analytics.send( toSend );
}