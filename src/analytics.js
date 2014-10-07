
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
    //.replace ( "?", "" ) 
    // this is better, there might be a question mark inside
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
         'eventCategory': 'Generic',
         'eventAction': 'State loaded',
         'eventLabel': state
      });
   }
   
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
   
   
   $( 'body' ).on( 'click' ,'.examples a, .js-start', function(){
      ga('send', {
         'hitType': 'event',
         'eventCategory': 'Generic',
         'eventAction': 'Click',
         'eventLabel': 'Splash screen: ' + $(this).text().trim()
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

   
   
   // Timeline events
   $('#timeline').on( 'mouseup', function(){
      gisportal.analytics.events.timelineUpdate();
      
      for( i in gisportal.layers ){
         if( gisportal.layers.hasOwnProperty( i ) ){
            gisportal.analytics.events.layerChange( gisportal.layers[ i ] )
         }
      }
   })
   
   
   // Created a graph button
   $('body').on( 'click', '.js-create-graph', function(){
      gisportal.analytics.events.createGraph( gisportal.layers[ $(this).data('id') ] )
   })
   
   
   
   
   
   // Changes to an indicators seetings
   $('body').on( 'change', '.indicator-option select', function(){
      var layer = gisportal.layers[ $(this).closest('[data-id]').data('id') ];
      if( layer != null )
         gisportal.analytics.events.layerChange( layer )
   })
}

//Settigns for the custom dimesion ids and what the values shoudl be
gisportal.analytics.customDefinitions  = gisportal.config.analytics.customDefinitions;
gisportal.analytics.customDefinitionsUsedInEvents  = gisportal.config.analytics.customDefinitionsUsedInEvents;


//A list of common functions used when tracking anayltics
gisportal.analytics.customDefinitionFunctions= {
   //Indicator nice name
   'indicator_name': function( indicator ){ return indicator.name.toLowerCase(); },
   
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
      try{
         var elevation = indicator.openlayers.anID.params.ELEVATION;
         if( typeof elevation == "string" && elevation != "" )
            return elevation;
      }catch(e){};   
      return indicator.elevationDefault;
   },
   
   //Current year of the data thats showing
   'indicator_year': function( indicator ){
      return indicator.selectedDateTime.substr(0,4)
   },
   
   //Indicator Layer Style
   'indicator_layer_style': function( indicator ){
      try{
         var style = indicator.openlayers.anID.params.STYLES;
         if( typeof style == "string" && style != ""  )
            return style;
      }catch(e){};   
      return indicator.styles[0].Name;
   },
   
   //Current year of the time line
   'timeline_year': function(){
      return gisportal.timeline.getDate().getFullYear()
   },
   
   'graph_type': function( indicator ){
      return $('#tab-' + indicator.id + '-graph-type').val()
   },
   'used_in_layer': function( indicator ){
      return 1;
   },
   'used_in_graph': function( indicator ){
      return 1;
   },
   
   'click_location': function(  ){
      if( ! ( window.event instanceof MouseEvent) ) return;
      var click = window.event;
      var target = window.event.target
      
      function getPath( element, chain ){
          element = $(element);
          if( element.is( window.document )) return;
          
           var location = element.data( 'page_location' );
         if( location != null && location != "" )
            chain.unshift( location );
            
         getPath( element.parent(), chain );
      }
      
      var chain = [];
      getPath( target, chain );
      console.log( 'Click location:' + chain.join(' >> ') );
      return chain.join(' >> ');
   },
};


/**
 * Logs a change in the gisportal.layer parameters 
 * 
 * @param {gisportal.layer} indicator - The layer object
 * @param {string} nameSet - The set of customDimesion indexes to read from the settings.
 */
gisportal.analytics.getCustomDefinitionsValues = function( nameSet, indicator ){
   var indicator = indicator || {};
   var toSend = {};
   
   
   gisportal.analytics.customDefinitionsUsedInEvents[ nameSet ].forEach(function( customDefinitionKey ){
      try{
         var valueFunction = gisportal.analytics.customDefinitionFunctions[ customDefinitionKey ];
         var value = valueFunction( indicator );
         
         var definitionIndex = null;
         for( var i in gisportal.analytics.customDefinitions ){
            if( gisportal.analytics.customDefinitions.hasOwnProperty( i ) )
               if( gisportal.analytics.customDefinitions[i] == customDefinitionKey )
                  var definitionIndex = i;
         }
         if( definitionIndex == null ) throw "No custom definition defined.";
         
         if( value != null && value.toString().length > 0 ){
            if( definitionIndex.match( /cd[0-9]{1,2}/ ) )
               definitionIndex = 'dimension' + definitionIndex.substr(2);
            else if( definitionIndex.match( /cm[0-9]{1,2}/ ) )
               definitionIndex = 'metric' + definitionIndex.substr(2);
                  
            toSend[ definitionIndex ] = value.toString();
         }
      }catch(e){
          console.log( "Error processing definition " + customDefinitionKey + ": " + e.toString() );
      }
   })
   
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

/**
 * Logs a change in the gisportal.layer parameters. Includes timesline changes, region, internval, elevation, etc....
 * 
 * @param {gisportal.layer} indicator - The layer object
 * @param {boolean} avoidSetTimeout - Whether or not to avoid the setTimeout. Used internally for self recall.
 */
gisportal.analytics.events.layerChange = function( indicator ){
   if( gisportal.config.analytics.active == false ) return;
   
   var callSelf = function(){
      gisportal.analytics.events.layerChange( indicator );
   };
   
   var canRun = gisportal.analytics.avoidRepeat( 'layerChange-' + indicator.name.toLowerCase(),  callSelf , 3000 );
   
   if( canRun == false ) return;
   
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Indicators',
      'eventAction': 'Configure layer'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'layerChange', indicator );
   
   toSend = $.extend( toSend, CDs );
   gisportal.analytics.send( toSend );
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
gisportal.analytics.events.createGraph = function( indicator ){
   var toSend = {
      'hitType': 'event',
      'eventCategory': 'Graph',
      'eventAction': 'Created'
   };
   
   var CDs = gisportal.analytics.getCustomDefinitionsValues( 'createGraph', indicator );
   
   toSend = $.extend( toSend, CDs );
   gisportal.analytics.send( toSend );
}
