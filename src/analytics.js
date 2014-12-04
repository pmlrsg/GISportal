
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
         gisportal.analytics.events.dateRangeUsed( layer )
   })
   
   
   
   // User hides and openLayer
   $('body').on( 'mousedown', '.indicator-header .js-toggleVisibility:not(.active)', function(){
      var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
      if( layer != null )
         gisportal.analytics.events.showLayer( layer );
   })
   
   
   // User shows an openLayer
   $('body').on( 'mousedown', '.indicator-header .js-toggleVisibility.active', function(){
      var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
      if( layer != null )
         gisportal.analytics.events.hideLayer( layer );
   })
   
    
   
   // Adding an indicator panel
   $('body').on( 'click', '#configurePanel .js-toggleVisibility.active', function(){
      var layer = gisportal.layers[ $(this).data('id') ];
      gisportal.analytics.events.selectLayer( { name: $(this).data('name') } );
   })


   
   // Created a graph button
   $('body').on( 'click', '.js-create-graph', function(){
      gisportal.analytics.events.createGraph( gisportal.layers[ $(this).data('id') ] );
   });
   
   
}

//Settigns for the custom dimesion ids and what the values shoudl be
gisportal.analytics.customDefinitions  = gisportal.config.analytics.customDefinitions;
gisportal.analytics.customDefinitionsUsedInEvents  = gisportal.config.analytics.customDefinitionsUsedInEvents;



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
         var value = valueFunction.call( indicator, paramaters );
         
         // Return if the value is exactly false
         if( value === false )
            return;

         // Get the index to send to GA
         definitionIndex = getDefinitionIndexFromKey( customDefinitionKey );
         
         // Set it into the object         
         toSend[ definitionIndex ] = value.toString();
      }catch(e){
         // Log the error and move on to the next
         console.log( "Error processing definition " + customDefinitionKey + ": " + e.toString() );
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
gisportal.analytics.events.deselectLayer = function( indicator ){
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Indicators',
      'eventAction': 'Remove'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'deselectLayer', indicator );
   
   toSend = $.extend( toSend, CDs );
   gisportal.analytics.send( toSend );
}

//Called when a the openLayer is hidden
gisportal.analytics.events.hideLayer = function( indicator ){
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Indicators',
      'eventAction': 'Hide'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'hideLayer', indicator );
   
   toSend = $.extend( toSend, CDs );
   gisportal.analytics.send( toSend );
}

// Called when the open layer is show
gisportal.analytics.events.showLayer = function( indicator ){
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Indicators',
      'eventAction': 'Show'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'showLayer', indicator );
   
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
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'timelineUpdate' );
   
   toSend = $.extend( toSend, CDs );
   gisportal.analytics.send( toSend );
}


/*
* Can be used to make sure events only fire at the end of a "perod"
* This will stop lots of events being fired for what you would consider a single action.
* 
* @param {string} key A key to use for unqiueness
* @param {Function} func A function to call back, also used for unqiueness
* @param {int} int A long to wait before a "period" ends
* @return {boolean} Tells the calling function if it is allowed to run
*/
gisportal.analytics.avoidRepeat = function(key,  func, length ){
   
   var pendingChanges = gisportal.analytics.pendingChanges;
   
   // Look at the current list of pending changes
   for( i in pendingChanges ){
      var change = pendingChanges[i];
      
      //Find the current list
      if( change.key == key ){
         
         // Has it been allowed to run ?
         if( change.allow == true ){
            
            //Remove it from the list
            pendingChanges.splice( i, 1 );
            
            // Tells the calling function to run
            return true;
         }
         
         // Rest the time out
         clearTimeout( change.timeout );
         
         change.timeout = setTimeout( function(){
            change.allow = true;
            change.func();
         }, length );
         
         // Tells the calling function not to run
         return false;
      }
   }
   
   // If its not already in the pendingChanges que add it
   gisportal.analytics.pendingChanges.push( {
      func: func,
      key: key,
      timeout: -1,
      allow: false
   } );
   
   // Triggers the timeout
   gisportal.analytics.avoidRepeat(key,  func, length );
   
   // Tells the calling function not to run
   return false;
}



////// Events relateing to the graph

// Called when a used uses the the draw a bounding box tool
gisportal.analytics.events.selectionBoxDrawn = function( indicator ){
   
   var callSelf = function(){
      gisportal.analytics.events.selectionBoxDrawn( indicator );
   };
   var canRun = gisportal.analytics.avoidRepeat( 'selectionBoxDrawn' + indicator.name, callSelf,  1000 );
   
   if( canRun == false ) return;
   
   
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Graph',
      'eventAction': 'Tool used',
      'eventLabel': 'Selection box drawn'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'selectionBoxDrawn', indicator );
   
   toSend = $.extend( toSend, CDs );
   gisportal.analytics.send( toSend );
}

// Called when a user manually inserts a bounding box
gisportal.analytics.events.selectionBoxTyped = function( indicator ){
   
   
   var callSelf = function(){
      gisportal.analytics.events.selectionBoxTyped( indicator );
   };
   var canRun = gisportal.analytics.avoidRepeat( 'selectionBoxTyped' + indicator.name, callSelf,  1000 );
   
   if( canRun == false ) return;
   
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Graph',
      'eventAction': 'Tool used',
      'eventLabel': 'Selection box typed'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'selectionBoxTyped', indicator );
   
   toSend = $.extend( toSend, CDs );
   gisportal.analytics.send( toSend );
}

// Called with the date range tool is used
gisportal.analytics.events.dateRangeUsed = function( indicator ){
   
   var callSelf = function(){
      gisportal.analytics.events.dateRangeUsed( indicator );
   };
   var canRun = gisportal.analytics.avoidRepeat( 'dateRangeUsed' + indicator.name, callSelf,  1000 );
   
   if( canRun == false ) return;
   
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Graph',
      'eventAction': 'Tool used'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'dateRangeUsed', indicator );
   
   toSend = $.extend( toSend, CDs );
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
