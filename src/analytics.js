
gisportal.analytics = {}


gisportal.analytics.initGA = function(){
   if( gisportal.config.analytics.active == false ) return;
   
   
   //Load UA
   (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
   (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
   m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
   })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

   ga('create', gisportal.config.analytics.UATrackingId , 'auto');
   ga('send', 'pageview');
   
   gisportal.analytics.initDomEvents();
}


gisportal.analytics.getGetParam = function(val) {
    var result = "",
        tmp = [];
    location.search
    .substr(1)
        .split("&")
        .forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
    });
    return result;
}

/**
* Adds events to the DOM. (requires the <body> to exist)
*/
gisportal.analytics.initDomEvents = function(){
   var state = gisportal.analytics.getGetParam('state');
   if(  typeof state == 'string' && state != "" ){
      ga('send', {
         'hitType': 'event',
         'eventCategory': 'Start',
         'eventAction': 'State loaded',
         'eventLabel': state
      });
   }
   

   // Splash screen
   $( 'body' ).on( 'click' ,'.js-start, .js-load-last-state', function(){
      var eventLabel =  $(this).text().trim();

      ga('send', {
         'hitType': 'event',
         'eventCategory': 'Start',
         'eventAction': 'Click',
         'eventLabel': eventLabel
      });
   });
   
   
   $( 'body' ).on( 'click' ,'.panel-footer button, .js-hide-panel, .js-show-tools', function(){
      var eventLabel =  $(this).text().trim();
      
      if( $(this).hasClass('js-hide-panel') )
          eventLabel = "Hide tools";
      else if( $(this).hasClass('js-show-tools') )
          eventLabel = "Show tools";
      
      ga('send', {
         'hitType': 'event',
         'eventCategory': 'Generic',
         'eventAction': 'Click',
         'eventLabel': eventLabel
      });
   });
   
   
   // Someone drew a bounding box
   $('body').on( 'click', '.js-draw-box', function(){
      var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
      if( layer != null )
         gisportal.analytics.events.selectionBoxDrawn( layer )
   });

   // Someone drew a bounding box
   $('body').on( 'click', '.js-draw-polygon', function(){
      var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
      if( layer != null )
         gisportal.analytics.events.selectionPolygonDrawn( layer )
   });
   
   // Someone typed a bounding box
   $('body').on( 'change', '.js-coordinates', function(){
      var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
      if( layer != null )
         gisportal.analytics.events.selectionBoxTyped( layer )
   });
   
   gisportal.events.bind( 'layer.select', function( event, id ){
      var layer = gisportal.layers[ id ];
      gisportal.analytics.events.selectLayer( layer );
   });
   
   gisportal.events.bind( 'layer.remove', function( event, id ){
      var layer = gisportal.layers[ id ];
      gisportal.analytics.events.removeLayer( layer );
   });
   
   
}

//Settings for the custom dimensions ids and what the values should be
gisportal.analytics.customDefinitions  = gisportal.config.analytics.customDefinitions;

gisportal.analytics.customDefinitionsUsedInEvents = {
     
     
     createGraph: [
        'graph_type',
        'used_in_graph',
        'graph_components_count'
     ],
     
     
     selectLayer: [
        'indicator_name',
        'indicator_id',
        'indicator_region',
        'indicator_interval',
        'indicator_provider',
        'indicator_confidence'
     ],
     
     removeLayer: [
        'indicator_name',
        'indicator_id',
        'indicator_region',
        'indicator_interval',
        'indicator_provider',
        'indicator_confidence'
     ]
}


//A list of common functions used when tracking analytics
gisportal.analytics.customDefinitionFunctions = {
   //Indicator nice name
   'indicator_name': function( indicator ){ return indicator.name; },
   
   //Indicator ID
   'indicator_id': function( indicator ){ return indicator.id; },
   
   //Indicator region
   'indicator_region': function( indicator ){ return indicator.tags.region; },

   //Indicator provider
   'indicator_provider': function( indicator ){ return indicator.providerTag; },
   
   //Indicator interval
   'indicator_interval': function( indicator ){ return indicator.tags.interval; },
   
   //Indicator confidence
   'indicator_confidence': function( indicator ){ return indicator.tags.Confidence; },

   // Returns the plot type of any actively in use graph
   'graph_type': function( plot ){
       return plot.type();
   },

   // Returns the number of graph components in each graph
   'graph_components_count': function( plot ){
       return plot.components().length;
   },

   'used_in_layer': 1,
   'used_in_graph': 1
};


/**
 * Logs a change in the gisportal.layer parameters 
 * 
 * @param {gisportal.layer} indicator - The layer object
 * @param {string} nameSet - The set of customDimesion indexes to read from the settings.
 */
gisportal.analytics.getCustomDefinitionsValues = function( nameSet ){
   var indicator = indicator || {};
   var toSend = {};

   var paramaters = Array.prototype.slice.call(arguments, 1);
   
   function getDefinitionIndexFromKey( customDefinitionKey ){
      var definitionIndex = null;
      // Find the key in the object/array
      for( var i in gisportal.analytics.customDefinitions ){
         if( gisportal.analytics.customDefinitions.hasOwnProperty( i ) )
            if( gisportal.analytics.customDefinitions[i] == customDefinitionKey )
               var definitionIndex = i;
      }
      // If not key was found then error
      if( definitionIndex == null )
         throw "No custom definition defined.";

      // Expand the definition index from short to long
      if( definitionIndex.match( /cd[0-9]{1,2}/ ) )
         definitionIndex = 'dimension' + definitionIndex.substr(2);
      else if( definitionIndex.match( /cm[0-9]{1,2}/ ) )
         definitionIndex = 'metric' + definitionIndex.substr(2);

      return definitionIndex;
   }

   // Returns the value for a certain customDefinition parameter
   function getValueForDefinition( customDefinitionKey ){
      try{
         // Get the value for the definition
         var valueFunction = gisportal.analytics.customDefinitionFunctions[ customDefinitionKey ];
         var value = valueFunction.apply( indicator, paramaters );
         
         // Return if the value is exactly false
         if( value === false )
            return;

         // Get the index to send to GA
         definitionIndex = getDefinitionIndexFromKey( customDefinitionKey );
         
         // Set it into the object         
         toSend[ definitionIndex ] = value.toString();
      }catch(e){
         // Log the error and move on to the next
         //console.log( "Error processing definition " + customDefinitionKey + ": " + e.toString() );
      }
   }

   
   gisportal.analytics.customDefinitionsUsedInEvents[ nameSet ].forEach( getValueForDefinition )
   
   return toSend;
   
}

gisportal.analytics.send = function( toSend ){
   if( gisportal.config.analytics.active == false ) return;
   
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
gisportal.analytics.pendingChanges = [];

//Events relating to choosing / changing indactor layers

//Called when a layer is added
gisportal.analytics.events.selectLayer = function( indicator ){
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Indicators',
      'eventAction': 'Add'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'selectLayer', indicator  );
   
   toSend = $.extend( toSend, CDs );
   gisportal.analytics.send( toSend );
}

//Called when a layer is removed
gisportal.analytics.events.removeLayer = function( indicator ){
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Indicators',
      'eventAction': 'Remove'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'removeLayer', indicator );
   
   toSend = $.extend( toSend, CDs );
   gisportal.analytics.send( toSend );
}


// Called when a used uses the the draw a bounding box tool
gisportal.analytics.events.selectionBoxDrawn = function( indicator ){
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Graph',
      'eventAction': 'Tool used',
      'eventLabel': 'Selection box drawn'
   };
   gisportal.analytics.send( toSend );
}


// Called when a used uses the the draw a bounding box tool
gisportal.analytics.events.selectionPolygonDrawn = function( indicator ){
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Graph',
      'eventAction': 'Tool used',
      'eventLabel': 'Selection polygon drawn'
   };
   gisportal.analytics.send( toSend );
}



// Called when a user manually inserts a bounding box
gisportal.analytics.events.selectionBoxTyped = function( indicator ){
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Graph',
      'eventAction': 'Tool used',
      'eventLabel': 'Selection box typed'
   };
   gisportal.analytics.send( toSend );
}

/*
* Called when a graph is actaully crated.
* Sends all the graph paramters
*/ 
gisportal.analytics.events.createGraph = function( plot ){
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Graph',
      'eventAction': 'Created'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'createGraph', plot );
   
   toSend = $.extend( toSend, CDs );
   gisportal.analytics.send( toSend );
}
