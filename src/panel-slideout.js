gisportal.panelSlideout = {};



gisportal.panelSlideout.initDOM = function(  ){

	function findRelatedSlideoutName( buttonElement ){

		var slideoutName = $(this).data('slideout-name');

		if( slideoutName )
			return slideoutName;
		else
			return $( buttonElement ).closest('[data-slideout-name]').data('slideout-name');
	}

	$('body')
		.on( 'click', '.js-slideout-open', function(){
			var slideoutName = findRelatedSlideoutName( this );
			gisportal.panelSlideout.openSlideout( slideoutName );
		})
		.on( 'click', '.js-slideout-close', function(){
			var slideoutName = findRelatedSlideoutName( this );
			gisportal.panelSlideout.closeSlideout( slideoutName );
		})
		.on( 'click', '.js-slideout-peak', function(){
			var slideoutName = findRelatedSlideoutName( this );
			gisportal.panelSlideout.peakSlideout( slideoutName );
		});


}
function findRelatedSlideoutName( slideoutName ){

	var slideout = $('[data-slideout-name="' + slideoutName + '"]');

	if( slideout.length == 0 )
		throw new Error("Could not find panel related to that button");
	else
		return slideout;
}



gisportal.panelSlideout.openSlideout = function( slideoutName ){
	var slideout = findRelatedSlideoutName( slideoutName );
	slideout.addClass( 'show-all' ).removeClass( 'show-peak' );
}


gisportal.panelSlideout.closeSlideout = function( slideoutName ){
	var slideout = findRelatedSlideoutName( slideoutName );
	slideout.removeClass( 'show-all show-peak' );
}


gisportal.panelSlideout.peakSlideout = function( slideoutName ){
	var slideout = findRelatedSlideoutName( slideoutName );
	slideout.addClass( 'show-peak' ).removeClass( 'show-all' );
}