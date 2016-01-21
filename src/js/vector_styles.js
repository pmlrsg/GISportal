







gisportal.vectorStyles = {};

gisportal.vectorStyles.coloursInUse = [];

gisportal.vectorStyles.binSize = 10;

gisportal.vectorStyles.createOLStyle = function(options){
	

	var defaults = {
        
        styleType: null, //  one from [numerical, catagorised]
        parameter: null, // the vector feature parameter to be styled
        catagories: null, // if styleType is catagories this should be array of catagories ["catagory1","catagory2"]
        vectorType: "polygon", // one from [point|polygon|line],
        preferredColour: null // if a preffered colour is selected provide it here as rgba string "rgba(125,125,125,0.5)"
       
    };


    var opts = $.extend({}, defaults, options);

    //console.log(opts);

};

gisportal.vectorStyles.createPalette = function(startingColour, steps){

	if (startingColour in gisportal.vectorStyles.startingColours)
		var startColour = gisportal.vectorStyles.startingColours[startingColour];
	else
		return false

	var tintFactor = 0.5 / steps;
	var currentR = startColour['r'];
	var currentG = startColour['g'];
	var currentB = startColour['b'];
	var palette = [];
	var x = 1
	for(var x;x <= steps;x++){

		currentR = Math.floor(currentR + (255 - currentR) * (tintFactor * x));
		currentG = Math.floor(currentG + (255 - currentG) * (tintFactor * x));
		currentB = Math.floor(currentB + (255 - currentB) * (tintFactor * x));
		newFull = "rgba("+currentR+","+currentG+","+currentB+",1)";
		palette.push(newFull);

	};

	return palette;

}

gisportal.vectorStyles.startingColours = {
	"basic_purple" : {
		"rgba" : "rgba(38, 3, 57,1)",
		"r" : 38,
		"g" : 3,
		"b" : 57,
		"a" : 1
	},
	"basic_green" : {
		"rgba" : "rgba(0,150,0,1)",
		"r" : 0,
		"g" : 150,
		"b" : 0,
		"a" : 1
	},
	"basic_red" : {
		"rgba" : "rgba(188,0,0,1)",
		"r" : 188,
		"g" : 0,
		"b" : 0,
		"a" : 1
	},
	"basic_blue" : {
		"rgba" : "rgba(5,2,175,1)",
		"r" : 5,
		"g" : 2,
		"b" : 175,
                "a" : 1 
	},
        "basic_orange" : {
		"rgba" : "rgba(255,116,0,1)",
                "r" : 255,
                "g" : 116,
                "b" : 0,
                "a" : 1
        },
        "bright_green" : {
                "rgba" : "rgba(161,242,0,1)",
                "r" : 161,
               	"g" : 242,
            	"b" : 0,
                "a" : 1
        }
}


gisportal.vectorStyles.defaultLine = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 200, 1.0)',
        width: 1
    })
});

gisportal.vectorStyles.defaultPoly =   new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 255, 0.5)',
      width: 2
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 255, 0.1)'
    })
})

gisportal.vectorStyles.genColour = function(opacity) {
      var r = Math.floor(Math.random() * (255 - 0) + 0);
      var g = Math.floor(Math.random() * (255 - 0) + 0);
      var b = Math.floor(Math.random() * (255 - 0) + 0);
    var colour = 'rgba('+ r.toString() +',' + g.toString() +',' + b.toString() + ',' +opacity.toString() + ')'
    //console.log(colour);
    return colour
};


gisportal.vectorStyles.cache = {};
