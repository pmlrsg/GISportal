var d3 = {};
d3.select = function(selector) {};
d3.selectAll = function(selector) {};

d3.selection = function(){}; //
d3.selection.enter = function() {};
d3.selection.exit = function() {};

d3.transition = function(selection){};//
d3.transition.delay = function(value) {};
d3.transition.duration = function(value) {};
d3.transition.ease = function(value) {};
d3.transition.attr = function(name, value) {};
d3.transition.attrTween = function(name, tween) {};
d3.transition.style = function(name, value, priority) {};
d3.transition.styleTween = function(name, tween, priority) {};
d3.transition.text = function(value) {};
d3.transition.select = function(query) {};
d3.transition.selectAll = function(query) {};
d3.transition.remove = function() {};
d3.transition.each = function(type, listener) {};

d3.interpolate = function(a, b) {};

d3.min = function(array, f) {};
d3.max = function(array, f) {};
d3.extent = function(array, f) {};
d3.sum = function(array, f) {};

d3.scale = {};
d3.scale.domain = function(dates) {};

// Quantitative
d3.scale.linear = function() {};
d3.scale.linear.domain = function(numbers) {};
d3.scale.linear.range = function(values) {};
d3.scale.linear.rangeRound = function(values) {};
d3.scale.linear.interpolate = function(factory) {};
d3.scale.linear.ticks = function(counts) {};

// Ordinal
d3.scale.ordinal = function() {};
d3.scale.category10 = function() {};
d3.scale.category20 = function() {};
d3.scale.category20b = function() {};
d3.scale.category20c = function() {};

d3.svg = {};
d3.svg.arc = function() {};
d3.svg.arc.innerRadius = function(v) {};
d3.svg.arc.outerRadius = function(v) {};
d3.svg.arc.startAngle = function(v) {};
d3.svg.arc.endAngle = function(v) {};
d3.svg.arc.centroid = function() {};

d3.layout = {};
d3.layout.histogram = function() {};
d3.layout.pie = function() {};
d3.layout.pie.value = function(x) {};
d3.layout.pie.sort = function(x) {};
d3.layout.pie.startAngle = function(x) {};
d3.layout.pie.endAngle = function(x) {};

d3.svg.line = function() {};
d3.svg.line.x = function(v) {};
d3.svg.line.y = function(v) {};
d3.svg.line.interpolate = function(v) {};
d3.svg.line.tension = function(v) {};

d3.svg.area = function() {};
d3.svg.area.x = function(x) {};
d3.svg.area.x0 = function(x) {};
d3.svg.area.x1 = function(x) {};
d3.svg.area.y = function(y) {};
d3.svg.area.y0 = function(y) {};
d3.svg.area.y1 = function(y) {};
d3.svg.area.interpolate = function(x) {};
d3.svg.area.tension = function(x) {};


//groups.select = function(selector) {};
//groups.selectAll = function(selector) {};
//groups.each = function(callback) {};
//groups.data = function(data, join) {};
//groups.on = function(type, listener, capture) {};
//groups.style = function(name, value, priority) {};
//groups.attr = function(name, value) {};
//groups.each = function(callback) {};
//groups.text = function(value) {};
//groups.append = function(name) {};
//groups.insert = function(name, before) {};
//groups.remove = function() {};
//groups.transition = function() {};
//groups.append = function(name) {};