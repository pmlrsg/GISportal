// osg-debug-0.0.5.js commit aa4baa76d9e1577ec065b533c5b9bd3df32fdeb2 - http://github.com/cedricpinson/osgjs
/** -*- compile-command: "jslint-cli osg.js" -*- */
var osg = {};

osg.version = '0.0.5';
osg.copyright = 'Cedric Pinson - cedric.pinson@plopbyte.com';
osg.instance = 0;
osg.version = 0;
osg.log = function(str) {
    if (window.console !== undefined) {
        window.console.log(str);
    }
};
osg.reportErrorGL = false;

osg.init = function() {
};

osg.checkError = function(error) {
    if (error === 0) {
        return;
    }
    if (error === 0x0500) {
        osg.log("detected error INVALID_ENUM");
    } else if (error === 0x0501) {
        osg.log("detected error INVALID_VALUE");
    } else if (error === 0x0502) {
        osg.log("detected error INVALID_OPERATION");
    } else if (error === 0x0505) {
        osg.log("detected error OUT_OF_MEMORY");
    } else if (error === 0x0506) {
        osg.log("detected error INVALID_FRAMEBUFFER_OPERATION");
    } else {
        osg.log("detected error UNKNOWN");
    }
};

// from jquery
osg.extend = function() {
    // Save a reference to some core methods
    var toString = Object.prototype.toString,
    hasOwnProperty = Object.prototype.hasOwnProperty;

    var isFunction = function(obj) {
        return toString.call(obj) === "[object Function]";
    };
    var isArray = function( obj ) {
	return toString.call(obj) === "[object Array]";
    };
    var isPlainObject = function( obj ) {
	// Must be an Object.
	// Because of IE, we also have to check the presence of the constructor property.
	// Make sure that DOM nodes and window objects don't pass through, as well
	if ( !obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval ) {
	    return false;
	}
	
	// Not own constructor property must be Object
	if ( obj.constructor && 
             !hasOwnProperty.call(obj, "constructor") && 
             !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf") ) {
	    return false;
	}
	
	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	
	var key;
	for ( key in obj ) {}
	
	return key === undefined || hasOwnProperty.call( obj, key );
    };

    // copy reference to target object
    var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

    // Handle a deep copy situation
    if ( typeof target === "boolean" ) {
	deep = target;
	target = arguments[1] || {};
	// skip the boolean and the target
	i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== "object" && !isFunction(target) ) {
	target = {};
    }

    // extend jQuery itself if only one argument is passed
    if ( length === i ) {
	target = this;
	--i;
    }

    for ( ; i < length; i++ ) {
	// Only deal with non-null/undefined values
	if ( (options = arguments[ i ]) != null ) {
	    // Extend the base object
	    for ( name in options ) {
		src = target[ name ];
		copy = options[ name ];

		// Prevent never-ending loop
		if ( target === copy ) {
		    continue;
		}

		// Recurse if we're merging object literal values or arrays
		if ( deep && copy && ( isPlainObject(copy) || isArray(copy) ) ) {
		    var clone = src && ( isPlainObject(src) || isArray(src) ) ? src
			: isArray(copy) ? [] : {};

		    // Never move original objects, clone them
		    target[ name ] = osg.extend( deep, clone, copy );

		    // Don't bring in undefined values
		} else if ( copy !== undefined ) {
		    target[ name ] = copy;
		}
	    }
	}
    }

    // Return the modified object
    return target;
};


osg.objectInehrit = function(base, extras) {
    function F(){}
    F.prototype = base;
    var obj = new F();
    if(extras)  {osg.objectMix(obj, extras, false); }
    return obj;
};
osg.objectMix = function(obj, properties, test){
    for (var key in properties) {
        if(!(test && obj[key])) { obj[key] = properties[key]; }
    }
    return obj;
};

osg.objectType = {};
osg.objectType.type = 0;
osg.objectType.generate = function(arg) {
    var t = osg.objectType.type;
    osg.objectType[t] = arg;
    osg.objectType[arg] = t;
    osg.objectType.type += 1;
    return t;
};

osg.Float32Array = Float32Array;
osg.Int32Array = Int32Array;
osg.Uint16Array = Uint16Array;


/** @class Vec2 Operations */
osg.Vec2 = {
    copy: function(a, r) {
        r[0] = a[0];
        r[1] = a[1];
        return r;
    },

    valid: function(a) {
        if (isNaN(a[0])) {
            return false;
        }
        if (isNaN(a[1])) {
            return false;
        }
        return true;
    },

    mult: function(a, b, r) {
        r[0] = a[0] * b;
        r[1] = a[1] * b;
        return r;
    },

    length2: function(a) {
        return a[0]*a[0] + a[1]*a[1];
    },

    length: function(a) {
        return Math.sqrt( a[0]*a[0] + a[1]* a[1]);
    },

    /** 
        normalize an Array of 2 elements and write it in r
     */
    normalize: function(a, r) {
        var norm = this.length2(a);
        if (norm > 0.0) {
            var inv = 1.0/Math.sqrt(norm);
            r[0] = a[0] * inv;
            r[1] = a[1] * inv;
        } else {
            r[0] = a[0];
            r[1] = a[1];
        }
        return r;
    },

    /** 
        Compute the dot product 
    */
    dot: function(a, b) {
        return a[0]*b[0]+a[1]*b[1];
    },

    /**
       Compute a - b and put the result in r
     */
    sub: function(a, b, r) {
        r[0] = a[0]-b[0];
        r[1] = a[1]-b[1];
        return r;
    },

    add: function(a, b, r) {
        r[0] = a[0]+b[0];
        r[1] = a[1]+b[1];
        return r;
    },

    neg: function(a, r) {
        r[0] = -a[0];
        r[1] = -a[1];
        return r;
    },

    lerp: function(t, a, b, r) {
        var tmp = 1.0-t;
        r[0] = a[0]*tmp + t*b[0];
        r[1] = a[1]*tmp + t*b[1];
        return r;
    }

};
/** @class Vec3 Operations */
osg.Vec3 = {
    copy: function(a, r) {
        r[0] = a[0];
        r[1] = a[1];
        r[2] = a[2];
        return r;
    },

    cross: function(a, b, r) {
        r[0] = a[1]*b[2]-a[2]*b[1];
        r[1] = a[2]*b[0]-a[0]*b[2];
        r[2] = a[0]*b[1]-a[1]*b[0];
        return r;
    },

    valid: function(a) {
        if (isNaN(a[0])) {
            return false;
        }
        if (isNaN(a[1])) {
            return false;
        }
        if (isNaN(a[2])) {
            return false;
        }
        return true;
    },

    mult: function(a, b, r) {
        r[0] = a[0] * b;
        r[1] = a[1] * b;
        r[2] = a[2] * b;
        return r;
    },

    length2: function(a) {
        return a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
    },

    length: function(a) {
        return Math.sqrt( a[0]*a[0] + a[1]* a[1] + a[2]*a[2] );
    },

    normalize: function(a, r) {
        var norm = this.length2(a);
        if (norm > 0.0) {
            var inv = 1.0/Math.sqrt(norm);
            r[0] = a[0] * inv;
            r[1] = a[1] * inv;
            r[2] = a[2] * inv;
        } else {
            r[0] = a[0];
            r[1] = a[1];
            r[2] = a[2];
        }
        return r;
    },

    dot: function(a, b) {
        return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    },

    sub: function(a, b, r) {
        r[0] = a[0]-b[0];
        r[1] = a[1]-b[1];
        r[2] = a[2]-b[2];
        return r;
    },

    add: function(a, b, r) {
        r[0] = a[0]+b[0];
        r[1] = a[1]+b[1];
        r[2] = a[2]+b[2];
        return r;
    },

    neg: function(a, r) {
        r[0] = -a[0];
        r[1] = -a[1];
        r[2] = -a[2];
        return r;
    },

    lerp: function(t, a, b, r) {
        var tmp = 1.0-t;
        r[0] = a[0]*tmp + t*b[0];
        r[1] = a[1]*tmp + t*b[1];
        r[2] = a[2]*tmp + t*b[2];
        return r;
    }

};



/** @class Vec4 Operations */
osg.Vec4 = {

    dot: function(a, b) {
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
    },

    copy: function(a, r) {
        r[0] = a[0];
        r[1] = a[1];
        r[2] = a[2];
        r[3] = a[3];
        return r;
    },

    sub: function(a, b, r) {
        r[0] = a[0] - b[0];
        r[1] = a[1] - b[1];
        r[2] = a[2] - b[2];
        r[3] = a[3] - b[3];
        return r;
    },

    mult: function(a, b, result) {
        r[0] = a[0] * b;
        r[1] = a[1] * b;
        r[2] = a[2] * b;
        r[3] = a[3] * b;
        return r;
    },

    add: function(a, b, r) {
        r[0] = a[0] + b[0];
        r[1] = a[1] + b[1];
        r[2] = a[2] + b[2];
        r[3] = a[3] + b[3];
        return r;
    },

    neg: function(a, r) {
        r[0] = -a[0];
        r[1] = -a[1];
        r[2] = -a[2];
        r[3] = -a[3];
        return r;
    },

    lerp: function(t, a, b, r) {
        var tmp = 1.0-t;
        r[0] = a[0]*tmp + t*b[0];
        r[1] = a[1]*tmp + t*b[1];
        r[2] = a[2]*tmp + t*b[2];
        r[3] = a[3]*tmp + t*b[3];
        return r;
    }
};


/** @class Matrix Operations */
osg.Matrix = {
    setRow: function(matrix, row, v0, v1, v2, v3) {
        var rowIndex = row*4;
        matrix[rowIndex + 0 ] = v0;
        matrix[rowIndex + 1 ] = v1;
        matrix[rowIndex + 2 ] = v2;
        matrix[rowIndex + 3 ] = v3;
    },
    innerProduct: function(a, b, r, c) {
        var rIndex = r * 4;
        return ((a[rIndex + 0] * b[0 + c]) + (a[rIndex + 1] * b[4 + c]) + (a[rIndex +2] * b[8 + c]) + (a[rIndex + 3] * b[12 + c]));
    },

    set: function(matrix, row, col, value) {
        matrix[row * 4 + col] = value;
	return value;
    },

    get: function(matrix, row, col) {
        return matrix[row * 4 + col];
    },

    makeIdentity: function(matrix) {
        if (matrix === undefined) {
            matrix = [];
        }
        osg.Matrix.setRow(matrix, 0,    1, 0, 0, 0 );
        osg.Matrix.setRow(matrix, 1,    0, 1, 0, 0 );
        osg.Matrix.setRow(matrix, 2,    0, 0, 1, 0 );
        osg.Matrix.setRow(matrix, 3,    0, 0, 0, 1 );
        return matrix;
    },

    /**
     * @param {Number} x position
     * @param {Number} y position
     * @param {Number} z position
     * @param {Array} matrix to write result
     */
    makeTranslate: function(x, y, z, matrix) {
        if (matrix === undefined) {
            matrix = [];
        }
        osg.Matrix.setRow(matrix, 0,    1, 0, 0, 0 );
        osg.Matrix.setRow(matrix, 1,    0, 1, 0, 0 );
        osg.Matrix.setRow(matrix, 2,    0, 0, 1, 0 );
        osg.Matrix.setRow(matrix, 3,    x, y, z, 1 );
        return matrix;
    },

    setTrans: function(matrix, x, y, z) {
        matrix[12] = x;
        matrix[13] = y;
        matrix[14] = z;
        return matrix;
    },

    getTrans: function(matrix, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = matrix[12];
        result[1] = matrix[13];
        result[2] = matrix[14];
        return result;
    },

    // do a * b and result in a
    preMult: function(a, b) {
        var atmp0, atmp1, atmp2, atmp3;

        atmp0 = (b[0] * a[0]) + (b[1] * a[4]) + (b[2] * a[8]) + (b[3] * a[12]);
        atmp1 = (b[4] * a[0]) + (b[5] * a[4]) + (b[6] * a[8]) + (b[7] * a[12]);
        atmp2 = (b[8] * a[0]) + (b[9] * a[4]) + (b[10] * a[8]) + (b[11] * a[12]);
        atmp3 = (b[12] * a[0]) + (b[13] * a[4]) + (b[14] * a[8]) + (b[15] * a[12]);
        a[0]  = atmp0;
        a[4]  = atmp1;
        a[8]  = atmp2;
        a[12] = atmp3;

        atmp0 = (b[0] * a[1]) + (b[1] * a[5]) + (b[2] * a[9]) + (b[3] * a[13]);
        atmp1 = (b[4] * a[1]) + (b[5] * a[5]) + (b[6] * a[9]) + (b[7] * a[13]);
        atmp2 = (b[8] * a[1]) + (b[9] * a[5]) + (b[10] * a[9]) + (b[11] * a[13]);
        atmp3 = (b[12] * a[1]) + (b[13] * a[5]) + (b[14] * a[9]) + (b[15] * a[13]);
        a[1]  = atmp0;
        a[5]  = atmp1;
        a[9]  = atmp2;
        a[13] = atmp3;

        atmp0 = (b[0] * a[2]) + (b[1] * a[6]) + (b[2] * a[10]) + (b[3] * a[14]);
        atmp1 = (b[4] * a[2]) + (b[5] * a[6]) + (b[6] * a[10]) + (b[7] * a[14]);
        atmp2 = (b[8] * a[2]) + (b[9] * a[6]) + (b[10] * a[10]) + (b[11] * a[14]);
        atmp3 = (b[12] * a[2]) + (b[13] * a[6]) + (b[14] * a[10]) + (b[15] * a[14]);
        a[2]  = atmp0;
        a[6]  = atmp1;
        a[10] = atmp2;
        a[14] = atmp3;

        atmp0 = (b[0] * a[3]) + (b[1] * a[7]) + (b[2] * a[11]) + (b[3] * a[15]);
        atmp1 = (b[4] * a[3]) + (b[5] * a[7]) + (b[6] * a[11]) + (b[7] * a[15]);
        atmp2 = (b[8] * a[3]) + (b[9] * a[7]) + (b[10] * a[11]) + (b[11] * a[15]);
        atmp3 = (b[12] * a[3]) + (b[13] * a[7]) + (b[14] * a[11]) + (b[15] * a[15]);
        a[3]  = atmp0;
        a[7]  = atmp1;
        a[11] = atmp2;
        a[15] = atmp3;

        return a;
    },

    // do a * b and result in b
    postMult: function(a, b) {
        // post mult
        btmp0 = (b[0] * a[0]) + (b[1] * a[4]) + (b[2] * a[8]) + (b[3] * a[12]);
        btmp1 = (b[0] * a[1]) + (b[1] * a[5]) + (b[2] * a[9]) + (b[3] * a[13]);
        btmp2 = (b[0] * a[2]) + (b[1] * a[6]) + (b[2] * a[10]) + (b[3] * a[14]);
        btmp3 = (b[0] * a[3]) + (b[1] * a[7]) + (b[2] * a[11]) + (b[3] * a[15]);
        b[0 ] = btmp0;
        b[1 ] = btmp1;
        b[2 ] = btmp2;
        b[3 ] = btmp3;

        btmp0 = (b[4] * a[0]) + (b[5] * a[4]) + (b[6] * a[8]) + (b[7] * a[12]);
        btmp1 = (b[4] * a[1]) + (b[5] * a[5]) + (b[6] * a[9]) + (b[7] * a[13]);
        btmp2 = (b[4] * a[2]) + (b[5] * a[6]) + (b[6] * a[10]) + (b[7] * a[14]);
        btmp3 = (b[4] * a[3]) + (b[5] * a[7]) + (b[6] * a[11]) + (b[7] * a[15]);
        b[4 ] = btmp0;
        b[5 ] = btmp1;
        b[6 ] = btmp2;
        b[7 ] = btmp3;

        btmp0 = (b[8] * a[0]) + (b[9] * a[4]) + (b[10] * a[8]) + (b[11] * a[12]);
        btmp1 = (b[8] * a[1]) + (b[9] * a[5]) + (b[10] * a[9]) + (b[11] * a[13]);
        btmp2 = (b[8] * a[2]) + (b[9] * a[6]) + (b[10] * a[10]) + (b[11] * a[14]);
        btmp3 = (b[8] * a[3]) + (b[9] * a[7]) + (b[10] * a[11]) + (b[11] * a[15]);
        b[8 ] = btmp0;
        b[9 ] = btmp1;
        b[10] = btmp2;
        b[11] = btmp3;

        btmp0 = (b[12] * a[0]) + (b[13] * a[4]) + (b[14] * a[8]) + (b[15] * a[12]);
        btmp1 = (b[12] * a[1]) + (b[13] * a[5]) + (b[14] * a[9]) + (b[15] * a[13]);
        btmp2 = (b[12] * a[2]) + (b[13] * a[6]) + (b[14] * a[10]) + (b[15] * a[14]);
        btmp3 = (b[12] * a[3]) + (b[13] * a[7]) + (b[14] * a[11]) + (b[15] * a[15]);
        b[12] = btmp0;
        b[13] = btmp1;
        b[14] = btmp2;
        b[15] = btmp3;

        return b;
    },
    multa: function(a, b, r) {
        if (r === a) {
            return this.preMult(a,b);
        } else if (r === b) {
            return this.postMult(a,b);
        } else {
            if (r === undefined) {
                r = [];
            }
            r[0] =  b[0] * a[0] + b[1] * a[4] + b[2] * a[8] + b[3] * a[12];
            r[1] =  b[0] * a[1] + b[1] * a[5] + b[2] * a[9] + b[3] * a[13];
            r[2] =  b[0] * a[2] + b[1] * a[6] + b[2] * a[10] + b[3] * a[14];
            r[3] =  b[0] * a[3] + b[1] * a[7] + b[2] * a[11] + b[3] * a[15];

            r[4] =  b[4] * a[0] + b[5] * a[4] + b[6] * a[8] + b[7] * a[12];
            r[5] =  b[4] * a[1] + b[5] * a[5] + b[6] * a[9] + b[7] * a[13];
            r[6] =  b[4] * a[2] + b[5] * a[6] + b[6] * a[10] + b[7] * a[14];
            r[7] =  b[4] * a[3] + b[5] * a[7] + b[6] * a[11] + b[7] * a[15];

            r[8] =  b[8] * a[0] + b[9] * a[4] + b[10] * a[8] + b[11] * a[12];
            r[9] =  b[8] * a[1] + b[9] * a[5] + b[10] * a[9] + b[11] * a[13];
            r[10] = b[8] * a[2] + b[9] * a[6] + b[10] * a[10] + b[11] * a[14];
            r[11] = b[8] * a[3] + b[9] * a[7] + b[10] * a[11] + b[11] * a[15];

            r[12] = b[12] * a[0] + b[13] * a[4] + b[14] * a[8] + b[15] * a[12];
            r[13] = b[12] * a[1] + b[13] * a[5] + b[14] * a[9] + b[15] * a[13];
            r[14] = b[12] * a[2] + b[13] * a[6] + b[14] * a[10] + b[15] * a[14];
            r[15] = b[12] * a[3] + b[13] * a[7] + b[14] * a[11] + b[15] * a[15];

            return r;
        }
    },
    /* r = a * b */
    mult: function(a, b, r) {
        var s00 = b[0];
        var s01 = b[1];
        var s02 = b[2];
        var s03 = b[3];
        var s10 = b[4];
        var s11 = b[5];
        var s12 = b[6];
        var s13 = b[7];
        var s20 = b[8];
        var s21 = b[9];
        var s22 = b[10];
        var s23 = b[11];
        var s30 = b[12];
        var s31 = b[13];
        var s32 = b[14];
        var s33 = b[15];

        var o00 = a[0];
        var o01 = a[1];
        var o02 = a[2];
        var o03 = a[3];
        var o10 = a[4];
        var o11 = a[5];
        var o12 = a[6];
        var o13 = a[7];
        var o20 = a[8];
        var o21 = a[9];
        var o22 = a[10];
        var o23 = a[11];
        var o30 = a[12];
        var o31 = a[13];
        var o32 = a[14];
        var o33 = a[15];

        r[0] =  s00 * o00 + s01 * o10 + s02 * o20 + s03 * o30;
        r[1] =  s00 * o01 + s01 * o11 + s02 * o21 + s03 * o31;
        r[2] =  s00 * o02 + s01 * o12 + s02 * o22 + s03 * o32;
        r[3] =  s00 * o03 + s01 * o13 + s02 * o23 + s03 * o33;

        r[4] =  s10 * o00 + s11 * o10 + s12 * o20 + s13 * o30;
        r[5] =  s10 * o01 + s11 * o11 + s12 * o21 + s13 * o31;
        r[6] =  s10 * o02 + s11 * o12 + s12 * o22 + s13 * o32;
        r[7] =  s10 * o03 + s11 * o13 + s12 * o23 + s13 * o33;

        r[8] =  s20 * o00 + s21 * o10 + s22 * o20 + s23 * o30;
        r[9] =  s20 * o01 + s21 * o11 + s22 * o21 + s23 * o31;
        r[10] = s20 * o02 + s21 * o12 + s22 * o22 + s23 * o32;
        r[11] = s20 * o03 + s21 * o13 + s22 * o23 + s23 * o33;

        r[12] = s30 * o00 + s31 * o10 + s32 * o20 + s33 * o30;
        r[13] = s30 * o01 + s31 * o11 + s32 * o21 + s33 * o31;
        r[14] = s30 * o02 + s31 * o12 + s32 * o22 + s33 * o32;
        r[15] = s30 * o03 + s31 * o13 + s32 * o23 + s33 * o33;

        return r;
    },
    multOrig: function(a, b, r) {
        var t;
        if (r === a) {
            // pre mult
            t = [];
            for (var col = 0; col < 4; col++) {
                t[0] = osg.Matrix.innerProduct(b, a, 0, col);
                t[1] = osg.Matrix.innerProduct(b, a, 1, col);
                t[2] = osg.Matrix.innerProduct(b, a, 2, col);
                t[3] = osg.Matrix.innerProduct(b, a, 3, col);
                a[0 + col] = t[0];
                a[4 + col] = t[1];
                a[8 + col] = t[2];
                a[12 + col] = t[3];
            }
            return a;
            //return this.preMult(r, b);
        } else if (r === b) {
            // post mult
            t = [];
            for (var row = 0; row < 4; row++) {
                t[0] = osg.Matrix.innerProduct(b, a, row, 0);
                t[1] = osg.Matrix.innerProduct(b, a, row, 1);
                t[2] = osg.Matrix.innerProduct(b, a, row, 2);
                t[3] = osg.Matrix.innerProduct(b, a, row, 3);
                this.setRow(b, row, t[0], t[1], t[2], t[3]);
            }
            return b;
            //return this.postMult(r, a);
        }
        if (r === undefined) {
            r = [];
        }

        var s00 = b[0];
        var s01 = b[1];
        var s02 = b[2];
        var s03 = b[3];
        var s10 = b[4];
        var s11 = b[5];
        var s12 = b[6];
        var s13 = b[7];
        var s20 = b[8];
        var s21 = b[9];
        var s22 = b[10];
        var s23 = b[11];
        var s30 = b[12];
        var s31 = b[13];
        var s32 = b[14];
        var s33 = b[15];

        var o00 = a[0];
        var o01 = a[1];
        var o02 = a[2];
        var o03 = a[3];
        var o10 = a[4];
        var o11 = a[5];
        var o12 = a[6];
        var o13 = a[7];
        var o20 = a[8];
        var o21 = a[9];
        var o22 = a[10];
        var o23 = a[11];
        var o30 = a[12];
        var o31 = a[13];
        var o32 = a[14];
        var o33 = a[15];

        r[0] =  s00 * o00 + s01 * o10 + s02 * o20 + s03 * o30;
        r[1] =  s00 * o01 + s01 * o11 + s02 * o21 + s03 * o31;
        r[2] =  s00 * o02 + s01 * o12 + s02 * o22 + s03 * o32;
        r[3] =  s00 * o03 + s01 * o13 + s02 * o23 + s03 * o33;

        r[4] =  s10 * o00 + s11 * o10 + s12 * o20 + s13 * o30;
        r[5] =  s10 * o01 + s11 * o11 + s12 * o21 + s13 * o31;
        r[6] =  s10 * o02 + s11 * o12 + s12 * o22 + s13 * o32;
        r[7] =  s10 * o03 + s11 * o13 + s12 * o23 + s13 * o33;

        r[8] =  s20 * o00 + s21 * o10 + s22 * o20 + s23 * o30;
        r[9] =  s20 * o01 + s21 * o11 + s22 * o21 + s23 * o31;
        r[10] = s20 * o02 + s21 * o12 + s22 * o22 + s23 * o32;
        r[11] = s20 * o03 + s21 * o13 + s22 * o23 + s23 * o33;

        r[12] = s30 * o00 + s31 * o10 + s32 * o20 + s33 * o30;
        r[13] = s30 * o01 + s31 * o11 + s32 * o21 + s33 * o31;
        r[14] = s30 * o02 + s31 * o12 + s32 * o22 + s33 * o32;
        r[15] = s30 * o03 + s31 * o13 + s32 * o23 + s33 * o33;

        return r;
    },

    makeLookAt: function(eye, center, up, result) {

        if (result === undefined) {
            result = [];
        }

        var f = osg.Vec3.sub(center, eye, []);
        osg.Vec3.normalize(f, f);

        var s = osg.Vec3.cross(f, up, []);
        osg.Vec3.normalize(s, s);

        var u = osg.Vec3.cross(s, f, []);
        osg.Vec3.normalize(u, u);

        // s[0], u[0], -f[0], 0.0,
        // s[1], u[1], -f[1], 0.0,
        // s[2], u[2], -f[2], 0.0,
        // 0,    0,    0,     1.0

        result[0]=s[0]; result[1]=u[0]; result[2]=-f[0]; result[3]=0.0;
        result[4]=s[1]; result[5]=u[1]; result[6]=-f[1]; result[7]=0.0;
        result[8]=s[2]; result[9]=u[2]; result[10]=-f[2];result[11]=0.0;
        result[12]=  0; result[13]=  0; result[14]=  0;  result[15]=1.0;

        osg.Matrix.multTranslate(result, osg.Vec3.neg(eye, []), result);
        return result;
    },
    makeOrtho: function(left, right,
                        bottom, top,
                        zNear, zFar, result)
    {
        if (result === undefined) {
            result = [];
        }
        // note transpose of Matrix_implementation wr.t OpenGL documentation, since the OSG use post multiplication rather than pre.
        // we will change this convention later
        var tx = -(right+left)/(right-left);
        var ty = -(top+bottom)/(top-bottom);
        var tz = -(zFar+zNear)/(zFar-zNear);
        var row = osg.Matrix.setRow;
        row(result, 0, 2.0/(right-left),              0.0,               0.0, 0.0);
        row(result, 1,              0.0, 2.0/(top-bottom),               0.0, 0.0);
        row(result, 2,              0.0,              0.0, -2.0/(zFar-zNear), 0.0);
        row(result, 3,               tx,               ty,                tz, 1.0);
        return result;
    },

    getLookAt: function(matrix, eye, center, up, distance) {
        if (distance === undefined) {
            distance = 1.0;
        }
        var inv = [];
        var result = osg.Matrix.inverse(matrix, inv);
        if (!result) {
            osg.Matrix.makeIdentity(inv);
        }
        osg.Matrix.transformVec3(inv, [0,0,0], eye);
        osg.Matrix.transform3x3(matrix, [0,1,0], up);
        osg.Matrix.transform3x3(matrix, [0,0,-1], center);
        osg.Vec3.normalize(center, center);
        osg.Vec3.add(osg.Vec3.mult(center, distance, [] ), eye, center);
    },

    //getRotate_David_Spillings_Mk1
    getRotate: function (mat, result) {
        if (result === undefined) {
            result = [];
        }

        var s;
        var tq = [];
        var i, j;

        // Use tq to store the largest trace
        var mat00 = mat[4*0 + 0];
        var mat11 = mat[4*1 + 1];
        var mat22 = mat[4*2 + 2];
        tq[0] = 1 + mat00 + mat11 + mat22;
        tq[1] = 1 + mat00 - mat11 - mat22;
        tq[2] = 1 - mat00 + mat11 - mat22;
        tq[3] = 1 - mat00 - mat11 + mat22;

        // Find the maximum (could also use stacked if's later)
        j = 0;
        for(i=1;i<4;i++) {
            if ((tq[i]>tq[j])) {
                j = i;
            } else {
                j = j;
            }
        }

        // check the diagonal
        if (j===0)
        {
            /* perform instant calculation */
            result[3] = tq[0];
            result[0] = mat[1*4+2]-mat[2*4+1];
            result[1] = mat[2*4+0]-mat[0  +2]; 
            result[2] = mat[0  +1]-mat[1*4+0]; 
        }
        else if (j==1)
        {
            result[3] = mat[1*4+2]-mat[2*4+1]; 
            result[0] = tq[1];
            result[1] = mat[0  +1]+mat[1*4+0]; 
            result[2] = mat[2*4+0]+mat[0  +2];
        }
        else if (j==2)
        {
            result[3] = mat[2*4+0]-mat[0+2]; 
            result[0] = mat[0  +1]+mat[1*4+0]; 
            result[1] = tq[2];
            result[2] = mat[1*4+2]+mat[2*4+1]; 
        }
        else /* if (j==3) */
        {
            result[3] = mat[0  +1]-mat[1*4+0]; 
            result[0] = mat[2*4+0]+mat[0  +2]; 
            result[1] = mat[1*4+2]+mat[2*4+1];
            result[2] = tq[3];
        }

        s = Math.sqrt(0.25/tq[j]);
        result[3] *= s;
        result[0] *= s;
        result[1] *= s;
        result[2] *= s;

        return result;
    },

    // result = Matrix M * Matrix Translate
    multTranslate: function(mat, translate, result) {
        if (result === undefined) {
            result = [];
        }
        if (result !== mat) {
            osg.Matrix.copy(mat, result);
        }

        var val;
        if (translate[0] !== 0.0) {
            val = translate[0];
            result[12] += val * mat[0];
            result[13] += val * mat[1];
            result[14] += val * mat[2];
            result[15] += val * mat[3];
        }

        if (translate[1] !== 0.0) {
            val = translate[1];
            result[12] += val * mat[4];
            result[13] += val * mat[5];
            result[14] += val * mat[6];
            result[15] += val * mat[7];
        }

        if (translate[2] !== 0.0) {
            val = translate[2];
            result[12] += val * mat[8];
            result[13] += val * mat[9];
            result[14] += val * mat[10];
            result[15] += val * mat[11];
        }
        return result;
    },

    makeRotate: function (angle, x, y, z, result) {
        if (result === undefined) {
            result = [];
        }

        var mag = Math.sqrt(x*x + y*y + z*z);
        var sinAngle = Math.sin(angle);
        var cosAngle = Math.cos(angle);

        if (mag > 0.0) {
            var xx, yy, zz, xy, yz, zx, xs, ys, zs;
            var oneMinusCos;
            var rotMat;
            mag = 1.0/mag;

            x *= mag;
            y *= mag;
            z *= mag;

            xx = x * x;
            yy = y * y;
            zz = z * z;
            xy = x * y;
            yz = y * z;
            zx = z * x;
            xs = x * sinAngle;
            ys = y * sinAngle;
            zs = z * sinAngle;
            oneMinusCos = 1.0 - cosAngle;

            result[0] = (oneMinusCos * xx) + cosAngle;
            result[1] = (oneMinusCos * xy) - zs;
            result[2] = (oneMinusCos * zx) + ys;
            result[3] = 0.0;

            result[4] = (oneMinusCos * xy) + zs;
            result[5] = (oneMinusCos * yy) + cosAngle;
            result[6] = (oneMinusCos * yz) - xs;
            result[7] = 0.0;

            result[8] = (oneMinusCos * zx) - ys;
            result[9] = (oneMinusCos * yz) + xs;
            result[10] = (oneMinusCos * zz) + cosAngle;
            result[11] = 0.0;

            result[12] = 0.0;
            result[13] = 0.0;
            result[14] = 0.0;
            result[15] = 1.0;

            return result;
        }

        return result;
    },

    transform3x3: function(m, v, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = m[0] * v[0] + m[1]*v[1] + m[2]*v[2];
        result[1] = m[4] * v[0] + m[5]*v[1] + m[6]*v[2];
        result[2] = m[8] * v[0] + m[9]*v[1] + m[10]*v[2];
        return result;
    },

    transformVec3: function(matrix, vector, result) {
        var d = 1.0/(matrix[3] * vector[0] + matrix[7] * vector[1] + matrix[11] * vector[2] + matrix[15]); 
        if (result === undefined) {
            result = [];
        }

        var tmp;
        if (result === vector) {
            tmp = [];
        } else {
            tmp = result;
        }
        tmp[0] = (matrix[0] * vector[0] + matrix[4] * vector[1] + matrix[8] * vector[2] + matrix[12]) * d;
        tmp[1] = (matrix[1] * vector[0] + matrix[5] * vector[1] + matrix[9] * vector[2] + matrix[13]) * d;
        tmp[2] = (matrix[2] * vector[0] + matrix[6] * vector[1] + matrix[10] * vector[2] + matrix[14]) * d;

        if (result === vector) {
            osg.Vec3.copy(tmp, result);
        }
        return result;
    },

    transformVec4: function(matrix, vector, result) {
        if (result === undefined) {
            result = [];
        }
        var tmp;
        if (result === vector) {
            tmp = [];
        } else {
            tmp = result;
        }
        tmp[0] = (matrix[0] * vector[0] + matrix[1] * vector[1] + matrix[2] * vector[2] + matrix[3]*vector[3]);
        tmp[1] = (matrix[4] * vector[0] + matrix[5] * vector[1] + matrix[6] * vector[2] + matrix[7]*vector[3]);
        tmp[2] = (matrix[8] * vector[0] + matrix[9] * vector[1] + matrix[10] * vector[2] + matrix[11]*vector[3]);
        tmp[3] = (matrix[12] * vector[0] + matrix[13] * vector[1] + matrix[14] * vector[2] + matrix[15]*vector[3]);

        if (result === vector) {
            osg.Vec4.copy(tmp, result);
        }
        return result;
    },

    copy: function(matrix, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        result[9] = matrix[9];
        result[10] = matrix[10];
        result[11] = matrix[11];
        result[12] = matrix[12];
        result[13] = matrix[13];
        result[14] = matrix[14];
        result[15] = matrix[15];
        return result;
    },

    inverse: function(matrix, resultArg) {
        return this.inverse4x4(matrix,resultArg);
        // it's not working yet, need to debug inverse 4x3
/*
        if (matrix[3] === 0.0 && matrix[7] === 0.0 && matrix[11] === 0.0 && matrix[15] === 1.0) {
            return this.inverse4x3(matrix,resultArg);
        } else {
            return this.inverse4x4(matrix,resultArg);
        }
*/
    },

    /**
     *  if a result argument is given the return of the function is true or false
     *  depending if the matrix can be inverted, else if no result argument is given
     *  the return is identity if the matrix can not be inverted and the matrix overthise
     */
    inverse4x4: function(matrix, resultArg) {
        if (resultArg === undefined) {
            result = [];
        } else {
            result = resultArg;
        }
        var tmp_0 = matrix[10] * matrix[15];
        var tmp_1 = matrix[14] * matrix[11];
        var tmp_2 = matrix[6] * matrix[15];
        var tmp_3 = matrix[14] * matrix[7];
        var tmp_4 = matrix[6] * matrix[11];
        var tmp_5 = matrix[10] * matrix[7];
        var tmp_6 = matrix[2] * matrix[15];
        var tmp_7 = matrix[14] * matrix[3];
        var tmp_8 = matrix[2] * matrix[11];
        var tmp_9 = matrix[10] * matrix[3];
        var tmp_10 = matrix[2] * matrix[7];
        var tmp_11 = matrix[6] * matrix[3];
        var tmp_12 = matrix[8] * matrix[13];
        var tmp_13 = matrix[12] * matrix[9];
        var tmp_14 = matrix[4] * matrix[13];
        var tmp_15 = matrix[12] * matrix[5];
        var tmp_16 = matrix[4] * matrix[9];
        var tmp_17 = matrix[8] * matrix[5];
        var tmp_18 = matrix[0] * matrix[13];
        var tmp_19 = matrix[12] * matrix[1];
        var tmp_20 = matrix[0] * matrix[9];
        var tmp_21 = matrix[8] * matrix[1];
        var tmp_22 = matrix[0] * matrix[5];
        var tmp_23 = matrix[4] * matrix[1];

        var t0 = ((tmp_0 * matrix[5] + tmp_3 * matrix[9] + tmp_4 * matrix[13]) -
                  (tmp_1 * matrix[5] + tmp_2 * matrix[9] + tmp_5 * matrix[13]));
        var t1 = ((tmp_1 * matrix[1] + tmp_6 * matrix[9] + tmp_9 * matrix[13]) -
                  (tmp_0 * matrix[1] + tmp_7 * matrix[9] + tmp_8 * matrix[13]));
        var t2 = ((tmp_2 * matrix[1] + tmp_7 * matrix[5] + tmp_10 * matrix[13]) -
                  (tmp_3 * matrix[1] + tmp_6 * matrix[5] + tmp_11 * matrix[13]));
        var t3 = ((tmp_5 * matrix[1] + tmp_8 * matrix[5] + tmp_11 * matrix[9]) -
                  (tmp_4 * matrix[1] + tmp_9 * matrix[5] + tmp_10 * matrix[9]));

        var d1 = (matrix[0] * t0 + matrix[4] * t1 + matrix[8] * t2 + matrix[12] * t3);
        if (Math.abs(d1) < 1e-5) {
            osg.log("Warning can't inverse matrix " + matrix);
            if (resultArg !== undefined) {
                return false;
            } else {
                osg.Matrix.makeIdentity(result);
            }
        }
        var d = 1.0 / d1;

        var out_00 = d * t0;
        var out_01 = d * t1;
        var out_02 = d * t2;
        var out_03 = d * t3;

        var out_10 = d * ((tmp_1 * matrix[4] + tmp_2 * matrix[8] + tmp_5 * matrix[12]) -
                          (tmp_0 * matrix[4] + tmp_3 * matrix[8] + tmp_4 * matrix[12]));
        var out_11 = d * ((tmp_0 * matrix[0] + tmp_7 * matrix[8] + tmp_8 * matrix[12]) -
                          (tmp_1 * matrix[0] + tmp_6 * matrix[8] + tmp_9 * matrix[12]));
        var out_12 = d * ((tmp_3 * matrix[0] + tmp_6 * matrix[4] + tmp_11 * matrix[12]) -
                          (tmp_2 * matrix[0] + tmp_7 * matrix[4] + tmp_10 * matrix[12]));
        var out_13 = d * ((tmp_4 * matrix[0] + tmp_9 * matrix[4] + tmp_10 * matrix[8]) -
                          (tmp_5 * matrix[0] + tmp_8 * matrix[4] + tmp_11 * matrix[8]));

        var out_20 = d * ((tmp_12 * matrix[7] + tmp_15 * matrix[11] + tmp_16 * matrix[15]) -
                          (tmp_13 * matrix[7] + tmp_14 * matrix[11] + tmp_17 * matrix[15]));
        var out_21 = d * ((tmp_13 * matrix[3] + tmp_18 * matrix[11] + tmp_21 * matrix[15]) -
                          (tmp_12 * matrix[3] + tmp_19 * matrix[11] + tmp_20 * matrix[15]));
        var out_22 = d * ((tmp_14 * matrix[3] + tmp_19 * matrix[7] + tmp_22 * matrix[15]) -
                          (tmp_15 * matrix[3] + tmp_18 * matrix[7] + tmp_23 * matrix[15]));
        var out_23 = d * ((tmp_17 * matrix[3] + tmp_20 * matrix[7] + tmp_23 * matrix[11]) -
                          (tmp_16 * matrix[3] + tmp_21 * matrix[7] + tmp_22 * matrix[11]));

        var out_30 = d * ((tmp_14 * matrix[10] + tmp_17 * matrix[14] + tmp_13 * matrix[6]) -
                          (tmp_16 * matrix[14] + tmp_12 * matrix[6] + tmp_15 * matrix[10]));
        var out_31 = d * ((tmp_20 * matrix[14] + tmp_12 * matrix[2] + tmp_19 * matrix[10]) -
                          (tmp_18 * matrix[10] + tmp_21 * matrix[14] + tmp_13 * matrix[2]));
        var out_32 = d * ((tmp_18 * matrix[6] + tmp_23 * matrix[14] + tmp_15 * matrix[2]) -
                          (tmp_22 * matrix[14] + tmp_14 * matrix[2] + tmp_19 * matrix[6]));
        var out_33 = d * ((tmp_22 * matrix[10] + tmp_16 * matrix[2] + tmp_21 * matrix[6]) -
                          (tmp_20 * matrix[6] + tmp_23 * matrix[10] + tmp_17 * matrix[2]));

        result[0] = out_00;
        result[1] = out_01;
        result[2] = out_02;
        result[3] = out_03;
        result[4] = out_10;
        result[5] = out_11;
        result[6] = out_12;
        result[7] = out_13;
        result[8] = out_20;
        result[9] = out_21;
        result[10] = out_22;
        result[11] = out_23;
        result[12] = out_30;
        result[13] = out_31;
        result[14] = out_32;
        result[15] = out_33;

        if (resultArg !== undefined) {
            return true;
        }
        return result;
    },

    inverse4x3: function(matrix, resultArg) {
        if (resultArg === undefined) {
            result = [];
        } else {
            result = resultArg;
        }

        // _mat[0][0] = r11*r22 - r12*r21;
        result[0] = matrix[5] * matrix[10] - matrix[6] * matrix[9];

        // _mat[0][1] = r02*r21 - r01*r22;
        result[1] = matrix[2] * matrix[9] - matrix[1] * matrix[10];

        // _mat[0][2] = r01*r12 - r02*r11;
        result[2] = matrix[1] * matrix[6] - matrix[2] * matrix[5];

        var r00 = matrix[0];
        var r10 = matrix[4];
        var r20 = matrix[8];
        
        var one_over_det = 1.0/(r00*result[0] + r10*result[1] + r20*result[2]);
        r00 *= one_over_det; r10 *= one_over_det; r20 *= one_over_det;  // Saves on later computations

        result[0] *= one_over_det;
        result[1] *= one_over_det;
        result[2] *= one_over_det;
        result[3] = 0.0;

        result[4] = matrix[6]*r20 - r10*matrix[10]; // Have already been divided by det
        result[5] = r00*matrix[10] - matrix[2]*r20; // same
        result[6] = matrix[2]*r10 - r00*matrix[6]; // same
        result[7] = 0.0;

        result[8] = r10*matrix[9] - matrix[5]*r20; // Have already been divided by det
        result[9] = matrix[1]*r20 - r00*matrix[9]; // same
        result[10]= r00*matrix[5] - matrix[1]*r10; // same
        result[11]= 0.0;
        result[15]= 1.0;

        var d  = matrix[15];
        var d2 = d-1.0;
        var tx, ty, tz;
        if( d2*d2 > 1.0e-6 ) { // Involves perspective, so we must
            // compute the full inverse
            var TPinv = [];
            result[12] = result[13] = result[15] = 0.0;

            var a = matrix[3];
            var b = matrix[7];
            var c = matrix[11];
            var px = result[0] * a + result[1] * b + result[2]*c;
            var py = result[4] * a + result[5] * b + result[6]*c;
            var pz = result[8] * a + result[9] * b + result[10]*c;

            tx = matrix[12];
            ty = matrix[13];
            tz = matrix[14];
            var one_over_s  = 1.0/(d - (tx*px + ty*py + tz*pz));

            tx *= one_over_s; ty *= one_over_s; tz *= one_over_s;  // Reduces number of calculations later on
            // Compute inverse of trans*corr
            TPinv[0] = tx*px + 1.0;
            TPinv[1] = ty*px;
            TPinv[2] = tz*px;
            TPinv[3] = -px * one_over_s;
            TPinv[4] = tx*py;
            TPinv[5] = ty*py + 1.0;
            TPinv[6] = tz*py;
            TPinv[7] = -py * one_over_s;
            TPinv[8] = tx*pz;
            TPinv[9] = ty*pz;
            TPinv[10]= tz*pz + 1.0;
            TPinv[11]= -pz * one_over_s;
            TPinv[12]= -tx;
            TPinv[13]= -ty;
            TPinv[14]= -tz;
            TPinv[15]= one_over_s;
            
            this.mult(result, TPinv, result); // Finish computing full inverse of mat
        } else {

            tx = matrix[12]; ty = matrix[13]; tz = matrix[14];
            // Compute translation components of mat'
            result[12] = -(tx*result[0] + ty*result[4] + tz*result[8]);
            result[13] = -(tx*result[1] + ty*result[5] + tz*result[9]);
            result[14] = -(tx*result[2] + ty*result[6] + tz*result[10]);
        }

        if (resultArg !== undefined) {
            return true;
        }
        return result;
    },

    transpose: function(mat, dest) {
        // from glMatrix
        // If we are transposing ourselves we can skip a few steps but have to cache some values
        if(mat === dest) {
            var a01 = mat[1], a02 = mat[2], a03 = mat[3];
            var a12 = mat[6], a13 = mat[7];
            var a23 = mat[11];
            
            mat[1] = mat[4];
            mat[2] = mat[8];
            mat[3] = mat[12];
            mat[4] = a01;
            mat[6] = mat[9];
            mat[7] = mat[13];
            mat[8] = a02;
            mat[9] = a12;
            mat[11] = mat[14];
            mat[12] = a03;
            mat[13] = a13;
            mat[14] = a23;
            return mat;
        } else {
            dest[0] = mat[0];
            dest[1] = mat[4];
            dest[2] = mat[8];
            dest[3] = mat[12];
            dest[4] = mat[1];
            dest[5] = mat[5];
            dest[6] = mat[9];
            dest[7] = mat[13];
            dest[8] = mat[2];
            dest[9] = mat[6];
            dest[10] = mat[10];
            dest[11] = mat[14];
            dest[12] = mat[3];
            dest[13] = mat[7];
            dest[14] = mat[11];
            dest[15] = mat[15];
            return dest;
        }
    },

    makePerspective: function(fovy, aspect, znear, zfar, result)
    {
        if (result === undefined) {
            result = [];
        }
        var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
        var ymin = -ymax;
        var xmin = ymin * aspect;
        var xmax = ymax * aspect;

        return osg.Matrix.makeFrustum(xmin, xmax, ymin, ymax, znear, zfar, result);
    },

    makeScale: function(x, y, z, result)
    {
        if (result === undefined) {
            result = [];
        }
        this.setRow(result, 0, x, 0, 0, 0);
        this.setRow(result, 1, 0, y, 0, 0);
        this.setRow(result, 2, 0, 0, z, 0);
        this.setRow(result, 3, 0, 0, 0, 1);
        return result;
    },

    makeFrustum: function(left, right,
                          bottom, top,
                          znear, zfar, result) {
        if (result === undefined) {
            result = [];
        }
        var X = 2*znear/(right-left);
        var Y = 2*znear/(top-bottom);
        var A = (right+left)/(right-left);
        var B = (top+bottom)/(top-bottom);
        var C = -(zfar+znear)/(zfar-znear);
        var D = -2*zfar*znear/(zfar-znear);
        this.setRow(result, 0, X, 0, 0, 0);
        this.setRow(result, 1, 0, Y, 0, 0);
        this.setRow(result, 2, A, B, C, -1);
        this.setRow(result, 3, 0, 0, D, 0);
        return result;
    },

    makeRotateFromQuat: function (quat, result) {
        if (result === undefined) {
            result = [];
        }
        this.makeIdentity(result);
        return this.setRotateFromQuat(result, quat);
    },

    setRotateFromQuat: function (matrix, quat) {
        var length2 = osg.Quat.length2(quat);
        if (Math.abs(length2) <= Number.MIN_VALUE)
        {
            matrix[0] = 0.0;
            matrix[1] = 0.0;
            matrix[2] = 0.0;

            matrix[4] = 0.0;
            matrix[5] = 0.0;
            matrix[6] = 0.0;

            matrix[8] = 0.0;
            matrix[9] = 0.0;
            matrix[10] = 0.0;
        }
        else
        {
            var rlength2;
            // normalize quat if required.
            // We can avoid the expensive sqrt in this case since all 'coefficients' below are products of two q components.
            // That is a square of a square root, so it is possible to avoid that
            if (length2 !== 1.0)
            {
                rlength2 = 2.0/length2;
            }
            else
            {
                rlength2 = 2.0;
            }

            // Source: Gamasutra, Rotating Objects Using Quaternions
            //
            //http://www.gamasutra.com/features/19980703/quaternions_01.htm

            var wx, wy, wz, xx, yy, yz, xy, xz, zz, x2, y2, z2;

            // calculate coefficients
            x2 = rlength2*quat[0];
            y2 = rlength2*quat[1];
            z2 = rlength2*quat[2];

            xx = quat[0] * x2;
            xy = quat[0] * y2;
            xz = quat[0] * z2;

            yy = quat[1] * y2;
            yz = quat[1] * z2;
            zz = quat[2] * z2;

            wx = quat[3] * x2;
            wy = quat[3] * y2;
            wz = quat[3] * z2;

            // Note.  Gamasutra gets the matrix assignments inverted, resulting
            // in left-handed rotations, which is contrary to OpenGL and OSG's
            // methodology.  The matrix assignment has been altered in the next
            // few lines of code to do the right thing.
            // Don Burns - Oct 13, 2001
            matrix[0] = 1.0 - (yy + zz);
            matrix[4] = xy - wz;
            matrix[8] = xz + wy;


            matrix[0+1] = xy + wz;
            matrix[4+1] = 1.0 - (xx + zz);
            matrix[8+1] = yz - wx;

            matrix[0+2] = xz - wy;
            matrix[4+2] = yz + wx;
            matrix[8+2] = 1.0 - (xx + yy);
        }
        return matrix;
    }
};
osg.ShaderGeneratorType = {
    VertexInit: 0,
    VertexFunction: 1,
    VertexMain: 2,
    FragmentInit: 3,
    FragmentMain: 5
};

/** 
 * Shader manage shader for vertex and fragment, you need both to create a glsl program.
 * @class Shader
 */
osg.Shader = function(type, text) {
    this.type = type;
    this.text = text;
};

/** @lends osg.Shader.prototype */
osg.Shader.prototype = {
    compile: function() {
        this.shader = gl.createShader(this.type);
        gl.shaderSource(this.shader, this.text);
        gl.compileShader(this.shader);
        if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
            osg.log("can't compile shader:\n" + this.text + "\n");
            var tmpText = "\n" + this.text;
            var splittedText = tmpText.split("\n");
            var newText = "\n";
            for (var i = 0, l = splittedText.length; i < l; ++i ) {
                newText += i + " " + splittedText[i] + "\n";
            }
            osg.log(newText);
            osg.log(gl.getShaderInfoLog(this.shader));
        }
    }
};

osg.Shader.create = function( type, text )
{
    osg.log("osg.Shader.create is deprecated, use new osg.Shader with the same arguments instead");
    return new osg.Shader(type, text);
};
/** 
 * StateAttribute base class
 * @class StateAttribute
 */
osg.StateAttribute = function() {
    this._dirty = true;
};

/** @lends osg.StateAttribute.prototype */
osg.StateAttribute.prototype = {
    isDirty: function() { return this._dirty; },
    dirty: function() { this._dirty = true; },
    setDirty: function(dirty) { this._dirty = dirty; }
};

osg.StateAttribute.OFF = 0;
osg.StateAttribute.ON = 1;
osg.StateAttribute.OVERRIDE = 2;
osg.StateAttribute.PROTECTED = 4;
osg.StateAttribute.INHERIT = 8;
/** -*- compile-command: "jslint-cli Uniform.js" -*- */

/** 
 * Uniform manage variable used in glsl shader.
 * @class Uniform
 */
osg.Uniform = function () { this.transpose = false; this._dirty = true; };

/** @lends osg.Uniform.prototype */
osg.Uniform.prototype = {

    get: function() { // call dirty if you update this array outside
        return this.data;
    },
    set: function(array) {
        this.data = array;
        this.dirty();
    },
    dirty: function() { this._dirty = true; },
    apply: function(location) {
        if (this._dirty) {
            this.update.call(this.glData, this.data);
            this._dirty = false;
        }
        this.glCall(location, this.glData);
    },
    applyMatrix: function(location) {
        if (this._dirty) {
            this.update.call(this.glData, this.data);
            this._dirty = false;
        }
        this.glCall(location, this.transpose, this.glData);
    },
    update: function(array) {
        for (var i = 0, l = array.length; i < l; ++i ) { // FF not traced maybe short
            this[i] = array[i];
        }
    },

    _updateFloat1: function(f) {
        this[0] = f[0];
    },
    _updateFloat2: function(f) {
        this[0] = f[0];
        this[1] = f[1];
    },
    _updateFloat3: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
    },
    _updateFloat4: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
        this[3] = f[3];
    },
    _updateFloat9: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
        this[3] = f[3];
        this[4] = f[4];
        this[5] = f[5];
        this[6] = f[6];
        this[7] = f[7];
        this[8] = f[8];
    },
    _updateFloat16: function(f) {
        this[0] = f[0];
        this[1] = f[1];
        this[2] = f[2];
        this[3] = f[3];
        this[4] = f[4];
        this[5] = f[5];
        this[6] = f[6];
        this[7] = f[7];
        this[8] = f[8];
        this[9] = f[9];
        this[10] = f[10];
        this[11] = f[11];
        this[12] = f[12];
        this[13] = f[13];
        this[14] = f[14];
        this[15] = f[15];
    }
};

osg.Uniform.createFloat1 = function(value, name) {
    var uniform = new osg.Uniform();
    uniform.data = [value];
    uniform.glCall = function (location, glData) {
        gl.uniform1fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat1;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat2 = function(vec2, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec2;
    uniform.glCall = function (location, glData) {
        gl.uniform2fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat2;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat3 = function(vec3, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec3;
    uniform.glCall = function (location, glData) {
        gl.uniform3fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat3;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createFloat4 = function(vec4, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec4;
    uniform.glCall = function (location, glData) {
        gl.uniform4fv(location, glData);
    };
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat4;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt1 = function(value, name) {
    var uniform = new osg.Uniform();
    uniform.data = [value];
    uniform.glCall = function (location, glData) {
        gl.uniform1iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt2 = function(vec2, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec2;
    uniform.glCall = function (location, glData) {
        gl.uniform2iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt3 = function(vec3, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec3;
    uniform.glCall = function (location, glData) {
        gl.uniform3iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createInt4 = function(vec4, name) {
    var uniform = new osg.Uniform();
    uniform.data = vec4;
    uniform.glCall = function (location, glData) {
        gl.uniform4iv(location, glData);
    };
    uniform.glData = new osg.Int32Array(uniform.data);
    uniform.name = name;
    return uniform;
};
osg.Uniform.createMatrix2 = function(mat2, name) {
    var uniform = new osg.Uniform();
    uniform.data = mat2;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix2fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat4;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createMatrix3 = function(mat3, name) {
    var uniform = new osg.Uniform();
    uniform.data = mat3;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix3fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat9;
    uniform.name = name;
    return uniform;
};
osg.Uniform.createMatrix4 = function(mat4, name) {
    var uniform = new osg.Uniform();
    uniform.data = mat4;
    uniform.glCall = function (location, transpose, glData) {
        gl.uniformMatrix4fv(location, transpose, glData);
    };
    uniform.apply = uniform.applyMatrix;
    uniform.transpose = false;
    uniform.glData = new osg.Float32Array(uniform.data);
    uniform.update = osg.Uniform.prototype._updateFloat16;
    uniform.name = name;
    return uniform;
};
/** -*- compile-command: "jslint-cli Node.js" -*- */

/** 
 *  Node that can contains child node
 *  @class Node
 */
osg.Node = function () {
    this.children = [];
    this.parents = [];
    this.nodeMask = ~0;
    this.boundingSphere = new osg.BoundingSphere();
    this.boundingSphereComputed = false;
};

/** @lends osg.Node.prototype */
osg.Node.prototype = {
    /**
        Return StateSet and create it if it does not exist yet
        @type osg.StateSet
     */
    getOrCreateStateSet: function() {
        if (this.stateset === undefined) {
            this.stateset = new osg.StateSet();
        }
        return this.stateset;
    },
    getStateSet: function() { return this.stateset; },
    accept: function(nv) { 
        if (nv.validNodeMask(this)) {
            nv.pushOntoNodePath(this);
            nv.apply(this);
            nv.popFromNodePath();
        }
    },
    dirtyBound: function() {
        if (this.boundingSphereComputed === true) {
            this.boundingSphereComputed = false;
            for (var i = 0, l = this.parents.length; i < l; i++) {
                this.parents[i].dirtyBound();
            }
        }
    },
    setNodeMask: function(mask) { this.nodeMask = mask; },
    getNodeMask: function(mask) { return this.nodeMask; },
    setStateSet: function(s) { this.stateset = s; },

    /**
       <p>
        Set update node callback, called during update traversal.
        The Object must have the following method
        update(node, nodeVisitor) {}
        note, callback is responsible for scenegraph traversal so
        they must call traverse(node,nv) to ensure that the
        scene graph subtree (and associated callbacks) are traversed.
        </p>
        <p>
        Here a dummy UpdateCallback example
        </p>
        @example
        var DummyUpdateCallback = function() {};
        DummyUpdateCallback.prototype = {
            update: function(node, nodeVisitor) {
                node.traverse(nodeVisitor);
            }
        };

        @param Oject callback
     */
    setUpdateCallback: function(cb) { this.updateCallback = cb; },
    /** Get update node callback, called during update traversal.
        @type Oject
     */
    getUpdateCallback: function() { return this.updateCallback; },
    setName: function(name) { this.name = name; },
    getName: function() { return this.name; },
    hasChild: function(child) {
        for (var i = 0, l = this.children.length; i < l; i++) {
            if (this.children[i] === child) {
                return true;
            }
        }
        return false;
    },
    addChild: function (child) {
	var c =  this.children.push(child);
        child.addParent(this);
	this.dirtyBound();
	return c;
    },
    getChildren: function() { return this.children; },
    addParent: function( parent) {
        this.parents.push(parent);
    },
    removeParent: function(parent) {
        for (var i = 0, l = this.parents.length, parents = this.parents; i < l; i++) {
            if (parents[i] === parent) {
                parents.splice(i, 1);
                return;
            }
        }
    },
    removeChildren: function () {
        var children = this.children;
        if (children.length !== 0) {
            for (var i = 0, l = children.length; i < l; i++) {
                children[i].removeParent(this);
            }
	    this.children.length = 0;
	    this.dirtyBound();
        }
    },

    // preserve order
    removeChild: function (child) {
        for (var i = 0, l = this.children.length; i < l; i++) {
            if (this.children[i] === child) {
                child.removeParent(this);
                this.children.splice(i, 1);
	        this.dirtyBound();
            }
        }
    },

    traverse: function (visitor) {
        for (var i = 0, l = this.children.length; i < l; i++) {
            var child = this.children[i];
            child.accept(visitor);
        }
    },

    ascend: function (visitor) {
        for (var i = 0, l = this.parents.length; i < l; i++) {
            var parent = this.parents[i];
            parent.accept(visitor);
        }
    },

    getBound: function() {
        if(!this.boundingSphereComputed) {
            this.computeBound(this.boundingSphere);
            this.boundingSphereComputed = true;
        }
        return this.boundingSphere;
    },

    computeBound: function (bsphere) {
        var bb = new osg.BoundingBox();
        bb.init();
        bsphere.init();
	for (var i = 0, l = this.children.length; i < l; i++) {
	    var child = this.children[i];
            if (child.referenceFrame === undefined || child.referenceFrame === osg.Transform.RELATIVE_RF) {
	        bb.expandBySphere(child.getBound());
            }
	}
        if (!bb.valid()) {
            return bsphere;
        }
        bsphere._center = bb.center();
        bsphere._radius = 0.0;
	for (var j = 0, l2 = this.children.length; j < l2; j++) {
	    var cc = this.children[j];
            if (cc.referenceFrame === undefined || cc.referenceFrame === osg.Transform.RELATIVE_RF) {
	        bsphere.expandRadiusBySphere(cc.getBound());
            }
	}
            
	return bsphere;
    },

    getWorldMatrices: function(halt) {
        var CollectParentPaths = function(halt) {
            this.nodePaths = [];
            this.halt = halt;
            osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_PARENTS);
        };
        CollectParentPaths.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
            apply: function(node) {
                if (node.parents.length === 0 || node === this.halt) {
                    // copy
                    this.nodePaths.push(this.nodePath.slice(0));
                } else {
                    this.traverse(node);
                }
            }
        });
        var collected = new CollectParentPaths(halt);
        this.accept(collected);
        var matrixList = [];

        for(var i = 0, l = collected.nodePaths.length; i < l; i++) {
            var np = collected.nodePaths[i];
            if (np.length === 0) {
                matrixList.push(osg.Matrix.makeIdentity());
            } else {
                matrixList.push(osg.computeLocalToWorld(np));
            }
        }
        return matrixList;
    }
    

};
osg.Node.prototype.objectType = osg.objectType.generate("Node");
osg.NodeVisitor = function (traversalMode) {
    this.traversalMask = ~0x0;
    this.nodeMaskOverride = 0;
    this.traversalMode = traversalMode;
    if (traversalMode === undefined) {
        this.traversalMode = osg.NodeVisitor.TRAVERSE_ALL_CHILDREN;
    }
    this.nodePath = [];
};
//osg.NodeVisitor.TRAVERSE_NONE = 0;
osg.NodeVisitor.TRAVERSE_PARENTS = 1;
osg.NodeVisitor.TRAVERSE_ALL_CHILDREN = 2;
//osg.NodeVisitor.TRAVERSE_ACTIVE_CHILDREN = 3;
osg.NodeVisitor._traversalFunctions = {};
osg.NodeVisitor._traversalFunctions[osg.NodeVisitor.TRAVERSE_PARENTS] = function(node) { node.ascend(this); };
osg.NodeVisitor._traversalFunctions[osg.NodeVisitor.TRAVERSE_ALL_CHILDREN] = function(node) { node.traverse(this); };

osg.NodeVisitor._pushOntoNodePath = {};
osg.NodeVisitor._pushOntoNodePath[osg.NodeVisitor.TRAVERSE_PARENTS] = function(node) { this.nodePath.unshift(node); };
osg.NodeVisitor._pushOntoNodePath[osg.NodeVisitor.TRAVERSE_ALL_CHILDREN] = function(node) { this.nodePath.push(node); };

osg.NodeVisitor._popFromNodePath = {};
osg.NodeVisitor._popFromNodePath[osg.NodeVisitor.TRAVERSE_PARENTS] = function() { return this.nodePath.shift(); };
osg.NodeVisitor._popFromNodePath[osg.NodeVisitor.TRAVERSE_ALL_CHILDREN] = function() { this.nodePath.pop(); };

osg.NodeVisitor.prototype = {
    setTraversalMask: function(m) { this.traversalMask = m; },
    getTraversalMask: function() { return this.traversalMask; },
    pushOntoNodePath: function(node) {
        osg.NodeVisitor._pushOntoNodePath[this.traversalMode].call(this, node);
    },
    popFromNodePath: function() {
        osg.NodeVisitor._popFromNodePath[this.traversalMode].call(this);
    },
    validNodeMask: function(node) {
        var nm = node.getNodeMask();
        return ((this.traversalMask & (this.nodeMaskOverride | nm)) !== 0);
    },
    apply: function ( node ) {
        this.traverse(node);
    },
    traverse: function ( node ) {
        osg.NodeVisitor._traversalFunctions[this.traversalMode].call(this, node);
    }
};
/** -*- compile-command: "jslint-cli Transform.js" -*- */

/** 
 * Transform - base class for Transform type node ( Camera, MatrixTransform )
 * @class Transform
 * @inherits osg.Node
 */
osg.Transform = function() {
    osg.Node.call(this);
    this.referenceFrame = osg.Transform.RELATIVE_RF;
};
osg.Transform.RELATIVE_RF = 0;
osg.Transform.ABSOLUTE_RF = 1;

/** @lends osg.Transform.prototype */
osg.Transform.prototype = osg.objectInehrit(osg.Node.prototype, {
    setReferenceFrame: function(value) { this.referenceFrame = value; },
    getReferenceFrame: function() { return this.referenceFrame; },

    computeBound: function(bsphere) {
        osg.Node.prototype.computeBound.call(this, bsphere);
        if (!bsphere.valid()) {
            return bsphere;
        }
        var matrix = osg.Matrix.makeIdentity();
        this.computeLocalToWorldMatrix(matrix);

        var xdash = osg.Vec3.copy(bsphere._center, []);
        xdash[0] += bsphere._radius;
        osg.Matrix.transformVec3(matrix, xdash, xdash);

        var ydash = osg.Vec3.copy(bsphere._center, []);
        ydash[1] += bsphere._radius;
        osg.Matrix.transformVec3(matrix, ydash, ydash);

        var zdash = osg.Vec3.copy(bsphere._center, []);
        zdash[2] += bsphere._radius;
        osg.Matrix.transformVec3(matrix, zdash, zdash);

        osg.Matrix.transformVec3(matrix, bsphere._center, bsphere._center);

        osg.Vec3.sub(xdash,
                     bsphere._center, 
                     xdash);
        var len_xdash = osg.Vec3.length(xdash);

        osg.Vec3.sub(ydash, 
                     bsphere._center, 
                     ydash);
        var len_ydash = osg.Vec3.length(ydash);

        osg.Vec3.sub(zdash, 
                     bsphere._center, 
                     zdash);
        var len_zdash = osg.Vec3.length(zdash);

        bsphere._radius = len_xdash;
        if (bsphere._radius<len_ydash) {
            bsphere._radius = len_ydash;
        }
        if (bsphere._radius<len_zdash) {
            bsphere._radius = len_zdash;
        }
        return bsphere;
    }
});

osg.computeLocalToWorld = function (nodePath, ignoreCameras) {
    var ignoreCamera = ignoreCameras;
    if (ignoreCamera === undefined) {
        ignoreCamera = true;
    }
    var matrix = osg.Matrix.makeIdentity();

    var j = 0;
    if (ignoreCamera) {
        for (j = nodePath.length-1; j > 0; j--) {
            var camera = nodePath[j];
            if (camera.objectType === osg.Camera.prototype.objectType &&
                (camera.getReferenceFrame !== osg.Transform.RELATIVE_RF || camera.getParents().length === 0 )) {
                break;
            }
        }
    }

    for (var i = j, l = nodePath.length; i < l; i++) {
        var node = nodePath[i];
        if (node.computeLocalToWorldMatrix) {
            node.computeLocalToWorldMatrix(matrix);
        }
    }
    return matrix;
};
/** 
 *  Manage Blending mode
 *  @class BlendFunc
 */
osg.BlendFunc = function (source, destination) {
    osg.StateAttribute.call(this);
    this.sourceFactor = 'ONE';
    this.destinationFactor = 'ZERO';
    if (source !== undefined) {
        this.sourceFactor = source;
    }
    if (destination !== undefined) {
        this.destinationFactor = destination;
    }
};
/** @lends osg.BlendFunc.prototype */
osg.BlendFunc.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    /** 
        StateAttribute type of BlendFunc
        @type String
     */
    attributeType: "BlendFunc",
    /** 
        Create an instance of this StateAttribute
    */ 
    cloneType: function() /**osg.BlendFunc*/ {return new osg.BlendFunc(); },
    /** 
        @type String
    */ 
    getType: function() { return this.attributeType;},
    /** 
        @type String
    */ 
    getTypeMember: function() { return this.attributeType;},
    /** 
        Apply the mode, must be called in the draw traversal
        @param state
    */
    apply: function(state) { 
        gl.blendFunc(gl[this.sourceFactor], gl[this.destinationFactor]); 
    }
});
osg.BoundingBox = function() {
    this._min = [1,1,1];
    this._max = [0,0,0];
};
osg.BoundingBox.prototype = {
    init: function() {
	this._min = [1,1,1];
	this._max = [0,0,0];
    },

    valid: function() {
        return (this._max[0] >= this._min[0] &&  this._max[1] >= this._min[1] &&  this._max[2] >= this._min[2]);
    },

    expandBySphere: function(sh) {
        if (!sh.valid()) {
            return;
        }
        if(sh._center[0]-sh._radius<this._min[0]) { this._min[0] = sh._center[0]-sh._radius; }
        if(sh._center[0]+sh._radius>this._max[0]) { this._max[0] = sh._center[0]+sh._radius; }

        if(sh._center[1]-sh._radius<this._min[1]) { this._min[1] = sh._center[1]-sh._radius; }
        if(sh._center[1]+sh._radius>this._max[1]) { this._max[1] = sh._center[1]+sh._radius; }

        if(sh._center[2]-sh._radius<this._min[2]) { this._min[2] = sh._center[2]-sh._radius; }
        if(sh._center[2]+sh._radius>this._max[2]) { this._max[2] = sh._center[2]+sh._radius; }
    },
    expandByVec3: function(v){

	if ( this.valid() ) {
	    if ( this._min[0] > v[0] ) { this._min[0] = v[0]; }
	    if ( this._min[1] > v[1] ) { this._min[1] = v[1]; }
	    if ( this._min[2] > v[2] ) { this._min[2] = v[2]; }
	    if ( this._max[0] < v[0] ) { this._max[0] = v[0]; }
	    if ( this._max[1] < v[1] ) { this._max[1] = v[1]; }
	    if ( this._max[2] < v[2] ) { this._max[2] = v[2]; }
	} else {
	    this._min[0] = v[0];
	    this._min[1] = v[1];
	    this._min[2] = v[2];
	    this._max[0] = v[0];
	    this._max[1] = v[1];
	    this._max[2] = v[2];
	}
    },

    center: function() {
	return osg.Vec3.mult(osg.Vec3.add(this._min,
                                          this._max, 
                                          []),
                             0.5,
                            []);
    },
    radius: function() {
	return Math.sqrt(this.radius2());
    },

    radius2: function() {
	return 0.25*(osg.Vec3.length2(osg.Vec3.sub(this._max,this._min, [])));
    },
    corner: function(pos) {
        ret = [0.0,0.0,0.0];
        if ( pos & 1 ) {
	    ret[0]=this._max[0];
	} else {
	    ret[0]=this._min[0];
	}
        if ( pos & 2 ) {
	    ret[1]=this._max[1];
	} else {
	    ret[1]=this._min[1];
	}
        if ( pos & 4 ) {
	    ret[2]=this._max[2];
	} else {
	    ret[2]=this._min[2];
	}
        return ret;
    }

};
osg.BoundingSphere = function() {
    this._center = [0.0,0.0,0.0];
    this._radius = -1;
};
osg.BoundingSphere.prototype = {
    init: function() {
	this._center = [0.0,0.0,0.0];
	this._radius = -1;
    },
    valid: function() {
	return this._radius>=0.0;
    },
    set: function (center,radius)
    {
	this._center = center;
	this._radius = radius;
    },
    center: function() {return this._center;},
    radius: function() {return this._radius;},
    radius2: function() {return this._radius*this._radius;},

    expandByBox: function(bb) {
	if ( bb.valid() )
	{
            var c;
	    if (this.valid())
	    {
		var newbb = new osg.BoundingBox();
		newbb._min[0]=bb._min[0];
		newbb._min[1]=bb._min[1];
		newbb._min[2]=bb._min[2];
		newbb._max[0]=bb._max[0];
		newbb._max[1]=bb._max[1];
		newbb._max[2]=bb._max[2];

                // this code is not valid c is defined after the loop
                // FIXME
		for (var i = 0 ; i < 8; i++) {
                    var v = osg.Vec3.sub(bb.corner(c),this._center, []); // get the direction vector from corner
                    osg.Vec3.normalize(v,v); // normalise it.
                    nv[0] *= -this._radius; // move the vector in the opposite direction distance radius.
                    nv[1] *= -this._radius; // move the vector in the opposite direction distance radius.
                    nv[2] *= -this._radius; // move the vector in the opposite direction distance radius.
                    nv[0] += this._center[0]; // move to absolute position.
                    nv[1] += this._center[1]; // move to absolute position.
                    nv[2] += this._center[2]; // move to absolute position.
                    newbb.expandBy(nv); // add it into the new bounding box.
		}

		c = newbb.center();
		this._center[0] = c[0];
		this._center[1] = c[1];
		this._center[2] = c[2];
		this._radius    = newbb.radius();


	    }
	    else
	    {

		c = bb.center();
		this._center[0] = c[0];
		this._center[1] = c[1];
		this._center[2] = c[2];
		this._radius    = bb.radius();

	    }
	}

    },

    expandByVec3: function(v){
	if ( this.valid())
	{
	    var dv = osg.Vec3.sub(v,this.center(), []);
	    r = osg.Vec3.length(dv);
	    if (r>this.radius())
	    {
		dr = (r-this.radius())*0.5;
		this._center[0] += dv[0] * (dr/r);
		this._center[1] += dv[1] * (dr/r);
		this._center[2] += dv[2] * (dr/r);
		this._radius += dr;
	    }
	}
	else
	{
	    this._center[0] = v[0];
	    this._center[1] = v[1];
	    this._center[2] = v[2];
	    this._radius = 0.0;
	}
    },

    expandRadiusBySphere: function(sh){
        if (sh.valid()) {
            if (this.valid()) {
                var sub = osg.Vec3.sub;
                var length = osg.Vec3.length;
                var r = length( sub(sh._center,
                                    this._center, 
                                    [])
                              ) + sh._radius;
                if (r>this._radius) {
                    this._radius = r;
                }
                // else do nothing as vertex is within sphere.
            } else {
                this._center = osg.Vec3.copy(sh._center, []);
                this._radius = sh._radius;
            }
        }
    },
    expandBy: function(sh){
	// ignore operation if incomming BoundingSphere is invalid.
	if (!sh.valid()) { return; }

	// This sphere is not set so use the inbound sphere
	if (!this.valid())
	{
	    this._center[0] = sh._center[0];
	    this._center[1] = sh._center[1];
	    this._center[2] = sh._center[2];
	    this._radius = sh.radius();

	    return;
	}


	// Calculate d == The distance between the sphere centers
	var tmp= osg.Vec3.sub( this.center() , sh.center(), [] );
	d = osg.Vec3.length(tmp);

	// New sphere is already inside this one
	if ( d + sh.radius() <= this.radius() )
	{
	    return;
	}

	//  New sphere completely contains this one
	if ( d + this.radius() <= sh.radius() )
	{
	    this._center[0] = sh._center[0];
	    this._center[1] = sh._center[1];
	    this._center[2] = sh._center[2];
	    this._radius    = sh._radius;
	    return;
	}


	// Build a new sphere that completely contains the other two:
	//
	// The center point lies halfway along the line between the furthest
	// points on the edges of the two spheres.
	//
	// Computing those two points is ugly - so we'll use similar triangles
	new_radius = (this.radius() + d + sh.radius() ) * 0.5;
	ratio = ( new_radius - this.radius() ) / d ;

	this._center[0] += ( sh._center[0] - this._center[0] ) * ratio;
	this._center[1] += ( sh._center[1] - this._center[1] ) * ratio;
	this._center[2] += ( sh._center[2] - this._center[2] ) * ratio;

	this._radius = new_radius;

    },
    contains: function(v) {
	var vc = osg.Vec3.sub(v,this.center(), []);
	return valid() && (osg.Vec3.length2(vc)<=radius2());
    },
    intersects: function( bs ) {
	var lc = osg.Vec3.length2(osg.Vec3.sub(this.center() , 
                                               bs.center(),
                                              []));
	return valid() && bs.valid() &&
	    (lc <= (this.radius() + bs.radius())*(this.radius() + bs.radius()));
    }
};
/** 
 * BufferArray manage vertex / normal / ... array used by webgl.
 * @class BufferArray
 */
osg.BufferArray = function (type, elements, itemSize) {
    if (osg.BufferArray.instanceID === undefined) {
        osg.BufferArray.instanceID = 0;
    }
    this.instanceID = osg.BufferArray.instanceID;
    osg.BufferArray.instanceID += 1;
    this.dirty();

    this.itemSize = itemSize;
    this.type = type;
    if (this.type === gl.ELEMENT_ARRAY_BUFFER) {
        this.elements = new osg.Uint16Array(elements);
    } else {
        this.elements = new osg.Float32Array(elements);
    }
};

/** @lends osg.BufferArray.prototype */
osg.BufferArray.prototype = {
    init: function() {
        if (!this.buffer && this.elements.length > 0 ) {
            this.buffer = gl.createBuffer();
            this.buffer.itemSize = this.itemSize;
            this.buffer.numItems = this.elements.length / this.itemSize;
        }
    },
    dirty: function() { this._dirty = true; },
    isDirty: function() { return this._dirty; },
    compile: function() {
        if (this._dirty) {
            gl.bufferData(this.type, this.elements, gl.STATIC_DRAW);
            this._dirty = false;
        }
    },
    getElements: function() { return this.elements;}
};

osg.BufferArray.create = function(type, elements, itemSize) {
    osg.log("osg.BufferArray.create is deprecated, use new osg.BufferArray with same arguments instead");
    return new osg.BufferArray(type, elements, itemSize);
};
osg.CullFace = function (mode) {
    osg.StateAttribute.call(this);
    this.mode = 'BACK';
    if (mode !== undefined) {
        this.mode = mode;
    }
};
osg.CullFace.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "CullFace",
    cloneType: function() {return new osg.CullFace(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) { 
        if (this.mode === 'DISABLE') {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl[this.mode]);
        }
        this._dirty = false;
    }
});
osg.CullSettings = function() {
    this.computeNearFar = true;
    this.nearFarRatio = 0.0005;

    var lookVector =[0.0,0.0,-1.0];
    this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
    this.bbCornerNear = (~this.bbCornerFar)&7;
};
osg.CullSettings.prototype = {
    setCullSettings: function(settings) {
        this.computeNearFar = settings.computeNearFar;
        this.nearFarRatio = settings.nearFarRatio;
    },
    setNearFarRatio: function( ratio) { this.nearFarRatio = ratio; },
    getNearFarRatio: function() { return this.nearFarRatio; },
    setComputeNearFar: function(value) { this.computeNearFar = value; },
    getComputeNearFar: function() { return this.computeNearFar; }
};
/** 
 * Camera - is a subclass of Transform which represents encapsulates the settings of a Camera.
 * @class Camera
 * @inherits osg.Transform osg.CullSettings
 */
osg.Camera = function () {
    osg.Transform.call(this);
    osg.CullSettings.call(this);

    this.viewport = undefined;
    this.setClearColor([0, 0, 0, 1.0]);
    this.setClearDepth(1.0);
    this.setClearMask(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.setViewMatrix(osg.Matrix.makeIdentity());
    this.setProjectionMatrix(osg.Matrix.makeIdentity());
    this.renderOrder = osg.Camera.NESTED_RENDER;
    this.renderOrderNum = 0;
};
osg.Camera.PRE_RENDER = 0;
osg.Camera.NESTED_RENDER = 1;
osg.Camera.POST_RENDER = 2;

/** @lends osg.Camera.prototype */
osg.Camera.prototype = osg.objectInehrit(
    osg.CullSettings.prototype, 
    osg.objectInehrit(osg.Transform.prototype, {

        setClearDepth: function(depth) { this.clearDepth = depth;}, 
        getClearDepth: function() { return this.clearDepth;},

        setClearMask: function(mask) { this.clearMask = mask;}, 
        getClearMask: function() { return this.clearMask;},

        setClearColor: function(color) { this.clearColor = color;},
        getClearColor: function() { return this.clearColor;},

        setViewport: function(vp) { 
            this.viewport = vp;
            this.getOrCreateStateSet().setAttributeAndMode(vp);
        },
        getViewport: function() { return this.viewport; },


        setViewMatrix: function(matrix) {
            this.modelviewMatrix = matrix;
        },

        setProjectionMatrix: function(matrix) {
            this.projectionMatrix = matrix;
        },

        /** Set to an orthographic projection. See OpenGL glOrtho for documentation further details.*/
        setProjectionMatrixAsOrtho: function(left, right,
                                             bottom, top,
                                             zNear, zFar) {
            osg.Matrix.makeOrtho(left, right, bottom, top, zNear, zFar, this.getProjectionMatrix());
        },

        getViewMatrix: function() { return this.modelviewMatrix; },
        getProjectionMatrix: function() { return this.projectionMatrix; },
        getRenderOrder: function() { return this.renderOrder; },
        setRenderOrder: function(order, orderNum) {
            this.renderOrder = order;
            this.renderOrderNum = orderNum; 
        },

        attachTexture: function(bufferComponent, texture, level) {
            if (this.frameBufferObject) {
                this.frameBufferObject.dirty();
            }
            if (level === undefined) {
                level = 0;
            }
            if (this.attachments === undefined) {
                this.attachments = {};
            }
            this.attachments[bufferComponent] = { 'texture' : texture , 'level' : level };
        },

        attachRenderBuffer: function(bufferComponent, internalFormat) {
            if (this.frameBufferObject) {
                this.frameBufferObject.dirty();
            }
            if (this.attachments === undefined) {
                this.attachments = {};
            }
            this.attachments[bufferComponent] = { 'format' : internalFormat };
        },

        computeLocalToWorldMatrix: function(matrix,nodeVisitor) {
            if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
                osg.Matrix.preMult(matrix, this.modelviewMatrix);
            } else {// absolute
                matrix = this.modelviewMatrix;
            }
            return true;
        },

        computeWorldToLocalMatrix: function(matrix, nodeVisitor) {
            var inverse = osg.Matrix.inverse(this.modelviewMatrix);
            if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
                osg.Matrix.postMult(inverse, matrix);
            } else {
                matrix = inverse;
            }
            return true;
        }

    }));
osg.Camera.prototype.objectType = osg.objectType.generate("Camera");

osg.Depth = function (func, near, far, writeMask) {
    osg.StateAttribute.call(this);
    this.func = 'LESS';
    this.near = 0.0;
    this.far = 1.0;
    this.writeMask = true;

    if (func !== undefined) {
        this.func = func;
    }
    if (near !== undefined) {
        this.near = near;
    }
    if (far !== undefined) {
        this.far = far;
    }
    if (writeMask !== undefined) {
        this.writeMask = far;
    }
};
osg.Depth.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Depth",
    cloneType: function() {return new osg.Depth(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setRange: function(near, far) { this.near = near; this.far = far; },
    setWriteMask: function(mask) { this.mask = mask; },
    apply: function(state) {
        if (this.func === 'DISABLE') {
            gl.disable(gl.DEPTH_TEST);
        } else {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl[this.func]);
            gl.depthMask(this.writeMask);
            gl.depthRange(this.near, this.far);
        }
    }
});
osg.WGS_84_RADIUS_EQUATOR = 6378137.0;
osg.WGS_84_RADIUS_POLAR = 6356752.3142;

osg.EllipsoidModel = function() {
    this._radiusEquator = osg.WGS_84_RADIUS_EQUATOR;
    this._radiusPolar = osg.WGS_84_RADIUS_POLAR;
    this.computeCoefficients();
};
osg.EllipsoidModel.prototype = {
    setRadiusEquator: function(r) { this._radiusEquator = radius; this.computeCoefficients();},
    getRadiusEquator: function() { return this._radiusEquator;},
    setRadiusPolar: function(radius) { this._radiusPolar = radius; 
                                              this.computeCoefficients(); },
    getRadiusPolar: function() { return this._radiusPolar; },
    convertLatLongHeightToXYZ: function ( latitude, longitude, height ) {
        var sin_latitude = Math.sin(latitude);
        var cos_latitude = Math.cos(latitude);
        var N = this._radiusEquator / Math.sqrt( 1.0 - this._eccentricitySquared*sin_latitude*sin_latitude);
        var X = (N+height)*cos_latitude*Math.cos(longitude);
        var Y = (N+height)*cos_latitude*Math.sin(longitude);
        var Z = (N*(1-this._eccentricitySquared)+height)*sin_latitude;
        return [X, Y, Z];
    },
    convertXYZToLatLongHeight: function ( X,  Y,  Z ) {
        // http://www.colorado.edu/geography/gcraft/notes/datum/gif/xyzllh.gif
        var p = Math.sqrt(X*X + Y*Y);
        var theta = Math.atan2(Z*this._radiusEquator , (p*this._radiusPolar));
        var eDashSquared = (this._radiusEquator*this._radiusEquator - this._radiusPolar*this._radiusPolar)/ (this._radiusPolar*this._radiusPolar);

        var sin_theta = Math.sin(theta);
        var cos_theta = Math.cos(theta);

        latitude = Math.atan( (Z + eDashSquared*this._radiusPolar*sin_theta*sin_theta*sin_theta) /
                         (p - this._eccentricitySquared*this._radiusEquator*cos_theta*cos_theta*cos_theta) );
        longitude = Math.atan2(Y,X);

        var sin_latitude = Math.sin(latitude);
        var N = this._radiusEquator / Math.sqrt( 1.0 - this._eccentricitySquared*sin_latitude*sin_latitude);

        height = p/Math.cos(latitude) - N;
        return [latitude, longitude, height];
    },
    computeLocalUpVector: function(X, Y, Z) {
        // Note latitude is angle between normal to ellipsoid surface and XY-plane
        var  latitude, longitude, altitude;
        var coord = this.convertXYZToLatLongHeight(X,Y,Z,latitude,longitude,altitude);
        latitude = coord[0];
        longitude = coord[1];
        altitude = coord[2];

        // Compute up vector
        return [ Math.cos(longitude) * Math.cos(latitude),
                 Math.sin(longitude) * Math.cos(latitude),
                 Math.sin(latitude) ];
    },
    isWGS84: function() { return(this._radiusEquator == osg.WGS_84_RADIUS_EQUATOR && this._radiusPolar == osg.WGS_84_RADIUS_POLAR);},

    computeCoefficients: function() {
        var flattening = (this._radiusEquator-this._radiusPolar)/this._radiusEquator;
        this._eccentricitySquared = 2*flattening - flattening*flattening;
    },
    computeLocalToWorldTransformFromLatLongHeight : function(latitude, longitude, height) {
        var pos = this.convertLatLongHeightToXYZ(latitude, longitude, height);
        var m = osg.Matrix.makeTranslate(pos[0], pos[1], pos[2], []);
        this.computeCoordinateFrame(latitude, longitude, m);
        return m;
    },
    computeLocalToWorldTransformFromXYZ : function(X, Y, Z) {
        var lla = this.convertXYZToLatLongHeight(X, Y, Z);
        var m = osg.Matrix.makeTranslate(X, Y, Z);
        this.computeCoordinateFrame(lla[0], lla[1], m);
        return m;
    },
    computeCoordinateFrame: function ( latitude,  longitude, localToWorld) {
        // Compute up vector
        var  up = [ Math.cos(longitude)*Math.cos(latitude), Math.sin(longitude)*Math.cos(latitude), Math.sin(latitude) ];

        // Compute east vector
        var east = [-Math.sin(longitude), Math.cos(longitude), 0];

        // Compute north vector = outer product up x east
        var north = osg.Vec3.cross(up,east, []);

        // set matrix
        osg.Matrix.set(localToWorld,0,0, east[0]);
        osg.Matrix.set(localToWorld,0,1, east[1]);
        osg.Matrix.set(localToWorld,0,2, east[2]);

        osg.Matrix.set(localToWorld,1,0, north[0]);
        osg.Matrix.set(localToWorld,1,1, north[1]);
        osg.Matrix.set(localToWorld,1,2, north[2]);

        osg.Matrix.set(localToWorld,2,0, up[0]);
        osg.Matrix.set(localToWorld,2,1, up[1]);
        osg.Matrix.set(localToWorld,2,2, up[2]);
    }
};
/** 
 * FrameBufferObject manage fbo / rtt 
 * @class FrameBufferObject
 */
osg.FrameBufferObject = function () {
    osg.StateAttribute.call(this);
    this.fbo = undefined;
    this.attachments = [];
    this.dirty();
};

/** @lends osg.FrameBufferObject.prototype */
osg.FrameBufferObject.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "FrameBufferObject",
    cloneType: function() {return new osg.FrameBufferObject(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setAttachment: function(attachment) { this.attachments.push(attachment); },
    apply: function(state) {
        var status;
        if (this.attachments.length > 0) {
            if (this.isDirty()) {

                if (!this.fbo) {
                    this.fbo = gl.createFramebuffer();
                }

                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                var hasRenderBuffer = false;
                for (var i = 0, l = this.attachments.length; i < l; ++i) {
                    
                    if (this.attachments[i].texture === undefined) { // render buffer
                        var rb = gl.createRenderbuffer();
                        gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
                        gl.renderbufferStorage(gl.RENDERBUFFER, this.attachments[i].format, this.attachments[i].width, this.attachments[i].height);
                        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, this.attachments[i].attachment, gl.RENDERBUFFER, rb);
                        hasRenderBuffer = true;
                    } else {
                        var texture = this.attachments[i].texture;
                        // apply on unit 0 to init it
                        state.applyTextureAttribute(0, texture);
                        
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachments[i].attachment, gl[texture.target], texture.textureObject, this.attachments[i].level);
                    }
                }
                status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (status !== 0x8CD5) {
                    osg.log("framebuffer error check " + status);
                }
                
                if (hasRenderBuffer) { // set it to null only if used renderbuffer
                    gl.bindRenderbuffer(null);
                }
                this.setDirty(false);
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                if (osg.reportErrorGL === true) {
                    status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                    if (status !== 0x8CD5) {
                        osg.log("framebuffer error check " + status);
                    }
                }
            }
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }
});
osg.FrameStamp = function() {
    var frame = 0;
    var startSimulation = 0.0;
    var currentSimulation = 0.0;
    
    this.setReferenceTime = function(s) { startSimulation = s; };
    this.setSimulationTime = function(s) { currentSimulation = s; };
    this.getReferenceTime = function() { return startSimulation; };
    this.getSimulationTime = function() { return currentSimulation; };
    this.setFrameNumber = function(n) { frame = n; };
    this.getFrameNumber = function() { return frame; };
};
/** 
 * Geometry manage array and primitives to draw a geometry.
 * @class Geometry
 */
osg.Geometry = function () {
    osg.Node.call(this);
    this.primitives = [];
    this.attributes = {};
    this.boundingBox = new osg.BoundingBox();
    this.boundingBoxComputed = false;
    this.cacheAttributeList = {};
};

/** @lends osg.Geometry.prototype */
osg.Geometry.prototype = osg.objectInehrit(osg.Node.prototype, {
    dirtyBound: function() {
        if (this.boundingBoxComputed === true) {
            this.boundingBoxComputed = false;
        }
        osg.Node.dirtyBound.call(this);
    },

    dirty: function() {
        this.cacheAttributeList = {};
    },
    getPrimitives: function() { return this.primitives; },
    getAttributes: function() { return this.attributes; },

    drawImplementation: function(state) {
        var program = state.getLastProgramApplied();
        var prgID = program.instanceID;
        if (this.cacheAttributeList[prgID] === undefined) {
            var attribute;
            var attributesCache = program.attributesCache;
            var attributeList = [];

            var generated = "//generated by Geometry::implementation\nfunction(state) {\n";
            generated += "state.lazyDisablingOfVertexAttributes();\n";

            for (var i = 0, l = attributesCache.attributeKeys.length; i < l; i++) {
                var key = attributesCache.attributeKeys[i];
                attribute = attributesCache[key];
                var attr = this.attributes[key];
                if (attr === undefined) {
                    continue;
                }
                attributeList.push(attribute);
                generated += "state.setVertexAttribArray(" + attribute + ", this.attributes[\""+key+ "\"], false);\n";
            }
            generated += "state.applyDisablingOfVertexAttributes();\n";
            var primitives = this.primitives;
            generated += "var primitives = this.primitives;\n";
            for (var j = 0, m = primitives.length; j < m; ++j) {
                generated += "primitives["+j+"].draw(state);\n";
            }
            generated += "}";
            var returnFunction = function() {
                //osg.log(generated);
                eval("var drawImplementationAutogenerated = " + generated + ";");
                return drawImplementationAutogenerated;
            };
            this.cacheAttributeList[prgID] = returnFunction();
        }
        this.cacheAttributeList[prgID].call(this, state);
    },

    // for testing disabling drawing
    drawImplementationDummy: function(state) {
        var program = state.getLastProgramApplied();
        var attribute;
        var attributeList = [];
        var attributesCache = program.attributesCache;


        var primitives = this.primitives;
        //state.disableVertexAttribsExcept(attributeList);

        for (var j = 0, m = primitives.length; j < m; ++j) {
            //primitives[j].draw(state);
        }
    },

    getBoundingBox: function() {
        if(!this.boundingBoxComputed) {
            this.computeBoundingBox(this.boundingBox);
            this.boundingBoxComputed = true;
        }
        return this.boundingBox;
    },
    computeBoundingBox: function(boundingBox) {
	var att = this.getAttributes();
	if ( att.Vertex.itemSize == 3 ) {
	    vertexes = att.Vertex.getElements();
	    for (var idx = 0, l = vertexes.length; idx < l; idx+=3) {
		var v=[vertexes[idx],vertexes[idx+1],vertexes[idx+2]];
		boundingBox.expandByVec3(v);
	    }
	}
        return boundingBox;
    },

    computeBound: function (boundingSphere) {
	boundingSphere.init();
	var bb = this.getBoundingBox();
	boundingSphere.expandByBox(bb);
	return boundingSphere;
    }
});
osg.Geometry.prototype.objectType = osg.objectType.generate("Geometry");
osg.Light = function () {
    osg.StateAttribute.call(this);

    this.ambient = [ 0.2, 0.2, 0.2, 1.0 ];
    this.diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
    this.specular = [ 0.0, 0.0, 0.0, 1.0 ];
    this.direction = [ 0.0, 0.0, 1.0 ];
    this.constant_attenuation = 1.0;
    this.linear_attenuation = 1.0;
    this.quadratic_attenuation = 1.0;
    this.light_unit = 0;
    this.enabled = 0;

    this.ambient = [ 1.0, 1.0, 1.0, 1.0 ];
    this.diffuse = [ 1.0, 1.0, 1.0, 1.0 ];
    this.specular = [ 1.0, 1.0, 1.0, 1.0 ];

    this._dirty = true;
};

osg.Light.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Light",
    cloneType: function() {return new osg.Light(); },
    getType: function() { return this.attributeType; },
    getTypeMember: function() { return this.attributeType + this.light_unit;},
    getOrCreateUniforms: function() {
        if (osg.Light.uniforms === undefined) {
            osg.Light.uniforms = {};
        }
        if (osg.Light.uniforms[this.getTypeMember()] === undefined) {
            osg.Light.uniforms[this.getTypeMember()] = { "ambient": osg.Uniform.createFloat4([ 0.2, 0.2, 0.2, 1], this.getParameterName("ambient")) ,
                                                         "diffuse": osg.Uniform.createFloat4([ 0.8, 0.8, 0.8, 1], this.getParameterName('diffuse')) ,
                                                         "specular": osg.Uniform.createFloat4([ 0.2, 0.2, 0.2, 1], this.getParameterName('specular')) ,
                                                         "direction": osg.Uniform.createFloat3([ 0, 0, 1], this.getParameterName('direction')),
                                                         "constant_attenuation": osg.Uniform.createFloat1( 0, this.getParameterName('constant_attenuation')),
                                                         "linear_attenuation": osg.Uniform.createFloat1( 0, this.getParameterName('linear_attenuation')),
                                                         "quadratic_attenuation": osg.Uniform.createFloat1( 0, this.getParameterName('quadratic_attenuation')),
                                                         "enable": osg.Uniform.createInt1( 0, this.getParameterName('enable')),
                                                         "matrix": osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), this.getParameterName('matrix'))
                                                       };

            var uniformKeys = [];
            for (var k in osg.Light.uniforms[this.getTypeMember()]) {
                uniformKeys.push(k);
            }
            osg.Light.uniforms[this.getTypeMember()].uniformKeys = uniformKeys;
        }
        return osg.Light.uniforms[this.getTypeMember()];
    },

    getPrefix: function() {
        return this.getType() + this.light_unit;
    },

    getParameterName: function (name) {
        return this.getPrefix()+ "_" + name;
    },

    applyPositionedUniform: function(matrix, state) {
        var uniform = this.getOrCreateUniforms();
        uniform.matrix.set(matrix);
    },

    apply: function(state)
    {
        var light = this.getOrCreateUniforms();

        light.ambient.set(this.ambient);
        light.diffuse.set(this.diffuse);
        light.specular.set(this.specular);
        light.direction.set(this.direction);
        light.constant_attenuation.set([this.constant_attenuation]);
        light.linear_attenuation.set([this.linear_attenuation]);
        light.quadratic_attenuation.set([this.quadratic_attenuation]);
        light.enable.set([this.enable]);

        this._dirty = false;
    },

    writeShaderInstance: function(type) {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str = [ "",
                    "varying vec4 LightColor;",
                    "vec3 EyeVector;",
                    "vec3 NormalComputed;",
                    "",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexFunction:
            str = [ "",
                    "vec3 computeNormal() {",
                    "   return vec3(NormalMatrix * vec4(Normal, 0.0));",
                    "}",
                    "",
                    "vec3 computeEyeDirection() {",
                    "   return vec3(ModelViewMatrix * vec4(Vertex,1.0));",
                    "}",
                    "",
                    "void directionalLight(in vec3 lightDirection, in vec3 lightHalfVector, in float constantAttenuation, in float linearAttenuation, in float quadraticAttenuation, in vec4 ambient, in vec4 diffuse,in vec4 specular, in vec3 normal)",
                    "{",
                    "   float nDotVP;         // normal . light direction",
                    "   float nDotHV;         // normal . light half vector",
                    "   float pf;             // power factor",
                    "",
                    "   nDotVP = max(0.0, dot(normal, normalize(lightDirection)));",
                    "   nDotHV = max(0.0, dot(normal, lightHalfVector));",
                    "",
                    "   if (nDotHV == 0.0)",
                    "   {",
                    "       pf = 0.0;",
                    "   }",
                    "   else",
                    "   {",
                    "       pf = pow(nDotHV, MaterialShininess);",
                    "   }",
                    "   Ambient  += ambient;",
                    "   Diffuse  += diffuse * nDotVP;",
                    "   Specular += specular * pf;",
                    "}",
                    "",
                    "void flight(in vec3 lightDirection, in float constantAttenuation, in float linearAttenuation, in float quadraticAttenuation, in vec4 ambient, in vec4 diffuse, in vec4 specular, in vec3 normal)",
                    "{",
                    "    vec4 localColor;",
                    "    vec3 lightHalfVector = normalize(EyeVector-lightDirection);",
                    "    // Clear the light intensity accumulators",
                    "    Ambient  = vec4 (0.0);",
                    "    Diffuse  = vec4 (0.0);",
                    "    Specular = vec4 (0.0);",
                    "",
                    "    directionalLight(lightDirection, lightHalfVector, constantAttenuation, linearAttenuation, quadraticAttenuation, ambient, diffuse, specular, normal);",
                    "",
                    "    vec4 sceneColor = vec4(0,0,0,0);",
                    "    localColor = sceneColor +",
                    "      MaterialEmission +",
                    "      Ambient  * MaterialAmbient +",
                    "      Diffuse  * MaterialDiffuse;",
                    "      //Specular * MaterialSpecular;",
                    "    localColor = clamp( localColor, 0.0, 1.0 );",
                    "    LightColor += localColor;",
                    "",
                    "}" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexMain:
            str = [ "",
                    "EyeVector = computeEyeDirection();",
                    "NormalComputed = computeNormal();",
                    "LightColor = vec4(0,0,0,0);",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentInit:
            str = [ "varying vec4 LightColor;",
                    ""
                  ].join('\n');
            break;
        case osg.ShaderGeneratorType.FragmentMain:
            str = [ "",
                    "fragColor *= LightColor;"
                  ].join('\n');
            break;
        }
        return str;
    },

    writeToShader: function(type)
    {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str = [ "",
                    "uniform bool " + this.getParameterName('enabled') + ";",
                    "uniform vec4 " + this.getParameterName('ambient') + ";",
                    "uniform vec4 " + this.getParameterName('diffuse') + ";",
                    "uniform vec4 " + this.getParameterName('specular') + ";",
                    "uniform vec3 " + this.getParameterName('direction') + ";",
                    "uniform float " + this.getParameterName('constantAttenuation') + ";",
                    "uniform float " + this.getParameterName('linearAttenuation') + ";",
                    "uniform float " + this.getParameterName('quadraticAttenuation') + ";",
                    //                    "uniform mat4 " + this.getParameterName('matrix') + ";",
                    "",
                    "" ].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexMain:
            var lightNameDirection = this.getParameterName('direction');
            var lightNameDirectionTmp = this.getParameterName('directionNormalized');
            var NdotL = this.getParameterName("NdotL");
            str = [ "",
                    "//if (" + this.getParameterName('enabled') + ") {",
                    "if (true) {",
                    "  vec3 " + lightNameDirectionTmp + " = normalize(" + lightNameDirection + ");",
                    "  float " + NdotL + " = max(dot(Normal, " + lightNameDirectionTmp + "), 0.0);",
                    "  flight(" +lightNameDirectionTmp +", "+ this.getParameterName("constantAttenuation") + ", " + this.getParameterName("linearAttenuation") + ", " + this.getParameterName("quadraticAttenuation") + ", " + this.getParameterName("ambient") + ", " + this.getParameterName("diffuse") + ", " + this.getParameterName("specular") + ", NormalComputed );",
                    "}",
                    "" ].join('\n');
            break;
        }
        return str;
    }
});
osg.LineWidth = function (lineWidth) {
    osg.StateAttribute.call(this);
    this.lineWidth = 1.0;
    if (lineWidth !== undefined) {
        this.lineWidth = lineWidth;
    }
};
osg.LineWidth.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "LineWidth",
    cloneType: function() {return new osg.LineWidth(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) { gl.lineWidth(this.lineWidth); }
});
/** 
 * Material
 * @class Material
 */
osg.Material = function () {
    osg.StateAttribute.call(this);
    this.ambient = [ 0.2, 0.2, 0.2, 1.0 ];
    this.diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
    this.specular = [ 0.0, 0.0, 0.0, 1.0 ];
    this.emission = [ 0.0, 0.0, 0.0, 1.0 ];
    this.shininess = [0.0];
    this._dirty = true;
};
/** @lends osg.Material.prototype */
osg.Material.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    /** setAmbient */
    setAmbient: function(a) { this.ambient = a; this._dirty = true; },
    /** setSpecular */
    setSpecular: function(a) { this.specular = a; this._dirty = true; },
    /** setDiffuse */
    setDiffuse: function(a) { this.diffuse = a; this._dirty = true; },
    attributeType: "Material",
    cloneType: function() {return new osg.Material(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    getOrCreateUniforms: function() {
        if (osg.Material.uniforms === undefined) {
            osg.Material.uniforms = { "ambient": osg.Uniform.createFloat4([ 0, 0, 0, 0], 'MaterialAmbient') ,
                                      "diffuse": osg.Uniform.createFloat4([ 0, 0, 0, 0], 'MaterialDiffuse') ,
                                      "specular": osg.Uniform.createFloat4([ 0, 0, 0, 0], 'MaterialSpecular') ,
                                      "emission": osg.Uniform.createFloat4([ 0, 0, 0, 0], 'MaterialEmission') ,
                                      "shininess": osg.Uniform.createFloat1([ 0], 'MaterialShininess')
                                    };
            var uniformKeys = [];
            for (var k in osg.Material.uniforms) {
                uniformKeys.push(k);
            }
            osg.Material.uniforms.uniformKeys = uniformKeys;
        }
        return osg.Material.uniforms;
    },

    apply: function(state)
    {
        var uniforms = this.getOrCreateUniforms();
        uniforms.ambient.set(this.ambient);
        uniforms.diffuse.set(this.diffuse);
        uniforms.specular.set(this.specular);
        uniforms.emission.set(this.emission);
        uniforms.shininess.set(this.shininess);
        this._dirty = false;
    },

    writeToShader: function(type)
    {
        var str = "";
        switch (type) {
        case osg.ShaderGeneratorType.VertexInit:
            str =  [ "uniform vec4 MaterialAmbient;",
                     "uniform vec4 MaterialDiffuse;",
                     "uniform vec4 MaterialSpecular;",
                     "uniform vec4 MaterialEmission;",
                     "uniform float MaterialShininess;",
                     "vec4 Ambient;",
                     "vec4 Diffuse;",
                     "vec4 Specular;",
                     ""].join('\n');
            break;
        case osg.ShaderGeneratorType.VertexMain:
            break;
        }
        return str;
    }
});
osg.MatrixTransform = function() {
    osg.Transform.call(this);
    this.matrix = osg.Matrix.makeIdentity();
};
osg.MatrixTransform.prototype = osg.objectInehrit(osg.Transform.prototype, {
    getMatrix: function() { return this.matrix; },
    setMatrix: function(m) { this.matrix = m; },
    computeLocalToWorldMatrix: function(matrix,nodeVisitor) {
        if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
            osg.Matrix.preMult(matrix, this.matrix);
        } else {
            matrix = this.matrix;
        }
        return true;
    },
    computeWorldToLocalMatrix: function(matrix,nodeVisitor) {
        var minverse = osg.Matrix.inverse(this.matrix);
        if (this.referenceFrame === osg.Transform.RELATIVE_RF) {
            osg.Matrix.postMult(minverse, matrix);
        } else {// absolute
            matrix = inverse;
        }
        return true;
    }
});
osg.MatrixTransform.prototype.objectType = osg.objectType.generate("MatrixTransform");
/** 
 * DrawArrays manage rendering primitives
 * @class DrawArrays
 */
osg.DrawArrays = function (mode, first, count) 
{
    this.mode = mode;
    this.first = first;
    this.count = count;
};

/** @lends osg.DrawArrays.prototype */
osg.DrawArrays.prototype = {
    draw: function(state) {
        gl.drawArrays(this.mode, this.first, this.count);
    },
    getMode: function() { return this.mode; },
    getCount: function() { return this.count; },
    getFirst: function() { return this.first; }
};
osg.DrawArrays.create = function(mode, first, count) {
    osg.log("osg.DrawArrays.create is deprecated, use new osg.DrawArrays with same arguments");
    var d = new osg.DrawArray(mode, first, count);
    return d;
};


/** 
 * DrawElements manage rendering of indexed primitives
 * @class DrawElements
 */
osg.DrawElements = function (mode, indices) {
    this.mode = gl.POINTS;
    if (mode !== undefined) {
        this.mode = mode;
    }

    this.count = 0;
    this.offset = 0;
    this.indices = indices;
    if (indices !== undefined) {
        this.count = indices.elements.length;
    }
};

/** @lends osg.DrawElements.prototype */
osg.DrawElements.prototype = {
    getMode: function() { return this.mode; },
    draw: function(state) {
        state.setIndexArray(this.indices);
        gl.drawElements(this.mode, this.count, gl.UNSIGNED_SHORT, this.offset );
    },
    getIndices: function() { return this.indices; },
    setFirst: function(val) { this.offset = val; },
    getFirst: function() { return this.offset;},
    setCount: function(val) { this.count = val;},
    getCount: function() { return this.count; }

};

osg.DrawElements.create = function(mode, indices) {
    osg.log("osg.DrawElements.create is deprecated, use new osg.DrawElements with same arguments");
    return new osg.DrawElements(mode, indices);
};
/** 
 * Program encapsulate an vertex and fragment shader
 * @class Program
 */
osg.Program = function (vShader, fShader) { 
    if (osg.Program.instanceID === undefined) {
        osg.Program.instanceID = 0;
    }
    this.instanceID = osg.Program.instanceID;
    this._dirty = true;
    osg.Program.instanceID+= 1;

    this.program = null;
    this.vertex = vShader;
    this.fragment = fShader;
    this.dirty = true;
};

/** @lends osg.Program.prototype */
osg.Program.prototype = {
    isDirty: function() { return this._dirty; },
    attributeType: "Program",
    cloneType: function() { var p = new osg.Program(); p.default_program = true; return p; },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setVertexShader: function(vs) { program.vertex = vs; },
    setFragmentShader: function(fs) { program.fragment = fs; },
    apply: function(state) {
        if (!this.program || this._dirty) {

            if (this.default_program === true) {
                return;
            }

            if (!this.vertex.shader) {
                this.vertex.compile();
            }
            if (!this.fragment.shader) {
                this.fragment.compile();
            }
            this.program = gl.createProgram();
            gl.attachShader(this.program, this.vertex.shader);
            gl.attachShader(this.program, this.fragment.shader);
            gl.linkProgram(this.program);
            gl.validateProgram(this.program);
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                osg.log("can't link program\n" + "vertex shader:\n" + this.vertex.text +  "\n fragment shader:\n" + this.fragment.text);
                osg.log(gl.getProgramInfoLog(this.program));
                debugger;
                return null;
            }

            this.uniformsCache = {};
            this.uniformsCache.uniformKeys = [];
            this.attributesCache = {};
            this.attributesCache.attributeKeys = [];

            this.cacheUniformList(this.vertex.text);
            this.cacheUniformList(this.fragment.text);
            //osg.log(this.uniformsCache);

            this.cacheAttributeList(this.vertex.text);

            this._dirty = false;
        }

        gl.useProgram(this.program);
    },

    cacheUniformList: function(str) {
        var r = str.match(/uniform\s+\w+\s+\w+/g);
        if (r !== null) {
            for (var i = 0, l = r.length; i < l; i++) {
                var uniform = r[i].match(/uniform\s+\w+\s+(\w+)/)[1];
                var location = gl.getUniformLocation(this.program, uniform);
                if (location !== undefined && location !== null) {
                    if (this.uniformsCache[uniform] === undefined) {
                        this.uniformsCache[uniform] = location;
                        this.uniformsCache.uniformKeys.push(uniform);
                    }
                }
            }
        }
    },

    cacheAttributeList: function(str) {
        var r = str.match(/attribute\s+\w+\s+\w+/g);
        if (r !== null) {
            for (var i = 0, l = r.length; i < l; i++) {
                var attr = r[i].match(/attribute\s+\w+\s+(\w+)/)[1];
                var location = gl.getAttribLocation(this.program, attr);
                if (location !== -1 && location !== undefined) {
                    if (this.attributesCache[attr] === undefined) {
                        this.attributesCache[attr] = location;
                        this.attributesCache.attributeKeys.push(attr);
                    }
                }
            }
        }
    }


};

osg.Program.create = function(vShader, fShader) {
    console.log("osg.Program.create is deprecated use new osg.Program(vertex, fragment) instead");
    var program = new osg.Program(vShader, fShader);
    return program;
};
osg.Projection = function () {
    osg.Node.call(this);
    this.projection = osg.Matrix.makeIdentity();
};
osg.Projection.prototype = osg.objectInehrit(osg.Node.prototype, {
    getProjectionMatrix: function() { return this.projection; },
    setProjectionMatrix: function(m) { this.projection = m; }
});
osg.Projection.prototype.objectType = osg.objectType.generate("Projection");

/** @class Quaternion Operations */
osg.Quat = {
    makeIdentity: function(element) { return osg.Quat.init(element); },

    init: function(element) {
        if (element === undefined) {
            element = [];
        }
        element[0] = 0;
        element[1] = 0;
        element[2] = 0;
        element[3] = 1;
        return element;
    },

    sub: function(a, b, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = a[0] - b[0];
        result[1] = a[1] - b[1];
        result[2] = a[2] - b[2];
        result[3] = a[3] - b[3];
        return result;
    },

    add: function(a, b, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = a[0] + b[0];
        result[1] = a[1] + b[1];
        result[2] = a[2] + b[2];
        result[3] = a[3] + b[3];
        return result;
    },

    dot: function(a, b) {
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
    },

    length2: function(a) {
        return a[0]*a[0] + a[1]*a[1] + a[2]*a[2] + a[3]*a[3];
    },

    neg: function(a, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = -a[0];
        result[1] = -a[1];
        result[2] = -a[2];
        result[3] = -a[3];
        return result;
    },

    makeRotate: function(angle, x, y, z, result ) {
        var epsilon = 0.0000001;
        var length = Math.sqrt(x*x+ y*y+ z*z);
        if (length < epsilon) {
            return this.init();
        }

        var inversenorm  = 1.0/length;
        var coshalfangle = Math.cos( 0.5*angle );
        var sinhalfangle = Math.sin( 0.5*angle );

        if (result === undefined) {
            result = [];
        }
        result[0] = x * sinhalfangle * inversenorm;
        result[1] = y * sinhalfangle * inversenorm;
        result[2] = z * sinhalfangle * inversenorm;
        result[3] = coshalfangle;
        return result;
    },

    lerp: function(t, from, to, result){
        if (result === undefined) {
            result = [];
        }

        var t1 = 1.0 - t;
        result[0] = from[0]*t1 + quatTo[0]*t;
        result[1] = from[1]*t1 + quatTo[1]*t;
        result[2] = from[2]*t1 + quatTo[2]*t;
        result[3] = from[3]*t1 + quatTo[3]*t;
        return result;
    },

    slerp: function(t, from, to, result) {
        var epsilon = 0.00001;

        var quatTo = to;
        var cosomega = this.dot(from,quatTo);
        if ( cosomega <0.0 )
        {
            cosomega = -cosomega;
            quatTo = this.neg(to);
        }

        var omega;
        var sinomega;
        var scale_from;
        var scale_to;
        if( (1.0 - cosomega) > epsilon )
        {
            omega= Math.acos(cosomega) ;  // 0 <= omega <= Pi (see man acos)
            sinomega = Math.sin(omega) ;  // this sinomega should always be +ve so
            // could try sinomega=sqrt(1-cosomega*cosomega) to avoid a sin()?
            scale_from = Math.sin((1.0-t)*omega)/sinomega ;
            scale_to = Math.sin(t*omega)/sinomega ;
        }
        else
        {
            /* --------------------------------------------------
             The ends of the vectors are very close
             we can use simple linear interpolation - no need
             to worry about the "spherical" interpolation
             -------------------------------------------------- */
            scale_from = 1.0 - t ;
            scale_to = t ;
        }

        if (result === undefined) {
            result = [];
        }

        result[0] = from[0]*scale_from + quatTo[0]*scale_to;
        result[1] = from[1]*scale_from + quatTo[1]*scale_to;
        result[2] = from[2]*scale_from + quatTo[2]*scale_to;
        result[3] = from[3]*scale_from + quatTo[3]*scale_to;
        return result;
    },

    // we suppose to have unit quaternion
    conj: function(a, result) {
        if (result === undefined) {
            result = [];
        }
        result[0] = -a[0];
        result[1] = -a[1];
        result[2] = -a[2];
        result[3] = a[3];
        return result;
    },

    inverse: function(a, result) {
        if (result === undefined) {
            result = [];
        }
        var div = 1.0/ this.length2(a);
        this.conj(a, result);
        result[0] *= div;
        result[1] *= div;
        result[2] *= div;
        result[3] *= div;
        return result;
    },

    // we suppose to have unit quaternion
    // multiply 2 quaternions
    mult: function(a, b, result) {
        if (result === undefined) {
            result = [];
        }

        result[0] =  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0];
        result[1] = -a[0] * b[2] + a[1] * b[3] + a[2] * b[0] + a[3] * b[1];
        result[2] =  a[0] * b[1] - a[1] * b[0] + a[2] * b[3] + a[3] * b[2];
        result[3] = -a[0] * b[0] - a[1] * b[1] - a[2] * b[2] + a[3] * b[3];
        return result;
    },
    div: function(a, b, result) {
        if (result === undefined) {
            result = [];
        }
        var d = 1.0/b;
        result[0] = a[0] * d;
        result[1] = a[1] * d;
        result[2] = a[2] * d;
        result[3] = a[3] * d;
        return result;
    },
    exp: function(a, res) {
	var r  = Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);
	var et = Math.exp(a[3]);
        var s = 0;
        if (r > 0.00001) {
            s = et * Math.sin(r)/r;
        }
        if (res === undefined) {
            res = [];
        }
        res[0] = s*a[0];
        res[1] = s*a[1];
        res[2] = s*a[2];
        res[3] = et*Math.cos(r);
        return res;
    },

    ln: function(a, res) {
        var n = a[0]*a[0]+a[1]*a[1]+a[2]*a[2];
	var r  = Math.sqrt(n);
	var t  = 0;
        if (r>0.00001) {
            t= Math.atan2(r,a[3])/r;
        }
        if (res === undefined) {
            res = [];
        }
        n += a[3]*a[3];
        res[0] = t*a[0];
        res[1] = t*a[1];
        res[2] = t*a[2];
        res[3] = 0.5*Math.log(n);
        return res;
    },


    //http://theory.org/software/qfa/writeup/node12.html
    //http://www.ece.uwaterloo.ca/~dwharder/C++/CQOST/src/
    //http://willperone.net/Code/quaternion.php

    // a is computeTangent(q1-1,q1,q2)
    // b is computeTangent(q2-1,q2,q2+1)
    squad: function(t, q1, a, b, q2, r) {
        var r1 = this.slerp(t, q1, q2);
        var r2 = this.slerp(t, a, b);
        return this.slerp(2.0 * t * (1.0 - t), r1, r2, r);
    },

    // qcur is current
    // q0 is qcur-1
    // q2 is qcur+1
    // compute tangent in of q1
    computeTangent: function(q0, qcur, q2, r) {
        if (r === undefined) {
            r = [];
        }
        // first step
        var invq = this.inv(qcur);
        var qa,qb;

        this.mult(q2, invq, qa);
        this.ln(qa, qa);

        this.mult(q0, invq , qb);
        this.ln(qb, qb);

        this.add(qa, qb, qa);
        this.div(qa, -4.0, qa);
        this.exp(qa, qb);
        return this.mult(qb, q1, r);
    },

    createKey: function(q, r) {
        if (r === undefined) {
            r = this.init();
        } else {
            if (q !== r) {
                r[0] = q[0];
                r[1] = q[1];
                r[2] = q[2];
                r[3] = q[3];
            }
        }
        r.time = 0;
        r.tangent = [];
        return r;
    }
};
osg.RenderBin = function (stateGraph) {
    this.leafs = [];
    this.stateGraph = stateGraph;
    this.positionedAttribute = [];
    this.renderStage = undefined;
    this.renderBin = {};
    this.stateGraphList = [];
};
osg.RenderBin.prototype = {
    getStage: function() { return this.renderStage; },
    addStateGraph: function(sg) { this.stateGraphList.push(sg); },
    reset: function() {
        this.stateGraph = undefined;
        this.stateGraphList.length = 0;
        this.renderBin = {};
        this.positionedAttribute.length = 0;
        this.leafs.length = 0;
    },
    applyPositionedAttribute: function(state, positionedAttibutes) {
        // the idea is to set uniform 'globally' in uniform map.
        for (var index = 0, l = positionedAttibutes.length; index < l; index++) {
            var element = positionedAttibutes[index];
            // add or set uniforms in state
            var stateAttribute = element[1];
            var matrix = element[0];
            state.setGlobalDefaultValue(stateAttribute);
            stateAttribute.applyPositionedUniform(matrix, state);
        }
    },

    drawImplementation: function(state, previousRenderLeaf) {
        var previous = previousRenderLeaf;
        // draw prev bins
        for (var key in this.renderBin) {
            if (key < 0 ) {
                previous = this.renderBin[key].drawImplementation(state, previous);
            }
        }
        
        // draw leafs
        previous = this.drawLeafs(state, previous);

        // draw post bins
        for (key in this.renderBin) {
            if (key >= 0 ) {
                previous = this.renderBin[key].drawImplementation(state, previous);
            }
        }
        return previous;
    },

    drawLeafs: function(state, previousRenderLeaf) {
        // no sort right now
        //this.drawImplementation(state, previousRenderLeaf);
        var stateList = this.stateGraphList;
        var leafs = this.leafs;
        var normalUniform;
        var modelViewUniform;
        var projectionUniform;
        var program;
        var stateset;
        var previousLeaf = previousRenderLeaf;
        var normal = [];
        var normalTranspose = [];

        var Matrix = osg.Matrix;

        if (previousRenderLeaf) {
            osg.StateGraph.prototype.moveToRootStateGraph(state, previousRenderLeaf.parent);
        }
        if (this.positionedAttribute) {
            this.applyPositionedAttribute(state, this.positionedAttribute);
        }

        for (var i = 0, l = stateList.length; i < l; i++) {
            var sg = stateList[i];
            for (var j = 0, ll = sg.leafs.length; j < ll; j++) {

                var leaf = sg.leafs[j];
                var push = false;
                if (previousLeaf !== undefined) {

                    // apply state if required.
                    var prev_rg = previousLeaf.parent;
                    var prev_rg_parent = prev_rg.parent;
                    var rg = leaf.parent;
                    if (prev_rg_parent !== rg.parent)
                    {
                        rg.moveStateGraph(state, prev_rg_parent, rg.parent);

                        // send state changes and matrix changes to OpenGL.
                        state.pushStateSet(rg.stateset);
                        push = true;
                    }
                    else if (rg !== prev_rg)
                    {
                        // send state changes and matrix changes to OpenGL.
                        state.pushStateSet(rg.stateset);
                        push = true;
                    }

                } else {
                    leaf.parent.moveStateGraph(state, undefined, leaf.parent.parent);
                    state.pushStateSet(leaf.parent.stateset);
                    push = true;
                }

                if (push === true) {
                    //state.pushGeneratedProgram();
                    state.apply();
                    program = state.getLastProgramApplied();

                    modelViewUniform = program.uniformsCache[state.modelViewMatrix.name];
                    projectionUniform = program.uniformsCache[state.projectionMatrix.name];
                    normalUniform = program.uniformsCache[state.normalMatrix.name];
                }


                if (modelViewUniform !== undefined) {
                    state.modelViewMatrix.set(leaf.modelview);
                    state.modelViewMatrix.apply(modelViewUniform);
                }
                if (projectionUniform !== undefined) {
                    state.projectionMatrix.set(leaf.projection);
                    state.projectionMatrix.apply(projectionUniform);
                }
                if (normalUniform !== undefined) {
                    Matrix.copy(leaf.modelview, normal);
                    //Matrix.setTrans(normal, 0, 0, 0);
                    normal[12] = 0;
                    normal[13] = 0;
                    normal[14] = 0;

                    Matrix.inverse(normal, normal);
                    Matrix.transpose(normal, normal);
                    state.normalMatrix.set(normal);
                    state.normalMatrix.apply(normalUniform);
                }

                leaf.geometry.drawImplementation(state);

                if (push === true) {
                    state.popGeneratedProgram();
                    state.popStateSet();
                }

                previousLeaf = leaf;
            }
        }
        return previousLeaf;
    }
};
/**
 * From OpenSceneGraph http://www.openscenegraph.org
 * RenderStage base class. Used for encapsulate a complete stage in
 * rendering - setting up of viewport, the projection and model
 * matrices and rendering the RenderBin's enclosed with this RenderStage.
 * RenderStage also has a dependency list of other RenderStages, each
 * of which must be called before the rendering of this stage.  These
 * 'pre' rendering stages are used for advanced rendering techniques
 * like multistage pixel shading or impostors.
 */
osg.RenderStage = function () {
    osg.RenderBin.call(this);
    this.positionedAttribute = [];
    this.clearDepth = 1.0;
    this.clearColor = [0,0,0,1];
    this.clearMask = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;
    this.camera = undefined;
    this.viewport = undefined;
    this.preRenderList = [];
    this.postRenderList = [];
    this.renderStage = this;
};
osg.RenderStage.prototype = osg.objectInehrit(osg.RenderBin.prototype, {
    reset: function() { 
        osg.RenderBin.prototype.reset.call(this);
        this.preRenderList.length = 0;
        this.postRenderList.length = 0;
    },
    setClearDepth: function(depth) { this.clearDepth = depth;},
    getClearDepth: function() { return this.clearDepth;},
    setClearColor: function(color) { this.clearColor = color;},
    getClearColor: function() { return this.clearColor;},
    setClearMask: function(mask) { this.clearMask = mask;},
    getClearMask: function() { return this.clearMask;},
    setViewport: function(vp) { this.viewport = vp; },
    getViewport: function() { return this.viewport; },
    setCamera: function(camera) { this.camera = camera; },
    addPreRenderStage: function(rs, order) {
        for (var i = 0, l = this.preRenderList.length; i < l; i++) {
            var render = this.preRenderList[i];
            if (order < render.order) {
                break;
            }
        }
        if (i < this.preRenderList.length) {
            this.preRenderList = this.preRenderList.splice(i,0, { 'order' : order, 'renderStage' : rs });
        } else {
            this.preRenderList.push({ 'order' : order, 'renderStage' : rs });
        }
    },
    addPostRenderStage: function(rs, order) {
        for (var i = 0, l = this.postRenderList.length; i < l; i++) {
            var render = this.postRenderList[i];
            if (order < render.order) {
                break;
            }
        }
        if (i < this.postRenderList.length) {
            this.postRenderList = this.postRenderList.splice(i,0, { 'order' : order, 'renderStage' : rs });
        } else {
            this.postRenderList.push({ 'order' : order, 'renderStage' : rs });
        }
    },

    drawPreRenderStages: function(state, previousRenderLeaf) {
        var previous = previousRenderLeaf;
        for (var i = 0, l = this.preRenderList.length; i < l; ++i) {
            var sg = this.preRenderList[i].renderStage;
            previous = sg.draw(state, previous);
        }
        return previous;
    },

    draw: function(state, previousRenderLeaf) {
        var previous = this.drawPreRenderStages(state, previousRenderLeaf);
        previous = this.drawImplementation(state, previous);

        previous = this.drawPostRenderStages(state, previous);
        return previous;
    },

    drawPostRenderStages: function(state, previousRenderLeaf) {
        var previous = previousRenderLeaf;
        for (var i = 0, l = this.postRenderList.length; i < l; ++i) {
            var sg = this.postRenderList[i].renderStage;
            previous = sg.draw(state, previous);
        }
        return previous;
    },

    applyCamera: function(state) {
        if (this.camera === undefined) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return;
        }
        var viewport = this.camera.getViewport();
        var fbo = this.camera.frameBufferObject;

        if (!fbo) {
            fbo = new osg.FrameBufferObject();
            this.camera.frameBufferObject = fbo;
        }

        if (fbo.isDirty()) {
            if (this.camera.attachments !== undefined) {
                for ( var key in this.camera.attachments) {
                    var a = this.camera.attachments[key];
                    var attach = undefined;
                    if (a.texture === undefined) { //renderbuffer
                        attach = { attachment: key, 
                                   format: a.format, 
                                   width: viewport.width(),
                                   height: viewport.height()
                                 };
                    } else if (a.texture !== undefined) {
                        attach = { 
                            attachment: key, 
                            texture: a.texture, 
                            level: a.level 
                        };
                        if (a.format) {
                            attach.format = a.format;
                        }
                    }
                    fbo.setAttachment(attach);
                }
            }
        }
        fbo.apply(state);
    },

    drawImplementation: function(state, previousRenderLeaf) {
        var error;
        if (osg.reportErrorGL === true) {
            error = gl.getError();
            osg.checkError(error);
        }

        this.applyCamera(state);

        if (this.viewport === undefined) {
            osg.log("RenderStage does not have a valid viewport");
        }

        state.applyAttribute(this.viewport);

        if (this.clearMask & gl.COLOR_BUFFER_BIT) {
            gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        }
        if (this.clearMask & gl.DEPTH_BUFFER_BIT) {
            gl.clearDepth(this.clearDepth);
        }
        gl.clear(this.clearMask);

        if (this.positionedAttribute) {
            this.applyPositionedAttribute(state, this.positionedAttribute);
        }

        var previous = osg.RenderBin.prototype.drawImplementation.call(this, state, previousRenderLeaf);

        if (osg.reportErrorGL === true) {
            error = gl.getError();
            osg.checkError(error);
        }

        return previous;
    }
});
osg.ShaderGenerator = function() {
    this.cache = [];
};
osg.ShaderGenerator.prototype = {

    getActiveTypeMember: function(state) {
        // we should check attribute is active or not
        var types = [];
        for (var j = 0, k = state.attributeMap.attributeKeys.length; j < k; j++) {
            var keya = state.attributeMap.attributeKeys[j];
            var attributeStack = state.attributeMap[keya];
            if (attributeStack.length === 0 && attributeStack.globalDefault.applyPositionedUniform === undefined) {
                continue;
            }
            if (attributeStack.globalDefault.getOrCreateUniforms !== undefined || attributeStack.globalDefault.writeToShader !== undefined) {
                types.push(keya);
            }
        }

        for (var i = 0, l = state.textureAttributeMapList.length; i < l; i++) {
            var attributesForUnit = state.textureAttributeMapList[i];
            if (attributesForUnit === undefined) {
                continue;
            }
            for (var h = 0, m = attributesForUnit.attributeKeys.length; h < m; h++) {
                var key = attributesForUnit.attributeKeys[h];
                var textureAttributeStack = attributesForUnit[key];
                if (textureAttributeStack.length === 0) {
                    continue;
                }
                if (textureAttributeStack.globalDefault.getOrCreateUniforms !== undefined || textureAttributeStack.globalDefault.writeToShader !== undefined) {
                    types.push(key+i);
                }
            }
        }
        return types;
    },

    getActiveAttributeMapKeys: function(state) {
        var keys = [];
        for (var j = 0, k = state.attributeMap.attributeKeys.length; j < k; j++) {
            var keya = state.attributeMap.attributeKeys[j];
            var attributeStack = state.attributeMap[keya];
            if (attributeStack.length === 0 && attributeStack.globalDefault.applyPositionedUniform === undefined) {
                continue;
            }
            if (attributeStack.globalDefault.getOrCreateUniforms !== undefined || attributeStack.globalDefault.writeToShader !== undefined) {
                keys.push(keya);
            }
        }
        return keys;
    },

    getActiveTextureAttributeMapKeys: function(state) {
        var textureAttributeKeys = [];
        for (var i = 0, l = state.textureAttributeMapList.length; i < l; i++) {
            var attributesForUnit = state.textureAttributeMapList[i];
            if (attributesForUnit === undefined) {
                continue;
            }
            textureAttributeKeys[i] = [];
            for (var j = 0, m = attributesForUnit.attributeKeys.length; j < m; j++) {
                var key = attributesForUnit.attributeKeys[j];
                var textureAttributeStack = attributesForUnit[key];
                if (textureAttributeStack.length === 0) {
                    continue;
                }
                if (textureAttributeStack.globalDefault.getOrCreateUniforms !== undefined || textureAttributeStack.globalDefault.writeToShader !== undefined) {
                    textureAttributeKeys[i].push(key);
                }
            }
        }
        return textureAttributeKeys;
    },

    getActiveUniforms: function(state, attributeKeys, textureAttributeKeys) {
        var uniforms = {};

        for (var i = 0, l = attributeKeys.length; i < l; i++) {
            var key = attributeKeys[i];

            if (state.attributeMap[key].globalDefault.getOrCreateUniforms === undefined) {
                continue;
            }
            var attributeUniforms = state.attributeMap[key].globalDefault.getOrCreateUniforms();
            for (var j = 0, m = attributeUniforms.uniformKeys.length; j < m; j++) {
                var name = attributeUniforms.uniformKeys[j];
                var uniform = attributeUniforms[name];
                uniforms[uniform.name] = uniform;
            }
        }

        for (var a = 0, n = textureAttributeKeys.length; a < n; a++) {
            var unitAttributekeys = textureAttributeKeys[a];
            if (unitAttributekeys === undefined) {
                continue;
            }
            for (var b = 0, o = unitAttributekeys.length; b < o; b++) {
                var attrName = unitAttributekeys[b];
                //if (state.textureAttributeMapList[a][attrName].globalDefault === undefined) {
                    //debugger;
                //}
                var textureAttribute = state.textureAttributeMapList[a][attrName].globalDefault;
                if (textureAttribute.getOrCreateUniforms === undefined) {
                    continue;
                }
                var texUniforms = textureAttribute.getOrCreateUniforms(a);
                for (var t = 0, tl = texUniforms.uniformKeys.length; t < tl; t++) {
                    var tname = texUniforms.uniformKeys[t];
                    var tuniform = texUniforms[tname];
                    uniforms[tuniform.name] = tuniform;
                }
            }
        }

        var keys = [];
        for (var ukey in uniforms) {
            keys.push(ukey);
        }
        uniforms.uniformKeys = keys;
        return uniforms;
    },

    getOrCreateProgram: function(state) {

        // first get trace of active attribute and texture attributes to check
        // if we already have generated a program for this configuration
        var flattenKeys = this.getActiveTypeMember(state);
        for (var i = 0, l = this.cache.length; i < l; ++i) {
            if (this.compareAttributeMap(flattenKeys, this.cache[i].flattenKeys) === 0) {
                return this.cache[i];
            }
        }

        // extract valid attributes keys with more details
        var attributeKeys = this.getActiveAttributeMapKeys(state);
        var textureAttributeKeys = this.getActiveTextureAttributeMapKeys(state);


        var vertexshader = this.getOrCreateVertexShader(state, attributeKeys, textureAttributeKeys);
        var fragmentshader = this.getOrCreateFragmentShader(state, attributeKeys, textureAttributeKeys);
        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        program.flattenKeys = flattenKeys;
        program.activeAttributeKeys = attributeKeys;
        program.activeTextureAttributeKeys = textureAttributeKeys;
        program.activeUniforms = this.getActiveUniforms(state, attributeKeys, textureAttributeKeys);
        program.generated = true;

        osg.log(program.vertex.text);
        osg.log(program.fragment.text);

        this.cache.push(program);
        return program;
    },

    compareAttributeMap: function(attributeKeys0, attributeKeys1) {
        var key;
        for (var i = 0, l = attributeKeys0.length; i < l; i++) {
            key = attributeKeys0[i];
            if (attributeKeys1.indexOf(key) === -1 ) {
                return 1;
            }
        }
        if (attributeKeys1.length !== attributeKeys0.length) {
            return -1;
        }
        return 0;
    },

    fillTextureShader: function (attributeMapList, validTextureAttributeKeys, mode) {
        var shader = "";
        var instanciedTypeShader = {};

        for (var i = 0, l = validTextureAttributeKeys.length; i < l; i++) {
            var attributeKeys = validTextureAttributeKeys[i];
            if (attributeKeys === undefined) {
                continue;
            }
            var attributes = attributeMapList[i];
            for (var j = 0, m = attributeKeys.length; j < m; j++) {
                var key = attributeKeys[j];

                var element = attributes[key].globalDefault;

                if (element.writeShaderInstance !== undefined && instanciedTypeShader[key] === undefined) {
                    shader += element.writeShaderInstance(i, mode);
                    instanciedTypeShader[key] = true;
                }

                if (element.writeToShader) {
                    shader += element.writeToShader(i, mode);
                }
            }
        }
        return shader;
    },

    fillShader: function (attributeMap, validAttributeKeys, mode) {
        var shader = "";
        var instanciedTypeShader = {};

        for (var j = 0, m = validAttributeKeys.length; j < m; j++) {
            var key = validAttributeKeys[j];
            var element = attributeMap[key].globalDefault;

            if (element.writeShaderInstance !== undefined && instanciedTypeShader[key] === undefined) {
                shader += element.writeShaderInstance(mode);
                instanciedTypeShader[key] = true;
            }

            if (element.writeToShader) {
                shader += element.writeToShader(mode);
            }
        }
        return shader;
    },

    getOrCreateVertexShader: function (state, validAttributeKeys, validTextureAttributeKeys) {
        var i;
        var mode = osg.ShaderGeneratorType.VertexInit;
        var shader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec4 Color;",
            "attribute vec3 Normal;",
            "uniform int ArrayColorEnabled;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "uniform mat4 NormalMatrix;",
            "varying vec4 VertexColor;",
            ""
        ].join('\n');


        shader += this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
        shader += this.fillShader(state.attributeMap, validAttributeKeys, mode);
        mode = osg.ShaderGeneratorType.VertexFunction;
        var func = [
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}"].join('\n');

        shader += func;
        shader += this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
        shader += this.fillShader(state.attributeMap, validAttributeKeys, mode);

        var body = [
            "",
            "void main(void) {",
            "gl_Position = ftransform();",
            "if (ArrayColorEnabled == 1)",
            "  VertexColor = Color;",
            "else",
            "  VertexColor = vec4(1.0,1.0,1.0,1.0);",
            ""
        ].join('\n');

        shader += body;

        mode = osg.ShaderGeneratorType.VertexMain;

        shader += this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
        shader += this.fillShader(state.attributeMap, validAttributeKeys, mode);

        shader += [
            "}",
            ""
        ].join('\n');

        return shader;
    },

    getOrCreateFragmentShader: function (state, validAttributeKeys, validTextureAttributeKeys) {
        var i;
        var shader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec4 VertexColor;",
            "uniform int ArrayColorEnabled;",
            "vec4 fragColor;",
            ""
        ].join("\n");
        var mode = osg.ShaderGeneratorType.FragmentInit;

        shader += this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
        shader += this.fillShader(state.attributeMap, validAttributeKeys, mode);

        shader += [
            "void main(void) {",
            "fragColor = VertexColor;",
            ""
        ].join('\n');

        mode = osg.ShaderGeneratorType.FragmentMain;
        if (validTextureAttributeKeys.length > 0) {
            var result = this.fillTextureShader(state.textureAttributeMapList, validTextureAttributeKeys, mode);
            shader += result;
        }
        shader += this.fillShader(state.attributeMap, validAttributeKeys, mode);

        shader += [
            "",
            "gl_FragColor = fragColor;",
            "}"
        ].join('\n');

        return shader;
    }
};
/**
 * Create a Textured Box on the given center with given size
 * @name osg.createTexturedBox
 */
osg.createTexturedBox = function(centerx, centery, centerz,
                                 sizex, sizey, sizez) {

    var g = new osg.Geometry();
    var dx,dy,dz;
    dx = sizex/2.0;
    dy = sizey/2.0;
    dz = sizez/2.0;

    var vertexes = [];
    var uv = [];
    var normal = [];

    // -ve y plane
    vertexes[0] = centerx - dx;
    vertexes[1] = centery - dy;
    vertexes[2] = centerz + dz;
    normal[0] = 0;
    normal[1] = -1;
    normal[2] = 0;
    uv[0] = 0;
    uv[1] = 1;

    vertexes[3] = centerx - dx;
    vertexes[4] = centery - dy;
    vertexes[5] = centerz - dz;
    normal[3] = 0;
    normal[4] = -1;
    normal[5] = 0;
    uv[2] = 0;
    uv[3] = 0;

    vertexes[6] = centerx + dx;
    vertexes[7] = centery - dy;
    vertexes[8] = centerz - dz;
    normal[6] = 0;
    normal[7] = -1;
    normal[8] = 0;
    uv[4] = 1;
    uv[5] = 0;

    vertexes[9] =  centerx + dx;
    vertexes[10] = centery - dy;
    vertexes[11] = centerz + dz;
    normal[9] = 0;
    normal[10] = -1;
    normal[11] = 0;
    uv[6] = 1;
    uv[7] = 1;


    // +ve y plane
    vertexes[12] = centerx + dx;
    vertexes[13] = centery + dy;
    vertexes[14] = centerz + dz;
    normal[12] = 0;
    normal[13] = 1;
    normal[14] = 0;
    uv[8] = 0;
    uv[9] = 1;

    vertexes[15] = centerx + dx;
    vertexes[16] = centery + dy;
    vertexes[17] = centerz - dz;
    normal[15] = 0;
    normal[16] = 1;
    normal[17] = 0;
    uv[10] = 0;
    uv[11] = 0;

    vertexes[18] = centerx - dx;
    vertexes[19] = centery + dy;
    vertexes[20] = centerz - dz;
    normal[18] = 0;
    normal[19] = 1;
    normal[20] = 0;
    uv[12] = 1;
    uv[13] = 0;

    vertexes[21] = centerx - dx;
    vertexes[22] = centery + dy;
    vertexes[23] = centerz + dz;
    normal[21] = 0;
    normal[22] = 1;
    normal[23] = 0;
    uv[14] = 1;
    uv[15] = 1;
    

    // +ve x plane
    vertexes[24] = centerx + dx;
    vertexes[25] = centery - dy;
    vertexes[26] = centerz + dz;
    normal[24] = 1;
    normal[25] = 0;
    normal[26] = 0;
    uv[16] = 0;
    uv[17] = 1;

    vertexes[27] = centerx + dx;
    vertexes[28] = centery - dy;
    vertexes[29] = centerz - dz;
    normal[27] = 1;
    normal[28] = 0;
    normal[29] = 0;
    uv[18] = 0;
    uv[19] = 0;

    vertexes[30] = centerx + dx;
    vertexes[31] = centery + dy;
    vertexes[32] = centerz - dz;
    normal[30] = 1;
    normal[31] = 0;
    normal[32] = 0;
    uv[20] = 1;
    uv[21] = 0;

    vertexes[33] = centerx + dx;
    vertexes[34] = centery + dy;
    vertexes[35] = centerz + dz;
    normal[33] = 1;
    normal[34] = 0;
    normal[35] = 0;
    uv[22] = 1;
    uv[23] = 1;

    // -ve x plane
    vertexes[36] = centerx - dx;
    vertexes[37] = centery + dy;
    vertexes[38] = centerz + dz;
    normal[36] = -1;
    normal[37] = 0;
    normal[38] = 0;
    uv[24] = 0;
    uv[25] = 1;

    vertexes[39] = centerx - dx;
    vertexes[40] = centery + dy;
    vertexes[41] = centerz - dz;
    normal[39] = -1;
    normal[40] = 0;
    normal[41] = 0;
    uv[26] = 0;
    uv[27] = 0;

    vertexes[42] = centerx - dx;
    vertexes[43] = centery - dy;
    vertexes[44] = centerz - dz;
    normal[42] = -1;
    normal[43] = 0;
    normal[44] = 0;
    uv[28] = 1;
    uv[29] = 0;

    vertexes[45] = centerx - dx;
    vertexes[46] = centery - dy;
    vertexes[47] = centerz + dz;
    normal[45] = -1;
    normal[46] = 0;
    normal[47] = 0;
    uv[30] = 1;
    uv[31] = 1;

    // top
    // +ve z plane
    vertexes[48] = centerx - dx;
    vertexes[49] = centery + dy;
    vertexes[50] = centerz + dz;
    normal[48] = 0;
    normal[49] = 0;
    normal[50] = 1;
    uv[32] = 0;
    uv[33] = 1;

    vertexes[51] = centerx - dx;
    vertexes[52] = centery - dy;
    vertexes[53] = centerz + dz;
    normal[51] = 0;
    normal[52] = 0;
    normal[53] = 1;
    uv[34] = 0;
    uv[35] = 0;

    vertexes[54] = centerx + dx;
    vertexes[55] = centery - dy;
    vertexes[56] = centerz + dz;
    normal[54] = 0;
    normal[55] = 0;
    normal[56] = 1;
    uv[36] = 1;
    uv[37] = 0;

    vertexes[57] = centerx + dx;
    vertexes[58] = centery + dy;
    vertexes[59] = centerz + dz;
    normal[57] = 0;
    normal[58] = 0;
    normal[59] = 1;
    uv[38] = 1;
    uv[39] = 1;

    // bottom
    // -ve z plane
    vertexes[60] = centerx + dx;
    vertexes[61] = centery + dy;
    vertexes[62] = centerz - dz;
    normal[60] = 0;
    normal[61] = 0;
    normal[62] = -1;
    uv[40] = 0;
    uv[41] = 1;

    vertexes[63] = centerx + dx;
    vertexes[64] = centery - dy;
    vertexes[65] = centerz - dz;
    normal[63] = 0;
    normal[64] = 0;
    normal[65] = -1;
    uv[42] = 0;
    uv[43] = 0;

    vertexes[66] = centerx - dx;
    vertexes[67] = centery - dy;
    vertexes[68] = centerz - dz;
    normal[66] = 0;
    normal[67] = 0;
    normal[68] = -1;
    uv[44] = 1;
    uv[45] = 0;

    vertexes[69] = centerx - dx;
    vertexes[70] = centery + dy;
    vertexes[71] = centerz - dz;
    normal[69] = 0;
    normal[70] = 0;
    normal[71] = -1;
    uv[46] = 1;
    uv[47] = 1;

    var indexes = [];
    indexes[0] = 0;
    indexes[1] = 1;
    indexes[2] = 2;
    indexes[3] = 0;
    indexes[4] = 2;
    indexes[5] = 3;

    indexes[6] = 4;
    indexes[7] = 5;
    indexes[8] = 6;
    indexes[9] = 4;
    indexes[10] = 6;
    indexes[11] = 7;

    indexes[12] = 8;
    indexes[13] = 9;
    indexes[14] = 10;
    indexes[15] = 8;
    indexes[16] = 10;
    indexes[17] = 11;

    indexes[18] = 12;
    indexes[19] = 13;
    indexes[20] = 14;
    indexes[21] = 12;
    indexes[22] = 14;
    indexes[23] = 15;

    indexes[24] = 16;
    indexes[25] = 17;
    indexes[26] = 18;
    indexes[27] = 16;
    indexes[28] = 18;
    indexes[29] = 19;

    indexes[30] = 20;
    indexes[31] = 21;
    indexes[32] = 22;
    indexes[33] = 20;
    indexes[34] = 22;
    indexes[35] = 23;

    g.getAttributes().Vertex = new osg.BufferArray(gl.ARRAY_BUFFER, vertexes, 3 );
    g.getAttributes().Normal = new osg.BufferArray(gl.ARRAY_BUFFER, normal, 3 );
    g.getAttributes().TexCoord0 = new osg.BufferArray(gl.ARRAY_BUFFER, uv, 2 );
    
    var primitive = new osg.DrawElements(gl.TRIANGLES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, indexes, 1 ));
    g.getPrimitives().push(primitive);
    return g;
};


osg.createTexturedQuad = function(cornerx, cornery, cornerz,
                                  wx, wy, wz,
                                  hx, hy, hz,
                                  l,b,r,t) {

    if (r === undefined && t === undefined) {
        r = l;
        t = b;
        l = 0;
        b = 0;
    }

    var g = new osg.Geometry();

    var vertexes = [];
    vertexes[0] = cornerx + hx;
    vertexes[1] = cornery + hy;
    vertexes[2] = cornerz + hz;

    vertexes[3] = cornerx;
    vertexes[4] = cornery;
    vertexes[5] = cornerz;

    vertexes[6] = cornerx + wx;
    vertexes[7] = cornery + wy;
    vertexes[8] = cornerz + wz;

    vertexes[9] =  cornerx + wx + hx;
    vertexes[10] = cornery + wy + hy;
    vertexes[11] = cornerz + wz + hz;

    if (r === undefined) {
        r = 1.0;
    }
    if (t === undefined) {
        t = 1.0;
    }

    var uvs = [];
    uvs[0] = l;
    uvs[1] = t;

    uvs[2] = l;
    uvs[3] = b;

    uvs[4] = r;
    uvs[5] = b;

    uvs[6] = r;
    uvs[7] = t;

    var n = osg.Vec3.cross([wx,wy,wz], [hx, hy, hz], []);
    var normal = [];
    normal[0] = n[0];
    normal[1] = n[1];
    normal[2] = n[2];

    normal[3] = n[0];
    normal[4] = n[1];
    normal[5] = n[2];

    normal[6] = n[0];
    normal[7] = n[1];
    normal[8] = n[2];

    normal[9] = n[0];
    normal[10] = n[1];
    normal[11] = n[2];


    var indexes = [];
    indexes[0] = 0;
    indexes[1] = 1;
    indexes[2] = 2;
    indexes[3] = 0;
    indexes[4] = 2;
    indexes[5] = 3;

    g.getAttributes().Vertex = new osg.BufferArray(gl.ARRAY_BUFFER, vertexes, 3 );
    g.getAttributes().Normal = new osg.BufferArray(gl.ARRAY_BUFFER, normal, 3 );
    g.getAttributes().TexCoord0 = new osg.BufferArray(gl.ARRAY_BUFFER, uvs, 2 );
    
    var primitive = new osg.DrawElements(gl.TRIANGLES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, indexes, 1 ));
    g.getPrimitives().push(primitive);
    return g;
};
osg.Stack = function() {};
osg.Stack.create = function()
{
    var a = [];
    a.globalDefault = undefined;
    a.lastApplied = undefined;
    a.back = function () {
        return this[this.length -1];
    };
    return a;
};
osg.StateGraph = function () {
    this.depth = 0;
    this.children = {};
    this.children.keys = [];
    this.leafs = [];
    this.stateset = undefined;
    this.parent = undefined;
};

osg.StateGraph.prototype = {
    clean: function() {
        this.leafs.length = 0;
        // keep it
        //this.stateset = undefined;
        //this.parent = undefined;
        //this.depth = 0;
        for (var i = 0, l = this.children.keys.length; i < l; i++) {
            var key = this.children.keys[i];
            this.children[key].clean();
        }
    },
    findOrInsert: function (stateset)
    {
        var sg;
        if (!this.children[stateset.id]) {
            sg = new osg.StateGraph();
            sg.parent = this;
            sg.depth = this.depth + 1;
            sg.stateset = stateset;
            this.children[stateset.id] = sg;
            this.children.keys.push(stateset.id);
        } else {
            sg = this.children[stateset.id];
        }
        return sg;
    },
    moveToRootStateGraph: function(state, sg_current)
    {
        // need to pop back all statesets and matrices.
        while (sg_current)
        {
            if (sg_current.stateSet) {
                state.popStateSet();
            }
            sg_current = sg_current._parent;
        }
    },
    moveStateGraph: function(state, sg_current, sg_new)
    {
        var stack;
        var i;
        if (sg_new === sg_current || sg_new === undefined) {
            return;
        }

        if (sg_current === undefined) {
            stack = [];
            // push stateset from sg_new to root, and apply
            // stateset from root to sg_new
            do {
                if (sg_new.stateset !== undefined) {
                    stack.push(sg_new.stateset);
                }
                sg_new = sg_new.parent;
            } while (sg_new);

            stack.reverse();
            for (i = 0, l = stack.length; i < l; ++i) {
                state.pushStateSet(stack[i]);
            }
            return;
        } else if (sg_current.parent === sg_new.parent) {
            // first handle the typical case which is two state groups
            // are neighbours.

            // state has changed so need to pop old state.
            if (sg_current.stateset !== undefined) {
                state.popStateSet();
            }
            // and push new state.
            if (sg_new.stateset !== undefined) {
                state.pushStateSet(sg_new.stateset);
            }
            return;
        }

        // need to pop back up to the same depth as the new state group.
        while (sg_current.depth > sg_new.depth)
        {
            if (sg_current.stateset !== undefined) {
                state.popStateSet();
            }
            sg_current = sg_current.parent;
        }

        // use return path to trace back steps to sg_new.
        stack = [];

        // need to pop back up to the same depth as the curr state group.
        while (sg_new.depth > sg_current.depth)
        {
            if (sg_new.stateset !== undefined) {
                stack.push(sg_new.stateset);
            }
            sg_new = sg_new.parent;
        }

        // now pop back up both parent paths until they agree.

        // DRT - 10/22/02
        // should be this to conform with above case where two StateGraph
        // nodes have the same parent
        while (sg_current !== sg_new)
        {
            if (sg_current.stateset !== undefined) {
                state.popStateSet();
            }
            sg_current = sg_current.parent;

            if (sg_new.stateset !== undefined) {
                stack.push(sg_new.stateset);
            }
            sg_new = sg_new.parent;
        }

        stack.reverse();
        stackLength = stack.length;
        for( i = 0; i < stackLength; ++i) {
            state.pushStateSet(stack[i]);
        }
    }
};
osg.State = function () {
    this.currentVBO = null;
    this.vertexAttribList = [];
    this.programs = osg.Stack.create();
    this.stateSets = osg.Stack.create();
    this.uniforms = {};
    this.uniforms.uniformKeys = [];
    
    this.textureAttributeMapList = [];

    this.attributeMap = {};
    this.attributeMap.attributeKeys = [];

    this.modeMap = {};

    this.shaderGenerator = new osg.ShaderGenerator();

    this.modelViewMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "ModelViewMatrix");
    this.projectionMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "ProjectionMatrix");
    this.normalMatrix = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity(), "NormalMatrix");

    this.uniformArrayState = {};
    this.uniformArrayState.uniformKeys = [];
    this.uniformArrayState.Color = osg.Uniform.createInt1(0, "ArrayColorEnabled");
    this.uniformArrayState.uniformKeys.push("Color");

    this.vertexAttribMap = {};
    this.vertexAttribMap._disable = [];
    this.vertexAttribMap._keys = [];
};

osg.State.prototype = {

    pushStateSet: function(stateset) {
        this.stateSets.push(stateset);

        if (stateset.attributeMap) {
            this.pushAttributeMap(this.attributeMap, stateset.attributeMap);
        }
        if (stateset.textureAttributeMapList) {
            var list = stateset.textureAttributeMapList;
            for (var textureUnit = 0, l = list.length; textureUnit < l; textureUnit++)
            {
                if (list[textureUnit] === undefined) {
                    continue;
                }
                if (!this.textureAttributeMapList[textureUnit]) {
                    this.textureAttributeMapList[textureUnit] = {};
                    this.textureAttributeMapList[textureUnit].attributeKeys = [];
                }
                this.pushAttributeMap(this.textureAttributeMapList[textureUnit], list[textureUnit]);
            }
        }

        if (stateset.uniforms) {
            this.pushUniformsList(this.uniforms, stateset.uniforms);
        }
    },

    applyStateSet: function(stateset) {
        this.pushStateSet(stateset);
        this.apply();
        this.popStateSet();
    },

    popAllStateSets: function() {
        while (this.stateSets.length) {
            this.popStateSet();
        }
    },
    popStateSet: function() {
        var stateset = this.stateSets.pop();
        if (stateset.program) {
            this.programs.pop();
        }
        if (stateset.attributeMap) {
            this.popAttributeMap(this.attributeMap, stateset.attributeMap);
        }
        if (stateset.textureAttributeMapList) {
            var list = stateset.textureAttributeMapList;
            for (var textureUnit = 0, l = list.length; textureUnit < l; textureUnit++)
            {
                if (list[textureUnit] === undefined) {
                    continue;
                }
                this.popAttributeMap(this.textureAttributeMapList[textureUnit], list[textureUnit]);
            }
        }

        if (stateset.uniforms) {
            this.popUniformsList(this.uniforms, stateset.uniforms);
        }
    },

    applyAttribute: function(attribute) {
        var key = attribute.getTypeMember();
        var attributeStack = this.attributeMap[key];
        if (attributeStack === undefined) {
            attributeStack = osg.Stack.create();
            this.attributeMap[key] = attributeStack;
            this.attributeMap[key].globalDefault = attribute.cloneType();
            this.attributeMap.attributeKeys.push(key);
        }

        if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
            if (attribute.apply) {
                attribute.apply(this);
            }
            attributeStack.lastApplied = attribute;
            attributeStack.asChanged = true;
        }
    },
    applyTextureAttribute: function(unit, attribute) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        var key = attribute.getTypeMember();

        if (!this.textureAttributeMapList[unit]) {
            this.textureAttributeMapList[unit] = {};
            this.textureAttributeMapList[unit].attributeKeys = [];
        }

        var attributeStack = this.textureAttributeMapList[unit][key];
        if (attributeStack === undefined) {
            attributeStack = osg.Stack.create();
            this.textureAttributeMapList[unit][key] = attributeStack;
            attributeStack.globalDefault = attribute.cloneType();
            this.textureAttributeMapList[unit].attributeKeys.push(key);
        }

        if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
            if (attribute.apply) {
                attribute.apply(this);
            }
            attributeStack.lastApplied = attribute;
            attributeStack.asChanged = true;
        }
    },

    getLastProgramApplied: function() {
        return this.programs.lastApplied;
    },

    pushGeneratedProgram: function() {
        var program;
        if (this.attributeMap.Program !== undefined && this.attributeMap.Program.length !== 0) {
            program = this.attributeMap.Program.back().object;
            value = this.attributeMap.Program.back().value;
            if (program !== undefined && value !== osg.StateAttribute.OFF) {
                this.programs.push(this.getObjectPair(program, value));
                return program;
            }
        }

        var attributes = {
            'textureAttributeMapList': this.textureAttributeMapList,
            'attributeMap': this.attributeMap
        };

        program = this.shaderGenerator.getOrCreateProgram(attributes);
        this.programs.push(this.getObjectPair(program, osg.StateAttribute.ON));
        return program;
    },

    popGeneratedProgram: function() {
        this.programs.pop();
    },

    applyWithoutProgram: function() {
        this.applyAttributeMap(this.attributeMap);
        this.applyTextureAttributeMapList(this.textureAttributeMapList);
    },

    apply: function() {
        this.applyAttributeMap(this.attributeMap);
        this.applyTextureAttributeMapList(this.textureAttributeMapList);

        this.pushGeneratedProgram();
        var program = this.programs.back().object;
        if (this.programs.lastApplied !== program) {
            program.apply(this);
            this.programs.lastApplied = program;
        }

	var programUniforms;
	var activeUniforms;
        var i;
        var key;
        if (program.generated !== undefined && program.generated === true) {
            // note that about TextureAttribute that need uniform on unit we would need to improve
            // the current uniformList ...

            programUniforms = program.uniformsCache;
            activeUniforms = program.activeUniforms;
            var regenrateKeys = false;
            for (i = 0 , l = activeUniforms.uniformKeys.length; i < l; i++) {
                var name = activeUniforms.uniformKeys[i];
                var location = programUniforms[name];
                if (location !== undefined) {
                    activeUniforms[name].apply(location);
                } else {
                    regenrateKeys = true;
                    delete activeUniforms[name];
                }
            }
            if (regenrateKeys) {
                var keys = [];
                for (key in activeUniforms) {
                    if (key !== "uniformKeys") {
                        keys.push(key);
                    }
                }
                activeUniforms.uniformKeys = keys;
            }
        } else {
            
            //this.applyUniformList(this.uniforms, {});

            // custom program so we will iterate on uniform from the program and apply them
            // but in order to be able to use Attribute in the state graph we will check if
            // our program want them. It must be defined by the user
            var programObject = program.program;
            var location1;
            var uniformStack;
            var uniform;

            programUniforms = program.uniformsCache;
            var uniformMap = this.uniforms;

            // first time we see attributes key, so we will keep a list of uniforms from attributes
            activeUniforms = [];
            var trackAttributes = program.trackAttributes;
            var trackUniforms = program.trackUniforms;
            var attribute;
            var uniforms;
            var a;
            // loop on wanted attributes and texture attribute to track state graph uniforms from those attributes
            if (trackAttributes !== undefined && trackUniforms === undefined) {
                var attributeKeys = program.trackAttributes.attributeKeys;
                for ( i = 0, l = attributeKeys.length; i < l; i++) {
                    key = attributeKeys[i];
                    attributeStack = this.attributeMap[key];
                    if (attributeStack === undefined) {
                        continue;
                    }
                    // we just need the uniform list and not the attribute itself
                    attribute = attributeStack.globalDefault;
                    if (attribute.getOrCreateUniforms === undefined) {
                        continue;
                    }
                    uniforms = attribute.getOrCreateUniforms();
                    for (a = 0, b = uniforms.uniformKeys.length; a < b; a++) {
                        activeUniforms.push(uniforms[uniforms.uniformKeys[a] ]);
                    }
                }

                var textureAttributeKeysList = program.trackAttributes.textureAttributeKeys;
                if (textureAttributeKeysList !== undefined) {
                    for (i = 0, l = textureAttributeKeysList.length; i < l; i++) {
                        var tak = textureAttributeKeysList[i];
                        if (tak === undefined) {
                            continue;
                        }
                        for (var j = 0, m = tak.length; j < m; j++) {
                            key = tak[j];
                            var attributeList = this.textureAttributeMapList[i];
                            if (attributeList === undefined) {
                                continue;
                            }
                            attributeStack = attributeList[key];
                            if (attributeStack === undefined) {
                                continue;
                            }
                            attribute = attributeStack.globalDefault;
                            if (attribute.getOrCreateUniforms === undefined) {
                                continue;
                            }
                            uniforms = attribute.getOrCreateUniforms(i);
                            for (a = 0, b = uniforms.uniformKeys.length; a < b; a++) {
                                activeUniforms.push(uniforms[uniforms.uniformKeys[a] ]);
                            }
                        }
                    }
                }
                // now we have a list on uniforms we want to track but we will filter them to use only what is needed by our program
                // not that if you create a uniforms whith the same name of a tracked attribute, and it will override it
                var uniformsFinal = {};
                for (i = 0, l = activeUniforms.length; i < l; i++) {
                    var u = activeUniforms[i];
                    var loc = gl.getUniformLocation(programObject, u.name);
                    if (loc !== undefined && loc !== null) {
                        uniformsFinal[u.name] = activeUniforms[i];
                    }
                }
                program.trackUniforms = uniformsFinal;
            }

            for (i = 0, l = programUniforms.uniformKeys.length; i < l; i++) {
                var uniformKey = programUniforms.uniformKeys[i];
                location1 = programUniforms[uniformKey];

                uniformStack = uniformMap[uniformKey];
                if (uniformStack === undefined) {
                    if (program.trackUniforms !== undefined) {
                        uniform = program.trackUniforms[uniformKey];
                        if (uniform !== undefined) {
                            uniform.apply(location1);
                        }
                    }
                } else {
                    if (uniformStack.length === 0) {
                        uniform = uniformStack.globalDefault;
                    } else {
                        uniform = uniformStack.back().object;
                    }
                    uniform.apply(location1);
                }
            }
        }
    },

    applyUniformList: function(uniformMap, uniformList) {

        var program = this.getLastProgramApplied();
        var programObject = program.program;
        var location;
        var uniformStack;
        var uniform;
        var uniformKeys = {};
        var key;

        var programUniforms = program.uniformsCache;

        for (var i = 0, l = programUniforms.uniformKeys.length; i < l; i++) {
            var uniformKey = programUniforms.uniformKeys[i];
            location = programUniforms[uniformKey];

            // get the one in the list
            uniform = uniformList[uniformKey];

            // not found ? check on the stack
            if (uniform === undefined) {
                uniformStack = uniformMap[uniformKey];
                if (uniformStack === undefined) {
                    continue;
                }
                if (uniformStack.length === 0) {
                    uniform = uniformStack.globalDefault;
                } else {
                    uniform = uniformStack.back().object;
                }
            }
            uniform.apply(location);
        }
    },

    applyAttributeMap: function(attributeMap) {
        var attributeStack;
        
        for (var i = 0, l = attributeMap.attributeKeys.length; i < l; i++) {
            var key = attributeMap.attributeKeys[i];

            attributeStack = attributeMap[key];
            if (attributeStack === undefined) {
                continue;
            }
            var attribute;
            if (attributeStack.length === 0) {
                attribute = attributeStack.globalDefault;
            } else {
                attribute = attributeStack.back().object;
            }

            if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
                if (attribute.apply) {
                    attribute.apply(this);
                }
                attributeStack.lastApplied = attribute;
                attributeStack.asChanged = true;
            }
        }
    },

    getObjectPair: function(uniform, value) {
        return { object: uniform, value: value};
    },
    pushUniformsList: function(uniformMap, uniformList) {
        var name;
        var uniform;
        for ( var i = 0, l = uniformList.uniformKeys.length; i < l; i++) {
            var key = uniformList.uniformKeys[i];
            uniformPair = uniformList[key];
            uniform = uniformPair.object;
            name = uniform.name;
            if (uniformMap[name] === undefined) {
                uniformMap[name] = osg.Stack.create();
                uniformMap[name].globalDefault = uniform;
                uniformMap.uniformKeys.push(name);
            }
            var stack = uniformMap[name];
            if (stack.length === 0) {
                stack.push(this.getObjectPair(uniform, uniformPair.value));
            } else if ((stack[stack.length-1].value & osg.StateAttribute.OVERRIDE) && !(uniformPair.value & osg.StateAttribute.PROTECTED) ) {
                stack.push(stack[stack.length-1]);
            } else {
                stack.push(this.getObjectPair(uniform, uniformPair.value));
            }
        }
    },
    popUniformsList: function(uniformMap, uniformList) {
        var uniform;
        for (var i = 0, l = uniformList.uniformKeys.length; i < l; i++) {
            var key = uniformList.uniformKeys[i];
            uniformMap[key].pop();
        }
    },

    applyTextureAttributeMapList: function(textureAttributesMapList) {
        var textureAttributeMap;

        for (var textureUnit = 0, l = textureAttributesMapList.length; textureUnit < l; textureUnit++) {
            textureAttributeMap = textureAttributesMapList[textureUnit];
            if (textureAttributeMap === undefined) {
                continue;
            }

            for (var i = 0, lt = textureAttributeMap.attributeKeys.length; i < lt; i++) {
                var key = textureAttributeMap.attributeKeys[i];

                var attributeStack = textureAttributeMap[key];
                if (attributeStack === undefined) {
                    continue;
                }

                var attribute;
                if (attributeStack.length === 0) {
                    attribute = attributeStack.globalDefault;
                } else {
                    attribute = attributeStack.back().object;
                }
                if (attributeStack.lastApplied !== attribute || attribute.isDirty()) {
                    gl.activeTexture(gl.TEXTURE0 + textureUnit);
                    attribute.apply(this.state);
                    attributeStack.lastApplied = attribute;
                }
            }
        }
    },
    setGlobalDefaultValue: function(attribute) {
        var key = attribute.getTypeMember();
        if (this.attributeMap[key]) {
            this.attributeMap[key].globalDefault = attribute;
        } else {
            this.attributeMap[key] = osg.Stack.create();
            this.attributeMap[key].globalDefault = attribute;

            this.attributeMap.attributeKeys.push(key);
        }
    },

    pushAttributeMap: function(attributeMap,  attributeList) {
        var attributeStack;
        for (var i = 0, l = attributeList.attributeKeys.length; i < l; i++ ) {
            var type = attributeList.attributeKeys[i];
            var attributePair = attributeList[type];
            var attribute = attributePair.object;
            if (attributeMap[type] === undefined) {
                attributeMap[type] = osg.Stack.create();
                attributeMap[type].globalDefault = attribute.cloneType();

                attributeMap.attributeKeys.push(type);
            }

            attributeStack = attributeMap[type];
            if (attributeStack.length === 0) {
                attributeStack.push(this.getObjectPair(attribute, attributePair.value));
            } else if ( (attributeStack[attributeStack.length-1].value & osg.StateAttribute.OVERRIDE) && !(attributePair.value & osg.StateAttribute.PROTECTED)) {
                attributeStack.push(attributeStack[attributeStack.length-1]);
            } else {
                attributeStack.push(this.getObjectPair(attribute, attributePair.value));
            }

            attributeStack.asChanged = true;
        }
    },
    popAttributeMap: function(attributeMap,  attributeList) {
        var attributeStack;
        for (var i = 0, l = attributeList.attributeKeys.length; i < l; i++) {
            type = attributeList.attributeKeys[i];
            attributeStack = attributeMap[type];
            attributeStack.pop();
            attributeStack.asChanged = true;
        }
    },

    setIndexArray: function(array) {
        if (this.currentIndexVBO !== array) {
            if (!array.buffer) {
                array.init();
            }
            gl.bindBuffer(array.type, array.buffer);
            this.currentIndexVBO = array;
        }
        if (array.isDirty()) {
            array.compile();
        }
    },

    lazyDisablingOfVertexAttributes: function() {
        var keys = this.vertexAttribMap._keys;
        for (var i = 0, l = keys.length; i < l; i++) {
            var attr = keys[i];
            if (this.vertexAttribMap[attr]) {
                this.vertexAttribMap._disable[attr] = true;
            }
        }
    },

    applyDisablingOfVertexAttributes: function() {
        var keys = this.vertexAttribMap._keys;
        for (var i = 0, l = keys.length; i < l; i++) {
            if (this.vertexAttribMap._disable[keys[i] ] === true) {
                var attr = keys[i];
                gl.disableVertexAttribArray(attr);
                this.vertexAttribMap._disable[attr] = false;
                this.vertexAttribMap[attr] = false;
            }
        }

        // it takes 4.26% of global cpu
        // there would be a way to cache it and track state if the program has not changed ...
        var program = this.programs.lastApplied;
        if (program.generated === true) {
            var updateColorUniform = false;
            if (this.previousAppliedProgram !== this.programs.lastApplied) {
                updateColorUniform = true;
                this.previousAppliedProgram = this.programs.lastApplied;
            } else {
                var colorAttrib = program.attributesCache.Color;
                if ( this.vertexAttribMap[colorAttrib] !== this.previousColorAttrib) {
                    updateColorUniform = true;
                }
            }

            if (updateColorUniform) {
                var colorAttrib = program.attributesCache.Color;
                if (colorAttrib !== undefined) {
                    if (this.vertexAttribMap[colorAttrib]) {
                        this.uniformArrayState.Color.set([1]);
                    } else {
                        this.uniformArrayState.Color.set([0]);
                    }
                    this.previousColorAttrib = this.vertexAttribMap[colorAttrib];
                    this.uniformArrayState.Color.apply(program.uniformsCache.ArrayColorEnabled);
                }
            }
        }
    },
    setVertexAttribArray: function(attrib, array, normalize) {
        this.vertexAttribMap._disable[ attrib ] = false;
        if (!array.buffer) {
            array.init();
        }
        if (array.isDirty()) {
            gl.bindBuffer(array.type, array.buffer);
            array.compile();
        }
        if (this.vertexAttribMap[attrib] !== array) {

            gl.bindBuffer(array.type, array.buffer);

            if (! this.vertexAttribMap[attrib]) {
                gl.enableVertexAttribArray(attrib);
                
                if ( this.vertexAttribMap[attrib] === undefined) {
                    this.vertexAttribMap._keys.push(attrib);
                }
            }

            this.vertexAttribMap[attrib] = array;
            gl.vertexAttribPointer(attrib, array.itemSize, gl.FLOAT, normalize, 0, 0);
        }
    }

};

osg.State.create = function() {
    var state = new osg.State();
    gl.hint(gl.NICEST, gl.GENERATE_MIPMAP_HINT);
    return state;
};
osg.StateSet = function () { this.id = osg.instance++; };
osg.StateSet.prototype = {
    getObjectPair: function(attribute, value) {
        return {object: attribute, value: value};
    },
    addUniform: function (uniform, mode) {
        if (mode === undefined) {
            mode = osg.StateAttribute.ON;
        }
        if (!this.uniforms) {
            this.uniforms = {};
            this.uniforms.uniformKeys = [];
        }
        var name = uniform.name;
        this.uniforms[name] = this.getObjectPair(uniform, mode);
        if (this.uniforms.uniformKeys.indexOf(name) === -1) {
            this.uniforms.uniformKeys.push(name);
        }
    },
    getUniform: function (uniform) {
        if (this.uniforms[uniform]) {
            return this.uniforms[uniform].object;
        }
        return undefined;
    },
    setTextureAttributeAndMode: function (unit, attribute, mode) {
        if (mode === undefined) {
            mode = osg.StateAttribute.ON;
        }
        this._setTextureAttribute(unit, this.getObjectPair(attribute, mode) );
    },
    getTextureAttribute: function(unit, attribute) {
        if (this.textureAttributeMapList[unit] === undefined || this.textureAttributeMapList[unit][attribute] === undefined) {
            return undefined;
        }
        return this.textureAttributeMapList[unit][attribute].object;
    },
    setAttributeAndMode: function(attribute, mode) { 
        if (mode === undefined) {
            mode = osg.StateAttribute.ON;
        }
        this._setAttribute(this.getObjectPair(attribute, mode)); 
    },

    _getUniformMap: function () {
        return this.uniforms;
    },

    // for internal use, you should not call it directly
    _setTextureAttribute: function (unit, attributePair) {
        if (!this.textureAttributeMapList) {
            this.textureAttributeMapList = [];
        }
        if (this.textureAttributeMapList[unit] === undefined) {
            this.textureAttributeMapList[unit] = {};
            this.textureAttributeMapList[unit].attributeKeys = [];
        }
        var name = attributePair.object.getTypeMember();
        this.textureAttributeMapList[unit][name] = attributePair;
        if (this.textureAttributeMapList[unit].attributeKeys.indexOf(name) === -1) {
            this.textureAttributeMapList[unit].attributeKeys.push(name);
        }
    },
    // for internal use, you should not call it directly
    _setAttribute: function (attributePair) {
        if (!this.attributeMap) {
            this.attributeMap = {};
            this.attributeMap.attributeKeys = [];
        }
        var name = attributePair.object.getTypeMember();
        this.attributeMap[name] = attributePair;
        if (this.attributeMap.attributeKeys.indexOf(name) === -1) {
            this.attributeMap.attributeKeys.push(name);
        }
    },
    getAttributeMap: function() { return this.attributeMap; }
};
/** 
 * Texture encapsulate webgl texture object
 * @class Texture
 * @inherits osg.StateAttribute
 */
osg.Texture = function() {
    osg.StateAttribute.call(this);
    this.setDefaultParameters();
};

/** @lends osg.Texture.prototype */
osg.Texture.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Texture",
    cloneType: function() { var t = new osg.Texture(); t.default_type = true; return t;},
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType; },
    getOrCreateUniforms: function(unit) {
        if (osg.Texture.uniforms === undefined) {
            osg.Texture.uniforms = [];
        }
        if (osg.Texture.uniforms[unit] === undefined) {
            var name = this.getType() + unit;
            var uniforms = {};
            uniforms[name] = osg.Uniform.createInt1(unit, name);
            var uniformKeys = [name];
            uniforms.uniformKeys = uniformKeys;

            osg.Texture.uniforms[unit] = uniforms;
        }
        // uniform for an texture attribute should directly in osg.Texture.uniforms[unit] and not in osg.Texture.uniforms[unit][Texture0]
        return osg.Texture.uniforms[unit];
    },
    setDefaultParameters: function() {
        this.mag_filter = 'LINEAR';
        this.min_filter = 'LINEAR';
        this.wrap_s = 'CLAMP_TO_EDGE';
        this.wrap_t = 'CLAMP_TO_EDGE';
        this.textureWidth = 0;
        this.textureHeight = 0;
        this.target = 'TEXTURE_2D';
    },
    setTextureSize: function(w,h) {
        this.textureWidth = w;
        this.textureHeight = h;
    },
    init: function() {
        if (!this.textureObject) {
            this.textureObject = gl.createTexture();
            this._dirty = true;
        }
    },
    getWidth: function() { return this.textureWidth; },
    getHeight: function() { return this.textureHeight; },

    setWrapS: function(value) { this.wrap_s = value; },
    setWrapT: function(value) { this.wrap_t = value; },

    setMinFilter: function(value) { this.min_filter = value; },
    setMagFilter: function(value) { this.mag_filter = value; },

    setImage: function(img) {
        this.image = img;
        this._dirty = true;
    },

    setFromCanvas: function(canvas) {
        this.init();
        gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        this.setTextureSize(canvas.width, canvas.height);
        this.applyFilterParameter();
        this._dirty = false;
    },

    isImageReady: function() {
        var image = this.image;
        if (image && image.complete) {
            if (typeof image.naturalWidth !== "undefined" &&  image.naturalWidth === 0) {
                return false;
            }
            return true;
        }
        return false;
    },

    applyFilterParameter: function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[this.mag_filter]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.min_filter]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[this.wrap_s]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[this.wrap_t]);
        if (this.min_filter === 'NEAREST_MIPMAP_NEAREST' ||
            this.min_filter === 'LINEAR_MIPMAP_NEAREST' ||
            this.min_filter === 'NEAREST_MIPMAP_LINEAR' ||
            this.min_filter === 'LINEAR_MIPMAP_LINEAR') {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
    },

    apply: function(state) {
        if (this.image !== undefined) {
            if (!this.textureObject) {
                if (this.isImageReady()) {
                    if (!this.textureObject) {
                        this.init();
                        this.setTextureSize(this.image.naturalWidth, this.image.naturalHeight);
                        this._dirty = false;
                    }
                    gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
                    this.applyFilterParameter();
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }
            } else {
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
            }
        } else if (this.textureHeight !== 0 && this.textureWidth !== 0 ) {
            if (!this.textureObject) {
                this.init();
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureWidth, this.textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                this.applyFilterParameter();
            } else {
                gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
            }
        } else if (this.textureObject !== undefined) {
            gl.bindTexture(gl.TEXTURE_2D, this.textureObject);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    },

    /**
      set the injection code that will be used in the shader generation
      for FragmentMain part we would write something like that
      @example
      var fragmentGenerator = function(unit) {
          var str = "texColor" + unit + " = texture2D( Texture" + unit + ", FragTexCoord" + unit + ".xy );\n";
          str += "fragColor = fragColor * texColor" + unit + ";\n";
      };
      setShaderGeneratorFunction(fragmentGenerator, osg.ShaderGeneratorType.FragmentMain);

    */
    setShaderGeneratorFunction: function(
        /**Function*/ injectionFunction, 
        /**osg.ShaderGeneratorType*/ mode) {
        this[mode] = injectionFunction;
    },

    writeToShader: function(unit, type)
    {
        if (this[type])
            return this[type].call(this,unit);
        return "";
    }
});
osg.Texture.prototype[osg.ShaderGeneratorType.VertexInit] = function(unit) {
    var str = "attribute vec2 TexCoord"+unit+";\n";
    str += "varying vec2 FragTexCoord"+unit+";\n";
    return str;
};
osg.Texture.prototype[osg.ShaderGeneratorType.VertexMain] = function(unit) {
        return "FragTexCoord"+unit+" = TexCoord" + unit + ";\n";
};
osg.Texture.prototype[osg.ShaderGeneratorType.FragmentInit] = function(unit) {
    var str = "varying vec2 FragTexCoord" + unit +";\n";
    str += "uniform sampler2D Texture" + unit +";\n";
    str += "vec4 texColor" + unit + ";\n";
    return str;
};
osg.Texture.prototype[osg.ShaderGeneratorType.FragmentMain] = function(unit) {
    var str = "texColor" + unit + " = texture2D( Texture" + unit + ", FragTexCoord" + unit + ".xy );\n";
    str += "fragColor = fragColor * texColor" + unit + ";\n";
    return str;
};


osg.Texture.createFromURL = function(imageSource) {
    var a = new osg.Texture();
    if (imageSource !== undefined) {
        var img = new Image();
        img.src = imageSource;
        a.setImage(img);
    }
    return a;
};
osg.Texture.createFromImg = function(img) {
    var a = new osg.Texture();
    a.setImage(img);
    return a;
};
osg.Texture.createFromCanvas = function(ctx) {
    var a = new osg.Texture();
    a.setFromCanvas(ctx);
    return a;
};

osg.Texture.create = function(url) {
    osg.log("osg.Texture.create is deprecated, use osg.Texture.createFromURL instead");
    return osg.Texture.createFromURL(url);
};
osg.UpdateVisitor = function () { 
    osg.NodeVisitor.call(this);
    var framestamp = new osg.FrameStamp();
    this.getFrameStamp = function() { return framestamp; };
    this.setFrameStamp = function(s) { framestamp = s; };
};
osg.UpdateVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    apply: function(node) {
        if (node.getUpdateCallback !== undefined) {
            var cb = node.getUpdateCallback();
            if (cb !== undefined) {
                cb.update(node, this);
                return;
            }
        }
        if (node.traverse) {
            this.traverse(node);
        }
    }
});
osg.View = function() { osg.Camera.call(this); };
osg.View.prototype = osg.objectInehrit(osg.Camera.prototype, {
    computeIntersections: function (x, y, traversalMask) {
        if (traversalMask === undefined) {
            traversalMask = ~0;
        }
        
        var iv = new osgUtil.IntersectVisitor();
        iv.setTraversalMask(traversalMask);
        iv.addLineSegment([x,y,0.0], [x,y,1.0]);
        iv.apply(this);
        return iv.hits;
    }
});
osg.Viewport = function (x,y, w, h) {
    osg.StateAttribute.call(this);

    if (x === undefined) { x = 0; }
    if (y === undefined) { y = 0; }
    if (w === undefined) { w = 800; }
    if (h === undefined) { h = 600; }

    var xstart = x;
    var ystart = y;
    var width = w;
    var height = h;
    this.x = function() { return xstart; };
    this.y = function() { return ystart; };
    this.width = function() { return width; };
    this.height = function() { return height; };
    this.computeWindowMatrix = function() {
        // res = Matrix offset * Matrix scale * Matrix translate
        var translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
        var scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);
        var offset = osg.Matrix.makeTranslate(xstart,ystart,0.0);
        //return osg.Matrix.mult(osg.Matrix.mult(translate, scale, translate), offset, offset);
        return osg.Matrix.preMult(offset, osg.Matrix.preMult(scale, translate));
    };
    this._dirty = true;
};
osg.Viewport.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "Viewport",
    cloneType: function() {return new osg.Viewport(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    apply: function(state) {
        gl.viewport(this.x(), this.y(), this.width(), this.height()); 
        this._dirty = false;
    }
});
osg.CullStack = function() {
    this.modelviewMatrixStack = [osg.Matrix.makeIdentity()];
    this.projectionMatrixStack = [osg.Matrix.makeIdentity()];
    this.viewportStack = [];
};

osg.CullStack.prototype = {
    getViewport: function () {
        if (this.viewportStack.length === 0) {
            return undefined;
        }
        return this.viewportStack[this.viewportStack.length-1];
    },
    getLookVectorLocal: function() {
        var m = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
        return [ -m[2], -m[6], -m[10] ];
    },
    pushViewport: function (vp) {
        this.viewportStack.push(vp);
    },
    popViewport: function () {
        this.viewportStack.pop();
    },
    pushModelviewMatrix: function (matrix) {
        this.modelviewMatrixStack.push(matrix);

        var lookVector = this.getLookVectorLocal();
        this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);        
        this.bbCornerNear = (~this.bbCornerFar)&7;
    },
    popModelviewMatrix: function () {

        this.modelviewMatrixStack.pop();
        var lookVector;
        if (this.modelviewMatrixStack.length !== 0) {
            lookVector = this.getLookVectorLocal();
        } else {
            lookVector = [0,0,-1];
        }
        this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
        this.bbCornerNear = (~this.bbCornerFar)&7;

    },
    pushProjectionMatrix: function (matrix) {
        this.projectionMatrixStack.push(matrix);
    },
    popProjectionMatrix: function () {
        this.projectionMatrixStack.pop();
    }
};
/** 
 * CullVisitor traverse the tree and collect Matrix/State for the rendering traverse 
 * @class CullVisitor
 */
osg.CullVisitor = function () {
    osg.NodeVisitor.call(this);
    osg.CullSettings.call(this);
    osg.CullStack.call(this);

    this.rootStateGraph = undefined;
    this.currentStateGraph = undefined;
    this.currentRenderBin = undefined;
    this.currentRenderStage = undefined;
    this.rootRenderStage = undefined;

    this.computeNearFar = true;
    this.computedNear = Number.POSITIVE_INFINITY;
    this.computedFar = Number.NEGATIVE_INFINITY;

    var lookVector =[0.0,0.0,-1.0];
    this.bbCornerFar = (lookVector[0]>=0?1:0) | (lookVector[1]>=0?2:0) | (lookVector[2]>=0?4:0);
    this.bbCornerNear = (~this.bbCornerFar)&7;


    // keep a matrix in memory to avoid to create matrix
    this.reserveMatrixStack = [[]];
    this.reserveMatrixStack.current = 0;

    this.reserveLeafStack = [{}];
    this.reserveLeafStack.current = 0;
};

/** @lends osg.CullVisitor.prototype */
osg.CullVisitor.prototype = osg.objectInehrit(osg.CullStack.prototype ,osg.objectInehrit(osg.CullSettings.prototype, osg.objectInehrit(osg.NodeVisitor.prototype, {
    distance: function(coord,matrix) {
        return -( coord[0]*matrix[2]+ coord[1]*matrix[6] + coord[2]*matrix[10] + matrix[14]);
    },
    updateCalculatedNearFar: function( matrix, drawable) {

        var bb = drawable.getBoundingBox();
        var d_near, d_far;

        // efficient computation of near and far, only taking into account the nearest and furthest
        // corners of the bounding box.
        d_near = this.distance(bb.corner(this.bbCornerNear),matrix);
        d_far = this.distance(bb.corner(this.bbCornerFar),matrix);
        
        if (d_near>d_far) {
            var tmp = d_near;
            d_near = d_far;
            d_far = tmp;
        }

        if (d_far<0.0) {
            // whole object behind the eye point so discard
            return false;
        }

        if (d_near<this.computedNear) {
            this.computedNear = d_near;
        }

        if (d_far>this.computedFar) {
            this.computedFar = d_far;
        }

        return true;
    },

    clampProjectionMatrix: function(projection, znear, zfar, nearFarRatio, resultNearFar) {
        var epsilon = 1e-6;
        if (zfar<znear-epsilon) {
            osg.log("clampProjectionMatrix not applied, invalid depth range, znear = " + znear + "  zfar = " + zfar);
            return false;
        }
        
        var desired_znear, desired_zfar;
        if (zfar<znear+epsilon) {
            // znear and zfar are too close together and could cause divide by zero problems
            // late on in the clamping code, so move the znear and zfar apart.
            var average = (znear+zfar)*0.5;
            znear = average-epsilon;
            zfar = average+epsilon;
            // OSG_INFO << "_clampProjectionMatrix widening znear and zfar to "<<znear<<" "<<zfar<<std::endl;
        }

        if (Math.abs(osg.Matrix.get(projection,0,3))<epsilon  && 
            Math.abs(osg.Matrix.get(projection,1,3))<epsilon  && 
            Math.abs(osg.Matrix.get(projection,2,3))<epsilon ) {
            // OSG_INFO << "Orthographic matrix before clamping"<<projection<<std::endl;

            var delta_span = (zfar-znear)*0.02;
            if (delta_span<1.0) {
		delta_span = 1.0;
	    }
            desired_znear = znear - delta_span;
            desired_zfar = zfar + delta_span;

            // assign the clamped values back to the computed values.
            znear = desired_znear;
            zfar = desired_zfar;

            osg.Matrix.set(projection,2,2, -2.0/(desired_zfar-desired_znear));
            osg.Matrix.set(projection,3,2, -(desired_zfar+desired_znear)/(desired_zfar-desired_znear));

            // OSG_INFO << "Orthographic matrix after clamping "<<projection<<std::endl;
        } else {

            // OSG_INFO << "Persepective matrix before clamping"<<projection<<std::endl;
            //std::cout << "_computed_znear"<<_computed_znear<<std::endl;
            //std::cout << "_computed_zfar"<<_computed_zfar<<std::endl;

            var zfarPushRatio = 1.02;
            var znearPullRatio = 0.98;

            //znearPullRatio = 0.99; 

            desired_znear = znear * znearPullRatio;
            desired_zfar = zfar * zfarPushRatio;

            // near plane clamping.
            var min_near_plane = zfar*nearFarRatio;
            if (desired_znear<min_near_plane) {
		desired_znear=min_near_plane;
	    }

            // assign the clamped values back to the computed values.
            znear = desired_znear;
            zfar = desired_zfar;
            
            var m22 = osg.Matrix.get(projection,2,2);
            var m32 = osg.Matrix.get(projection,3,2);
            var m23 = osg.Matrix.get(projection,2,3);
            var m33 = osg.Matrix.get(projection,3,3);
            var trans_near_plane = (-desired_znear*m22 + m32)/(-desired_znear*m23+m33);
            var trans_far_plane = (-desired_zfar*m22+m32)/(-desired_zfar*m23+m33);

            var ratio = Math.abs(2.0/(trans_near_plane-trans_far_plane));
            var center = -(trans_near_plane+trans_far_plane)/2.0;

            var matrix = [1.0,0.0,0.0,0.0,
                          0.0,1.0,0.0,0.0,
                          0.0,0.0,ratio,0.0,
                          0.0,0.0,center*ratio,1.0];
            osg.Matrix.postMult(matrix, projection);
            // OSG_INFO << "Persepective matrix after clamping"<<projection<<std::endl;
        }
        if (resultNearFar !== undefined) {
            resultNearFar[0] = znear;
            resultNearFar[1] = zfar;
        }
        return true;
    },

    setStateGraph: function(sg) {
        this.rootStateGraph = sg;
        this.currentStateGraph = sg;
    },
    setRenderStage: function(rg) {
        this.rootRenderStage = rg;
        this.currentRenderBin = rg;
    },
    reset: function () {
        this.modelviewMatrixStack.length = 1;
        this.projectionMatrixStack.length = 1;
        this.reserveMatrixStack.current = 0;
        this.reserveLeafStack.current = 0;
    },
    getCurrentRenderBin: function() { return this.currentRenderBin; },
    setCurrentRenderBin: function(rb) { this.currentRenderBin = rb; },
    addPositionedAttribute: function (attribute) {
        var matrix = this.modelviewMatrixStack[this.modelviewMatrixStack.length - 1];
        this.currentRenderBin.getStage().positionedAttribute.push([matrix, attribute]);
    },
    pushStateSet: function (stateset) {
        this.currentStateGraph = this.currentStateGraph.findOrInsert(stateset);
    },
    popStateSet: function () {
        this.currentStateGraph = this.currentStateGraph.parent;
    },

    popProjectionMatrix: function () {
        if (this.computeNearFar === true && this.computedFar >= this.computedNear) {
            var m = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
            this.clampProjectionMatrix(m, this.computedNear, this.computedFar, this.nearFarRatio);
        }
        osg.CullStack.prototype.popProjectionMatrix.call(this);
    },

    apply: function( node ) {
        this[node.objectType].call(this, node);
    },

    getReservedMatrix: function() {
        var m = this.reserveMatrixStack[this.reserveMatrixStack.current++];
        if (this.reserveMatrixStack.current === this.reserveMatrixStack.length) {
            this.reserveMatrixStack.push(osg.Matrix.makeIdentity());
        }
        return m;
    },
    getReservedLeaf: function() {
        var l = this.reserveLeafStack[this.reserveLeafStack.current++];
        if (this.reserveLeafStack.current === this.reserveLeafStack.length) {
            this.reserveLeafStack.push({});
        }
        return l;
    }
})));

osg.CullVisitor.prototype[osg.Camera.prototype.objectType] = function( camera ) {

    var stateset = camera.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (camera.light) {
        this.addPositionedAttribute(camera.light);
    }

    var originalModelView = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];

    var modelview = this.getReservedMatrix();
    var projection = this.getReservedMatrix();

    if (camera.getReferenceFrame() === osg.Transform.RELATIVE_RF) {
        var lastProjectionMatrix = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
        osg.Matrix.mult(lastProjectionMatrix, camera.getProjectionMatrix(), projection);
        var lastViewMatrix = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
        osg.Matrix.mult(lastViewMatrix, camera.getViewMatrix(), modelview);
    } else {
        // absolute
        osg.Matrix.copy(camera.getViewMatrix(), modelview);
        osg.Matrix.copy(camera.getProjectionMatrix(), projection);
    }
    this.pushProjectionMatrix(projection);
    this.pushModelviewMatrix(modelview);

    if (camera.getViewport()) {
        this.pushViewport(camera.getViewport());
    }

    // save current state of the camera
    var previous_znear = this.computedNear;
    var previous_zfar = this.computedFar;
    var previous_cullsettings = new osg.CullSettings();
    previous_cullsettings.setCullSettings(this);

    this.computedNear = Number.POSITIVE_INFINITY;
    this.computedFar = Number.NEGATIVE_INFINITY;
    this.setCullSettings(camera);

    // nested camera
    if (camera.getRenderOrder() === osg.Camera.NESTED_RENDER) {
        
        if (camera.traverse) {
            this.traverse(camera);
        }
        
    } else {
        // not tested

        var previous_stage = this.getCurrentRenderBin().getStage();

        // use render to texture stage
        var rtts = new osg.RenderStage();
        rtts.setCamera(camera);
        rtts.setClearDepth(camera.getClearDepth());
        rtts.setClearColor(camera.getClearColor());

        rtts.setClearMask(camera.getClearMask());
        
        var vp;
        if (camera.getViewport() === undefined) {
            vp = previous_stage.getViewport();
        } else {
            vp = camera.getViewport();
        }
        rtts.setViewport(vp);
        
        // skip positional state for now
        // ...

        var previousRenderBin = this.getCurrentRenderBin();

        this.setCurrentRenderBin(rtts);

        if (camera.traverse) {
            camera.traverse(this);
        }

        this.setCurrentRenderBin(previousRenderBin);

        if (camera.getRenderOrder() === osg.Camera.PRE_RENDER) {
            this.getCurrentRenderBin().getStage().addPreRenderStage(rtts,camera.renderOrderNum);
        } else {
            this.getCurrentRenderBin().getStage().addPostRenderStage(rtts,camera.renderOrderNum);
        }
    }

    this.popModelviewMatrix();
    this.popProjectionMatrix();

    if (camera.getViewport()) {
        this.popViewport();
    }

    // restore previous state of the camera
    this.setCullSettings(previous_cullsettings);
    this.computedNear = previous_znear;
    this.computedFar = previous_zfar;

    if (stateset) {
        this.popStateSet();
    }

};


osg.CullVisitor.prototype[osg.MatrixTransform.prototype.objectType] = function (node) {

    var lastMatrixStack = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];

    var matrix = this.getReservedMatrix();
    osg.Matrix.mult(lastMatrixStack, node.getMatrix(), matrix);
    this.pushModelviewMatrix(matrix);

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (node.light) {
        this.addPositionedAttribute(node.light);
    }

    if (node.traverse) {
        this.traverse(node);
    }

    if (stateset) {
        this.popStateSet();
    }
    
    this.popModelviewMatrix();

};

osg.CullVisitor.prototype[osg.Projection.prototype.objectType] = function (node) {
    lastMatrixStack = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
    var matrix = this.getReservedMatrix();
    osg.Matrix.mult(lastMatrixStack, node.getProjectionMatrix(), matrix);
    this.pushProjectionMatrix(matrix);

    var stateset = node.getStateSet();

    if (stateset) {
        this.pushStateSet(stateset);
    }

    if (node.traverse) {
        this.traverse(node);
    }

    if (stateset) {
        this.popStateSet();
    }

    this.popProjectionMatrix();
};

osg.CullVisitor.prototype[osg.Node.prototype.objectType] = function (node) {

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }
    if (node.light) {
        this.addPositionedAttribute(node.light);
    }

    if (node.traverse) {
        this.traverse(node);
    }

    if (stateset) {
        this.popStateSet();
    }
};
osg.CullVisitor.prototype[osg.Geometry.prototype.objectType] = function (node) {
    matrix = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
    var bb = node.getBoundingBox();
    if (this.computeNearFar && bb.valid()) {
        if (!this.updateCalculatedNearFar(matrix,node)) {
            return;
        }
    }

    var stateset = node.getStateSet();
    if (stateset) {
        this.pushStateSet(stateset);
    }

    var leafs = this.currentStateGraph.leafs;
    if (leafs.length === 0) {
        this.currentRenderBin.addStateGraph(this.currentStateGraph);
    }

    var leaf = this.getReservedLeaf();
    leaf.parent = this.currentStateGraph;
    leaf.modelview = this.modelviewMatrixStack[this.modelviewMatrixStack.length-1];
    leaf.projection = this.projectionMatrixStack[this.projectionMatrixStack.length-1];
    leaf.geometry = node;
    leafs.push(leaf);

    if (stateset) {
        this.popStateSet();
    }
};
/** -*- compile-command: "jslint-cli osgAnimation.js" -*-
 *
 *  Copyright (C) 2010 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */


var osgAnimation = {};

osgAnimation.EaseOutQuad = function(t) { return - (t* (t-2.0)); };
osgAnimation.EaseInQuad = function(t) { return (t*t); };
osgAnimation.EaseOutCubic = function(t) { t = t-1.0; return (t*t*t + 1); };
osgAnimation.EaseInCubic = function(t) { return (t*t*t); };
osgAnimation.EaseOutQuart = function(t) { t = t - 1; return - (t*t*t*t -1); };
osgAnimation.EaseInQuart = function(t) { return (t*t*t*t); };
osgAnimation.EaseOutElastic = function(t) { return Math.pow(2.0, -10.0 * t) * Math.sin((t - 0.3 / 4.0) * (2.0 * Math.PI) / 0.3) + 1.0; };
//osgAnimation.EaseInElastic = function(t) { return ; };
/** -*- compile-command: "jslint-cli osgUtil.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

var osgUtil = {};
/** -*- compile-command: "jslint-cli TriangleIntersect.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

osgUtil.TriangleHit = function (index, normal, r1, v1, r2, v2, r3, v3) {
    this.index = index;
    this.normal = normal;
    this.r1 = r1;
    this.v1 = v1;
    this.r2 = r2;
    this.v2 = v2;
    this.r3 = r3;
    this.v3 = v3;
};

osgUtil.TriangleIntersect = function()
{
    this.hits = [];
    this.nodePath = [];
};

osgUtil.TriangleIntersect.prototype = {
    setNodePath: function(np) { this.nodePath = np; },
    set: function(start, end) {
        this.start = start;
        this.end = end;
        this.dir = osg.Vec3.sub(end, start, []);
        this.length = osg.Vec3.length(this.dir);
        var l = 1.0/this.length;
        osg.Vec3.mult(this.dir, l, this.dir);
    },

    apply: function(node) {
        var primitive;
        var vertexes;
        var lastIndex;
        var idx;
        var v0,v1,v2;
        var i;
        this.index = 0;
        for (i = 0, l = node.primitives.length; i < l; i++) {
            primitive = node.primitives[i];
            if (primitive.getIndices !== undefined) {
                vertexes = node.getAttributes().Vertex.getElements();
                var indexes = primitive.indices.getElements();
                switch(primitive.getMode()) {
                case gl.TRIANGLES:
                    lastIndex = primitive.getCount();
                    for ( idx = primitive.getFirst(); idx < lastIndex; idx+= 3) {
                        v0 = [];
                        v1 = [];
                        v2 = [];
                        v0[0] = vertexes[indexes[idx]*3];
                        v0[1] = vertexes[indexes[idx]*3 +1];
                        v0[2] = vertexes[indexes[idx]*3 +2];
                        v1[0] = vertexes[indexes[idx+1]*3];
                        v1[1] = vertexes[indexes[idx+1]*3 +1];
                        v1[2] = vertexes[indexes[idx+1]*3 +2];
                        v2[0] = vertexes[indexes[idx+2]*3];
                        v2[1] = vertexes[indexes[idx+2]*3 +1];
                        v2[2] = vertexes[indexes[idx+2]*3 +2];
                        this.intersect(v0, v1, v2);
                    }
                    break;
                case gl.TRIANGLE_STRIP:
                    if (console) {
                        console.log("TriangleIntersect does not support TRIANGLE_STRIP");
                    }
                    break;
                case gl.TRIANGLE_FAN:
                    if (console) {
                        console.log("TriangleIntersect does not support TRIANGLE_FAN");
                    }
                    break;
                }
            } else { // draw array
                vertexes = node.getAttributes().Vertex.getElements();
                switch(primitive.getMode()) {
                case gl.TRIANGLES:
                    lastIndex = primitive.getCount();
                    for (idx = primitive.getFirst(); idx < lastIndex; ) {
                        v0 = [];
                        v1 = [];
                        v2 = [];
                        v0[0] = vertexes[idx++];
                        v0[1] = vertexes[idx++];
                        v0[2] = vertexes[idx++];
                        v1[0] = vertexes[idx++];
                        v1[1] = vertexes[idx++];
                        v1[2] = vertexes[idx++];
                        v2[0] = vertexes[idx++];
                        v2[1] = vertexes[idx++];
                        v2[2] = vertexes[idx++];
                        this.intersect(v0, v1, v2);
                    }
                    break;
                case gl.TRIANGLE_STRIP:
                    if (console) {
                        console.log("TriangleIntersect does not support TRIANGLE_STRIP");
                    }
                    break;
                case gl.TRIANGLE_FAN:
                    if (console) {
                        console.log("TriangleIntersect does not support TRIANGLE_FAN");
                    }
                    break;
                }
            }
        }

    },

    intersect: function(v1, v2, v3) {
        this.index++;

        if (v1==v2 || v2==v3 || v1==v3) { return;}

        var v12 = osg.Vec3.sub(v2,v1, []);
        var n12 = osg.Vec3.cross(v12, this.dir, []);
        var ds12 = osg.Vec3.dot(osg.Vec3.sub(this.start,v1,[]),n12);
        var d312 = osg.Vec3.dot(osg.Vec3.sub(v3,v1,[]),n12);
        if (d312>=0.0)
        {
            if (ds12<0.0) { return;}
            if (ds12>d312) { return;}
        }
        else                     // d312 < 0
        {
            if (ds12>0.0) { return;}
            if (ds12<d312) { return;}
        }

        var v23 = osg.Vec3.sub(v3,v2, []);
        var n23 = osg.Vec3.cross(v23,this.dir, []);
        var ds23 = osg.Vec3.dot(osg.Vec3.sub(this.start,v2, []),n23);
        var d123 = osg.Vec3.dot(osg.Vec3.sub(v1,v2, []),n23);
        if (d123>=0.0)
        {
            if (ds23<0.0) {return;}
            if (ds23>d123) { return;}
        }
        else                     // d123 < 0
        {
            if (ds23>0.0) {return;}
            if (ds23<d123) {return; }
        }

        var v31 = osg.Vec3.sub(v1,v3, []);
        var n31 = osg.Vec3.cross(v31,this.dir, []);
        var ds31 = osg.Vec3.dot(osg.Vec3.sub(this.start,v3, []),n31);
        var d231 = osg.Vec3.dot(osg.Vec3.sub(v2,v3, []),n31);
        if (d231>=0.0)
        {
            if (ds31<0.0) {return;}
            if (ds31>d231) {return;}
        }
        else                     // d231 < 0
        {
            if (ds31>0.0) {return;}
            if (ds31<d231) {return;}
        }
        

        var r3;
        if (ds12 === 0.0) { r3 = 0.0;}
        else if (d312 !== 0.0) { r3 = ds12/d312; }
        else {return;} // the triangle and the line must be parallel intersection.
        
        var r1;
        if (ds23 === 0.0) { r1 = 0.0;}
        else if (d123 !== 0.0) {r1 = ds23/d123;}
        else {return;} // the triangle and the line must be parallel intersection.
        
        var r2;
        if (ds31 === 0.0) {r2=0.0;}
        else if (d231 !== 0.0) {r2 = ds31/d231; }
        else {return;} // the triangle and the line must be parallel intersection.

        var total_r = (r1+r2+r3);
        if (total_r !== 1.0)
        {
            if (total_r === 0.0) {return;} // the triangle and the line must be parallel intersection.
            var inv_total_r = 1.0/total_r;
            r1 *= inv_total_r;
            r2 *= inv_total_r;
            r3 *= inv_total_r;
        }
        
        var inside = [];
        osg.Vec3.add(osg.Vec3.mult(v1,r1, []),  
                     osg.Vec3.mult(v2,r2, []), 
                     inside);
        osg.Vec3.add(osg.Vec3.mult(v3,r3, []), 
                     inside, 
                     inside);
        if (!osg.Vec3.valid(inside)) {
            osg.log("Warning: TriangleIntersect ");
            osg.log("hit:     " + inside );
            osg.log("         " + v1);
            osg.log("         " + v2);
            osg.log("         " + v3);
            return;
        }

        var d = osg.Vec3.dot(osg.Vec3.sub(inside,
                                          this.start, 
                                          []), this.dir);

        if (d<0.0) {return;}
        if (d>this.length) {return;}

        var normal = osg.Vec3.cross(v12,v23, []);
        osg.Vec3.normalize(normal, normal);

        var r = d/this.length;

        
        this.hits.push({ 'ratio': r,
                         'nodepath': this.nodePath.slice(0),
                         'triangleHit': new osgUtil.TriangleHit(this.index-1, normal, r1, v1, r2, v2, r3, v3)
                       });
        this.hit = true;
    }
};
/** -*- compile-command: "jslint-cli IntersectVisitor.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

osgUtil.IntersectVisitor = function() {
    osg.NodeVisitor.call(this);
    this.matrix = [];
    this.hits = [];
    this.nodePath = [];
};
osgUtil.IntersectVisitor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
    addLineSegment: function(start, end) {
        this.start = start;
        this.end = end;
    },
    intersectSegmentWithSphere: function(start, end, bsphere) {
        var sm = osg.Vec3.sub(start, bsphere.center);
        var c = osg.Vec3.length2(sm) - bsphere.radius * bsphere.radius;
        if (c < 0.0) {
            return true;
        }
        
        var se = osg.Vec3.sub(end, start);
        var a = osg.Vec3.length2(se);
        var b = osg.Vec3.dot(sm, se) * 2.0;
        var d = b*b - 4.0 * a * c;
        if (d < 0.0) {
            return false;
        }

        d = Math.sqrt(d);
        var div = 1.0/2.0 * a;
        var r1 = (-b-d)*div;
        var r2 = (-b+d)*div;

        if (r1 <= 0.0 && r2 <= 0.0) {
            return false;
        }

        if (r1 >= 1.0 && r2 >= 1.0) {
            return false;
        }
        return true;
    },
    pushModelMatrix: function(matrix) {
        if (this.matrix.length > 0 ) {
            var m = osg.Matrix.copy(this.matrix[this.matrix.length-1]);
            osg.Matrix.preMult(m, matrix);
            this.matrix.push(m);
        } else {
            this.matrix.push(matrix);
        }
    },
    getModelMatrix: function() {
        if (this.matrix.length ===0 ) {
            return osg.Matrix.makeIdentity();
        }
        return this.matrix[this.matrix.length-1];
    },
    popModelMatrix: function() { return this.matrix.pop(); },
    getWindowMatrix: function() { return this.windowMatrix;},
    getProjectionMatrix: function() { return this.projectionMatrix;},
    getViewMatrix: function() { return this.viewMatrix;},
    intersectSegmentWithGeometry: function(start, end, geometry) {
        ti = new osgUtil.TriangleIntersect();
        ti.setNodePath(this.nodePath);
        ti.set(start, end);
        ti.apply(geometry);
        var l = ti.hits.length;
        if (l > 0) {
            for (var i = 0; i < l; i++) {
                this.hits.push( ti.hits[i]);
            }
            return true;
        }
        return false;
    },
    applyCamera: function(camera) {
        // we should support hierarchy of camera
        // but right now we want just simple picking on main
        // camera
        this.projectionMatrix = camera.getProjectionMatrix();
        this.viewMatrix = camera.getViewMatrix();

        var vp = camera.getViewport();
        if (vp !== undefined) {
            this.windowMatrix = vp.computeWindowMatrix();
        }

        this.traverse(camera);
    },

    applyNode: function(node) {
        if (node.getMatrix) {
            this.pushModelMatrix(node.getMatrix());
        }

        if (node.primitives) {
            var matrix = [];
            osg.Matrix.copy(this.getWindowMatrix(), matrix);
            osg.Matrix.preMult(matrix, this.getProjectionMatrix());
            osg.Matrix.preMult(matrix, this.getViewMatrix());
            osg.Matrix.preMult(matrix, this.getModelMatrix());
            
            var inv = [];
            var valid = osg.Matrix.inverse(matrix, inv);
            // if matrix is invalid do nothing on this node
            if (!valid) {
                return;
            }

            var ns = osg.Matrix.transformVec3(inv, this.start);
            var ne = osg.Matrix.transformVec3(inv, this.end);
            this.intersectSegmentWithGeometry(ns, ne, node);
        }

        if (node.traverse) {
            this.traverse(node);
        }

        if (node.getMatrix) {
            this.popModelMatrix();
        }
    },

    apply: function(node) {
        if (this.enterNode(node) === false) {
            return;
        }
        this.nodePath.push(node);

        if (node.getViewMatrix) { // Camera/View
            this.applyCamera(node);
        } else {
            this.applyNode(node);
        }

        this.nodePath.pop();
    },

    enterNode: function(node) {
        var bsphere = node.boundingSphere;
        if (bsphere !== undefined ) {
            if (!this.intersectSegmentWithSphere) {
                return false;
            }
        }
        return true;
    }
});
/** -*- compile-command: "jslint-cli osgDB.js" -*-
 *
 *  Copyright (C) 2010 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */

var osgDB = {};

osgDB.parseSceneGraph = function (node)
{
    var newnode;
    var children = node.children;
    if (node.primitives || node.attributes) {
        newnode = new osg.Geometry();
        osg.extend(newnode, node);
        node = newnode;

        var i;
        for ( i in node.primitives) {
            var mode = node.primitives[i].mode;
            if (node.primitives[i].indices) {
                var array = node.primitives[i].indices;
                array = new osg.BufferArray(gl[array.type], array.elements, array.itemSize );
                if (!mode) {
                    mode = gl.TRIANGLES;
                } else {
                    mode = gl[mode];
                }
                node.primitives[i] = new osg.DrawElements(mode, array);
            } else {
                mode = gl[mode];
                var first = node.primitives[i].first;
                var count = node.primitives[i].count;
                node.primitives[i] = new osg.DrawArrays(mode, first, count);
            }
        }


        for (var key in node.attributes) {
            if (node.attributes.hasOwnProperty(key)) {
                var attributeArray = node.attributes[key];
                node.attributes[key] = new osg.BufferArray(gl[attributeArray.type], attributeArray.elements, attributeArray.itemSize );
            }
        }
        // jQuery.each(node.attributes, function( key, element) {
        //     var attributeArray = node.attributes[key];
        //     node.attributes[key] = osg.BufferArray.create(gl[attributeArray.type], attributeArray.elements, attributeArray.itemSize );
        // });
    }

    if (node.stateset) {
        var newstateset = new osg.StateSet();
        if (node.stateset.textures) {
            var textures = node.stateset.textures;
            for (var t = 0, tl = textures.length; t < tl; t++) {
                if (!textures[t].file) {
                    osg.log("no texture on unit " + t + " skip it")
                    //osg.log(textures[t]);
                    continue;
                }
                var tex = new osg.Texture();
                osg.extend(tex, textures[t]);
                var img = new Image();
                img.src = textures[t].file;
                tex.setImage(img);
                
                newstateset.setTextureAttributeAndMode(t, tex);
                newstateset.addUniform(osg.Uniform.createInt1(t,"Texture" + t));
            }
        }
        if (node.stateset.material) {
            var material = node.stateset.material;
            var newmaterial = new osg.Material();
            osg.extend(newmaterial, material);
            newstateset.setAttributeAndMode(newmaterial);
        }
        node.stateset = newstateset;
    }

    if (node.matrix) {
        newnode = new osg.MatrixTransform();
        osg.extend(newnode, node);
        newnode.setMatrix(osg.Matrix.copy(node.matrix));
        node = newnode;

    }

    if (node.projection) {
        newnode = new osg.Projection();
        osg.extend(newnode, node);
        newnode.setProjectionMatrix(osg.Matrix.copy(node.projection));
        node = newnode;
    }

    // default type
    if (node.objectType === undefined) {
        newnode = new osg.Node();
        osg.extend(newnode, node);
        node = newnode;
    }

    if (children) {
        // disable children, it will be processed in the end
        node.children = [];

        for (var child = 0, childLength = children.length; child < childLength; child++) {
            node.addChild(osgDB.parseSceneGraph(children[child]));
        }
    }

    return node;
};
/** -*- compile-command: "jslint-cli osgViewer.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

var osgViewer = {};
/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains functions every webgl program will need
 * a version of one way or another.
 *
 * Instead of setting up a context manually it is recommended to
 * use. This will check for success or failure. On failure it
 * will attempt to present an approriate message to the user.
 *
 *       gl = WebGLUtils.setupWebGL(canvas);
 *
 * For animated WebGL apps use of setTimeout or setInterval are
 * discouraged. It is recommended you structure your rendering
 * loop like this.
 *
 *       function render() {
 *         window.requestAnimationFrame(render, canvas);
 *
 *         // do rendering
 *         ...
 *       }
 *       render();
 *
 * This will call your rendering function up to the refresh rate
 * of your display but will stop rendering if your app is not
 * visible.
 */

WebGLUtils = function() {

/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 */
var makeFailHTML = function(msg) {
  return '' +
        '<div style="margin: auto; width:500px;z-index:10000;margin-top:20em;text-align:center;">' + msg + '</div>';
  // return '' +
  //   '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
  //   '<td align="center">' +
  //   '<div style="display: table-cell; vertical-align: middle;">' +
  //   '<div style="">' + msg + '</div>' +
  //   '</div>' +
  //   '</td></tr></table>';
};

/**
 * Mesasge for getting a webgl browser
 * @type {string}
 */
var GET_A_WEBGL_BROWSER = '' +
  'This page requires a browser that supports WebGL.<br/>' +
  '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

/**
 * Mesasge for need better hardware
 * @type {string}
 */
var OTHER_PROBLEM = '' +
  "It doesn't appear your computer can support WebGL.<br/>" +
  '<a href="http://get.webgl.org">Click here for more information.</a>';

/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @return {WebGLRenderingContext} The created context.
 */
var setupWebGL = function(
    /** Element */ canvas, 
    /** WebGLContextCreationAttirbutes */ opt_attribs, 
    /** function:(msg) */ opt_onError) {
  function handleCreationError(msg) {
      var container = document.getElementsByTagName("body")[0];
    //var container = canvas.parentNode;
    if (container) {
      var str = window.WebGLRenderingContext ?
           OTHER_PROBLEM :
           GET_A_WEBGL_BROWSER;
      if (msg) {
        str += "<br/><br/>Status: " + msg;
      }
      container.innerHTML = makeFailHTML(str);
    }
  };

  opt_onError = opt_onError || handleCreationError;

  if (canvas.addEventListener) {
    canvas.addEventListener("webglcontextcreationerror", function(event) {
          opt_onError(event.statusMessage);
        }, false);
  }
  var context = create3DContext(canvas, opt_attribs);
  if (!context) {
    if (!window.WebGLRenderingContext) {
      opt_onError("");
    } else {
      opt_onError("");
    }
  }

  return context;
};

/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLContext} The created context.
 */
var create3DContext = function(canvas, opt_attribs) {
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], opt_attribs);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  return context;
}

return {
  create3DContext: create3DContext,
  setupWebGL: setupWebGL
};
}();

/**
 * Provides requestAnimationFrame in a cross browser
 * way.
 */
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
             window.setTimeout(callback, 1000/60);
           };
  })();
}
/** -*- compile-command: "jslint-cli stats.js" -*-
 *
 *  Copyright (C) 2010 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.net>
 *
 */

var Stats = {};


Stats.Stats = function(canvas) {
    this.layers = [];
    this.last_update = undefined;
    this.canvas = canvas;
};

Stats.Stats.prototype = {
    addLayer: function(color, getter) {
        if (color === undefined) {
            color = "rgb(255,255,255)";
        }
        this.layers.push({ 
            previous: 0, 
            color: color,
            getValue: getter
        });
    },

    update: function() {
        
        var t = (new Date()).getTime();
        if (this.last_update === undefined) {
            this.last_update = t;
        }
        var delta = (t - this.last_update)* 2.0*60.0/1000.0;
        if (delta < 1.0) {
            return;
        }

        var translate = delta;
        var c = this.canvas;
        var width = c.width;
        var height = c.height;
        var ctx = c.getContext("2d");
        ctx.save();
        ctx.globalCompositeOperation="copy";
        ctx.mozImageSmoothingEnabled = false;
        ctx.translate(-delta,0);
        ctx.drawImage(c, 0, 0, width, height);
        ctx.restore();
        ctx.clearRect(width - delta, 0, delta, height);

        for (var i = 0, l = this.layers.length; i < l; i++) {
            var layer = this.layers[i];
            var c = this.canvas;
            var value = layer.getValue(t);
            var width = c.width;
            var height = c.height;

            ctx.lineWidth = 1.0;
            ctx.strokeStyle = layer.color;
            ctx.beginPath();
            ctx.moveTo(width - delta, height - layer.previous);
            ctx.lineTo(width, height - value);
            ctx.stroke();
            layer.previous = value;
        }
        this.last_update = t;
    }
};/** -*- compile-command: "jslint-cli Viewer.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */


osgViewer.Viewer = function(canvas, options, error) {
    if (options === undefined) {
        options = {antialias : true};
    }

    gl = WebGLUtils.setupWebGL(canvas, options, error );
    if (gl) {
        this.gl = gl;
        osg.init();
        this.canvas = canvas;
        this.frameRate = 60.0;
        osgUtil.UpdateVisitor = osg.UpdateVisitor;
        osgUtil.CullVisitor = osg.CullVisitor;
        this.urlOptions = true;

        this.mouseWheelEventNode = canvas;
        this.mouseEventNode = canvas;
        this.keyboardEventNode = document;
        if (options) {
            if(options.mouseWheelEventNode){
                this.mouseWheelEventNode = options.mouseWheelEventNode;
            }
            if(options.mouseEventNode){
                this.mouseEventNode = options.mouseEventNode;
            }
            if(options.mouseWheelEventNode){
                this.keyboardEventNode = options.keyboardEventNode;
            }
        }

    } else {
        throw "No WebGL implementation found";
    }
};


osgViewer.Viewer.prototype = {
    getScene: function() { return this.scene; },
    setScene: function(scene) {
        this.root.removeChildren();
        this.root.addChild( scene );
        this.scene = scene;
    },

    init: function() {
        this._done = false;
        this.root = new osg.Node();
        this.state = new osg.State();
        this.view = new osg.View();
        this.view.addChild(this.root);

        var ratio = this.canvas.width/this.canvas.height;
        this.view.setViewport(new osg.Viewport(0,0, this.canvas.width, this.canvas.height));
        this.view.setViewMatrix(osg.Matrix.makeLookAt([0,0,-10], [0,0,0], [0,1,0]));
        this.view.setProjectionMatrix(osg.Matrix.makePerspective(60, ratio, 1.0, 1000.0));

        this.view.light = new osg.Light();
        this.view.getOrCreateStateSet().setAttributeAndMode(new osg.Material());

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);


        this.updateVisitor = new osgUtil.UpdateVisitor();
        this.cullVisitor = new osgUtil.CullVisitor();

        this.renderStage = new osg.RenderStage();
        this.stateGraph = new osg.StateGraph();
        this.renderStage.setViewport(this.view.getViewport());

        if (this.urlOptions) {
            this.parseOptions();
        }
    },

    parseOptions: function() {

        var optionsURL = function() {
            var vars = [], hash;
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for(var i = 0; i < hashes.length; i++)
            {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        };
        
        var options = optionsURL();

        if (options['stats'] === "1" || options['STATS'] === "1" || options['Stats'] === "1" ) {
            this.initStats(options);
        }

        // not the best way to do it
        if (options['DEPTH_TEST'] === "0") {
            gl.disable(gl.DEPTH_TEST);
        }
        if (options['BLEND'] === "0") {
            gl.disable(gl.BLEND);
        }
        if (options['CULL_FACE'] === "0") {
            gl.disable(gl.CULL_FACE);
        }
        if (options['LIGHT'] === "0") {
            delete this.view.light;
        }

         
    },

    initStats: function(options) {

        var maxMS = 50;
        var stepMS = 10;
        var fontsize = 14;

        if (options['statsMaxMS'] !== undefined) {
            maxMS = parseInt(options['statsMaxMS']);
        }
        if (options['statsStepMS'] !== undefined) {
            stepMS = parseInt(options['statsStepMS']);
        }

        var createDomElements = function (elementToAppend) {
            var dom = [
                "<div id='StatsDiv' style='float: left; position: relative; width: 300px; height: 150px; z-index: 10;'>",
                "<div id='StatsLegends' style='position: absolute; left: 0px; font-size: " + fontsize +"px;color: #ffffff;'>",

                "<div id='frameRate' style='color: #00ff00;' > frameRate </div>",
                "<div id='frameTime' style='color: #ffff00;' > frameTime </div>",
                "<div id='updateTime' style='color: #d07b1f;'> updateTime </div>",
                "<div id='cullTime' style='color: #73e0ff;'> cullTime </div>",
                "<div id='drawTime' style='color: #ff0000;'> drawTime </div>",
                "<div id='fps'> </div>",
                
                "</div>",

                "<div id='StatsCanvasDiv' style='position: relative;'>",
                "<canvas id='StatsCanvasGrid' width='300' height='150' style='z-index:-1; position: absolute; background: rgba(14,14,14,0.8); ' ></canvas>",
                "<canvas id='StatsCanvas' width='300' height='150' style='z-index:8; position: absolute;' ></canvas>",
                "<canvas id='StatsCanvasFps' width='30' height='15' style='z-index:9; position: absolute; top: 130px' ></canvas>",
                "</div>",

                "</div>"
            ].join("\n");
            var parent;
            if (elementToAppend === undefined) {
                parent = document.body;
                //elementToAppend = "body";
            } else {
                parent = document.getElementById(elementToAppend);
            }

            //jQuery(dom).appendTo(elementToAppend);
            var mydiv = document.createElement('div');
            mydiv.innerHTML = dom;
            parent.appendChild(mydiv);

            var grid = document.getElementById("StatsCanvasGrid");
            var ctx = grid.getContext("2d");
            ctx.clearRect(0,0,grid.width, grid.height);

            var step = Math.floor(maxMS/stepMS).toFixed(0);
            var r = grid.height/step;
            ctx.strokeStyle = "rgb(70,70,70)";
            for (var i = 0, l = step; i < l; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i*r);
                ctx.lineTo(grid.width, i*r);
                ctx.stroke();
            }

            // setup the font for fps
            var cfps = document.getElementById("StatsCanvasFps");
            var ctx = cfps.getContext("2d");
            ctx.font = "14px Sans";

            return document.getElementById("StatsCanvas");
        };

        if (this.canvasStats === undefined || this.canvasStats === null) {
            this.canvasStats = createDomElements();
        }
        this.stats = new Stats.Stats(this.canvasStats);
        var that = this;
        this.frameRate = 1;
        this.frameTime = 0;
        this.updateTime = 0;
        this.cullTime = 0;
        this.drawTime = 0;
        var height = this.canvasStats.height;
        var ratio = height / maxMS;
        height = height - 2;
        var getStyle = function(el,styleProp)
        {
	    var x = document.getElementById(el);
	    if (x.style) {
		return x.style.getPropertyValue(styleProp);
            }
            return null;
        };
        this.stats.addLayer(getStyle("frameRate","color"), function(t) { 
            var v = (height)/60.0 * (1000/that.frameRate);
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(getStyle("frameTime", "color"), function(t) { 
            var v = that.frameTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(getStyle("updateTime","color"), function(t) { 
            var v = that.updateTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(getStyle("cullTime","color"), function(t) { 
            var v = that.cullTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
        this.stats.addLayer(getStyle("drawTime","color"), function(t) { 
            var v = that.drawTime * ratio;
            if (v > height) {
                return height;
            }
            return v;} );
    },

    update: function() {
        this.view.accept(this.updateVisitor);
    },
    cull: function() {
        this.stateGraph.clean();
        this.renderStage.reset();

        this.cullVisitor.reset();
        this.cullVisitor.setStateGraph(this.stateGraph);
        this.cullVisitor.setRenderStage(this.renderStage);

        //this.renderStage.setViewport(this.view.getClearDepth());
        this.renderStage.setClearDepth(this.view.getClearDepth());
        this.renderStage.setClearColor(this.view.getClearColor());
        this.renderStage.setClearMask(this.view.getClearMask());

        this.view.accept(this.cullVisitor);
    },
    draw: function() {
        this.renderStage.draw(this.state);

        // noticed that we accumulate lot of stack, maybe because of the stateGraph
        this.state.popAllStateSets();
        // should not be necessary because of dirty flag now in attrubutes
        //this.state.applyWithoutProgram();
    },

    frame: function() {
        var frameTime, beginFrameTime;
        frameTime = (new Date()).getTime();
        if (this.lastFrameTime === undefined) {
            this.lastFrameTime = 0;
        }
        this.frameRate = frameTime - this.lastFrameTime;
        this.lastFrameTime = frameTime;
        beginFrameTime = frameTime;

        if (this.updateVisitor.getFrameStamp().getFrameNumber() === 0) {
            this.updateVisitor.getFrameStamp().setReferenceTime(frameTime/1000.0);
            this.numberFrame = 0;
        }

        this.updateVisitor.getFrameStamp().setSimulationTime(frameTime/1000.0 - this.updateVisitor.getFrameStamp().getReferenceTime());

        if (this.manipulator) {
            this.view.setViewMatrix(this.manipulator.getInverseMatrix());
        }

        // time the update
        var updateTime = (new Date()).getTime();
        this.update();

        var cullTime = (new Date()).getTime();
        updateTime = cullTime - updateTime;
        this.updateTime = updateTime;

        this.cull();
        var drawTime = (new Date()).getTime();
        cullTime = drawTime - cullTime;
        this.cullTime = cullTime;

        this.draw();
        drawTime = (new Date()).getTime() - drawTime;
        this.drawTime = drawTime;

        var f = this.updateVisitor.getFrameStamp().getFrameNumber()+1;
        this.updateVisitor.getFrameStamp().setFrameNumber(f);

        this.numberFrame++;
        var endFrameTime = (new Date()).getTime();

        this.frameTime = (new Date()).getTime() - beginFrameTime;
        if (this.stats !== undefined) {
            this.stats.update();

            if (this.numberFrame % 60 === 0.0) {
                var nd = endFrameTime;
                var diff = nd - this.statsStartTime;
                var fps = (this.numberFrame*1000/diff).toFixed(1);
                this.statsStartTime = nd;
                this.numberFrame = 0;

                var cfps = document.getElementById("StatsCanvasFps");
                var ctx = cfps.getContext("2d");
                ctx.clearRect(0,0,cfps.width, cfps.height);
                ctx.fillStyle = "rgb(255,255,255)";
                ctx.fillText(fps, 0, cfps.height);
            }
        }
    },

    setDone: function() { this._done = true; },
    done: function() { return this._done; },

    run: function() {
        var that = this;
        var render = function() {
            if (!that.done()) {
                window.requestAnimationFrame(render, that.canvas);
                that.frame();
            }
        };
        render();
    },

    getManipulator: function() { return this.manipulator; },
    setupManipulator: function(manipulator, dontBindDefaultEvent) {
        if (manipulator === undefined) {
            manipulator = new osgGA.OrbitManipulator();
        }

        if (manipulator.setNode !== undefined) {
            manipulator.setNode(this.root);
        } else {
            // for backward compatibility
            manipulator.view = this.view;
        }

        this.manipulator = manipulator;

        var that = this;
        var viewer = this;
	var fixEvent = function( event ) {

	    //if ( event[ expando ] ) {
		//return event;
	    //}

	    // store a copy of the original event object
	    // and "clone" to set read-only properties

            // nop
	    //var originalEvent = event;
	    //event = jQuery.Event( originalEvent );

	    for ( var i = this.props.length, prop; i; ) {
		prop = this.props[ --i ];
		event[ prop ] = originalEvent[ prop ];
	    }

	    // Fix target property, if necessary
	    if ( !event.target ) {
		event.target = event.srcElement || document; // Fixes #1925 where srcElement might not be defined either
	    }

	    // check if target is a textnode (safari)
	    if ( event.target.nodeType === 3 ) {
		event.target = event.target.parentNode;
	    }

	    // Add relatedTarget, if necessary
	    if ( !event.relatedTarget && event.fromElement ) {
		event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
	    }

	    // Calculate pageX/Y if missing and clientX/Y available
	    if ( event.pageX == null && event.clientX != null ) {
		var doc = document.documentElement, body = document.body;
		event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
		event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
	    }

	    // Add which for key events
	    if ( !event.which && ((event.charCode || event.charCode === 0) ? event.charCode : event.keyCode) ) {
		event.which = event.charCode || event.keyCode;
	    }

	    // Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
	    if ( !event.metaKey && event.ctrlKey ) {
		event.metaKey = event.ctrlKey;
	    }

	    // Add which for click: 1 === left; 2 === middle; 3 === right
	    // Note: button is not normalized, so don't use it
	    if ( !event.which && event.button !== undefined ) {
		event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));
	    }

	    return event;
	};

        this.manipulator.convertEventToCanvas = function(e) {
            var myObject = that.canvas;
            var posx,posy;
	    if (e.pageX || e.pageY) {
	        posx = e.pageX;
	        posy = e.pageY;
	    }
	    else if (e.clientX || e.clientY) {
	        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
	        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	    }

            var divGlobalOffset = function(obj) {
                var x=0, y=0;
                x = obj.offsetLeft;
                y = obj.offsetTop;
                var body = document.getElementsByTagName('body')[0];
                while (obj.offsetParent && obj!=body){
                    x += obj.offsetParent.offsetLeft;
                    y += obj.offsetParent.offsetTop;
                    obj = obj.offsetParent;
                }
                return [x,y];
            };
	    // posx and posy contain the mouse position relative to the document
	    // Do something with this information
            var globalOffset = divGlobalOffset(myObject);
            posx = posx - globalOffset[0];
            posy = myObject.height-(posy - globalOffset[1]);
            return [posx,posy];
        };

        if (dontBindDefaultEvent === undefined || dontBindDefaultEvent === false) {

            var disableMouse = false;

            var touchStart = function(ev)
            {
                disableMouse = true;
                return viewer.getManipulator().touchStart(ev);
            };
            var touchEnd = function(ev)
            {
                disableMouse = true;
                return viewer.getManipulator().touchEnd(ev);
            };
            var touchMove = function(ev)
            {
                disableMouse = true;
                return viewer.getManipulator().touchMove(ev);
            };

            // touch events
            this.canvas.addEventListener("touchstart", touchStart, false);
            this.canvas.addEventListener("touchend", touchEnd, false);
            this.canvas.addEventListener("touchmove", touchMove, false);

            // mouse
            var mousedown = function (ev) 
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().mousedown(ev);
                }
            };
            var mouseup = function (ev) 
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().mouseup(ev);
                }
            };
            var mousemove = function (ev) 
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().mousemove(ev);
                }
            };
            var dblclick = function (ev) 
            {
                if (disableMouse === false) {
                    return viewer.getManipulator().dblclick(ev);
                }
            };
            var mousewheel = function (event) 
            {
                if (disableMouse === false) {
                    // from jquery
                    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
                    //event = $.event.fix(orgEvent);
                    event.type = "mousewheel";
                    
                    // Old school scrollwheel delta
                    if ( event.wheelDelta ) { delta = event.wheelDelta/120; }
                    if ( event.detail     ) { delta = -event.detail/3; }
                    
                    // New school multidimensional scroll (touchpads) deltas
                    deltaY = delta;
                    
                    // Gecko
                    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
                        deltaY = 0;
                        deltaX = -1*delta;
                    }
                    
                    // Webkit
                    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
                    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
                    // Add event and delta to the front of the arguments
                    args.unshift(event, delta, deltaX, deltaY);
                    var m = viewer.getManipulator();
                    return m.mousewheel.apply(m, args);
                }
            };

            if (viewer.getManipulator().mousedown) {
                this.mouseEventNode.addEventListener("mousedown", mousedown, false);
            }
            if (viewer.getManipulator().mouseup) {
                this.mouseEventNode.addEventListener("mouseup", mouseup, false);
            }
            if (viewer.getManipulator().mousemove) {
                this.mouseEventNode.addEventListener("mousemove", mousemove, false);
            }
            if (viewer.getManipulator().dblclick) {
                this.mouseEventNode.addEventListener("dblclick", dblclick, false);
            }
            if (viewer.getManipulator().mousewheel) {
                this.mouseWheelEventNode.addEventListener("DOMMouseScroll", mousewheel, false);
                this.mouseWheelEventNode.addEventListener("mousewheel", mousewheel, false);
            }

            var keydown = function(ev) {return viewer.getManipulator().keydown(ev); };
            var keyup = function(ev) {return viewer.getManipulator().keyup(ev);};

            if (viewer.getManipulator().keydown) {
                this.keyboardEventNode.addEventListener("keydown", keydown, false);
            }
            if (viewer.getManipulator().keyup) {
                this.keyboardEventNode.addEventListener("keyup", keyup, false);
            }
        }
    }
};
/** -*- compile-command: "jslint-cli osgGA.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

osgGA = {};
/** -*- compile-command: "jslint-cli OrbitManipulator.js" -*-
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */
osgGA.OrbitManipulatorMode = {
    Rotate: 0,
    Pan: 1,
    Zoom: 2
};

/** 
 *  OrbitManipulator
 *  @class
 */
osgGA.OrbitManipulator = function () {
    this.init();
};

/** @lends osgGA.OrbitManipulator.prototype */
osgGA.OrbitManipulator.prototype = {
    init: function() {
        this.distance = 25;
        this.target = [ 0,0, 0];
        this.eye = [ 0, this.distance, 0];
        this.rotation = osg.Matrix.mult(osg.Matrix.makeRotate( Math.PI, 0,0,1), osg.Matrix.makeRotate( -Math.PI/10.0, 1,0,0), []); // osg.Quat.makeIdentity();
        this.up = [0, 0, 1];
        this.time = 0.0;
        this.dx = 0.0;
        this.dy = 0.0;
        this.buttonup = true;
        this.scale = 1.0;
        this.targetDistance = this.distance;
        this.currentMode = osgGA.OrbitManipulatorMode.Rotate;
        this.maxDistance = 0;
        this.minDistance = 0;
    },
    reset: function() {
        this.init();
    },
    setNode: function(node) {
        this.node = node;
    },
    setTarget: function(target) {
        osg.Vec3.copy(target, this.target);
    },
    computeHomePosition: function() {
        if (this.node !== undefined) {
            var bs = this.node.getBound();
            this.setDistance(bs.radius()*1.5);
            this.setTarget(bs.center());
        }
    },

    /**
       Method called when a keydown event is triggered
        @type KeyEvent
     */
    keydown: function(ev) {
        if (ev.keyCode === 32) {
            this.computeHomePosition();
        } else if (ev.keyCode === 33) { // pageup
            this.distanceIncrease();
            return false;
        } else if (ev.keyCode === 34) { //pagedown
            this.distanceDecrease();
            return false;
        }
    },
    /**
       Method called when a keyup event is triggered
       @type KeyEvent
     */
    keyup: function(ev) {
    },
    mouseup: function(ev) {
        this.dragging = false;
        this.panning = false;
        this.releaseButton(ev);
    },
    mousedown: function(ev) {
        this.panning = true;
        this.dragging = true;
        var pos = this.convertEventToCanvas(ev);
        this.clientX = pos[0];
        this.clientY = pos[1];
        this.pushButton(ev);
        ev.preventDefault();
    },
    mousemove: function(ev) {
        if (this.buttonup === true) {
            return;
        }
        var scaleFactor;
        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.convertEventToCanvas(ev);
        curX = pos[0];
        curY = pos[1];

        scaleFactor = 10.0;
        deltaX = (this.clientX - curX) / scaleFactor;
        deltaY = (this.clientY - curY) / scaleFactor;
        this.clientX = curX;
        this.clientY = curY;

        this.update(deltaX, deltaY);
        return false;
    },
    dblclick: function(ev) {
    },
    touchDown: function(ev) {
    },
    touchUp: function(ev) {
    },
    touchMove: function(ev) {
    },
    setMaxDistance: function(d) {
        this.maxDistance =  d;
    },
    setMinDistance: function(d) {
        this.minDistance =  d;
    },
    setDistance: function(d) {
        this.distance = d;
        this.targetDistance = d;
    },

    panModel: function(dx, dy) {
        var inv = osg.Matrix.inverse(this.rotation);
        var x = [ osg.Matrix.get(inv, 0,0), osg.Matrix.get(inv, 0,1), 0 ];
        osg.Vec3.normalize(x, x);
        var y = [ osg.Matrix.get(inv, 1,0), osg.Matrix.get(inv, 1,1), 0 ];
        osg.Vec3.normalize(y, y);

        osg.Vec3.add(this.target, osg.Vec3.mult(x, -dx), this.target);
        osg.Vec3.add(this.target, osg.Vec3.mult(y, -dy), this.target);
    },

    zoomModel: function(dx, dy) {
        this.distance += dy;
    },

    computeRotation: function(dx, dy) {
        var of = osg.Matrix.makeRotate(dx / 10.0, 0,0,1);
        var r = osg.Matrix.mult(this.rotation, of, []);

        of = osg.Matrix.makeRotate(dy / 10.0, 1,0,0);
        var r2 = osg.Matrix.mult(of, r, []);

        // test that the eye is not too up and not too down to not kill
        // the rotation matrix
        var eye = osg.Matrix.transformVec3(osg.Matrix.inverse(r2), [0, this.distance, 0]);

        var dir = osg.Vec3.neg(eye, []);
        osg.Vec3.normalize(dir, dir);

        var p = osg.Vec3.dot(dir, [0,0,1]);
        if (Math.abs(p) > 0.95) {
            //discard rotation on y
            this.rotation = r;
            return;
        }

        // if (Math.abs(p) > 0.9) {
        //     var plane = [ dir[0] , dir[1], 0 ];
        //     osg.Vec3.normalize(plane, plane);

        //     var diff = Math.abs(p) - 0.9;
        //     r2  = osg.Matrix.mult(r2, osg.Matrix.makeRotate( diff , plane[0], plane[1], 0));
        //     osg.log("adjust rotation" + diff + " axis " + plane);
        // }

        this.rotation = r2;
    },

    update: function(dx, dy) {
        this.dx = dx;
        this.dy = dy;

        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            this.time = (new Date()).getTime();
        }
    },

    updateWithDelay: function() {
        var f = 1.0;
        var dt;
        var max = 2.0;
        var dx = this.dx;
        var dy = this.dy;
        if (this.buttonup) {
            f = 0.0;
            dt = ((new Date()).getTime() - this.time)/1000.0;
            if (dt < max) {
                f = 1.0 - osgAnimation.EaseOutQuad(dt/max);
            }
            dx *= f;
            dy *= f;
        } else {
            this.dx = 0;
            this.dy = 0;
        }

        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            if (this.currentMode === osgGA.OrbitManipulatorMode.Pan) {
                this.panModel(dx/this.scale, dy/this.scale);
            } else if ( this.currentMode === osgGA.OrbitManipulatorMode.Rotate) {
                this.computeRotation(dx, dy);
            } else if ( this.currentMode === osgGA.OrbitManipulatorMode.Zoom) {
                this.zoomModel(dx, dy);
            }
        }
    },
    releaseButton: function() {
        this.buttonup = true;
    },

    changeScale: function(d) {
        var curd = this.distance;
        var scaleChange = this.scale/d;
        this.scale = d;
        this.distance = this.targetDistance;
        this.targetDistance = this.distance * scaleChange;
        this.timeMotion = (new Date()).getTime();
    },
    mousewheel: function(ev, intDelta, deltaX, deltaY) {
	if (intDelta > 0){
            if (this.distanceDecrease) {
                this.distanceDecrease();
            }
	}
	else if (intDelta < 0){
            if (this.distanceIncrease) {
                this.distanceIncrease();
            }
	}
    },
    distanceIncrease: function() {
        var h = this.distance;
        var currentTarget = this.targetDistance;
        var newTarget = currentTarget + h/10.0;
        if (this.maxDistance > 0) {
            if (newTarget > this.maxDistance) {
                newTarget = this.maxDistance;
            }
        }
        this.distance = currentTarget;
        this.targetDistance = newTarget;
        this.timeMotion = (new Date()).getTime();
    },
    distanceDecrease: function() {
        var h = this.distance;
        var currentTarget = this.targetDistance;
        var newTarget = currentTarget - h/10.0;
        if (this.minDistance > 0) {
            if (newTarget < this.minDistance) {
                newTarget = this.minDistance;
            }
        }
        this.distance = currentTarget;
        this.targetDistance = newTarget;
        this.timeMotion = (new Date()).getTime();
    },

    pushButton: function() {
        this.dx = this.dy = 0;
        this.buttonup = false;
    },
    getInverseMatrix: function () {
        this.updateWithDelay();

        var target = this.target;
        var distance = this.distance;

        if (this.timeMotion !== undefined) { // we have a camera motion event
            var dt = ((new Date()).getTime() - this.timeMotion)/1000.0;
            var motionDuration = 1.0;
            if (dt < motionDuration) {
                var r = osgAnimation.EaseOutQuad(dt/motionDuration);
                if (this.targetMotion) {
                    target = osg.Vec3.add(this.target, osg.Vec3.mult(osg.Vec3.sub(this.targetMotion, this.target), r));
                }
                if (this.targetDistance) {
                    distance = this.distance + (this.targetDistance - this.distance) * r;
                }
            } else {
                if (this.targetMotion) {
                    this.target = this.targetMotion;
                    target = this.targetMotion;
                }
                if (this.targetDistance) {
                    this.distance = this.targetDistance;
                    distance = this.targetDistance;
                }
                this.timeMotion = undefined;
            }
        }
        
        var inv = [];
        var eye = [];
        osg.Matrix.inverse(this.rotation, inv);
        osg.Matrix.transformVec3(inv,
                                 [0, distance, 0],
                                 eye );

        osg.Matrix.makeLookAt(osg.Vec3.add(target, eye, eye),
                              target,
                              [0,0,1], 
                              inv);
        return inv;
    }
};

/** -*- compile-command: "jslint-cli FirstPersonManipulator.js" -*-
 * Authors:
 *  Matt Fontaine <tehqin@gmail.com>
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 */

osgGA.FirstPersonManipulator = function () {
    this.init();
};

osgGA.FirstPersonManipulator.prototype = {
    setNode: function(node) {
        this.node = node;
    },
    computeHomePosition: function() {
        if (this.node) {
            var bs = this.node.getBound();
            this.eye = [ 0, -bs.radius()*1.5, 0 ];
        }
    },
    init: function()
    {
        this.direction = [0.0, 1.0, 0.0];
        this.angleVertical = 0.0;
        this.angleHorizontal = 0.0;
        this.eye = [0, 25.0, 10.0];
        this.up = [0, 0, 1];
        this.time = 0.0;
        this.buttonup = true;
    },
    reset: function()
    {
        this.init();
    },
    mouseup: function(ev)
    {
        this.dragging = false;
        this.releaseButton(ev);
    },
    mousedown: function(ev)
    {
        this.dragging = true;
        var pos = this.convertEventToCanvas(ev);
        this.clientX = pos[0];
        this.clientY = pos[1];
        this.pushButton(ev);
    },
    mousemove: function(ev)
    {
        if (this.buttonup === true) { return; }

        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.convertEventToCanvas(ev);

        curX = pos[0];
        curY = pos[1];
        deltaX = this.clientX - curX;
        deltaY = this.clientY - curY;
        this.clientX = curX;
        this.clientY = curY;

        this.update(deltaX, deltaY);
        this.computeRotation(this.dx, this.dy);
    },
    dblclick: function(ev)
    {
    },
    touchdown: function(ev)
    {
    },
    touchup: function(ev)
    {
    },
    touchmove: function(ev)
    {
    },
    pushButton: function(ev)
    {
        this.dx = this.dy = 0;
        this.buttonup = false;
    },
    computeRotation: function(dx, dy)
    {
        this.angleVertical += dy*0.01;
        this.angleHorizontal -= dx*0.01;

        var first = osg.Matrix.makeRotate(this.angleVertical, 1, 0, 0);
        var second = osg.Matrix.makeRotate(this.angleHorizontal, 0, 0, 1);
        var rotMat = osg.Matrix.mult(second, first, []);

        this.direction = osg.Matrix.transformVec3(rotMat, [0, 1, 0], []);
        this.up = osg.Matrix.transformVec3(rotMat, [0, 0, 1], [] );
    },
    update: function(dx, dy)
    {
        this.dx = dx;
        this.dy = dy;
        if (Math.abs(dx) + Math.abs(dy) > 0.0) {
            this.time = (new Date()).getTime();
        }
    },
    releaseButton: function()
    {
        this.buttonup = true;
    },
    getInverseMatrix: function()
    {
        var target = osg.Vec3.add(this.eye, this.direction, []);
        return osg.Matrix.makeLookAt(this.eye, target, this.up, []);
    },
    moveForward: function(distance)
    {
        var d = osg.Vec3.mult(osg.Vec3.normalize(this.direction, []), distance, []);
        this.eye = osg.Vec3.add(this.eye, d, []);
    },
    strafe: function(distance)
    {
        var cx = osg.Vec3.cross(this.direction, this.up, []);
        var d = osg.Vec3.mult(osg.Vec3.normalize(cx,cx), distance, []);
        this.eye = osg.Vec3.add(this.eye, d, []);
    },
    
    keydown: function(event) {
        if (event.keyCode === 32) {
            this.computeHomePosition();
        } else if (event.keyCode == 87){ // W
            this.moveForward(5.0);
            return false;
        }
        else if (event.keyCode == 83){ // S
            this.moveForward(-5.0);
            return false;
        }
        else if (event.keyCode == 68){ // D
            this.strafe(5.0);
            return false;
        }
        else if (event.keyCode == 65){ // A
            this.strafe(-5.0);
            return false;
        }
    }
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
* Extra functionality added to osgjs
*/

//........................................................................
osg.Matrix.equals = function(a,b) {
  if (a == b) return true;
  
  if (a.length != b.length) return false;
  
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

// OSG extensions ...
// eventually submit all this stuff to osgjs:

// osgjs's Quat.mult backwards?
osg.Quat.multiply = function(a, b, r) {
    if (r === undefined) {
        r = [];
    }
    return osg.Quat.mult(b, a, r);
};

osg.Quat.zeroRotation = function(q) {
    return q[0] === 0 && q[1] === 0 && q[2] === 0 && q[3] === 1;
};

osg.Quat.transformVec3 = function(q, v) {
    var uv = [];
    var uuv = [];
    var qvec = [q[0], q[1], q[2]];
    osg.Vec3.cross(qvec, v, uv);
    osg.Vec3.cross(qvec, uv, uuv);
    osg.Vec3.mult(uv, 2.0 * q[3], uv);
    osg.Vec3.mult(uuv, 2.0, uuv);
    return osg.Vec3.add(v, osg.Vec3.add(uv, uuv, []), []);
};

osg.Quat.rotateVecOnToVec = function(from, to, r) {
    if (r === undefined) {
        r = [];
    }

    var sourceVector = osg.Vec3.copy(from, []);
    var targetVector = osg.Vec3.copy(to, []);

    var fromLen2 = osg.Vec3.length2(from);
    var fromLen = 0;
    if (fromLen2 < 1 - 1e-7 || fromLen2 > 1 + 1e-7) {
        fromLen = Math.sqrt(fromLen2);
        sourceVector = osg.Vec3.mult(sourceVector, 1.0 / fromLen, []);
    }

    var toLen2 = osg.Vec3.length2(to);
    if (toLen2 < 1 - 1e-7 || toLen2 > 1 + 1e-7) {
        var toLen = 0;
        if (toLen2 > fromLen2 - 1e-7 && toLen2 < fromLen2 + 1e-7) {
            toLen = fromLen;
        }
        else {
            toLen = Math.sqrt(toLen2);
        }
        targetVector = osg.Vec3.mult(targetVector, 1.0 / toLen, []);
    }

    var dotProdPlus1 = 1.0 + osg.Vec3.dot(sourceVector, targetVector);

    if (dotProdPlus1 < 1e-7) {
        var norm;
        if (Math.abs(sourceVector[0]) < 0.6) {
            norm = Math.sqrt(1.0 - sourceVector[0] * sourceVector[0]);
            r[0] = 0.0;
            r[1] = sourceVector[2] / norm;
            r[2] = -sourceVector[1] / norm;
            r[3] = 0.0;
        }
        else if (Math.abs(sourceVector[1]) < 0.6) {
            norm = Math.sqrt(1.0 - sourceVector[1] * sourceVector[1]);
            r[0] = -sourceVector[2] / norm;
            r[1] = 0.0;
            r[2] = sourceVector[0] / norm;
            r[3] = 0.0;
        }
        else {
            norm = Math.sqrt(1.0 - sourceVector[2] * sourceVector[2]);
            r[0] = sourceVector[1] / norm;
            r[1] = -sourceVector[0] / norm;
            r[2] = 0.0;
            r[3] = 0.0;
        }
    }

    else {
        // Find the shortest angle quaternion that transforms normalized vectors
        // into one other. Formula is still valid when vectors are colinear
        var s = Math.sqrt(0.5 * dotProdPlus1);
        var tmp = osg.Vec3.cross(sourceVector, osg.Vec3.mult(targetVector, 1.0 / (2.0 * s)), []);
        r[0] = tmp[0];
        r[1] = tmp[1];
        r[2] = tmp[2];
        r[3] = s;
    }

    return r;
};

osg.StateSet.removeUniform = function(stateSet, name) {
    delete stateSet.uniforms[name];
    var index = stateSet.uniforms.uniformKeys.indexOf(name);
    if (index !== -1) {
        delete stateSet.uniforms.uniformKeys[index];
        stateSet.uniforms.uniformKeys.splice(index, 1);
    }
};

osg.BufferArray.destroy = function(ba) {
    if (ba !== undefined && ba !== null) {
        if (ba.buffer !== undefined && ba.buffer !== null) {
            gl.deleteBuffer(ba.buffer);
        }
    }
};

osg.Geometry.destroy = function(geom) {
    if (geom !== undefined && geom !== null) {
        var i;
        for (i in geom.attributes) {
            osg.BufferArray.destroy(geom.attributes[i]);
        }
        for (i in geom.primitives) {
            var prim = geom.primitives[i];
            if (prim !== undefined && prim !== null) {
                if (prim.indices !== undefined && prim.indices !== null) {
                    osg.BufferArray.destroy(prim.indicies);
                }
            }
        }
    }
};

osg.Texture.destroy = function(tex) {
    if (tex !== undefined && tex !== null) {
        if (tex.textureObject !== null) {
            gl.deleteTexture(tex.textureObject);
            tex.textureObject = null;
            tex.image = undefined;
        }
    }
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

var osgearth = {};

osgearth.copyright = '(c) Copyright 2011 Pelican Mapping - http://pelicanmapping.com';
osgearth.instance = 0;
osgearth.version = '0.0.1';
osgearth.log = function(str) {
    if (window.console !== undefined) {
        window.console.log(str);
    } else {
        jQuery("#debug").append(str + "<br>");
    }
};

osgearth.ProxyHost = "proxy.php?url=";

//Makes a URL prepended by the ProxyHost if it's set
osgearth.getURL = function(url) {
    if (osgearth.ProxyHost !== null && window.document.URL.indexOf("file:") === 0) {
        osgearth.ProxyHost = null;
    }
    if (osgearth.ProxyHost !== undefined && osgearth.ProxyHost !== null) {
        url = osgearth.ProxyHost + encodeURIComponent(url);
    }
    return url;
};

/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.FunctionLocation = {
    VertexPreTexture: 0,
    VertexPreLighting: 1,
    VertexPostLighting: 2,
    FragmentPreTexture: 3,
    FragmentPreLighting: 4,
    FragmentPostLighting: 5
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.ShaderFactory = {};

osgearth.ShaderFactory.createVertexShaderMain = function(functions) {
    return [
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        // todo: insert functions here
        "attribute vec3 Vertex;",
        "attribute vec4 Color;",
        "attribute vec3 Normal;",
        "attribute vec3 Elevation;",
        "uniform int ArrayColorEnabled;",
        "uniform mat4 ModelViewMatrix;",
        "uniform mat4 ProjectionMatrix;",
        "uniform mat4 NormalMatrix;",
        "uniform int osgearth_LightingEnabled;",
        "uniform float VerticalScale;",
        "varying vec4 VertexColor;",
        "void osgearth_vert_setupTexturing(void);",
        //todo: insert all function prototypes
        "",
        "void main() {",
        "    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex + VerticalScale*Elevation, 1.0);",
        "    if (ArrayColorEnabled == 1)",
        "        VertexColor = Color;",
        "    else",
        "        VertexColor = vec4(1.0,1.0,1.0,1.0);",
        "",
        //todo: call VertexPreTexture functions here
        "    osgearth_vert_setupTexturing();",
        //todo: call VertexPreLighting functions here
        //"    if (osgearth_LightingEnabled == 1)";
        //"        osgearth_vert_setupLighting();",
        //todo: call VertexPostLighting functions here
        "}"
    ].join('\n');
};

osgearth.ShaderFactory.createFragmentShaderMain = function(functions) {
    return [
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "varying vec4 VertexColor;",
        "uniform int osgearth_LightingEnabled;",
        "void osgearth_frag_applyTexturing(inout vec4 color);",
        //todo: insert all function prototypes
        "",
        "void main(void) {",
        "    vec4 color = VertexColor;",
        //todo call FragmentPreTexture functions
        "    osgearth_frag_applyTexturing(color);",
        //todo call FragmentPreLighting functions
        //"    if (osgearth_LightingEnabled == 1)",
        //"        osgearth_frag_applyLighting(color);",
        //todo call FragmentPostLighting functions
        "    gl_FragColor = color;",
        "}"
    ].join('\n');
};

osgearth.ShaderFactory.createVertexSetupTexturing = function(imageLayers) {
    var buf = "";
    var unit;

    for (unit = 0; unit < imageLayers.length; ++unit) {
        buf += "attribute vec2 TexCoord" + unit + ";\n";
        buf += "uniform mat4 TexMat" + unit + ";\n";
        buf += "varying vec2 FragTexCoord" + unit + ";\n";
    }

    buf += "void osgearth_vert_setupTexturing(void) { \n";

    for (unit = 0; unit < imageLayers.length; unit++) {
        buf += "    FragTexCoord" + unit + " = (TexMat" + unit + " * vec4(TexCoord" + unit + ",0,1)).xy;\n";
    }
    buf += "}\n";

    return buf;
};

osgearth.ShaderFactory.createFragmentApplyTexturing = function(imageLayers) {
    var buf = "";
    var unit;

    for (unit = 0; unit < imageLayers.length; ++unit) {
        buf += "varying vec2 FragTexCoord" + unit + ";\n";
        buf += "uniform sampler2D Texture" + unit + ";\n";
        buf += "uniform bool Texture" + unit + "Visible;\n";
        buf += "uniform float Texture" + unit + "Opacity;\n";
    }

    buf += "void osgearth_frag_applyTexturing(inout vec4 color) {\n";
    buf += "    vec4 texel;\n";

    for (unit = 0; unit < imageLayers.length; ++unit) {
        buf += "    if (Texture" + unit + "Visible) { \n";
        buf += "        texel = texture2D(Texture" + unit + ", FragTexCoord" + unit + ".xy );\n";
        buf += "        color = vec4( mix( color.rgb, texel.rgb, texel.a * Texture" + unit + "Opacity), 1);\n";
        buf += "    } \n";
    }

    buf += "}\n";

    return buf;
};


/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.VirtualProgram = function() {
    osg.Program.call(this);

    this.virtualProgramMarker = true;

    // shaders, keyed by a "sematic" string: name + gl shader type
    this.shaderMap = {};

    // key is FunctionLocation; value is array of sematics
    this.funcSemanticsByLocation = {};

    // object, each key is a FunctionLocation, each value is an array of shader sematics
    this.accumulatedFuncSemanticsByLocation = {};

    // cached programs, key = accumalted attribute semantic string
    this.programCache = {};

    this.vertex = {};
    this.fragment = {};

    this._dirty = true;

    // install the base shaders
    this.refreshMains();
};

osgearth.VirtualProgram.prototype = osg.objectInehrit(osg.Program.prototype, {

    isVirtualProgram: function(obj) {
        return true;
    },

    cloneType: function() {
        return new osgearth.VirtualProgram();
    },

    setShader: function(name, type, shaderSource) {
        this.shaderMap[name + ";" + type] = shaderSource;
        this._dirty = true;
    },

    // injects a GLSL function at the specified location
    setFunction: function(name, source, location, priority) {
        if (this.semanticsByLocation[location] === undefined)
            this.semanticsByLocation[location] = [];
        var type = (location <= 2) ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
        var semantic = name + ';' + type;
        this.setShader(semantic, source);
        this.funcSemanticsByLocation[location].push(semantic); //todo: insert sorted by priority
        this._dirty = true;
    },

    // rebuilds the main shader functions.
    refreshMains: function() {
        this.setShader(
            "osgearth_vert_main",
            gl.VERTEX_SHADER,
            osgearth.ShaderFactory.createVertexShaderMain(this.accumulatedFunctions));

        this.setShader(
            "osgearth_frag_main",
            gl.FRAGMENT_SHADER,
            osgearth.ShaderFactory.createFragmentShaderMain(this.accumulatedFunctions));
    },

    apply: function(state) {
        // pull the stack of "Program" attributes
        var attributeStack = state.attributeMap[this.attributeType];
        if (attributeStack === undefined) {
            return;
        }

        // constructs a string that uniquely identifies this accumulated shader program.
        // it is a concatenation of all shader semantics in the current attribute stack.
        var accumulatedSemantic = "";

        for (var i = 0; i < attributeStack.length; ++i) {
            var p = attributeStack[i];
            if (this.isVirtualProgram(p)) {
                for (var semantic in p.shaderMap) {
                    accumulatedSemantic += semantic;
                }
            }
        }

        // add this VP's shaders to the identifier:
        for (var semantic in this.shaderMap) {
            accumulatedSemantic += semantic;
        }

        // see if our gl program is already in the cache:
        this.program = this.programCache[accumulatedSemantic];

        // if not, build and compile it
        if (this.program === undefined) {

            // check for new user functions
            this.refreshAccumulatedFunctions(state);

            // rebuild the shaders
            this.refreshMains();

            // rebulid the shader list:
            var vertShaderSource = "";
            var fragShaderSource = "";

            for (var semantic in this.shaderMap) {
                var type = parseInt(semantic.split(';')[1]);
                if (type === gl.VERTEX_SHADER) {
                    vertShaderSource += this.shaderMap[semantic] + '\n';
                }
                else { // if ( semantic.type === gl.FRAGMENT_SHADER )
                    fragShaderSource += this.shaderMap[semantic] + '\n';
                }
            }

            this.vertex = new osg.Shader(gl.VERTEX_SHADER, vertShaderSource);
            this.vertex.compile();

            this.fragment = new osg.Shader(gl.FRAGMENT_SHADER, fragShaderSource);
            this.fragment.compile();

            this.program = gl.createProgram();

            gl.attachShader(this.program, this.vertex.shader);
            gl.attachShader(this.program, this.fragment.shader);
            gl.linkProgram(this.program);
            gl.validateProgram(this.program);

            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                osg.log("can't link program\n" + "vertex shader:\n" + this.vertex.text + "\n fragment shader:\n" + this.fragment.text);
                osg.log(gl.getProgramInfoLog(this.program));
                debugger;
            }

            this.uniformsCache = {};
            this.uniformsCache.uniformKeys = [];
            this.attributesCache = {};
            this.attributesCache.attributeKeys = [];

            this.cacheUniformList(this.vertex.text);
            this.cacheUniformList(this.fragment.text);
            //osg.log(this.uniformsCache);

            this.cacheAttributeList(this.vertex.text);

            // cache this gl program.
            this.programCache[accumulatedSemantic] = this.program;

            osg.log(vertShaderSource);
            osg.log(fragShaderSource);
        }

        gl.useProgram(this.program);
    },

    refreshAccumulatedFunctions: function(state) {
        // stack of all VirtualProgram attributes:
        var attributeStack = state.attributeMap[this.attributeType];
        if (attributeStack === undefined || attributeStack.length == 0) {
            return;
        }

        // accumulate all the user functions from all the VPs into a single list:
        this.accumulatedFunctions = {};

        for (var i = 0; i < attributeStack.length; ++i) {
            var vp = attributeStack[i];
            if (this.isVirtualProgram(vp)) {
                for (var location in vp.funcSemanticsByLocation) {
                    if (this.accumulatedFuncSemanticsByLocation[location] === undefined)
                        this.accumulatedFuncSemanticsByLocation[location] = {};

                    var semantics = vp.funcSemanticsByLocation[location];
                    for (var j = 0; j < semantics.length; ++j) {
                        var semantic = semantics[j].split(';')[0];
                        this.accumulatedFuncSemanticsByLocation[location][semantic] = semantic;
                    }
                }
            }
        }
    }
});
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.Extent = {
    width: function(extent) {
        return extent.xmax - extent.xmin;
    },
    height: function(extent) {
        return extent.ymax - extent.ymin;
    },
    center: function(extent) {
        return [(extent.xmin + extent.xmax) / 2, (extent.ymin + extent.ymax) / 2];
    },
    clamp: function(extent, vec2) {
        vec2[0] = Math.clamp(vec2[0], extent.xmin, extent.xmax);
        vec2[1] = Math.clamp(vec2[1], extent.ymin, extent.ymax);
    }
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.EllipsoidModel = function() {
    this.setRadii(6378137.0, 6356752.3142); // WGS84
};

osgearth.EllipsoidModel.prototype = {

    setRadii: function(equatorial, polar) {
        this.radiusEquator = equatorial;
        this.radiusPolar = polar;
        var flattening = (equatorial - polar) / equatorial;
        this.ecc2 = 2 * flattening - flattening * flattening;
        this.absMaxMerc_m = Math.PI * this.radiusEquator;
    },

    lla2ecef: function(lla) {
        var sinLat = Math.sin(lla[1]);
        var cosLat = Math.cos(lla[1]);
        var N = this.radiusEquator / Math.sqrt(1.0 - this.ecc2 * sinLat * sinLat);
        var x = (N + lla[2]) * cosLat * Math.cos(lla[0]);
        var y = (N + lla[2]) * cosLat * Math.sin(lla[0]);
        var z = (N * (1 - this.ecc2) + lla[2]) * sinLat;
        return [x, y, z];
    },

    ecef2lla: function(ecef) {
        var p = Math.sqrt(ecef[0] * ecef[0] + ecef[1] * ecef[1]);
        var theta = Math.atan2(ecef[2] * this.radiusEquator, (p * this.radiusPolar));
        var eDashSquared = (this.radiusEquator * this.radiusEquator - this.radiusPolar * this.radiusPolar) /
                              (this.radiusPolar * this.radiusPolar);
        var sintheta = Math.sin(theta);
        var costheta = Math.cos(theta);
        var lat = Math.atan((ecef[2] + eDashSquared * this.radiusPolar * sintheta * sintheta * sintheta) /
                             (p - this.ecc2 * this.radiusEquator * costheta * costheta * costheta));
        var lon = Math.atan2(ecef[1], ecef[0]);
        var sinlat = Math.sin(lat);
        var N = this.radiusEquator / Math.sqrt(1.0 - this.ecc2 * sinlat * sinlat);
        var alt = p / Math.cos(lat) - N;

        return [lon, lat, alt];
    },

    local2worldFromECEF: function(ecef) {
        var lla = this.ecef2lla(ecef);

        var l2w = osg.Matrix.makeTranslate(ecef[0], ecef[1], ecef[2]);

        var up = [Math.cos(lla[0]) * Math.cos(lla[1]), Math.sin(lla[0]) * Math.cos(lla[1]), Math.sin(lla[1])];
        var east = [-Math.sin(lla[0]), Math.cos(lla[0]), 0];
        var north = osg.Vec3.cross(up, east, []);

        osg.Matrix.set(l2w, 0, 0, east[0]);
        osg.Matrix.set(l2w, 0, 1, east[1]);
        osg.Matrix.set(l2w, 0, 2, east[2]);

        osg.Matrix.set(l2w, 1, 0, north[0]);
        osg.Matrix.set(l2w, 1, 1, north[1]);
        osg.Matrix.set(l2w, 1, 2, north[2]);

        osg.Matrix.set(l2w, 2, 0, up[0]);
        osg.Matrix.set(l2w, 2, 1, up[1]);
        osg.Matrix.set(l2w, 2, 2, up[2]);

        return l2w;
    },

    local2worldFromLLA: function(lla) {
        var ecef = lla2ecef(lla);
        return local2worldFromECEF(ecef);
    }
};/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.Profile = function() {
    this.ellipsoid = new osgearth.EllipsoidModel();
};

osgearth.Profile.prototype = {

    getTileSize: function(lod) {
        var width = osgearth.Extent.width(this.extent) / this.baseTilesX;
        var height = osgearth.Extent.height(this.extent) / this.baseTilesY;
        for (var i = 0; i < lod; i++) {
            width /= 2.0;
            height /= 2.0;
        }
        return [width, height];
    },

    getTileCount: function(lod) {
        var e = Math.pow(2, lod);
        return [this.baseTilesX * e, this.baseTilesY * e];
    }
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.GeodeticProfile = function() {
    osgearth.Profile.call(this);
    this.name = "WGS84";
    this.extent = { xmin: -Math.PI, ymin: -Math.PI / 2, xmax: Math.PI, ymax: Math.PI / 2 };
    this.baseTilesX = 2;
    this.baseTilesY = 1;
    this.isGeographic = true;
};

osgearth.GeodeticProfile.prototype = osg.objectInehrit(osgearth.Profile.prototype, {
});
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.MercatorProfile = function() {
    osgearth.Profile.call(this);
    this.name = "Mercator";
    this.extent = {
        xmin: -this.ellipsoid.absMaxMerc_m,
        ymin: -this.ellipsoid.absMaxMerc_m,
        xmax: this.ellipsoid.absMaxMerc_m,
        ymax: this.ellipsoid.absMaxMerc_m
    };
    this.baseTilesX = 2;
    this.baseTilesY = 2;
    this.isGeographic = false;

    var emin = this.toLLA([this.extent.xmin, this.extent.ymin, 0]);
    var emax = this.toLLA([this.extent.xmax, this.extent.ymax, 0]);
    this.extentLLA = {
        xmin: emin[0],
        ymin: emin[1],
        xmax: emax[0],
        ymax: emax[1]
    };
};

// this is spherical mercator, but that's ok for now
osgearth.MercatorProfile.prototype = osg.objectInehrit(osgearth.Profile.prototype, {

    getUV: function(localExtentLLA, lla) {
        var u = (lla[0] - localExtentLLA.xmin) / osgearth.Extent.width(localExtentLLA);
        var vmin = this.lat2v(Math.clamp(localExtentLLA.ymax, this.extentLLA.ymin, this.extentLLA.ymax));
        var vmax = this.lat2v(Math.clamp(localExtentLLA.ymin, this.extentLLA.ymin, this.extentLLA.ymax));
        var vlat = this.lat2v(Math.clamp(lla[1], this.extentLLA.ymin, this.extentLLA.ymax));
        var v = 1.0 - (vlat - vmin) / (vmax - vmin);
        return [u, v];
    },

    lat2v: function(lat) {
        var sinLat = Math.sin(lat);
        return 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
    },

    fromLLA: function(lla) {
        return [
            lla[0] * this.ellipsoid.radiusEquator,
            this.ellipsoid.absMaxMerc_m - this.lat2v(lla[1]) * 2 * this.ellipsoid.absMaxMerc_m,
            lla[2]];
    },

    toLLA: function(coord) {
        return [
            coord[0] / this.ellipsoid.radiusEquator,
            2 * Math.atan(Math.exp(coord[1] / this.ellipsoid.radiusEquator)) - Math.PI / 2,
            coord[2]];
    }
});
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.TileKey = {

    x: function(key) {
        return key[0];
    },

    y: function(key) {
        return key[1];
    },

    lod: function(key) {
        return key[2];
    },

    valid: function(key) {
        return key[2] >= 0;
    },

    parent: function(key) {
        return [parseInt(key[0] / 2), parseInt(key[1] / 2), lod - 1];
    },

    child: function(key, q) {
        var x = (key[0] * 2) + (q == 1 ? 1 : 0) + (q == 3 ? 1 : 0);
        var y = (key[1] * 2) + (q == 2 ? 1 : 0) + (q == 3 ? 1 : 0);
        return [x, y, key[2] + 1];
    },

    getExtent: function(key, profile) {
        var size = profile.getTileSize(key[2]);
        var xmin = profile.extent.xmin + (size[0] * key[0]);
        var ymax = profile.extent.ymax - (size[1] * key[1]);
        var r = { "xmin": xmin, "ymin": ymax - size[1], "xmax": xmin + size[0], "ymax": ymax };
        return r;
    },

    getExtentLLA: function(key, profile) {
        var e = this.getExtent(key, profile);
        if (profile.toLLA !== undefined) {
            var min = [e.xmin, e.ymin, 0];
            var max = [e.xmax, e.ymax, 0];
            min = profile.toLLA(min);
            max = profile.toLLA(max);
            var r = { xmin: min[0], ymin: min[1], xmax: max[0], ymax: max[1] };
            return r;
        }
        else {
            return e;
        }
    }
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.ImageLayer = function(name) {
    this.name = name;
    this.profile = undefined;
    this.opacity = 1.0;
    this.visible = true;
    this.draw = false; // internal
};

osgearth.ImageLayer.prototype = {

    name: function() {
        return this.name;
    },

    getOpacity: function() {
        return this.opacity;
    },

    setOpacity: function(opacity) {
        if (this.opacity != opacity) {
            this.opacity = opacity;
            if (this.opacityUniform !== undefined) {
                this.opacityUniform.set([this.opacity]);
            }
        }
    },

    getVisible: function() {
        return this.visible;
    },

    setVisible: function(visible) {
        if (this.visible != visible) {
            this.visible = visible;
            if (this.visibleUniform !== undefined) {
                this.visibleUniform.set([this.visible]);
            }
        }
    }

};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.HeightField = function(numColumns, numRows, data) {
    this._numColumns = numColumns;
    this._numRows = numRows;

    //Allocate data for the underlying heights if none was provides
    if (data === undefined) {
        data = new Array(numColumns * numRows);
    }
    this._data = data;
};

osgearth.HeightField.prototype = {
    getNumColumns: function() {
        return this._numColumns;
    },

    getNumRows: function() {
        return this._numRows;
    },

    getHeight: function(c, r) {
        var index = c + r * this._numColumns;
        if (index < 0 || index >= this._data.length) throw "Index out of bounds";
        return this._data[index];
    },

    setHeight: function(c, r, height) {
        var index = c + r * this._numColumns;
        if (index < 0 || index >= this._data.length) throw "Index out of bounds";
        this._data[index] = height;
    }
};

osgearth.WebHeightField = function(url, loadNow) {
    this.url = url;
    this.complete = false;
    this.loadNow = loadNow === undefined ? false : loadNow;
    this.refresh();
}

osgearth.WebHeightField.prototype = osg.objectInehrit(osgearth.HeightField.prototype, {
    refresh: function() {
        //Mark the HeightField as not complete
        this.complete = false;

        var that = this;
        //Request the heightfield from the URL
        jQuery.ajax({
            url: this.url,
            dataType: "json",
            async: !this.loadNow,
            success: function(data) {
                that._numColumns = data.width;
                that._numRows = data.height;
                that._data = data.data;
                that.complete = true;
            },
            error: function() {
                /*
                that._numColumns = 8;
                that._numRows = 8;
                var data = [];
                for (var i = 0; i < that._numColumns * that._numRows; i++) {
                    data[i] = 0;
                }
                that._data = data;
                that.complete = true;
                */
            }
        });
    }
});
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.ElevationLayer = function(name) {
    this.name = name;
    this.profile = undefined;
};

osgearth.ElevationLayer.prototype = {
    name: function() {
        return this.name;
    }    
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.Map = function(args) {

    this.usingDefaultProfile = false;

    // whether it's a 2D or 3D map
    this.threeD = true;

    // whether the map is round (geocentric) or flat (projected)
    this.geocentric = true;

    // start at this level
    this.minLevel = 0;

    // don't subdivide beyond this level
    this.maxLevel = 22;

    // whether to draw a tile before all the layers have loaded
    this.waitForAllLayers = true;

    // scale factor for tile paging
    this.zoomScale = 1.0;

    // vertical scale for elevation data
    //this.verticalScale = 1.0;

    // minimum allowable elevation value
    this.minElevation = -1e6;

    // maximum allowable elevation value
    this.maxElevation = 1e6;

    if (args !== undefined) {
        if (args.profile !== undefined)
            this.profile = args.profile;
        if (args.threeD !== undefined)
            this.threeD = args.threeD;
        if (args.twoD !== undefined)
            this.threeD = (args.twoD !== true);
        if (args.minLevel !== undefined)
            this.minLevel = args.minLevel;
        if (args.maxLevel !== undefined)
            this.maxLevel = args.maxLevel;
        if (args.waitForAllLayers !== undefined)
            this.waitForAllLayers = args.waitForAllLayers;
        if (args.zoomScale !== undefined)
            this.zoomScale = args.zoomScale;
//        if (args.verticalScale !== undefined)
//            this.verticalScale = args.verticalScale;
        if (args.minElevation !== undefined)
            this.minElevation = args.minElevation;
        if (args.maxElevation !== undefined)
            this.maxElevation = args.maxElevation;
        if (args.geocentric !== undefined)
            this.geocentric = args.geocentric;
        else if (this.threeD === false)
            this.geocentric = false;
    }

    if (this.profile === undefined) {
        this.profile = new osgearth.GeodeticProfile();
        this.usingDefaultProfile = true;
    }

    // ordered list of image layers in the map
    this.imageLayers = [];

    //Elevation layers
    this.elevationLayers = [];

    // these handle the automatic deletion of culled tiles.
    this.drawList = {};
    this.expireList = {};

    // you can monitor this value to see how many tiles are being drawn each frame.
    this.drawListSize = 0;
};

osgearth.Map.prototype = {

    addImageLayer: function(layer) {
        this.imageLayers.push(layer);
        if (this.usingDefaultProfile && layer.profile !== undefined) {
            this.profile = layer.profile;
            this.usingDefaultProfile = false;
        }
    },

    addElevationLayer: function(layer) {
        this.elevationLayers.push(layer);
    },

    // converts [long,lat,alt] to world model coordinates [x,y,z]
    lla2world: function(lla) {
        if (this.geocentric)
            return this.profile.ellipsoid.lla2ecef(lla);
        else
            return this.profile.fromLLA(lla);
    },

    world2lla: function(world) {
        if (this.geocentric)
            return this.profile.ellipsoid.ecef2lla(world);
        else
            return this.profile.toLLA(world);
    },

    // called by Tile::traverse to tell the map that the tile is in use
    markTileDrawn: function(tile) {
        this.drawList[tile.key] = tile;
        this.expireList[tile.key] = null;
        this.drawListSize++;
    },


    createEmptyHeightField: function(numColumns, numRows) {
        var data = [];
        var numElements = numColumns * numRows;
        for (var i = 0; i < numElements; i++) {
            data[i] = 0;
        }
        return new osgearth.HeightField(numColumns, numRows, data);
    },


    //Creates a heightfield from the elevation layers or an empty heightfield
    createHeightField: function(key, loadNow) {
        if (this.elevationLayers.length == 0) {
            return null;
            //return this.createEmptyHeightField(16, 16);
        }
        else {
            //Just return the first layers heightfield            
            return this.elevationLayers[0].createHeightField(key, this.profile, loadNow);
        }
    },

    frame: function() {
        // anything left in the expiration list gets deleted (well its children anyway)
        for (var key in this.expireList) {
            tile = this.expireList[key];
            if (tile !== undefined && tile != null && tile.parents.length > 0) {
                tile.resetSubtiles();
            }
        }

        // use this frame's draw list as the next frame's expiration list.
        this.expireList = this.drawList;
        delete this.drawList;
        this.drawList = {};
        this.drawListSize = 0;
    }
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.MapNode = function(map) {

    osg.Node.call(this);

    this.map = map;
    this.verticalScale = 1.0;

    var rootSize = map.profile.getTileCount(map.minLevel);
    for (var x = 0; x < rootSize[0]; x++) {
        for (var y = 0; y < rootSize[1]; y++) {
            this.addChild(new osgearth.Tile([x, y, map.minLevel], map, null));
        }
    }

    var stateSet = this.getOrCreateStateSet();

    // set up our custom GLSL program
    var vp = new osgearth.VirtualProgram();

    vp.setShader(
        "osgearth_vert_setupTexturing",
        gl.VERTEX_SHADER,
        osgearth.ShaderFactory.createVertexSetupTexturing(map.imageLayers));

    vp.setShader(
        "osgearth_frag_applyTexturing",
        gl.FRAGMENT_SHADER,
        osgearth.ShaderFactory.createFragmentApplyTexturing(map.imageLayers));


    stateSet.setAttributeAndMode(vp, osg.StateAttribute.ON);

    stateSet.setAttributeAndMode(new osg.CullFace('DISABLE'));

    for (var i = 0; i < map.imageLayers.length; i++) {

        var visible = map.imageLayers[i].getVisible() ? true : false;
        var visibleUniform = osg.Uniform.createInt1(visible, "Texture" + i + "Visible");
        stateSet.addUniform(visibleUniform, osg.StateAttribute.ON);
        map.imageLayers[i].visibleUniform = visibleUniform;

        var opacity = map.imageLayers[i].getOpacity();
        var opacityUniform = osg.Uniform.createFloat1(opacity, "Texture" + i + "Opacity");
        map.imageLayers[i].opacityUniform = opacityUniform;
        stateSet.addUniform(opacityUniform, osg.StateAttribute.ON);

        var texMatUniform = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "TexMat" + i);
        stateSet.addUniform(texMatUniform, osg.StateAttribute.ON);

        stateSet.addUniform(osg.Uniform.createInt1(i, "Texture" + i));
    }

    this.verticalScaleUniform = osg.Uniform.createFloat1(this.verticalScale, "VerticalScale");
    stateSet.addUniform(this.verticalScaleUniform, osg.StateAttribute.ON);
};

osgearth.MapNode.prototype = osg.objectInehrit(osg.Node.prototype, {

    setVerticalScale: function(value) {
        this.verticalScaleUniform.set([value]);
    },

    traverse: function(visitor) {
        if (visitor.modelviewMatrixStack !== undefined) { // i.e., in cull visitor
            var lastViewMatrix = visitor.modelviewMatrixStack[visitor.modelviewMatrixStack.length - 1];
            var mvmInv = [];
            osg.Matrix.inverse(lastViewMatrix, mvmInv);
            if (visitor.eyePoint === undefined)
                visitor.eyePoint = [];
            osg.Matrix.getTrans(mvmInv, visitor.eyePoint);
        }
        var n = this.children.length;
        for (var i = 0; i < n; i++) {
            this.children[i].accept(visitor);
        }
    }
});

osgearth.MapNode.prototype.objectType = osg.objectType.generate("MapNode");

osg.CullVisitor.prototype[osgearth.MapNode.prototype.objectType] = function(node) {
    if (node.stateset)
        this.pushStateSet(node.stateset);
    this.traverse(node);
    if (node.stateset)
        this.popStateSet();
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.Tile = function(key, map, parentTextures) {

    osg.Node.call(this);

    //    osg.log("Create tile: " + key);

    this.key = key;
    this.map = map;

    var extent = osgearth.TileKey.getExtentLLA(key, map.profile);

    // xforms LLA to tile [0..1]
    this.lla2local = [
        osgearth.Extent.width(extent), 0.0, 0.0, 0.0,
        0.0, osgearth.Extent.height(extent), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        extent.xmin, extent.ymin, 0.0, 1.0];

    var centerLLA = osgearth.Extent.center(extent);

    this.centerWorld = map.lla2world([centerLLA[0], centerLLA[1], 0]);

    this.centerNormal = [];
    osg.Vec3.normalize(this.centerWorld, this.centerNormal);
    this.deviation = 0.0;

    this.geometry = null;
    this.subtilesRequested = false;
    this.subtileRange = 1e7 * 1e7;
    this.textures = [];
    this.textureReady = [];
    this.numTexturesReady = 0;

    this.parentTextures = parentTextures;

    var loadNow = this.key[2] == this.map.minLevel;
    //Create the heightfield
    this.heightField = this.map.createHeightField(this.key, loadNow);

    //Create the texture layers
    for (var i = 0, n = this.map.imageLayers.length; i < n; i++) {
        var layer = this.map.imageLayers[i];
        var newTex = layer.createTexture(this.key, this.map.profile);
        this.textures.push(newTex);
        this.textureReady.push(false);
    }

    this.isBuilt = false;
    if (loadNow) {
        this.build(this.parentTextures);
    }

};

osgearth.Tile.prototype = osg.objectInehrit(osg.Node.prototype, {

    computeBound: function(bs) {
        return this.xform.computeBound(bs);
    },

    insertArray: function(from, to, toIndex) {
        for (var i = 0; i < from.length; i++) {
            to[toIndex + i] = from[i];
        }
    },

    allTexturesReady: function() {
        return this.numTexturesReady === this.textures.length;
    },

    allChildrenBuilt: function() {
        for (var i = 0; i < this.children.length; i++) {
            if (!this.children[i].isBuilt) return false;
        }
        return true;
    },

    buildChildren: function() {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].checkBuild();
        }
    },

    // checks to see whether all the images for this tile are available
    checkTextures: function() {
        this.numTexturesReady = 0;
        for (var i = 0; i < this.textures.length; i++) {
            if (this.textureReady[i] === true) {
                this.numTexturesReady++;
            }
            else if (this.textures[i].isImageReady()) {
                this.textureReady[i] = true;
                // in no-wait mode, remove the uniform that hides a not-yet-ready layer
                if (this.map.waitForAllLayers === false) {
                    osg.StateSet.removeUniform(this.getStateSet(), "TexMat" + i);
                    this.getStateSet().setTextureAttributeAndMode(i, this.textures[i]);
                }
                this.numTexturesReady++;
            }
        }
    },

    resetSubtiles: function() {
        // delete all the children's textures to free their memory.
        var i, n = this.children.length;
        for (i = 0; i < n; ++i) {
            this.children[i].destroy();
        }

        this.removeChildren();
        this.subtilesRequested = false;
    },

    // free memory associated with the Tile.
    // todo: check for buffer objects as well.
    destroy: function() {
        for (j = 0; j < this.textures.length; ++j) {
            osg.Texture.destroy(this.textures[j]);
        }
        osg.Geometry.destroy(this.geometry);
    },

    build: function(parentTextures) {
        var verts = [];
        var elements = [];
        var normals = [];
        var texcoords0 = [];
        var corner = [];
        var elevVecs = [];

        var numRows = this.map.threeD ? 8 : 2;
        var numCols = this.map.threeD ? 8 : 2;

        var extentLLA = osgearth.TileKey.getExtentLLA(this.key, this.map.profile);
        // localizer matrix:
        var tile2world =
            this.map.threeD ?
            this.map.profile.ellipsoid.local2worldFromECEF(this.centerWorld) :
            osg.Matrix.makeTranslate(this.centerWorld[0], this.centerWorld[1], this.centerWorld[2]);
        var world2tile = [];
        osg.Matrix.inverse(tile2world, world2tile);

        // rotation element:
        var world2tileRot = [];
        osg.Matrix.getRotate(world2tile, world2tileRot);


        //Right now just create an empty heightfield
        var heightField = this.map.threeD ? this.heightField : null;
        if (heightField !== null) {
            numRows = heightField.getNumRows();
            numCols = heightField.getNumColumns();
        }

        var lonSpacing = osgearth.Extent.width(extentLLA) / (numCols - 1);
        var latSpacing = osgearth.Extent.height(extentLLA) / (numRows - 1);


        var e = 0, v = 0, tc = 0, vi = 0;

        for (var row = 0; row < numRows; row++) {
            var t = row / (numRows - 1);

            for (var col = 0; col < numCols; col++) {
                var s = col / (numCols - 1);
                var height = heightField != null ? heightField.getHeight(col, row) : 0;
                height = Math.clamp(height, this.map.minElevation, this.map.maxElevation);
                //var lla = [extentLLA.xmin + lonSpacing * col, extentLLA.ymin + latSpacing * row, height];
                var lla = [extentLLA.xmin + lonSpacing * col, extentLLA.ymin + latSpacing * row, 0]; //height];

                var world = this.map.lla2world(lla);
                var vert = osg.Matrix.transformVec3(world2tile, world, []);
                this.insertArray(vert, verts, v);

                // todo: fix for elevation
                var normal =
                    this.map.geocentric ? osg.Vec3.normalize(vert, []) :
                    [0, 0, 1];
                this.insertArray(normal, normals, v);

                // elevation extrusion vector
                var extrude = [];
                osg.Vec3.normalize(world, extrude);
                extrude = osg.Quat.transformVec3(world2tileRot, extrude);
                osg.Vec3.mult(extrude, height, extrude);
                this.insertArray(extrude, elevVecs, v);

                v += 3;

                if (col < numCols - 1 && row < numRows - 1) {
                    this.insertArray([vi, vi + 1, vi + 1 + numCols, vi + 1 + numCols, vi + numCols, vi], elements, e);
                    e += 6;
                }
                vi++;

                // simple [0..1] tex coords
                var uv = [s, t];
                if (this.map.profile.getUV !== undefined)
                    uv = this.map.profile.getUV(extentLLA, lla);

                this.insertArray([s, uv[1]], texcoords0, tc);
                tc += 2;

                if (row == 0 && col == 0)
                    corner[0] = world;
                else if (row == 0 && col == numCols - 1)
                    corner[1] = world;
                else if (row == numRows - 1 && col == 0)
                    corner[2] = world;
                else if (row == numRows - 1 && col == numCols - 1)
                    corner[3] = world;
            }
        }

        this.geometry = new osg.Geometry();
        this.geometry.getAttributes().Vertex = new osg.BufferArray(gl.ARRAY_BUFFER, verts, 3);
        this.geometry.getAttributes().Normal = new osg.BufferArray(gl.ARRAY_BUFFER, normals, 3);
        var tris = new osg.DrawElements(gl.TRIANGLES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, elements, 1));
        this.geometry.getPrimitives().push(tris);

        this.geometry.getAttributes().Elevation = new osg.BufferArray(gl.ARRAY_BUFFER, elevVecs, 3);

        // the textures:     
        var stateSet = this.getOrCreateStateSet();
        var geomStateSet = this.geometry.getOrCreateStateSet();

        // shared texture coordinate attribute:
        var sharedTexCoordAttr = new osg.BufferArray(gl.ARRAY_BUFFER, texcoords0, 2);

        for (var i = 0, n = this.map.imageLayers.length; i < n; i++) {
            //var layer = this.map.imageLayers[i];
            //var newTex = layer.createTexture(this.key, this.map.profile);
            //this.textures.push(newTex);
            //this.textureReady.push(false);
            var newTex = this.textures[i];

            if (parentTextures === null || this.map.waitForAllLayers) {
                stateSet.setTextureAttributeAndMode(i, newTex);
            }
            else {
                var texMat = [
                    0.5, 0, 0, 0,
                    0.0, 0.5, 0, 0,
                    0.0, 0.0, 0.0, 0.0,
                    (this.key[0] % 2) * 0.5, (1 - this.key[1] % 2) * 0.5, 0, 0];

                var texMatU = osg.Uniform.createMatrix4(texMat, "TexMat" + i);
                stateSet.addUniform(texMatU, osg.StateAttribute.ON);
            }

            this.geometry.getAttributes()["TexCoord" + i] = sharedTexCoordAttr;
        }

        this.xform = new osg.MatrixTransform();
        this.xform.setMatrix(tile2world);
        this.xform.addChild(this.geometry);

        this.subtileRange2 = this.getBound().radius() * 3 * this.map.zoomScale;
        this.subtileRange2 *= this.subtileRange2;

        // for geocentric maps, get the tile's deviation for geocentric normal-based culling
        if (this.map.geocentric && this.key[2] > 0) {
            for (var i = 0; i < 4; i++) {
                var vec = [];
                osg.Vec3.sub(corner[i], this.centerWorld, vec);
                osg.Vec3.normalize(vec, vec);
                var dot = osg.Vec3.dot(this.centerNormal, vec);
                if (dot < this.deviation)
                    this.deviation = dot;
            }
        }
        this.deviation -= 0.2;
        this.isBuilt = true;
    },

    requestSubtiles: function() {
        for (var q = 0; q < 4; q++)
            this.addChild(new osgearth.Tile(osgearth.TileKey.child(this.key, q), this.map, this.textures));
        this.subtilesRequested = true;
    },

    checkBuild: function() {
        if (!this.isBuilt) {
            var hasAllData = true;
            if (this.heightField != null && !this.heightField.complete) {
                hasAllData = false;
            }

            /*if (!this.allTexturesReady()) {
            hasAllData = false;
            }*/

            if (hasAllData) {
                this.build(this.parentTextures);
            }

        }
        return this.isBuilt;
    },



    traverse: function(visitor) {
        //Try to build the children if needed
        this.buildChildren();

        if (visitor.modelviewMatrixStack !== undefined) { // i.e., in cull visitor

            var centerToEye = [0, 0, 0];
            osg.Vec3.sub(visitor.eyePoint, this.centerWorld, centerToEye);
            osg.Vec3.normalize(centerToEye, centerToEye);

            if (this.key[2] == 0 || !this.map.geocentric || osg.Vec3.dot(centerToEye, this.centerNormal) >= this.deviation) {

                // tell the map we're drawing this tile (so it doesn't get exipred)
                this.map.markTileDrawn(this);

                var bound = this.getBound();
                var range2 = osg.Vec3.length2(osg.Vec3.sub(visitor.eyePoint, bound.center(), []));

                var traverseChildren = true;
                var numChildren = this.children.length;

                if (range2 > this.subtileRange2 || this.key[2] >= this.map.maxLevel) {
                    traverseChildren = false;
                }
                else {
                    // if this tile's content is all loaded, it's ok to start requesting subtiles.
                    if (!this.subtilesRequested && (this.key[2] == this.map.minLevel || this.allTexturesReady())) {
                        this.requestSubtiles();
                        traverseChildren = false;
                    }
                    else if (this.children.length < 4) {
                        traverseChildren = false;
                    }
                    else if (!this.allChildrenBuilt()) {
                        traverseChildren = false;
                    }
                    else {
                        // in "wait for all layers" mode, don't traverse this tile's children
                        // until they have each loaded all of their textures.
                        if (this.map.waitForAllLayers) {
                            for (var i = 0; i < this.children.length; i++) {
                                var child = this.children[i];
                                if (!child.allTexturesReady()) {
                                    traverseChildren = false;
                                    child.checkTextures();
                                }
                            }
                        }

                        // in non-waiting mode, traverse the children as long as each one
                        // has loaded it's base layer (layer 0).
                        else {
                            for (var i = 0; i < this.children.length; i++) {
                                var child = this.children[i];
                                if (!child.textureReady[0])
                                    traverseChildren = false;
                                if (!child.allTexturesReady())
                                    child.checkTextures();
                            }
                        }
                    }
                }

                if (traverseChildren) {
                    for (var i = 0; i < numChildren; i++) {
                        this.children[i].accept(visitor);
                    }
                }
                else {
                    this.xform.accept(visitor);
                }
            }
        }
    }

});

osgearth.Tile.prototype.objectType = osg.objectType.generate("Tile");

osg.CullVisitor.prototype[osgearth.Tile.prototype.objectType] = function(node) {
    if (node.stateset)
        this.pushStateSet(node.stateset);

    this.traverse(node);

    if (node.stateset)
        this.popStateSet();
};

/*! Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.4
 * 
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    // Old school scrollwheel delta
    if ( event.wheelDelta ) { delta = event.wheelDelta/120; }
    if ( event.detail     ) { delta = -event.detail/3; }
    
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
    
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
    
    return $.event.handle.apply(this, args);
}

})(jQuery);/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

Math.deg2rad = function(deg) {
    return deg * 0.0174532925;
};

Math.rad2deg = function(rad) {
    return rad * 57.2957795;
};

Math.clamp = function(x, min, max) {
    if (x < min)
        return min;
    else if (x > max)
        return max;
    else
        return x;
};

Math.log10 = function(n) {
    return Math.log(n) / Math.LN10;
};

Math.powFast = function(x, y) {
    return x / (x + y - y * x);
};

Math.smoothStepInterp = function(t) {
    return (t * t) * (3.0 - 2.0 * t);
};

Math.smootherStepInterp = function(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
};

Math.accelerationInterp = function(t, a) {
    return a == 0 ? t : a > 0 ? Math.powFast(t, a) : 1.0 - Math.powFast(1.0 - t, -a);
};/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
* Array utility functions
*/

//........................................................................

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elt /*, from*/) {
        var len = this.length;

        var from = Number(arguments[1]) || 0;
        from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
        if (from < 0)
            from += len;

        for (; from < len; from++) {
            if (from in this &&
          this[from] === elt)
                return from;
        }
        return -1;
    };
}/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
* jQuery extension to ensure ordered loading of dependencies. -GW 2011/05
* 
* Inspired by:
*
* $.include - script inclusion jQuery plugin
* Based on idea from http://www.gnucitizen.org/projects/jquery-include/
* @author Tobiasz Cudnik
* @link http://meta20.net/.include_script_inclusion_jQuery_plugin
* @license MIT
*/

// overload jquery's onDomReady
if (jQuery.browser.mozilla || jQuery.browser.opera) {
    document.removeEventListener("DOMContentLoaded", jQuery.ready, false);
    document.addEventListener("DOMContentLoaded", function() { jQuery.ready(); }, false);
}

jQuery.event.remove(window, "load", jQuery.ready);

jQuery.event.add(window, "load", function() { jQuery.ready(); });

jQuery.extend({

    includeList: [],
    includeLoaded: {},
    includePtr: 0,

    includeInOrder: function(libs) {
        this.includeList = libs;
        this.includePtr = 0;
        this.loadInclude(this.includePtr);
    },

    loadNext: function() {
        this.includePtr++;
        if (this.includePtr < this.includeList.length)
            this.loadInclude(this.includePtr);
    },

    loadInclude: function(i) {
        if (this.includePtr >= this.includeList.length)
            return;
        var host = this;
        var url = this.includeList[i].replace('\n', '');
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        
        this.includeLoaded[script] = false;
        
        // set both callbacks to support different browser behaviors
        script.onload = function() {
            if (host.includeLoaded[this] === false) {
                host.includeLoaded[this] = true;
                host.loadNext();
            }
        };
        script.onreadystatechange = function() {
            if (this.readyState != 'complete' && this.readyState != 'loaded')
                return;
            if (host.includedLoaded[this] === false) {
                host.includeLoaded[this] = true;
                host.loadNext();
            }
        };
        
        document.getElementsByTagName('head')[0].appendChild(script);
    },

    readyOld: jQuery.ready,

    ready: function() {
        if (jQuery.isReady)
            return;
        var imReady = jQuery.includePtr >= jQuery.includeList.length;
        if (imReady)
            jQuery.readyOld.apply(jQuery, arguments);
        else
            setTimeout(arguments.callee, 10);
    }
});












var ReadyMap = {};

ReadyMap.version = '0.0.1';

ReadyMap.init = function(onload) {
    window.addEventListener("load", onload, true);
};

ReadyMap.getWindowSize = function() {

    var myWidth = 0, myHeight = 0;

    if (typeof (window.innerWidth) == 'number') {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    }
    else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    }
    else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    return { 'w': myWidth, 'h': myHeight };
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/



ReadyMap.Manipulator = function(map) {
    this.map = map;
    this.center = [0, 0, 0];
    this.minDistance = 0.001;
    this.maxDistance = 1e10;
    this.buttonup = true;
    this.rotation = osg.Quat.makeIdentity();
    this.localAzim = 0;
    this.localPitch = Math.deg2rad(-90);
    this.settingVP = false;
    this.continuousZoom = 0;
    this.continuousPanX = 0;
    this.continuousPanY = 0;
    this.touchSensitivity = 0.1;
    this.touchStartDistance = 0;
    this.touchStartVec = [0, 0];
};

ReadyMap.Manipulator.prototype = {

    init: function() {
    },

    reset: function() {
        this.init();
    },

    setNode: function(node) {
        this.node = node;
    },

    mouseup: function(ev) {
        this.dragging = false;
        this.panning = false;
        this.releaseButton(ev);
    },

    mousedown: function(ev) {
        this.panning = true;
        this.dragging = true;
        var pos = this.convertEventToCanvas(ev);
        this.clientX = pos[0];
        this.clientY = pos[1];
        this.pushButton(ev);
    },

    touchStart: function(ev) {
      if (!ev.touches)
        return;

      if (ev.touches.length == 1)
        this.mousedown(ev);
      else if (ev.touches.length == 2) {
        var p1 = [ev.touches[0].clientX, ev.touches[0].clientY];
        var p2 = [ev.touches[1].clientX, ev.touches[1].clientY];

        var diff = osg.Vec2.sub(p2, p1, []);
        this.touchStartDistance = osg.Vec2.length(diff);
        this.touchStartVec = osg.Vec2.normalize(diff, []);
      }

    },

    touchEnd: function(ev) {
      //if (ev.touches && ev.touches.length == 1)
      this.mouseup(ev);
    },

    touchMove: function(ev) {
    },

    pushButton: function() {
        this.dx = this.dy = 0;
        this.buttonup = false;
    },

    releaseButton: function() {
        this.buttonup = true;
    },

    setDistance: function(d) {
        this.distance = d;
        if (this.distance < this.minDistance)
            this.distance = this.minDistance;
        else if (this.distance > this.maxDistance)
            this.distance = this.maxDistance;
    },

    getViewpoint: function() {
        var vp = {};
        vp.center = osg.Vec3.copy(this.center, []);
        vp.heading = Math.rad2deg(this.localAzim);
        vp.pitch = Math.rad2deg(this.localPitch);
        vp.range = this.distance;
        return vp;
    },

    startViewpointTransition: function(lat, lon, alt, heading, pitch, range, seconds) {

        var newCenter = this.map.lla2world([Math.deg2rad(lon), Math.deg2rad(lat), alt]);

        this.startVP = this.getViewpoint();
        this.deltaHeading = heading - this.startVP.heading;
        this.deltaPitch = pitch - this.startVP.pitch;
        this.deltaRange = range - this.startVP.range;
        this.deltaCenter = osg.Vec3.sub(newCenter, this.startVP.center, []);

        while (this.deltaHeading > 180) this.deltaHeading -= 360;
        while (this.deltaHeading < -180) this.deltaHeading += 360;

        var h0 = this.startVP.range * Math.sin(Math.deg2rad(-this.startVP.pitch));
        var h1 = range * Math.sin(Math.deg2rad(-pitch));
        var dh = h1 - h0;

        var de;
        if (this.map.geocentric) {
            var startFP = this.startVP.center;
            var xyz0 = [this.startVP.center[0], this.startVP.center[1], 0];
            var xyz1 = this.map.lla2world([Math.deg2rad(lon), Math.deg2rad(lat), 0]);
            de = osg.Vec3.length(osg.Vec3.sub(xyz0, xyz1, []));
        }
        else {
            de = osg.Vec3.length(this.deltaCenter);
        }

        this.arcHeight = Math.max(de - Math.abs(dh), 0);
        if (this.arcHeight > 0) {
            var h_apex = 2 * (h0 + h1) + this.arcHeight;
            var dh2_up = Math.abs(h_apex - h0) / 100000.0;
            this.setVPaccel = Math.log10(dh2_up);
            var dh2_down = Math.abs(h_apex - h1) / 100000.0;
            this.setVPaccel2 = -Math.log10(dh2_down);
        }
        else {
            var dh2 = (h1 - h0) / 100000.0;
            this.setVPaccel = Math.abs(dh2) <= 1.0 ? 0.0 : dh2 > 0.0 ? Math.log10(dh2) : -Math.log10(-dh2);
            if (Math.abs(this.setVPaccel) < 1.0)
                this.setVPaccel = 0.0;
        }

        this.setVPstartTime_ms = new Date().getTime();

        //TODO: auto viewpoint duration code (from osgEarth)
        // auto time:
        if (this.map.geocentric) {
            var maxDistance = this.map.profile.ellipsoid.radiusEquator;
            var ratio = Math.clamp(de / maxDistance, 0, 1);
            ratio = Math.accelerationInterp(ratio, -4.5);
            var minDur = 2.0;
            var maxDur = Math.max(seconds, minDur);
            this.setVPduration_ms = (minDur + ratio * (maxDur - minDur)) * 1000.0;
        }
        else {
            this.setVPduration_ms = seconds * 1000.0;
        }

        this.settingVP = true;
    },

    updateSetViewpoint: function() {
        var now = new Date().getTime();
        var t = (now - this.setVPstartTime_ms) / this.setVPduration_ms;
        var tp = t;

        if (t >= 1.0) {
            t = 1.0;
            tp = 1.0;
            this.settingVP = false;
        }
        else if (this.arcHeight > 0.0) {
            if (tp <= 0.5) {
                var t2 = 2.0 * tp;
                t2 = Math.accelerationInterp(t2, this.setVPaccel);
                tp = 0.5 * t2;
            }
            else {
                var t2 = 2.0 * (tp - 0.5);
                t2 = Math.accelerationInterp(t2, this.setVPaccel2);
                tp = 0.5 + (0.5 * t2);
            }
            tp = Math.smoothStepInterp(tp);
            //tp = Math.smoothStepInterp( tp );
        }
        else if (t > 0.0) {
            tp = Math.accelerationInterp(tp, this.setVPaccel);
            tp = Math.smoothStepInterp(tp);
        }

        var lla = this.map.world2lla(osg.Vec3.add(this.startVP.center, osg.Vec3.mult(this.deltaCenter, tp, []), []));

        this.setViewpoint(
            Math.rad2deg(lla[1]),
            Math.rad2deg(lla[0]),
            lla[2],
            this.startVP.heading + this.deltaHeading * tp,
            this.startVP.pitch + this.deltaPitch * tp,
            this.startVP.range + this.deltaRange * tp + (Math.sin(Math.PI * tp) * this.arcHeight));
    }
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.EarthManipulator = function(map) {
    ReadyMap.Manipulator.call(this, map);
    this.minPitch = Math.deg2rad(-89.9);
    this.maxPitch = Math.deg2rad(-10.0);
    this.buttonup = true;
    this.centerRotation = osg.Quat.makeIdentity();
    this.lockAzimWhilePanning = true;
    this.settingVP = false;
    this.computeHomePosition();
}

ReadyMap.EarthManipulator.prototype = osg.objectInehrit(ReadyMap.Manipulator.prototype, {

  computeHomePosition: function() {
    this.setViewpoint(0, -90, 0, 0, -90, 1e7);
  },

  keydown: function(ev) {
    if (ev.keyCode === 32) {
      this.computeHomePosition();
    } else if (ev.keyCode === 33) { // pageup
      this.distanceIncrease();
      return false;
    } else if (ev.keyCode === 34) { //pagedown
      this.distanceDecrease();
      return false;
    }
    else if (ev.keyCode === 13) { // mode
      this.mode = 1 - this.mode;
      return false;
    }
  },

  mousemove: function(ev) {
    if (this.buttonup === true) {
      return;
    }
    var scaleFactor;
    var curX;
    var curY;
    var deltaX;
    var deltaY;
    var pos = this.convertEventToCanvas(ev);
    curX = pos[0];
    curY = pos[1];

    scaleFactor = 100.0;
    deltaX = (this.clientX - curX) / scaleFactor;
    deltaY = (this.clientY - curY) / scaleFactor;
    this.clientX = curX;
    this.clientY = curY;

    if (ev.shiftKey)
      this.rotateModel(-deltaX, -deltaY);
    else if (ev.ctrlKey)
      this.zoomModel(0, -deltaY);
    else
      this.panModel(-deltaX, -deltaY);

    return false;
  },

  mousewheel: function(ev, intDelta, deltaX, deltaY) {
    this.zoomModel(0, intDelta * -0.1);
  },

  dblclick: function(ev) {
  },

  touchMove: function(ev) {
    ev.preventDefault();

    if (ev.touches.length == 1) {
      this.mousemove(ev);
    }
    else if (ev.touches.length == 2) {
      var p1 = [ev.touches[0].clientX, ev.touches[0].clientY];
      var p2 = [ev.touches[1].clientX, ev.touches[1].clientY];

      var diff = osg.Vec2.sub(p2, p1, []);
      var newDist = osg.Vec2.length(diff);
      var newVec = osg.Vec2.normalize(diff, []);

      var deltaDist = newDist - this.touchStartDistance;
      if (Math.abs(deltaDist) > this.touchSensitivity) {
        // zoom based on change in distance
        this.zoomModel(0, deltaDist * -0.006);

        // tilt globe based on rotation
        var rotation = Math.atan2(newVec[1], newVec[0]) - Math.atan2(this.touchStartVec[1], this.touchStartVec[0]);
        this.rotateModel(0, rotation);

        this.touchStartDistance = newDist;
        this.touchStartVec = newVec;
      }
    }
  },

  getCoordFrame: function(point) {
    var l2w = this.map.profile.ellipsoid.local2worldFromECEF(point);
    var trans = osg.Matrix.getTrans(l2w);
    var x = osg.Matrix.transform3x3(l2w, [1, 0, 0]);
    var y = osg.Matrix.transform3x3(l2w, [0, 1, 0]);
    var z = osg.Matrix.transform3x3(l2w, [0, 0, 1]);
    var scale = osg.Matrix.makeScale(1.0 / osg.Vec3.length(x), 1.0 / osg.Vec3.length(y), 1.0 / osg.Vec3.length(z));
    osg.Matrix.postMult(scale, l2w);
    osg.Matrix.setTrans(l2w, trans[0], trans[1], trans[2]);
    return l2w;
  },

  normalizeAzimRad: function(azim) {
    if (Math.abs(azim) > 2 * Math.PI)
      azim = azim % (2 * Math.PI);
    while (azim < -Math.PI)
      azim += 2 * Math.PI;
    while (azim > Math.PI)
      azim -= 2 * Math.PI;
    return azim;
  },

  getSideVector: function(m) {
    return [osg.Matrix.get(m, 0, 0), osg.Matrix.get(m, 0, 1), osg.Matrix.get(m, 0, 2)];
  },

  getFrontVector: function(m) {
    return [osg.Matrix.get(m, 1, 0), osg.Matrix.get(m, 1, 1), osg.Matrix.get(m, 1, 2)];
  },

  getUpVector: function(m) {
    return [osg.Matrix.get(m, 2, 0), osg.Matrix.get(m, 2, 1), osg.Matrix.get(m, 2, 2)];
  },

  getAzimuth: function(frame) {
    return this.localAzim;

    //        var m = this.getMatrix();
    //        var frameInv = osg.Matrix.inverse(frame);
    //        osg.Matrix.postMult(frameInv, m);

    //        var look = osg.Vec3.normalize(osg.Vec3.neg(this.getUpVector(m),[]), []);
    //        var up = osg.Vec3.normalize(this.getFrontVector(m), []);

    //        var azim;
    //        if (look[2] < -0.9)
    //            azim = Math.atan2(up[0], up[1]);
    //        else if (look[2] > 0.9)
    //            azim = Math.atan2(-up[0], -up[1]);
    //        else
    //            azim = Math.atan2(look[0], look[1]);

    //        return this.normalizeAzimRad(azim);
  },

  recalcLocalPitchAndAzim: function() {
    var rot = osg.Matrix.makeRotateFromQuat(this.rotation);
    this.localPitch = Math.asin(osg.Matrix.get(rot, 1, 2));
    if (Math.abs(this.localPitch - Math.PI / 2) < 0.000001)
      this.localAzim = Math.atan2(osg.Matrix.get(rot, 0, 1), osg.Matrix.get(rot, 0, 0));
    else
      this.localAzim = Math.atan2(osg.Matrix.get(rot, 1, 0), osg.Matrix.get(rot, 1, 1));
    this.localPitch -= Math.PI / 2.0;
  },

  recalculateCenter: function(localFrame) {
    var lla = this.map.profile.ellipsoid.ecef2lla(osg.Matrix.getTrans(localFrame));
    lla[2] = 0.0;
    this.center = this.map.profile.ellipsoid.lla2ecef(lla);
  },

  panModel: function(dx, dy) {
    var scale = -0.3 * this.distance;
    var oldFrame = this.getCoordFrame(this.center);

    var oldAzim = this.getAzimuth(oldFrame);

    var rotMatrix = osg.Matrix.makeRotateFromQuat(osg.Quat.multiply(this.rotation, this.centerRotation));

    var side = this.getSideVector(rotMatrix);
    var previousUp = this.getUpVector(oldFrame);

    var forward = osg.Vec3.cross(previousUp, side, []);
    side = osg.Vec3.cross(forward, previousUp, []);

    osg.Vec3.normalize(forward, forward);
    osg.Vec3.normalize(side, side);

    var dv = osg.Vec3.add(osg.Vec3.mult(forward, (dy * scale), []), osg.Vec3.mult(side, (dx * scale), []), [])

    this.center = osg.Vec3.add(this.center, dv, []);

    var newFrame = this.getCoordFrame(this.center);

    if (this.lockAzimWhilePanning) {
      this.centerRotation = osg.Matrix.getRotate(newFrame);
    }
    else {
      var newUp = this.getUpVector(newFrame);
      var panRot = osg.Quat.rotateVecOnToVec(previousUp, newUp);
      if (!osg.Quat.zeroRotation(panRot)) {
        osg.Quat.multiply(this.centerRotation, panRot, this.centerRotation);
      }
    }

    this.recalculateCenter(newFrame);
    this.recalcLocalPitchAndAzim();
  },

  rotateModel: function(dx, dy) {
    if (dy + this.localPitch > this.maxPitch || dy + this.localPitch < this.minPitch)
      dy = 0;

    var rotMat = osg.Matrix.makeRotateFromQuat(this.rotation);

    var side = this.getSideVector(rotMat);
    var front = osg.Vec3.cross([0, 0, 1], side, []);
    side = osg.Vec3.cross(front, [0, 0, 1], []);

    osg.Vec3.normalize(front, front);
    osg.Vec3.normalize(side, side);

    this.pv = side;

    var p = osg.Quat.makeRotate(dy, side[0], side[1], side[2]);
    var a = osg.Quat.makeRotate(-dx, 0, 0, 1);

    this.rotation = osg.Quat.multiply(this.rotation, osg.Quat.multiply(p, a));

    this.recalcLocalPitchAndAzim();
  },

  zoomModel: function(dx, dy) {
    var fd = 1000;
    var scale = 1 + dy;
    if (fd * scale > this.minDistance) {
      this.setDistance(this.distance * scale);
    }
    else {
      this.setDistance(this.minDistance);
    }
  },

  getRotation: function(point) {
    var cf = this.getCoordFrame(point);
    var look = osg.Vec3.neg(this.getUpVector(cf), []);
    var worldUp = [0, 0, 1];
    var dot = Math.abs(osg.Vec3.dot(worldUp, look));
    if (Math.abs(dot - 1.0) < 0.000001)
      worldUp = [0, 1, 0];
    var side = osg.Vec3.cross(look, worldUp, []);
    var up = osg.Vec3.normalize(osg.Vec3.cross(side, look, []), []);

    var offset = 1e-6;
    return osg.Matrix.makeLookAt(osg.Vec3.sub(point, osg.Vec3.mult(look, offset, []), []), point, up);
  },

  setViewpoint: function(lat, lon, alt, heading, pitch, range, seconds) {

    var lla = [Math.deg2rad(lon), Math.deg2rad(lat), alt];

    if (seconds === undefined) {
      this.center = this.map.lla2world(lla);

      var newPitch = Math.clamp(Math.deg2rad(pitch), this.minPitch, this.maxPitch);
      var newAzim = this.normalizeAzimRad(Math.deg2rad(heading));

      this.setDistance(range);

      var localFrame = this.getCoordFrame(this.center);
      this.centerRotation = osg.Matrix.getRotate(localFrame);

      var azim_q = osg.Quat.makeRotate(newAzim, 0, 0, 1);
      var pitch_q = osg.Quat.makeRotate(-newPitch - (Math.PI / 2.0), 1, 0, 0);
      var newRot_m = osg.Matrix.makeRotateFromQuat(osg.Quat.multiply(azim_q, pitch_q));
      this.rotation = osg.Matrix.getRotate(osg.Matrix.inverse(newRot_m));

      this.localPitch = newPitch;
      this.localAzim = newAzim;

      this.recalcLocalPitchAndAzim();
      this.recalculateCenter(localFrame);
    }
    else {
      this.startViewpointTransition(lat, lon, alt, heading, pitch, range, seconds);
      this.recalculateCenter(this.getCoordFrame(this.center));
    }
  },

  frame: function() {
    if (this.settingVP) {
      this.updateSetViewpoint();
    }

    if (this.continuousZoom != 0) {
      this.zoomModel(0, this.continuousZoom);
    }

    if (this.continuousPanX != 0 || this.continuousPanY != 0) {
      this.panModel(this.continuousPanX, this.continuousPanY);
    }
  },

  getMatrix: function() {
    var m = osg.Matrix.makeTranslate(0, 0, this.distance);
    osg.Matrix.postMult(osg.Matrix.makeRotateFromQuat(this.rotation), m);
    osg.Matrix.postMult(osg.Matrix.makeRotateFromQuat(this.centerRotation), m);
    osg.Matrix.postMult(osg.Matrix.makeTranslate(this.center[0], this.center[1], this.center[2]), m);
    return m;
  },

  getInverseMatrix: function() {
    this.frame();
    var m = osg.Matrix.makeTranslate(-this.center[0], -this.center[1], -this.center[2]);
    osg.Matrix.postMult(osg.Matrix.makeRotateFromQuat(osg.Quat.inverse(this.centerRotation)), m);
    osg.Matrix.postMult(osg.Matrix.makeRotateFromQuat(osg.Quat.inverse(this.rotation)), m);
    osg.Matrix.postMult(osg.Matrix.makeTranslate(0, 0, -this.distance), m);
    return m;
  }
});/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.MapManipulator = function(map) {
    ReadyMap.Manipulator.call(this, map);
    this.computeHomePosition();
};

ReadyMap.MapManipulator.prototype = osg.objectInehrit(ReadyMap.Manipulator.prototype, {

    computeHomePosition: function() {
        this.center = [0, 0, 0];
        this.distance = osgearth.Extent.width(this.map.profile.extent) / 2;
        this.maxDistance = this.distance * 1.5;
    },

    setViewpoint: function(lat, lon, alt, heading, pitch, range, seconds) {
        if (seconds === undefined || seconds == 0) {
            var lla = [Math.deg2rad(lon), Math.deg2rad(lat), alt];
            this.center = this.map.lla2world(lla);
            this.setDistance(range);
        }
        else {
            this.startViewpointTransition(lat, lon, alt, heading, pitch, range, seconds);
        }
    },

    panModel: function(dx, dy) {
        var scale = -0.3 * this.distance;
        this.center = osg.Vec3.add(this.center, [dx * scale, dy * scale, 0], []);
        osgearth.Extent.clamp(this.map.profile.extent, this.center);
    },

    zoomModel: function(dx, dy) {
        var fd = 1000;
        var scale = 1 + dy;
        if (fd * scale > this.minDistance)
            this.setDistance(this.distance * scale);
        else
            this.setDistance(this.minDistance);
    },

    frame: function() {
        if (this.settingVP) {
            this.updateSetViewpoint();
        }

        if (this.continuousZoom != 0) {
            this.zoomModel(0, this.continuousZoom);
        }

        if (this.continuousPanX != 0 || this.continuousPanY != 0) {
            this.panModel(this.continuousPanX, this.continuousPanY);
        }
    },

    getInverseMatrix: function() {
        this.frame();
        var eye = [];
        osg.Vec3.copy(this.center, eye);
        eye[2] = this.distance;
        var m = osg.Matrix.makeLookAt(eye, this.center, [0, 1, 0]);
        return m;
    },

    mousemove: function(ev) {
        if (this.buttonup === true)
            return;

        var pos = this.convertEventToCanvas(ev);
        var curX = pos[0];
        var curY = pos[1];

        var scaleFactor = 100.0;
        var deltaX = (this.clientX - curX) / scaleFactor;
        var deltaY = (this.clientY - curY) / scaleFactor;
        this.clientX = curX;
        this.clientY = curY;

        this.panModel(-deltaX, -deltaY);
        return false;
    },

    mousewheel: function(ev, intDelta, deltaX, deltaY) {
        this.zoomModel(0, intDelta * -0.1);
    }
});/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
* MapView
* Installs a 3D WebGL viewer within an HTML5 canvas elements.
*/
ReadyMap.MapView = function(elementId, size, map, args) {

    this.map = map;
    this.viewer = null;
    this.endFrame = undefined;
    this.frameNum = 0;
    this.frameTimes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.frameRate = 0.0;
    this.lastTime = new Date().getTime();

    var canvas = document.getElementById(elementId);
    canvas.width = size.w;
    canvas.height = size.h;

    this.root = new osg.Node();

    //try {    
    this.viewer = new osgViewer.Viewer(canvas, { alpha: false });

    //If you don't do this then the mouse manipulators listen for mouse events on the whole dom
    //so dragging other controls end up moving the canvas view.
    this.viewer.eventNode = this.viewer.canvas;

    this.viewer.init();
    if (map.geocentric)
        this.viewer.setupManipulator(new ReadyMap.EarthManipulator(map));
    else
        this.viewer.setupManipulator(new ReadyMap.MapManipulator(map));

    // by default, set up a small near/far clipping plane ratio:
    this.viewer.view.nearFarRatio = 0.00001;

    this.mapNode = new osgearth.MapNode(map);

    if (args !== undefined) {
        if (args.verticalScale !== undefined) {
            this.setVerticalScale(args.verticalScale);
        }
    }

    this.root.addChild(this.mapNode);

    // enable blending for transparency
    this.root.getOrCreateStateSet().setAttributeAndMode(
        new osg.BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'));


    this.viewer.setScene(this.root);
    delete this.viewer.view.light;
    this.viewer.getManipulator().computeHomePosition();
    //this.viewer.run();
    this.run();
    //}
    //catch (er) {
    //osg.log("exception in osgViewer " + er);
    //}

    this.frameEnd = [];
};

ReadyMap.MapView.prototype = {

    home: function() {
        this.viewer.getManipulator().computeHomePosition();
    },

    zoom: function(delta) {
        this.viewer.getManipulator().zoomModel(0, delta);
    },

    setVerticalScale: function(value) {
        this.mapNode.setVerticalScale(value);
    },

    projectObjectIntoWindow: function(object) {
        var viewMatrix = this.viewer.view.getViewMatrix();
        var projectionMatrix = this.viewer.view.getProjectionMatrix();
        var windowMatrix = null;
        var vp = this.viewer.view.getViewport();
        if (vp !== undefined) {
            windowMatrix = vp.computeWindowMatrix();
        }

        var matrix = [];
        osg.Matrix.copy(windowMatrix, matrix);
        osg.Matrix.preMult(matrix, projectionMatrix);
        osg.Matrix.preMult(matrix, viewMatrix);

        var result = osg.Matrix.transformVec3(matrix, object);
        var height = this.viewer.canvas.height;
        result[1] = height - result[1] - 1;
        return result;
    },

    run: function() {
        var that = this;
        var render = function() {
            window.requestAnimationFrame(render, this.canvas);

            var startTime = new Date().getTime() * 0.001;

            that.viewer.frame();

            if (that.frameEnd !== undefined && that.frameEnd != null) {
                //Fire off any frame end callbacks
                for (var i = 0; i < that.frameEnd.length; i++) {
                    that.frameEnd[i]();
                }
            }

            var endTime = new Date().getTime() * 0.001;
            var f0 = that.frameNum % 10;
            that.frameTimes[f0] = endTime - that.lastTime;
            var total = 0.001;
            for (var t = 0; t < 10; t++) {
                total += that.frameTimes[t];
            }
            that.frameRate = 10.0 / total;
            that.lastTime = endTime;
            that.frameNum++;

            that.map.frame();
        };

        render();
    },

    addFrameEndCallback: function(callback) {
        this.frameEnd.push(callback);
    }
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.PositionedElement = function(id, lon, lat, alt, options) {
  this.hAlign = "left";
  this.vAlign = "top";
  this.lat = lat;
  this.lon = lon;
  this.alt = alt;
  this.offset = [0,0];
  this.ecf = null;
  this._dirty = true;
  
  var defaults = {
    hAlign: "left",
    vAlign: "top",
    offset: [0,0]
  };
  
  var options = jQuery.extend({}, defaults, options);     
  
  this.vAlign = options.vAlign;
  this.hAlign = options.hAlign;
  
  if (options.element !== undefined) {
     this.element = options.element;
  }    
  
  this.id = id;
  this.ownsElement = this.element !== undefined;
  if (this.element === undefined) {
    this.element = jQuery("#" + id);
    //If we found an existing element we don't own it
    if (this.element) {
        this.ownsElement = false;    
    }
  } 
}

ReadyMap.PositionedElement.prototype = {  

  destroy : function() {
    if (this.ownsElement) {
      this.element.remove();
    }        
  },

  setLocation: function(lon, lat, alt) {
    if (this.lon != lon || this.lat != lat || this.alt != alt) {
      this.lon = lon;
      this.lat = lat;
      this.alt = alt;
      _dirty = true;
    }      
  },
  
  sizeChanged: function() {
      if (this.element._lastSize !== undefined ) {
	    var changed = (this.element._lastSize[0] != this.element.width() ||
		               this.element._lastSize[1] != this.element.height());
		return changed;
		
	  }
	  return true;
  },
  
  hide : function() {
    this.element.hide();
  },
  
  show : function() {
    this.element.show();
  },
  
  toggle: function(visible) {
     this.element.toggle(visible);
  },
  
  update : function(mapView) {
      if (this.ecf == null || this._dirty) {      
        var ecf = mapView.map.lla2world([this.lon, this.lat, this.alt]);
        this._dirty = false;
        this.ecf = ecf;
      }
	                    
      //Cluster cull geocentric
      if (mapView.map.geocentric) {
          viewMatrix = mapView._inverseViewMatrix;
          var eye = [];      
          osg.Matrix.getTrans(viewMatrix, eye);
                    
          var lookVector = [];
          osg.Vec3.sub( this.ecf, eye, lookVector );         

          var worldUp = [];
          osg.Vec3.copy(this.ecf, worldUp);
          osg.Vec3.normalize( worldUp, worldUp );
          var dot = osg.Vec3.dot(lookVector, worldUp);
          if (dot > 0) {
            this.element.offset({top:0, left:-10000});
            return;
          }                  
      }
           
      var window = mapView.projectObjectIntoWindow(this.ecf);      
      
      var x = (window[0] + this.offset[0]).toFixed();
      var y = (window[1] + this.offset[1]).toFixed();
     
      
      //Don't reposition this element if it hasn't changed
      if (this.lastWindow !== undefined) {
        var dx = this.lastWindow[0] - x;
        var dy = this.lastWindow[1] - y;
        if (dx == 0 && dy == 0) {
            return;
        } 
      }
      
	  var width = this.element.width();
      if (this.hAlign == "right") {
        x = x - width;
      }
      
	  var height = this.element.height();
      if (this.vAlign == "bottom") {	  
        y = y - height;
      }      
	  
	  this.element._lastSize = [width, height];
          
      this.element.position( {        
        my: "left top",
        at: "left top",
        of: mapView.viewer.canvas,
        offset: x + " " + y,
        collision: "none none"
      });      
      
      this.lastWindow = [x,y];                       
  }
}/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.PositionEngine = function(mapView) {
  this.mapView = mapView;
  var me = this;
  this.mapView.addFrameEndCallback( function() {
    me.frameEnd();
  } );
  this.elements = [];
}

ReadyMap.PositionEngine.prototype = {
  addElement: function(element) {
    this.elements.push( element );
  },
  
  removeElement: function(element) {  
    var index = this.elements.indexOf( element );
    if (index >= 0) {
      element.destroy();
      this.elements.splice( index, 1 );
    }       
  },
  
  clear: function() {
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].destroy();
    }
    this.elements = [];
  },
  
  hide: function() {
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].hide();
    }
  },
  
  show: function() {
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].show();
    }
  },
  
  frameEnd: function() {
  
    //Cull elements on the other side of the earth.
    var viewMatrix = this.mapView.viewer.view.getViewMatrix();
      
	var viewChanged = true;
    if (this._lastViewMatrix !== undefined) {
      viewChanged = !osg.Matrix.equals(viewMatrix, this._lastViewMatrix);
    }
	else {
	  this._lastViewMatrix = [];
	}
      
      //Save the last view matrix
	osg.Matrix.copy(viewMatrix, this._lastViewMatrix);
	this.mapView._inverseViewMatrix = osg.Matrix.inverse( viewMatrix );                        

	for (var i = 0; i < this.elements.length; i++) {
	  if (viewChanged || this.elements[i]._dirty || this.elements[i].sizeChanged()) {
		this.elements[i].update(this.mapView);
	  }
	}
  }
}/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.ArcGISImageLayer = function(settings) {
    osgearth.ImageLayer.call(this, settings.name);
    this.url = settings.url;
    this.extension = settings.imageType !== undefined ? settings.imageType : "jpg";
};

ReadyMap.ArcGISImageLayer.prototype = osg.objectInehrit(osgearth.ImageLayer.prototype, {

    getURL: function(key, profile) {
        var imageURL = this.url + "/tile/" + key[2] + "/" + key[1] + "/" + key[0] + "." + this.extension;
        if (this.args !== undefined && this.args != null) {
          imageURL += "?" + this.args;
        }

        return osgearth.getURL( imageURL );		
    },

    createTexture: function(key, profile) {
        var imageURL = this.getURL(key, profile);
        return osg.Texture.createFromURL(imageURL);
    }
});/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.GeoRSSLayer = function(mapView, url, rate, iconOptions) {
    this.mapView = mapView;
    this.url = url;

    var defaults = {
        url: "http://google-maps-icons.googlecode.com/files/redblank.png",
        width: 32,
        height: 32,
        cssClass: ""
    };
    this.options = jQuery.extend({}, defaults, iconOptions);

    this.positionEngine = new ReadyMap.PositionEngine(mapView);

    var thisObj = this;
    this.reader = new ReadyMap.GeoRSSReader(url, rate, function(items) { thisObj.createIcons(items); });
};


function showDialog(content, title) {
    //Create a new div on the fly
    return $('<div/>').html(content).dialog({
        bgiframe: true,
        resizable: false,
        modal: false,
        draggable: false,
        title: title,
        overlay: {
            backgroundColor: '#000',
            opacity: 0.5
        }
    });
}

ReadyMap.GeoRSSLayer.prototype = {
    setRate: function(newRate) {
        this.reader.setRate(newRate);
    },

    createIcons: function(items) {
        //this.positionEngine.elements = [];
        this.positionEngine.clear();

        for (var i in items) {
            var icon = new ReadyMap.Icon("icon" + i + "_" + items[i].guid, Math.deg2rad(items[i].longitude), Math.deg2rad(items[i].latitude), 0, this.options.url, {
                width: this.options.width,
                height: this.options.height,
                cssClass: this.options.cssClass,
                title: items[i].title
            });

            icon.offset = [this.options.width / -2, this.options.height * -1];
            icon.element.bind("click", { url: items[i].link,
                title: items[i].title,
                engine: this.positionEngine,
                lat: items[i].latitude,
                lon: items[i].longitude,
                description: items[i].description
            }, function(e) {
                var html = "<div><h3>" + e.data.title + "</h3>" +
  			                 "   <p> " + e.data.description + "</p>";
                if (e.data.url !== undefined && e.data.url != null) {
                    html += '<a href="' + e.data.url + '" target="_blank">Link</a>';
                }
                html += "</div>";
                var dlg = showDialog(html, e.data.title);
                dlg = dlg.parent();
                e.data.engine.addElement(new ReadyMap.PositionedElement("dlg", Math.deg2rad(e.data.lon), Math.deg2rad(e.data.lat), 0, { element: dlg, vAlign: "bottom" }));
            });
            this.positionEngine.addElement(icon);
        }
    }
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.GeoRSSReader = function(url, rate, updateCallback) {
    this.url = url;

    this.callbacks = new Array;
    if (updateCallback != undefined)
        this.callbacks.push(updateCallback);

    this.updateFeed();
    this.setRate(rate);
};

ReadyMap.GeoRSSReader.prototype = {
    updateFeed: function() {
        this.items = new Array;

        if (this.url != undefined) {
            var items = this.items;
            var callbacks = this.callbacks;

            $.ajax(
			{
			    url: this.url,
			    type: "GET",
			    dataType: "xml",

			    success: function(data) {
			        var selector = $(data).find('item').length > 0 ? 'item' : 'entry';
			        $(data).find(selector).each(function(i) {
			            var lat = undefined;
			            var lon = undefined;

			            var point = $(this).find('georss\\:point').text();
			            if (point == "")
			                point = $(this).find('point').text();

			            if (point != "") {
			                lat = point.split(" ")[0];
			                lon = point.split(" ")[1];
			            }
			            else {
			                lat = $(this).find('geo\\:lat').text();
			                lon = $(this).find('geo\\:long').text();

			                if (lat == "" || lon == "") {
			                    lat = $(this).find('lat').text();
			                    lon = $(this).find('long').text();
			                }
			            }

			            var description = undefined;
			            try {
			                description = $(this).find('description').get(0).innerHTML;
			            }
			            catch (e) { }

			            if (description == undefined || description == "")
			                description = $(this).find('description').text()

			            items.push({ guid: $(this).find('guid').text(),
			                title: $(this).find('title').text(),
			                author: $(this).find('author').text(),
			                pubDate: $(this).find('pubDate').text(),
			                description: description,
			                link: $(this).find('link').text(),
			                latitude: lat,
			                longitude: lon,
			                src: $(this).get()
			            });
			        });

			        for (var i in callbacks) {
			            var callback = callbacks[i];
			            callback(items);
			        }
			    },

			    error: function(jqXHR, status, error) {
			        //alert("Eror reading RSS feed: " + status);
			        for (var i in callbacks) {
			            var callback = callbacks[i];
			            callback(items);
			        }
			    }
			});
        }
    },

    setRate: function(newRate) {
        if (this.interval != undefined)
            window.clearInterval(this.interval);

        this.rate = newRate;
        if (this.rate > 0)
            this.interval = window.setInterval(function(layer) { layer.updateFeed(); }, this.rate * 1000, this);
    },

    addCallback: function(updateCallback) {
        if (updateCallback != undefined) {
            this.callbacks.push(updateCallback);
            updateCallback(this.items);
        }
    }
};/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.HeatMapNode = function(map, data) {
    osg.Node.call(this);
    this.map = map;
    this.originLLA = {
        lat: Math.deg2rad(data.origin.lat),
        lon: Math.deg2rad(data.origin.lon)
    };
    this.spacingLL = {
        lat: Math.deg2rad(data.spacing.lat),
        lon: Math.deg2rad(data.spacing.lon)
    };
    this.extentLLA = {
        xmin: Math.deg2rad(data.origin.lon),
        xmax: Math.deg2rad(data.origin.lon + data.spacing.lon * data.numCols),
        ymin: Math.deg2rad(data.origin.lat),
        ymax: Math.deg2rad(data.origin.lat + data.spacing.lat * data.numRows)
    };
    this.minHeight = 5.0;
    this.maxHeight = 2500.0;

    this.dataArray = [];
    for (var i = 0; i < data.data.length; ++i) {
        this.dataArray.push(parseFloat(data.data[i].value));
    }
    this.heightField = new osgearth.HeightField(data.numCols, data.numRows, this.dataArray);

    for (var times = 0; times < 2; times++) {
        for (var col = 1; col < data.numCols - 2; col++) {
            for (var row = 1; row < data.numRows - 2; row++) {
                var a =
                    this.heightField.getHeight(col - 1, row - 1) +
                    this.heightField.getHeight(col, row - 1) +
                    this.heightField.getHeight(col + 1, row - 1) +
                    this.heightField.getHeight(col - 1, row) +
                    this.heightField.getHeight(col, row) +
                    this.heightField.getHeight(col + 1, row) +
                    this.heightField.getHeight(col - 1, row + 1) +
                    this.heightField.getHeight(col, row + 1) +
                    this.heightField.getHeight(col + 1, row + 1);
                this.heightField.setHeight(col, row, a/8);
            }
        }
    }

    this.build();
};

ReadyMap.HeatMapNode.prototype = osg.objectInehrit(osg.Node.prototype, {

    insertArray: function(from, to, toIndex) {
        for (var i = 0; i < from.length; i++) {
            to[toIndex + i] = from[i];
        }
    },

    rampColor: function(v, vmin, vmax) {
        var c = [1, 1, 1];
        if (vmin === undefined)
            vmin = 0.0;
        if (vmax === undefined)
            vmax = 1.0;
        var dv = vmax - vmin;
        if (v < (vmin + 0.25 * dv)) {
            c[0] = 0;
            c[1] = 4 * (v - vmin) / dv;
        }
        else if (v < (vmin + 0.5 * dv)) {
            c[0] = 0;
            c[2] = 1 + 4 * (vmin + 0.25 * dv - v) / dv;
        }
        else if (v < (vmin + 0.75 * dv)) {
            c[0] = 4 * (v - vmin - 0.5 * dv) / dv;
            c[2] = 0;
        }
        else {
            c[1] = 1 + 4 * (vmin + 0.75 * dv - v) / dv;
            c[2] = 0;
        }
        return c;
    },

    build: function() {

        var verts = [];
        var elements = [];
        var normals = [];
        var colors = [];

        // anchor point in world coords
        var centerWorld = this.map.lla2world([this.originLLA.lon, this.originLLA.lat, 0]);

        // local-to-world transform matrix
        var local2world = this.map.threeD ?
            this.map.profile.ellipsoid.local2worldFromECEF(centerWorld) :
            osg.Matrix.makeTranslate(this.centerWorld[0], this.centerWorld[1], this.centerWorld[2]);

        // world-to-local transform matrix:
        var world2local = [];
        osg.Matrix.inverse(local2world, world2local);

        var numRows = this.heightField.getNumRows();
        var numCols = this.heightField.getNumColumns();

        // find the extremes so we can scale colors
        var minValue = 99999999.0;
        var maxValue = -minValue;
        for (var row = 0; row < numRows; row++) {
            for (var col = 0; col < numCols; col++) {
                var height = this.heightField.getHeight(col, row);
                if (height < minValue) {
                    minValue = height;
                }
                if (height > maxValue) {
                    maxValue = height;
                }
            }
        }

        var e = 0, v = 0, c = 0, vi = 0;

        for (var row = 0; row < numRows; row++) {

            var t = row / (numRows - 1);

            for (var col = 0; col < numCols; col++) {

                var s = col / (numCols - 1);

                var height = this.heightField.getHeight(col, row);
                var nheight = (height - minValue) / (maxValue - minValue);
                height = this.minHeight + nheight * (this.maxHeight - this.minHeight);
                var lla = [this.extentLLA.xmin + this.spacingLL.lon * col, this.extentLLA.ymin + this.spacingLL.lat * row, height];

                var world = this.map.lla2world(lla);
                var vert = osg.Matrix.transformVec3(world2local, world, []);
                this.insertArray(vert, verts, v);

                // todo: fix for elevation
                var normal = this.map.geocentric ? osg.Vec3.normalize(vert, []) : [0, 0, 1];
                this.insertArray(normal, normals, v);
                v += 3;

                var color = this.rampColor(nheight);
                color[3] = nheight > 0.25 ? 0.75 : nheight * 3.0;

                this.insertArray(color, colors, c);
                c += 4;

                // the elements indicies:
                if (col < numCols - 1 && row < numRows - 1) {
                    this.insertArray([vi, vi + 1, vi + 1 + numCols, vi + 1 + numCols, vi + numCols, vi], elements, e);
                    e += 6;
                }
                vi++;
            }
        }

        this.geometry = new osg.Geometry();
        this.geometry.getAttributes().Vertex = new osg.BufferArray(gl.ARRAY_BUFFER, verts, 3);
        this.geometry.getAttributes().Normal = new osg.BufferArray(gl.ARRAY_BUFFER, normals, 3);
        this.geometry.getAttributes().Color = new osg.BufferArray(gl.ARRAY_BUFFER, colors, 4);
        var tris = new osg.DrawElements(gl.TRIANGLES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, elements, 1));
        this.geometry.getPrimitives().push(tris);

        // put it under the localization transform:
        var xform = new osg.MatrixTransform();
        xform.setMatrix(local2world);
        xform.addChild(this.geometry);
        this.addChild(xform);

        this.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
    },

    traverse: function(visitor) {
        var n = this.children.length;
        for (var i = 0; i < n; i++) {
            this.children[i].accept(visitor);
        }
    }

});


ReadyMap.HeatMapNode.prototype.objectType = osg.objectType.generate("HeatMapNode");

osg.CullVisitor.prototype[ReadyMap.HeatMapNode.prototype.objectType] = function(node) {
    if (node.stateset)
        this.pushStateSet(node.stateset);

    this.traverse(node);

    if (node.stateset)
        this.popStateSet();
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
 * ImageLayer that uses the Leaflet API to access image tiles.
 */

ReadyMap.LeafletImageLayer = function(settings) {
  osgearth.ImageLayer.call(this, settings.name);
  this.args = settings.args !== undefined ? settings.args : null;
  
  // source Leaflet layer object
  this.sourceLayer = settings.sourceLayer !== undefined ? settings.sourceLayer : null;
};


ReadyMap.LeafletImageLayer.prototype = osg.objectInehrit(osgearth.ImageLayer.prototype, {

  getURL: function(key, profile) {
    var y = key[1];
    if (this.sourceLayer.options.scheme === 'tms') {
      var size = profile.getTileCount(key[2]);
      y = (size[1] - 1) - key[1];
    }
    return this.sourceLayer.getTileUrl({ x: key[0], y: y }, key[2]);
  },

  createTexture: function(key, profile) {
    var imageURL = this.getURL(key, profile);
    var encodedURL = osgearth.getURL(imageURL);
    if (this.sourceLayer.format !== undefined) {
      encodedURL += "&mimeType=" + this.sourceLayer.format;
    }
    return osg.Texture.createFromURL(encodedURL);
  }
});/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Map = function(args) {
    osgearth.Map.call(this, args);
};

ReadyMap.Map.prototype = osg.objectInehrit(osgearth.Map.prototype, {
});/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
 * ImageLayer that uses the OpenLayers API to access image tiles.
 */

ReadyMap.OLImageLayer = function (settings) {
    osgearth.ImageLayer.call(this, settings.name);
    this.args = settings.args !== undefined ? settings.args : null;

    // source OpenLayers layer object
    this.sourceLayer = settings.sourceLayer !== undefined ? settings.sourceLayer : null;

    var that = this;
    if (this.sourceLayer !== null) {
        //Override the setOpacity function to use our setOpacity function
        this.sourceLayer.setOpacity = function (opacity) {
            if (opacity != this.opacity) {
                this.opacity = opacity;
                that.setOpacity(opacity);
            }
        };

        //Override the setVisibility function to use our setEnabled function
        this.sourceLayer.setVisibility = function (visibility) {
            if (this.visibility != visibility) {
                this.visibility = visibility;
                that.setVisible(this.visibility);
            }
        }

    }
};


ReadyMap.OLImageLayer.prototype = osg.objectInehrit(osgearth.ImageLayer.prototype, {

  getURL: function(key, profile) {
    var ex = osgearth.TileKey.getExtent(key, profile);
    var bounds = new OpenLayers.Bounds();
    bounds.left = Math.rad2deg(ex.xmin);
    bounds.right = Math.rad2deg(ex.xmax);
    bounds.bottom = Math.rad2deg(ex.ymin);
    bounds.top = Math.rad2deg(ex.ymax);
    bounds.centerLonLat = new OpenLayers.LonLat(0.5 * (bounds.left + bounds.right), 0.5 * (bounds.bottom + bounds.top));
    return this.sourceLayer.getURL(bounds);
  },

  createTexture: function(key, profile) {
    var imageURL = this.getURL(key, profile);
    var encodedURL = osgearth.getURL(imageURL);
    if (this.sourceLayer.format !== undefined) {
      encodedURL += "&mimeType=" + this.sourceLayer.format;
    }
    return osg.Texture.createFromURL(encodedURL); //osgearth.getURL(imageURL));
  }
});
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.TMSImageLayer = function(settings) {
    osgearth.ImageLayer.call(this, settings.name);
    this.url = settings.url;
    this.flipY = settings.tmsType !== "google";
    this.extension = settings.imageType !== undefined ? settings.imageType : "jpg";
    this.baseLevel = settings.baseLevel !== undefined ? settings.baseLevel : 0;
    this.args = settings.args !== undefined ? settings.args : null;
};

ReadyMap.TMSImageLayer.prototype = osg.objectInehrit(osgearth.ImageLayer.prototype, {

    getURL: function(key, profile) {
        var y = key[1];

        if (this.flipY) {
            var size = profile.getTileCount(key[2]);
            y = (size[1] - 1) - key[1];
        }

        var imageURL = this.url + "/" + (key[2] + this.baseLevel) + "/" + key[0] + "/" + y + "." + this.extension;
        if (this.args !== undefined && this.args != null) {
            imageURL += "?" + this.args;
        }

        return osgearth.getURL(imageURL);
    },

    createTexture: function(key, profile) {
        var imageURL = this.getURL(key, profile);
        return osg.Texture.createFromURL(imageURL);
    }
});/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.TMSElevationLayer = function(settings) {
    osgearth.ElevationLayer.call(this, settings.name);
    this.url = settings.url;
    this.flipY = settings.tmsType !== "google";
    this.extension = "json";
    this.baseLevel = settings.baseLevel !== undefined ? settings.baseLevel : 0;
    this.args = settings.args !== undefined ? settings.args : null;
};

ReadyMap.TMSElevationLayer.prototype = osg.objectInehrit(osgearth.ElevationLayer.prototype, {

    getURL: function(key, profile) {
        var y = key[1];

        if (this.flipY) {
            var size = profile.getTileCount(key[2]);
            y = (size[1] - 1) - key[1];
        }

        var url = this.url + "/" + (key[2] + this.baseLevel) + "/" + key[0] + "/" + y + "." + this.extension;
        if (this.args !== undefined && this.args != null) {
            url += "?" + this.args;
        }

        return osgearth.getURL(url);
    },

    createHeightField: function(key, profile, loadNow) {
        var url = this.getURL(key, profile);
        return new osgearth.WebHeightField(url, loadNow);
    }
});/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.WMSImageLayer = function(settings) {
    osgearth.ImageLayer.call(this, settings.name);
    this.url = settings.url;
    this.version = settings.version !== undefined ? settings.version : "1.1.1";
    this.format = settings.format !== undefined ? settings.format : "image/jpeg";
    this.profile = settings.profile !== undefined ? settings.profile : new osgearth.GeodeticProfile();
    this.args = settings.args !== undefined ? settings.args : null;
    this.layers = settings.layers !== undefined ? settings.layers : "default";
    this.width = settings.width !== undefined ? settings.width : 256;
    this.height = settings.height !== undefined ? settings.height : 256;
    this.srs = settings.srs !== undefined ? settings.srs : "EPSG:4326";
    this.styles = settings.styles !== undefined ? settings.styles : "";
};

ReadyMap.WMSImageLayer.prototype = osg.objectInehrit(osgearth.ImageLayer.prototype, {

    getURL: function(key) {
        var size = this.profile.getTileSize(key[2]);
        var xmin = this.profile.extent.xmin + (size[0] * key[0]);
        var ymax = this.profile.extent.ymax - (size[1] * key[1]);
        var xmax = xmin + size[0];
        var ymin = ymax - size[1];

        xmin = Math.rad2deg(xmin);
        ymin = Math.rad2deg(ymin);
        xmax = Math.rad2deg(xmax);
        ymax = Math.rad2deg(ymax);

        var sep = this.url.indexOf("?") >= 0 ? "&" : "?";

        var imageURL = [
		               this.url,
					   sep,
		               "SERVICE=WMS",
					   "&VERSION=" + this.version,
					   "&REQUEST=GetMap",
					   "&LAYERS=" + this.layers,
					   "&FORMAT=" + this.format,
					   "&STYLES=" + this.styles,
					   "&SRS=" + this.srs,
					   "&WIDTH=" + this.width,
					   "&HEIGHT=" + this.height,
                       "&BBOX=" + xmin + "," + ymin + "," + xmax + "," + ymax
					   ].join("");

        if (this.args !== undefined && this.args != null) {
            imageURL += "&" + this.args;
        }

        return osgearth.getURL(imageURL);
    },

    createTexture: function(key, profile) {
        var imageURL = this.getURL(key, profile);
        return osg.Texture.createFromURL(imageURL);
    }
});
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/


ReadyMap.WOEIDWeatherLayer = function(mapView, places, rate, proxy, iconOptions) {
    this.positionEngine = new ReadyMap.PositionEngine(mapView);
	this.places = places;
	this.rate = rate;
	this.proxy = proxy;
	
	var defaults = {
	  url: "http://google-maps-icons.googlecode.com/files/cloudsun.png",
      width: 32,
      height: 32,
      cssClass: "",
	  renderer: undefined
    };
    this.options = jQuery.extend({}, defaults, iconOptions);
	
	this.readers = [];
	this.icons = [];
	this.init();
};

ReadyMap.WOEIDWeatherLayer.prototype = {
    init: function() {
		for (var i in this.places)
		{
		    var place = this.places[i];
			var thisObj = this;
			ReadyMap.PlaceSearch.doSearch(place, function(lat, lon, swlat, swlon, nelat, nelon, data) {
			    var woeid = $(data).find('woeId').eq(0).text();
				if (woeid != undefined && woeid != '')
				  thisObj.createReader(woeid);
			});
		}
	},
	
	createReader: function(id) {
	    var url = this.proxy + 'http://weather.yahooapis.com/forecastrss?w=' + id;
		var thisObj = this;
		var renderer = this.options.renderer;
		this.readers[id] = new ReadyMap.GeoRSSReader(url, this.rate, function(items) {
		    if (renderer != undefined)
			    renderer(items[0], id);
			else
			    thisObj.createIcon(items[0], id);
		});
	},
	
	createIcon: function(item, id) {
		var active = false;
	    if (this.icons[id] != undefined)
		{
		    if (this.icons[id].popup != undefined)
			{
				this.positionEngine.removeElement(this.icons[id].popup);
				active = true;
			}
				
		    this.positionEngine.removeElement(this.icons[id]);
			this.icons[id] = undefined;
		}
		
	    var icon = new ReadyMap.Icon("icon" + id, Math.deg2rad(item.longitude), Math.deg2rad(item.latitude), 0, this.options.url, {
		  width: this.options.width,
		  height: this.options.height,
		  cssClass: this.options.cssClass,
		  title: item.title
		});
		
		icon.offset = [this.options.width / -2, this.options.height / -2];
		
		if (active)
		{
			this.createIconPopup(icon, id, item.latitude, item.longitude, item.title, item.description, item.link);
		}
		
		var thisObj = this;
		icon.element.bind("click", {url: item.link,
									title: item.title,
									engine: this.positionEngine,
									lat: item.latitude,
									lon: item.longitude,
									description: item.description,
									icon: icon,
									id: id
									}, function(e) {
			  if (e.data.icon.popup != undefined)
			  {
			    e.data.engine.removeElement(e.data.icon.popup);
				e.data.icon.popup = undefined;
			  }
			  else
			  {
				  thisObj.createIconPopup(e.data.icon, e.data.id, e.data.lat, e.data.lon, e.data.title, e.data.description, e.data.url);
			  }
			});
		
		this.icons[id] = icon;
		this.positionEngine.addElement( icon );
	},
	
	createIconPopup: function(icon, id, lat, lon, title, content, url) {
		var htmlElem = $('<div class="weather_popup_background"><div class="weather_popup"><h4 class="weather_popup">' + title + '</h4>' + content + '</div></div>');		
		jQuery("body").append(htmlElem);
		
		htmlElem[0].onselectstart = function() { return false; }
		htmlElem[0].onmousedown   = function() { return false; }
		
		htmlElem.bind("click", { icon: icon }, function(e) {
			$(e.data.icon.element).click();
		});
		
		var popup = new ReadyMap.PositionedElement("popup_" + id, Math.deg2rad(lon), Math.deg2rad(lat), 0, {element: htmlElem, vAlign: "bottom"});
		icon.popup = popup;
		this.positionEngine.addElement(popup);
	}
};
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Controls = {}/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Controls.GeoRSSList = function(element_id, mapView, classid) {
    this.id = element_id;
    this.element = $("#" + element_id);
    this.mapView = mapView;
    this.classid = classid
    this.items = undefined;
    this.init();
};

ReadyMap.Controls.GeoRSSList.prototype = {
    init: function() {
        this.element.append('...');
    },

    setItems: function(items) {
        this.items = items;
        this.renderList();
    },

    renderList: function() {
        this.element.empty();

        var mapView = this.mapView;
        var element = this.element;
        var classid = this.classid;

        $.each(this.items, function(i, value) {
            var itemDiv;
            if (classid == undefined) {
                itemDiv = $('<div style="padding: 4px;' + (i == 0 ? '' : ' border-top: 1px dotted #999;') + '">' + value.title + (value.link == undefined || value.link.length < 0 ? '' : '...<a href="' + value.link + '" target="_blank">Details</a>') + '</div>');
                $(itemDiv).hover(
		  function() {
		      $(this).css("color", "#09f");
		  },
		  function() {
		      $(this).css("color", "");
		  });
            }
            else {
                itemDiv = $('<div class="' + classid + '">' + value.title + (value.link == undefined || value.link.length < 0 ? '' : '...<a href="' + value.link + '">Details</a>') + '</div>');
            }

            $(itemDiv).click(function() {
                mapView.viewer.manipulator.setViewpoint(value.latitude, value.longitude, 0.0, 0, -90, 2000000, 1);
            });

            element.append(itemDiv);
        });
    }
};/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Icon = function(id, lon, lat, alt, url, options) {  
  ReadyMap.PositionedElement.call(this, id, lon, lat, alt);    
  this.url = url;
  this.ownsElement = true;
    
  var defaults = {
    width: 64,
    height: 64,
    cssClass: ""
  };
 
  
  var options = jQuery.extend({}, defaults, options);
  
  this.width = options.width;
  this.height = options.height;
  this.cssClass = options.cssClass;
  
  this.element = jQuery('<img id="' + this.id + '" class="' + options.cssClass + '" src="' + url +
                        '" width="' + this.width + '" height="' + this.height +
						(options.title != undefined ? '" title="' + options.title : '') + '"/>');
						
  //Disable selection
  this.element[0].onselectstart = function() { return false;} //id;
  this.element[0].onmousedown   = function() { return false;} //id;
						
  jQuery("body").append(this.element);                         
}

ReadyMap.Icon.prototype = osg.objectInehrit(ReadyMap.PositionedElement.prototype, {
 getWidth : function() {
   return this.width;
 },
 
 setWidth: function(width) {
   setSize(width, this.height);
 }, 
  
 getHeight : function() {
   return this.height;
 },
 
  setHeight: function(height) {
    setSize(this.width, height);
  },
 
 setSize: function(width, height) {
   if (this.height != height || this.width != width) {
     this.width = width;
     this.height = height;
     this.element.attr('height', this.height);
     this.element.attr('width', this.width);
   }
 }
 
 
});/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Label = function(id, lon, lat, alt, text, options) {  
  ReadyMap.PositionedElement.call(this, id, lon, lat, alt);    
  this.text = text;
  this.ownsElement = true;
    
  var defaults = {
    cssClass: ""
  };
 
  
  var options = jQuery.extend({}, defaults, options);
  
  this.cssClass = options.cssClass;
  
  this.element = jQuery('<span id="' + this.id + '" class="' + options.cssClass + '">' + this.text + '</span>');
  //Disable selection
  this.element[0].onselectstart = function() { return false;} //id;
  this.element[0].onmousedown   = function() { return false;} //id;

  jQuery("body").append(this.element);                         
}

ReadyMap.Label.prototype = osg.objectInehrit(ReadyMap.PositionedElement.prototype, {
 
});
/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Controls.LayerSwitcher = function(element_id, map) {
    this.id = element_id;
    this.element = jQuery("#" + element_id);
    this.map = map;
    this.init();
};

ReadyMap.Controls.LayerSwitcher.prototype = {
    init: function() {
        //Remove all existing children
        jQuery(this.element).children().remove();

        jQuery(this.element).append('<div class="ui-widget-header"><span id="layer-header-toggle" style="float:left" class="ui-icon ui-icon-triangle-1-s"></span>Layers</div>');

        var layerContainer = jQuery('<div id="layer_container"/>');
        jQuery(this.element).append(layerContainer);



        jQuery("#layer-header-toggle").bind("click", function() {
            jQuery("#layer_container").slideToggle();
            var l = jQuery(this);
            if (l.hasClass("ui-icon-triangle-1-s")) {
                l.removeClass("ui-icon-triangle-1-s");
                l.addClass("ui-icon-triangle-1-e");
            }
            else if (l.hasClass('ui-icon-triangle-1-e')) {
                l.addClass("ui-icon-triangle-1-s");
                l.removeClass("ui-icon-triangle-1-e");
            }
        });

        for (var i = 0; i < this.map.imageLayers.length; i++) {
            var layer = this.map.imageLayers[i];
            var div = jQuery('<div id="layer_"' + i + '>')
                        .addClass('ui-widget-content ui-state-default ui-corner-all ui-helper-clearfix');
            jQuery(div).append('<input id="layercheck_' + i + '" type="checkbox" checked="checked"/><span>' + layer.name + '</span>');
            jQuery(div).append('<div id="layeropacity_' + i + '" class="opacity-slider"></div>');

            jQuery(layerContainer).append(div);

            jQuery("#layercheck_" + i).bind("click", { layer: layer }, function(event) {
                var checked = jQuery(this).attr("checked");
                event.data.layer.setVisible(checked);
            });

            jQuery('#layeropacity_' + i).slider({
                min: 0,
                max: 100,
                value: layer.getOpacity() * 100.0,
                range: "min",
                layer: layer,
                slide: function(event, ui) {
                    var opacity = ui.value / 100.0;
                    var lyr = jQuery(this).data('slider').options.layer;
                    lyr.setOpacity(opacity);
                }
            });
        }
    }
};/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
 * PlaceSearch
 * Geolocator based on Yahoo geocoding
 */

//........................................................................

// Creates style-able input element. Mostly provided as a convenience.
ReadyMap.PlaceSearch = function(parentId, inputId, callback)
{
  if (inputId == undefined)
    inputId = "inputPlaceSearch";
  
  document.getElementById(parentId).innerHTML = 'Search: <input id="' + inputId + '" size="20em" type="text" onkeydown="if(event.keyCode==13) ReadyMap.PlaceSearch.doSearch(value, ' + callback + ');" />';
};

ReadyMap.PlaceSearch.doSearch = function(place, callback)
{
  var pelicanProxyURI = "http://demo.pelicanmapping.com/rmweb/proxy.php";
  var yahooGeocodeURI = "http://local.yahooapis.com/MapsService/V1/geocode";
  var yahooPlaceURI   = "http://wherein.yahooapis.com/v1/document";
  var yahooAppId = "n51Mo.jV34EwZuxIhJ0GqHLzPXoZyjSG6jhLJsQ1v1q975Lf9g7iC4gRYKecVQ--";
  
  if (place != undefined && typeof callback == "function")
  {
    var yahooURI = encodeURI(yahooPlaceURI);
	$.ajax(
	{
	  url:pelicanProxyURI,
	  async: "false",
	  type: "POST",
	  headers: { "Connection": "close" },
	  data:
	  {
	    url: yahooURI, mimeType: "text/xml",
        documentContent: encodeURI(place),
        documentType: "text/plain",
        appid: yahooAppId
	  },

      success: function(data)
	  {
		var xml = data.documentElement;

		try
		{
			var lat = xml.getElementsByTagName("latitude")[0].firstChild.nodeValue;
			var lon = xml.getElementsByTagName("longitude")[0].firstChild.nodeValue;

			var southWest = xml.getElementsByTagName("southWest")[0];
			var swlat = southWest.getElementsByTagName("latitude")[0].firstChild.nodeValue;
			var swlon = southWest.getElementsByTagName("longitude")[0].firstChild.nodeValue;

			var northEast = xml.getElementsByTagName("northEast")[0];
			var nelat = northEast.getElementsByTagName("latitude")[0].firstChild.nodeValue;
			var nelon = northEast.getElementsByTagName("longitude")[0].firstChild.nodeValue;
			  
			callback(lat, lon, swlat, swlon, nelat, nelon, data);
		}
		catch (e)
		{
			callback(0,0,0,0,0,0,"Cannot find location: " + place);
		}
      },
	  
	  error: function(jqXHR, status, error)
	  {
		callback(0,0,0,0,0,0,status);
      }
	});
  }
};/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Controls.Pan = function(mapView, parent) {
    this.mapView = mapView;
    this._parent = parent;
    this.init();
};

ReadyMap.Controls.Pan.prototype = {
    init: function() {
        var that = this;
        //Create the new parent element
        this._container = jQuery("<div>").addClass("readymap-control-pan");
        var parent = "body";
        if (this._parent !== undefined) {
            parent = "#" + this._parent;
        }
        jQuery(parent).append(this._container);       

        //Create the pan left button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-pan-left readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousPanX = 0.01;
                         })
        );

        //Create the pan right button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-pan-right readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousPanX = -0.01;
                         })
        );

        //Create the pan up button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-pan-up readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousPanY = -0.01;
                         })
        );

        //Create the pan down button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-pan-down readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousPanY = 0.01;
                         })
        );

        //Create the home button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-home readymap-control-button")
                         .bind("click", function() {
                             that.mapView.home();
                         })
        );



        //Listen to mouseup on the body of the document to reset the continous pan to 0
        jQuery("body").bind("mouseup", function() {
            that.mapView.viewer.getManipulator().continuousPanX = 0;
            that.mapView.viewer.getManipulator().continuousPanY = 0;
        });
    }
};/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Controls.Zoom = function(mapView, parent) {
    this.mapView = mapView;
    this._parent = parent;
    this.init();
};

ReadyMap.Controls.Zoom.prototype = {
    init: function() {
        var that = this;
        //Create the new parent element
        this._container = jQuery("<div>").addClass("readymap-control-zoom");
        var parent = "body";
        if (this._parent !== undefined) {
            parent = "#" + this._parent;
        }
        jQuery(parent).append(this._container);

        //Create the zoom-in button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-zoom-in readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousZoom = -0.01;
                         })
        );

        //Create the zoom-out button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-zoom-out readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousZoom = 0.01;
                         })
        );

        //Listen to mouseup on the body of the document to reset the continous zoom to 0
        jQuery("body").bind("mouseup", function() {
            that.mapView.viewer.getManipulator().continuousZoom = 0;
        });
    }
};
if (typeof OpenLayers !== 'undefined') {

    OpenLayers.Map.prototype.finishGlobe = function () {
        var size = { "w": $(this.div).width(), "h": $(this.div).height() };
        this._mapView = new ReadyMap.MapView(this._canvasId, size, this._map);
    }

    OpenLayers.Map.prototype.setupGlobe = function(globe) {
        // create the ReadyMap map model:
        this._map = new ReadyMap.Map();

        this._canvasId = this.div.id + "_canvas";
        this._canvas = $("<canvas/>").attr("id", this._canvasId);
        $(this.div).append(this._canvas);

        //Initialize the prototypes        

        //Attach a new destroy function that removes the canvas from the parent div
        this.destroy = function() {
            OpenLayers.Map.prototype.destroy.call(this);
            $(this._canvas).remove();
        }

        //Override addLayer so that it adds layers to our ReadyMap map
        this.addLayer = function(layer) {
            OpenLayers.Map.prototype.addLayer.call(this, layer);

            if (layer instanceof OpenLayers.Layer.Grid) {
                //Add the layer to the ReadyMap map
                this._map.addImageLayer(new ReadyMap.OLImageLayer({
                    name: layer.name,
                    sourceLayer: layer
                }));
            }
            else if (layer instanceof OpenLayers.Layer.Markers) {                		
			    //TODO:  Draw any markers that are within the layer
                //this._map.addMarkerLayer(new ReadyMap.OLMarkerLayer({}));
            }
        };

        var panScale = 0.002;
        this.pan = function(dx, dy, options) {
            if (this.is3D) {
                this._mapView.viewer.getManipulator().panModel(-dx * panScale, dy * panScale);
            }
            else {
                OpenLayers.Map.prototype.pan.call(this, dx, dy, options);
            }
        };

        var zoomScale = 0.1;
        this.zoomIn = function() {
            if (this.is3D) {
                this._mapView.viewer.getManipulator().zoomModel(0, -zoomScale);
            }
            else {
                OpenLayers.Map.prototype.zoomIn.call(this);
            }
        };

        this.zoomOut = function() {
            if (this.is3D) {
                this._mapView.viewer.getManipulator().zoomModel(0, zoomScale);
            }
            else {
                OpenLayers.Map.prototype.zoomOut.call(this);
            }
        };

        this.zoomToExtent = function(bounds, closest) {
            if (this.is3D) {
                if (bounds === null) {
                    bounds = new OpenLayers.Bounds(-180, -90, 180, 90);
                }
                var width = bounds.getWidth();
                var height = bounds.getHeight();
                var maxDim = width > height ? width : height;
                var radius = maxDim / 2.0;
                var center = bounds.getCenterLonLat();

                var range = ((.5 * radius) / 0.267949849) * 111000.0;
                if (range != 0)
                    this._mapView.viewer.manipulator.setViewpoint(center.lat, center.lon, 0.0, 0, -90, range);
            }
            else {
                OpenLayers.Map.prototype.zoomToExtent.call(this, bounds, closest);
            }
        };



        this.show3D = function() {
            this.is3D = true;
            $(this._canvas).show();
            $(this.viewPortDiv).hide();

            if (this._mapView !== undefined) {
                var extent = this.getExtent();
                if (extent !== null) {
                    this.zoomToExtent(extent, false);
                }
                else {
                    this.zoomToMaxExtent();
                }
				
				//Show any markers
				if (this._positionEngine !== undefined) {
				  this._positionEngine.show();
				}
            }
        };

        this.show2D = function() {
            this.is3D = false;
            $(this._canvas).hide();
            $(this.viewPortDiv).show();

            if (this._mapView !== undefined) {
                var viewMatrix = this._mapView.viewer.view.getViewMatrix();
                viewMatrix = osg.Matrix.inverse(viewMatrix);
                var eye = [];
                osg.Matrix.getTrans(viewMatrix, eye);
                var lla = this._mapView.map.profile.ellipsoid.ecef2lla(eye);
                lla[0] = Math.rad2deg(lla[0]);
                lla[1] = Math.rad2deg(lla[1]);
                var range = lla[2];

                var radius = ((range / 111000.0) * 0.267949849) / 0.5;
                var bounds = new OpenLayers.Bounds(lla[0] - radius, lla[1] - radius, lla[0] + radius, lla[1] + radius);
                if (bounds.getWidth() > 360.0 || bounds.getHeight() > 180) {
                    this.zoomToMaxExtent();
                }
                else {
                    this.zoomToExtent(bounds, false);
                }
				
				//Hide any markers
				if (this._positionEngine !== undefined) {
				  this._positionEngine.hide();
				}
            }

            //var extent = this.getExtent();
            //this.zoomToExtent(this.getExtent());
        };

        this.set3D = function(is3D) {
            if (is3D) this.show3D();
            else this.show2D();
        };

        this.set3D(true);
    }
	
	var markerId = 0;
	
	OpenLayers.Layer.Markers.prototype.base_addMarker = OpenLayers.Layer.Markers.prototype.addMarker;
	OpenLayers.Layer.Markers.prototype.addMarker = function( marker ) {
        OpenLayers.Layer.Markers.prototype.base_addMarker.call( this, marker );				
		
		if (this.map._mapView) {		  
		  if (this.map._positionEngine === undefined) {
		    this.map._positionEngine = new ReadyMap.PositionEngine( this.map._mapView )
		  }
		  
		  var lat = marker.lonlat.lat;
		  var lon = marker.lonlat.lon;
		  var icon_url = marker.icon.url;
		  var width = marker.icon.size.w;
		  var height = marker.icon.size.h;
		  
		  markerId++;
		  var icon = new ReadyMap.Icon("icon" + markerId, Math.deg2rad(lon), Math.deg2rad(lat), 0, icon_url, {
              width: width,
              height: height
            });
          this.map._positionEngine.elements.push( icon );  
		}
	}
}if (typeof L !== 'undefined') {

  L.Map.prototype._base_initialize = L.Map.prototype.initialize;

  L.Map.prototype.initialize = function(id, options) {
    var container = L.DomUtil.get(id);
    var divHeight = $("#" + id).height();
    var divWidth = $("#" + id).width();
    if (options.globe && options.splitview)
      divWidth = Math.floor(divWidth / 2) - 2;

    this._leafletDivId = 'leaflet_div';
    this._leafletDiv = L.DomUtil.create('div', '', container);
    this._leafletDiv.id = this._leafletDivId;

    document.getElementById(this._leafletDivId).style.width = divWidth + "px";
    document.getElementById(this._leafletDivId).style.height = divHeight + "px";

    this._base_initialize(this._leafletDivId, options);

    if (this.options.globe) {
      this._rmDivId = 'rm_div';
      this._rmDiv = L.DomUtil.create('div', '', container);
      this._rmDiv.id = this._rmDivId;

      document.getElementById(this._rmDivId).style.width = divWidth + "px";
      document.getElementById(this._rmDivId).style.height = divHeight + "px";

      if (this.options.splitview) {
        document.getElementById(this._leafletDivId).style.position = 'absolute';
        document.getElementById(this._leafletDivId).style.left = "0px";
        document.getElementById(this._leafletDivId).style.top = "0px";
        document.getElementById(this._rmDivId).style.position = 'absolute';
        document.getElementById(this._rmDivId).style.left = (divWidth + 4) + "px";
        document.getElementById(this._rmDivId).style.top = "0px";
      }

      this._rmMap = new ReadyMap.Map();

      //TODO: Temp code, needs to be replaced by ability to specify projection
      this._rmMap.profile = new osgearth.MercatorProfile();
      this._rmMap.profile.baseTilesX = 1;
      this._rmMap.profile.baseTilesY = 1;

      //TODO: This code will be used in place of finalizeGlobe method once
      //      ReadyMap has been fixed to support an initial map without layers
      //var size = { "w": $(this._rmDiv).width(), "h": $(this._rmDiv).height() };
      //this.MapView = new ReadyMap.MapView(this._canvasId, size, this._rmMap);

      this._canvasId = "rm_canvas";
      this._canvas = L.DomUtil.create('canvas', '', document.getElementById(this._rmDivId));
      this._canvas.id = this._canvasId;

      this.on('viewreset', this.onLeafletViewReset, this);
      this.on('move', this.onLeafletViewReset, this);
    }
  }

  L.Map.prototype.onLeafletViewReset = function() {
    if (this._loaded) {
      var bounds = this.getBounds();
      var width = Math.abs(bounds.getNorthEast().lng - bounds.getSouthWest().lng) % 180.0;
      if (bounds.getNorthEast().lng < bounds.getSouthWest().lng)
        width = 180.0 - width;
      var height = bounds.getNorthEast().lat - bounds.getSouthWest().lat;

      var maxDim = width > height ? width : height;
      var radius = maxDim / (width > height ? 4.0 : 2.0);
      var center = bounds.getCenter();

      var range = ((.5 * radius) / 0.267949849) * 111000.0;
      if (range != 0)
        this.MapView.viewer.manipulator.setViewpoint(center.lat, center.lng, 0.0, 0, -90, range);
    }
  }

  L.Map.prototype._base_addLayer = L.Map.prototype.addLayer;

  L.Map.prototype.addLayer = function(layer) {
    this._base_addLayer(layer);

    this._rmMap.addImageLayer(new ReadyMap.LeafletImageLayer({
      name: "Leaflet TileLayer",
      sourceLayer: layer
    }));
  }

  //L.Map.prototype._base_addControl = L.Map.prototype.addControl;

  //L.Map.prototype.addControl = function(control) {
  //  this._base_addControl(control);
  //  
  //  
  //}

  L.Map.prototype.finalizeGlobe = function() {
    if (this.options.globe && this._rmMap) {
      if (!this.options.splitview)
        document.getElementById(this._leafletDivId).style.display = 'none';

      var size = { "w": $(this._rmDiv).width(), "h": $(this._rmDiv).height() };
      this.MapView = new ReadyMap.MapView(this._canvasId, size, this._rmMap);

      this.onLeafletViewReset();
    }
  }

  L.Map.prototype.show3D = function() {
    if (this.options.globe) {
      document.getElementById(this._leafletDivId).style.display = 'none';
      document.getElementById(this._rmDivId).style.display = 'block';
      //document.getElementById(this._rmDivId).appendChild(document.getElementById("leaflet-control-container"));
    }
  }

  L.Map.prototype.show2D = function() {
    if (this.options.globe) {
      document.getElementById(this._rmDivId).style.display = 'none';
      document.getElementById(this._leafletDivId).style.display = 'block';
      //document.getElementById(this._leafletDivId).appendChild(document.getElementById("leaflet-control-container"));
    }
  }

}/*
* Daniel Gaston
* 
* Add Buildings functionality for ReadyMap/WebGL
* 
* License: LGPL
*/
var RealFlow = {};


RealFlow.BuildingNode = function(map, data, polOrLinOrPoi, buil_start, buil_end, color_choice) {

    osg.Node.call(this);
    var height_weighting = 1; //vertical exaggeration
    this.map = map;

    this.originLLA = {

        lat: Math.deg2rad(data[buil_start].vertices[0].lat),
        lon: Math.deg2rad(data[buil_start].vertices[0].lon)
    };
    this.heightField = [];

    this.build(data, height_weighting, polOrLinOrPoi, buil_start, buil_end, color_choice);
};


RealFlow.BuildingNode.prototype = osg.objectInehrit(osg.Node.prototype, {

    insertArray: function(from, to, toIndex) {
        for (var i = 0; i < from.length; i++) {
            to[toIndex + i] = from[i];
        }
    },

    rampColor: function(height, height_weighting) {

        if (height <= 2 * height_weighting) {
            var c = [0, 0, 0, 1]
        }
        else if (height <= 9 * height_weighting) {
            var c = [0, 0, 1, 1]
        }
        else if (height <= 15 * height_weighting) {
            var c = [0, 1, 0, 1]
        }
        else if (height <= 30 * height_weighting) {
            var c = [1, 1, 0, 1]
        }
        else if (height <= 60 * height_weighting) {
            var c = [1, 0.46, 0, 1]
        }
        else {
            var c = [1, 0, 0, 1];
        }

        return c;
    },

    rampColor2: function(index, height, height_weighting, hoja, hojas) {


        var length = hojas.length;
        var dif = Math.floor(length / 3); //35
        var indice;
        var c = [0, 0, 0, 1];

        if (height <= 2 * height_weighting) {
            return c;
        }
        for (var i = 0; i < length; i++) {
            if (hoja == hojas[i]) {
                indice = i;
            }
        }
        if (indice <= dif) {
            c = [((indice + 1) / dif), 0, 0, 1];
            return c;

        }
        if ((indice <= 2 * dif) && (indice > dif)) {
            c = [1, ((indice - dif) / dif), 0, 1];
            return c;
        }
        else {
            c = [1, 1, ((indice - (2 * dif)) / (dif + 1)), 1];
            return c;
        }
    },

    build: function(data, height_weighting, polOrLinOrPoi, buil_start, buil_end, color_choice) {

        var verts = [];

        if (polOrLinOrPoi == '1') {
            var elements = [];
            var last_index = 0;


            var roof = []; //Stores roof´s triangle elements
            for (var index = buil_start; index < buil_end; index++) {

                var roofOutline = [];
                var misDatosTecho = [];

                var lon = wrapBuilding(data, index, elements, last_index); //draws buildings side faces
                createRoofOutline(data, index, last_index, roofOutline);

                // Array of indices that a roof consists of
                createRoofData(data, index, misDatosTecho, roof, last_index, roofOutline);
                last_index = last_index + lon;

            }
        }
        if (polOrLinOrPoi == '2') {
            var lines1 = [];
            var lines2 = [];
            wrapBuildingLines(data, buil_start, buil_end);
        }
        if (polOrLinOrPoi == '3') {
            var points1 = [];
            pointsIndices(data, buil_start, buil_end);
        }
        var normals = [];
        var colors = [];


        function pointsIndices(data, buil_start, buil_end) {
            var last_index = 0;

            for (var index = buil_start; index < buil_end; index++) {
                for (var i = 0; i < data[index].vertices.length; i++) {

                    if (data[index].vertices[i].lon == -0.323081) {
                        console.log('puerto de valencia en index: ' + index);
                    }
                    points1.push(last_index);
                    last_index++;

                }
            }

        }

        function wrapBuildingLines(data, buil_start, buil_end) {	 //number of repeated edges equal to number of prism base -1 (cube = 3)
            var last_index = 0;

            for (var index = buil_start; index < buil_end; index++) {
                var longitud = data[index].vertices.length;

                if (longitud % 2 != 0) {
                    console.log('edificio ' + index + ' tiene longitud impar');
                }
                var parIgual = false;
                var imparAdelantado = true;
                lines1.push(last_index + 0);
                lines2.push(last_index + 0);
                lines1.push(last_index + 1);
                lines2.push(last_index + 2);
                lines1.push(last_index + 1);
                lines2.push(last_index + 2);
                for (var i = 2; i < longitud - 1; i++) {//both lines share element 0 and 1

                    if (i % 2 !== 0) {
                        if (!imparAdelantado) {
                            lines1.push(i + last_index);
                            lines1.push(i + last_index);
                            lines2.push(i + last_index + 1);
                            lines2.push(i + last_index + 1);
                            imparAdelantado = !imparAdelantado;
                        }
                        else {
                            lines1.push(i + last_index - 1);
                            lines1.push(i + last_index - 1);
                            lines2.push(i + last_index + 2);
                            lines2.push(i + last_index + 2);
                            imparAdelantado = !imparAdelantado;
                        }
                    }
                    else {
                        if (!parIgual) {
                            lines1.push(i + last_index + 1);
                            lines1.push(i + last_index + 1);
                            lines2.push(i + last_index + 1);
                            lines2.push(i + last_index + 1);
                            parIgual = !parIgual;
                        }
                        else {
                            lines1.push(i + last_index);
                            lines1.push(i + last_index);
                            lines2.push(i + last_index);
                            lines2.push(i + last_index);
                            parIgual = !parIgual;
                        }

                    }

                }

                //depends on the prism base relying upon it is odd or even
                if ((longitud / 2) % 2 == 0) {//even number prism base
                    lines1.push(last_index + i - 1);
                    lines1.push(last_index + i - 1);
                    lines2.push(last_index + 1);
                    lines1.push(last_index + 0);

                }
                else {
                    lines1.push(last_index + i);
                    lines1.push(last_index + i);
                    lines2.push(last_index + 0);
                    lines1.push(last_index + 1);

                }
                last_index = last_index + longitud;
            }
        }

        function wrapBuilding(data, index, elements, last_index) {

            var normal_out = true;
            for (var i = 0; i < data[index].vertices.length - 2; i++) {

                if (normal_out) {
                    elements.push(last_index + i);
                    elements.push(last_index + i + 1);
                    elements.push(last_index + i + 2);
                    normal_out = !normal_out;

                }
                else {	//we define such differentiation in order to create the triangles in different order so that internally, the cull face is determined, pointing out
                    elements.push(last_index + i + 1);
                    elements.push(last_index + i);
                    elements.push(last_index + i + 2);
                    normal_out = !normal_out;

                }
            }

            elements.push(last_index + data[index].vertices.length - 2); //1st trinagle of last face
            elements.push(last_index + data[index].vertices.length - 1);
            elements.push(last_index);

            elements.push(last_index); 									//2nd trinagle of last face
            elements.push(last_index + data[index].vertices.length - 1);
            elements.push(last_index + 1);

            return data[index].vertices.length;
        }
        function createRoofOutline(data, index, last_index, roofOutline) {

            for (var i = 0; i < data[index].vertices.length; i = i + 2) { //even vertices conform the roof

                roofOutline.push(last_index + i);
                temp = new RealFlow.poly2tri_Point(parseFloat(data[index].vertices[i].lon), parseFloat(data[index].vertices[i].lat))
                misDatosTecho.push(temp);
            }
        }

        function createRoofData(data, index, misDatosTecho, roof, last_index, roofOutline) {

            var misDatosTriangulacion = new Array();

            //prepare sweep Context
            var pointsAndEdges = new RealFlow.poly2tri_SweepContext(misDatosTecho);

            // triangulate
            try {
                var triangles = RealFlow.poly2tri_sweep_Triangulate(pointsAndEdges); //guardamos el array con los puntos, no indices


            } catch (err) {
                console.log('Roof failure creation, building: ' + index);
            }

            if (triangles) {
                var tempChange
                var tempx;
                var tempy;

                //finding indices
                for (var i = 0; i < triangles.length; i++) {
                    //we change the order of the points that consist a triangle, in order to make the normal point out.

                    tempChange = triangles[i].points_[2];
                    triangles[i].points_[2] = triangles[i].points_[0];
                    triangles[i].points_[0] = tempChange;

                    var check = 0;

					//JB:  What is this check doing
                    for (var j = 0; j < 3; j++) {

                        tempx = triangles[i].points_[j].x;
                        tempy = triangles[i].points_[j].y;
                        for (var k = 0; k < data[index].vertices.length; k += 2) {//k+=2 due to points with same coordinates. The first one is always the one whic carries roof height info
                            if ((tempx == data[index].vertices[k].lon) && (tempy == data[index].vertices[k].lat)) {
                                roof.push(last_index + k); // array with triangles indices
                                check++;
                                break;
                            }
                        }
                    }
					
                    if (check != 3) {				
					    console.log('Triangle point retrieving Error. Building: ' + index + " check=" + check);
                        //window.alert('Triangle point retrieving Error. Building: ' + index + " check=" + check);												
						//Remove the last points that are causing errors					
                    }
                }
            } else {
				console.log('Triangle point retrieving Error. Building: ' + index);
                //window.alert('Triangle point retrieving Error. Building: ' + index); //redundant. RealFlow.poly2tri_sweep_Triangulate is already within try-catch 				
				/*
				for (var i = 0; i < check; i++) {
				   roof.splice( roof.length -1, 1 );
				}*/
            }
        }


        // anchor point in world coords
        var centerWorld = this.map.lla2world([this.originLLA.lon, this.originLLA.lat, 0]);

        // local-to-world transform matrix
        var local2world = this.map.threeD ?
            this.map.profile.ellipsoid.local2worldFromECEF(centerWorld) :
            osg.Matrix.makeTranslate(this.centerWorld[0], this.centerWorld[1], this.centerWorld[2]);

        // world-to-local transform matrix:
        var world2local = [];
        osg.Matrix.inverse(local2world, world2local);

        var v = 0, c = 0, vi = 0, n_v = 0;

        var hojas = [];
        var hoja_flag;
        var hoja;

        hojas.push(data[0].hoja)

        for (var index2 = 1; index2 < data.length; index2++) {
            hoja_flag = false;
            hoja = data[index2].hoja

            for (var i = 0; i < hojas.length; i++) {
                if (hoja == hojas[i]) {
                    hoja_flag = true;
                }
            }

            if (!hoja_flag) {
                hojas.push(hoja);
            }
        }

        console.log('Cadaster Sheets : ' + hojas);

        for (var index = buil_start; index < buil_end; index++) {
            for (var i = 0; i < data[index].vertices.length; i++) {

                this.heightField.push(parseFloat(data[index].vertices[i].altura) * height_weighting);

                var height = this.heightField[vi];
                var lla = [Math.deg2rad(data[index].vertices[i].lon), Math.deg2rad(data[index].vertices[i].lat), height];
                var world = this.map.lla2world(lla);
                var vert = osg.Matrix.transformVec3(world2local, world, []);
                this.insertArray(vert, verts, v);

                // todo: fix for elevation
                var normal = this.map.geocentric ? osg.Vec3.normalize(vert, []) : [0, 0, 1]; //PENDING
                this.insertArray(normal, normals, v);
                v += 3;

				var color = [0.5,0.5,0.5,1];				
                if (color_choice == '0') {
                    color = this.rampColor(height, height_weighting);
                }
                else if (color_choice == '1') {
                    color = this.rampColor2(index, height, height_weighting, data[index].hoja, hojas);
                }				
					
				
				
                this.insertArray(color, colors, c);
                c += 4;

                vi++;
                n_v++;

            }
        }

        this.geometry = new osg.Geometry();
        this.geometry.getAttributes().Vertex = new osg.BufferArray(gl.ARRAY_BUFFER, verts, 3);
        this.geometry.getAttributes().Normal = new osg.BufferArray(gl.ARRAY_BUFFER, normals, 3);
        this.geometry.getAttributes().Color = new osg.BufferArray(gl.ARRAY_BUFFER, colors, 4);


        if (polOrLinOrPoi == '1') {
            //Planes Representation
            var tris = new osg.DrawElements(gl.TRIANGLES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, elements, 1));
            this.geometry.getPrimitives().push(tris);


            var tris2 = new osg.DrawElements(gl.TRIANGLES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, roof, 1));
            this.geometry.getPrimitives().push(tris2);
        }

        if (polOrLinOrPoi == '2') {
            //Edges Representation
            var lin1 = new osg.DrawElements(gl.LINES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, lines1, 1));
            this.geometry.getPrimitives().push(lin1);

            var lin2 = new osg.DrawElements(gl.LINES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, lines2, 1));
            this.geometry.getPrimitives().push(lin2);
        }
        if (polOrLinOrPoi == '3') {
            //Edges Representation
            var point1 = new osg.DrawElements(gl.POINTS, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, points1, 1));
            this.geometry.getPrimitives().push(point1);

        }


        // put it under the localization transform:
        var xform = new osg.MatrixTransform();
        xform.setMatrix(local2world);
        xform.addChild(this.geometry);
        this.addChild(xform);

        this.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('FRONT')); //culling mode changed to FRONT

    },

    traverse: function(visitor) {
        var n = this.children.length;
        for (var i = 0; i < n; i++) {
            this.children[i].accept(visitor);
        }
    }

});

RealFlow.BuildingNode.prototype.objectType = osg.objectType.generate("BuildingNode");

osg.CullVisitor.prototype[RealFlow.BuildingNode.prototype.objectType] = function(node) {
    if (node.stateset)
        this.pushStateSet(node.stateset);

    this.traverse(node);

    if (node.stateset)
        this.popStateSet();
};


/* Poly2tri adaptation to ReadyMap by Daniel Gaston
* Poly2Tri Copyright (c) 2009-2010, Poly2Tri Contributors
* http://code.google.com/p/poly2tri/
*
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without modification,
* are permitted provided that the following conditions are met:
*
* * Redistributions of source code must retain the above copyright notice,
*   this list of conditions and the following disclaimer.
* * Redistributions in binary form must reproduce the above copyright notice,
*   this list of conditions and the following disclaimer in the documentation
*   and/or other materials provided with the distribution.
* * Neither the name of Poly2Tri nor the names of its contributors may be
*   used to endorse or promote products derived from this software without specific
*   prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
* "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
* LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
* A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
* CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
* EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
* PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
* PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
* LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
* NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
* SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


//Namespace('RealFlow.poly2tri');


// ------------------------------------------------------------------------Point

RealFlow.poly2tri_Point = function() {
    this.x = null;
    this.y = null;

    if (arguments.length == 0) {
        this.x = 0.0;
        this.y = 0.0;
    } else if (arguments.length == 2) {
        this.x = arguments[0];
        this.y = arguments[1];
    } else {
        alert('Invalid RealFlow.poly2tri_Point constructor call!');
    }


    // The edges this point constitutes an upper ending point
    this.edge_list = [];


};


/**
* Set this Point instance to the origo. <code>(0; 0)</code>
*/
RealFlow.poly2tri_Point.prototype.set_zero = function() {
    this.x = 0.0;
    this.y = 0.0;
};


/**
* Set the coordinates of this instance.
* @param   x   number.
* @param   y   number;
*/
RealFlow.poly2tri_Point.prototype.set = function(x, y) {
    this.x = x;
    this.y = y;
}


/**
* Negate this Point instance. (component-wise)
*/
RealFlow.poly2tri_Point.prototype.negate = function() {
    this.x = -this.x;
    this.y = -this.y;
}


/**
* Add another Point object to this instance. (component-wise)
* @param   n   Point object.
*/
RealFlow.poly2tri_Point.prototype.add = function(n) {
    this.x += n.x;
    this.y += n.y;
}


/**
* Subtract this Point instance with another point given. (component-wise)
* @param   n   Point object.
*/
RealFlow.poly2tri_Point.prototype.sub = function(n) {
    this.x -= n.x;
    this.y -= n.y;
}


/**
* Multiply this Point instance by a scalar. (component-wise)
* @param   s   scalar.
*/
RealFlow.poly2tri_Point.prototype.mul = function(s) {
    this.x *= s;
    this.y *= s;
}


/**
* Return the distance of this Point instance from the origo.
*/
RealFlow.poly2tri_Point.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
}


/**
* Normalize this Point instance (as a vector).
* @return The original distance of this instance from the origo.
*/
RealFlow.poly2tri_Point.prototype.normalize = function() {
    var len = this.length();
    this.x /= len;
    this.y /= len;
    return len;
}


/**
* Test this Point object with another for equality.
* @param   p   Point object.
* @return <code>True</code> if <code>this == p</code>, <code>false</code> otherwise.
*/
RealFlow.poly2tri_Point.prototype.equals = function(p) {
    return RealFlow.poly2tri_equals(this, p);
}


/**
* Negate a point component-wise and return the result as a new Point object.
* @param   p   Point object.
* @return the resulting Point object.
*/
RealFlow.poly2tri_negate = function(p) {
    return new RealFlow.poly2tri_Point(-p.x, -p.y);
}


/**
* Compare two points component-wise.
* @param   a   Point object.
* @param   b   Point object.
* @return <code>-1</code> if <code>a &lt; b</code>, <code>1</code> if
*         <code>a &gt; b</code>, <code>0</code> otherwise.
*/
RealFlow.poly2tri_cmp = function(a, b) {
    if (a.y == b.y) {
        return a.x - b.x;
    } else {
        return a.y - b.y;
    }
}


/**
* Add two points component-wise and return the result as a new Point object.
* @param   a   Point object.
* @param   b   Point object.
* @return the resulting Point object.
*/
RealFlow.poly2tri_add = function(a, b) {
    return new RealFlow.poly2tri_Point(a.x + b.x, a.y + b.y);
}


/**
* Subtract two points component-wise and return the result as a new Point object.
* @param   a   Point object.
* @param   b   Point object.
* @return the resulting Point object.
*/
RealFlow.poly2tri_sub = function(a, b) {
    return new RealFlow.poly2tri_Point(a.x - b.x, a.y - b.y);
}


/**
* Multiply a point by a scalar and return the result as a new Point object.
* @param   s   the scalar (a number).
* @param   p   Point object.
* @return the resulting Point object.
*/
RealFlow.poly2tri_mul = function(s, p) {
    return new RealFlow.poly2tri_Point(s * p.x, s * p.y);
}


/**
* Test two Point objects for equality.
* @param   a   Point object.
* @param   b   Point object.
* @return <code>True</code> if <code>a == b</code>, <code>false</code> otherwise.
*/
RealFlow.poly2tri_equals = function(a, b) {
    return a.x == b.x && a.y == b.y;
}


/**
* Peform the dot product on two vectors.
* @param   a   Point object.
* @param   b   Point object.
* @return The dot product (as a number).
*/
RealFlow.poly2tri_dot = function(a, b) {
    return a.x * b.x + a.y * b.y;
}


/**
* Perform the cross product on either two points (this produces a scalar)
* or a point and a scalar (this produces a point).
* This function requires two parameters, either may be a Point object or a
* number.
* @return a Point object or a number, depending on the parameters.
*/
RealFlow.poly2tri_cross = function() {
    var a0_p = false;
    var a1_p = false;
    if (arguments.length == 2) {
        if (typeof (arguments[0]) == 'number') {
            a0_p = true;
        }
        if (typeof (arguments[1] == 'number')) {
            a1_p = true;
        }


        if (a0_p) {
            if (a1_p) return arguments[0].x * arguments[1].y - arguments[0].y * arguments[1].x;
            else return new RealFlow.poly2tri_Point(arguments[1] * arguments[0].y, -arguments[1] * arguments[0].x);
        } else {
            if (a1_p) return new RealFlow.poly2tri_Point(-arguments[0] * arguments[1].y, arguments[0] * arguments[1].x);
            else return arguments[0] * arguments[1];
        }
    } else {
        alert('Invalid RealFlow.poly2tri_cross call!');
        return undefined;
    }
}




// -------------------------------------------------------------------------Edge
RealFlow.poly2tri_Edge = function() {
    this.p = null;
    this.q = null;

    if (arguments.length == 2) {
        if (arguments[0].y > arguments[1].y) {
            this.q = arguments[0];
            this.p = arguments[1];
        } else if (arguments[0].y == arguments[1].y) {
            if (arguments[0].x > arguments[1].x) {
                this.q = arguments[0];
                this.p = arguments[1];
            } else if (arguments[0].x == arguments[1].x) {
                alert('Invalid RealFlow.poly2tri_edge constructor call: repeated points!' + arguments[0].x + "," + arguments[0].y);
            } else {
                this.p = arguments[0];
                this.q = arguments[1];
            }
        } else {
            this.p = arguments[0];
            this.q = arguments[1];
        }
    } else {
        alert('Invalid RealFlow.poly2tri_Edge constructor call!');
    }


    this.q.edge_list.push(this);
}


// ---------------------------------------------------------------------Triangle
/**
* Triangle class.<br>
* Triangle-based data structures are known to have better performance than
* quad-edge structures.
* See: J. Shewchuk, "Triangle: Engineering a 2D Quality Mesh Generator and
* Delaunay Triangulator", "Triangulations in CGAL"
* 
* @param   p1  Point object.
* @param   p2  Point object.
* @param   p3  Point object.
*/
RealFlow.poly2tri_Triangle = function(p1, p2, p3) {
    // Triangle points
    this.points_ = [null, null, null];
    // Neighbor list
    this.neighbors_ = [null, null, null];
    // Has this triangle been marked as an interior triangle?
    this.interior_ = false;
    // Flags to determine if an edge is a Constrained edge
    this.constrained_edge = [false, false, false];
    // Flags to determine if an edge is a Delauney edge
    this.delaunay_edge = [false, false, false];


    if (arguments.length == 3) {
        this.points_[0] = p1;
        this.points_[1] = p2;
        this.points_[2] = p3;
    }
}


RealFlow.poly2tri_Triangle.prototype.GetPoint = function(index) {
    return this.points_[index];
}


RealFlow.poly2tri_Triangle.prototype.GetNeighbor = function(index) {
    return this.neighbors_[index];
}


/**
* Test if this Triangle contains the Point objects given as parameters as its
* vertices.
* @return <code>True</code> if the Point objects are of the Triangle's vertices,
*         <code>false</code> otherwise.
*/
RealFlow.poly2tri_Triangle.prototype.ContainsP = function() {
    var back = true;
    for (var aidx = 0; aidx < arguments.length; ++aidx) {
        back = back && (arguments[aidx].equals(this.points_[0]) ||
                        arguments[aidx].equals(this.points_[1]) ||
                        arguments[aidx].equals(this.points_[2])
        );
    }
    return back;
}


/**
* Test if this Triangle contains the Edge objects given as parameters as its
* bounding edges.
* @return <code>True</code> if the Edge objects are of the Triangle's bounding
*         edges, <code>false</code> otherwise.
*/
RealFlow.poly2tri_Triangle.prototype.ContainsE = function() {
    var back = true;
    for (var aidx = 0; aidx < arguments.length; ++aidx) {
        back = back && this.ContainsP(arguments[aidx].p, arguments[aidx].q);
    }
    return back;
}


RealFlow.poly2tri_Triangle.prototype.IsInterior = function() {
    if (arguments.length == 0) {
        return this.interior_;
    } else {
        this.interior_ = arguments[0];
        return this.interior_;
    }
}


/**
* Update neighbor pointers.<br>
* This method takes either 3 parameters (<code>p1</code>, <code>p2</code> and
* <code>t</code>) or 1 parameter (<code>t</code>).
* @param   p1  Point object.
* @param   p2  Point object.
* @param   t   Triangle object.
*/
RealFlow.poly2tri_Triangle.prototype.MarkNeighbor = function() {
    var t;
    if (arguments.length == 3) {
        var p1 = arguments[0];
        var p2 = arguments[1];
        t = arguments[2];


        if ((p1.equals(this.points_[2]) && p2.equals(this.points_[1])) || (p1.equals(this.points_[1]) && p2.equals(this.points_[2]))) this.neighbors_[0] = t;
        else if ((p1.equals(this.points_[0]) && p2.equals(this.points_[2])) || (p1.equals(this.points_[2]) && p2.equals(this.points_[0]))) this.neighbors_[1] = t;
        else if ((p1.equals(this.points_[0]) && p2.equals(this.points_[1])) || (p1.equals(this.points_[1]) && p2.equals(this.points_[0]))) this.neighbors_[2] = t;
        //else alert('Invalid RealFlow.poly2tri_Triangle.MarkNeighbor call (1)!');
		else console.log('Triangle point retrieving Error. Building: ' + index);
    } else if (arguments.length == 1) {
        // exhaustive search to update neighbor pointers
        t = arguments[0];
        if (t.ContainsP(this.points_[1], this.points_[2])) {
            this.neighbors_[0] = t;
            t.MarkNeighbor(this.points_[1], this.points_[2], this);
        } else if (t.ContainsP(this.points_[0], this.points_[2])) {
            this.neighbors_[1] = t;
            t.MarkNeighbor(this.points_[0], this.points_[2], this);
        } else if (t.ContainsP(this.points_[0], this.points_[1])) {
            this.neighbors_[2] = t;
            t.MarkNeighbor(this.points_[0], this.points_[1], this);
        }
    } else {
        alert('Invalid RealFlow.poly2tri_Triangle.MarkNeighbor call! (2)');
    }
}


RealFlow.poly2tri_Triangle.prototype.ClearNeigbors = function() {
    this.neighbors_[0] = null;
    this.neighbors_[1] = null;
    this.neighbors_[2] = null;
}


RealFlow.poly2tri_Triangle.prototype.ClearDelunayEdges = function() {
    this.delaunay_edge[0] = false;
    this.delaunay_edge[1] = false;
    this.delaunay_edge[2] = false;
}


/**
* Return the point clockwise to the given point.
*/
RealFlow.poly2tri_Triangle.prototype.PointCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.points_[2];
    } else if (p.equals(this.points_[1])) {
        return this.points_[0];
    } else if (p.equals(this.points_[2])) {
        return this.points_[1];
    } else {
        return null;
    }
}


/**
* Return the point counter-clockwise to the given point.
*/
RealFlow.poly2tri_Triangle.prototype.PointCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.points_[1];
    } else if (p.equals(this.points_[1])) {
        return this.points_[2];
    } else if (p.equals(this.points_[2])) {
        return this.points_[0];
    } else {
        return null;
    }
}


/**
* Return the neighbor clockwise to given point.
*/
RealFlow.poly2tri_Triangle.prototype.NeighborCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.neighbors_[1];
    } else if (p.equals(this.points_[1])) {
        return this.neighbors_[2];
    } else {
        return this.neighbors_[0];
    }
}


/**
* Return the neighbor counter-clockwise to given point.
*/
RealFlow.poly2tri_Triangle.prototype.NeighborCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.neighbors_[2];
    } else if (p.equals(this.points_[1])) {
        return this.neighbors_[0];
    } else {
        return this.neighbors_[1];
    }
}


RealFlow.poly2tri_Triangle.prototype.GetConstrainedEdgeCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.constrained_edge[1];
    } else if (p.equals(this.points_[1])) {
        return this.constrained_edge[2];
    } else {
        return this.constrained_edge[0];
    }
}


RealFlow.poly2tri_Triangle.prototype.GetConstrainedEdgeCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.constrained_edge[2];
    } else if (p.equals(this.points_[1])) {
        return this.constrained_edge[0];
    } else {
        return this.constrained_edge[1];
    }
}


RealFlow.poly2tri_Triangle.prototype.SetConstrainedEdgeCW = function(p, ce) {
    if (p.equals(this.points_[0])) {
        this.constrained_edge[1] = ce;
    } else if (p.equals(this.points_[1])) {
        this.constrained_edge[2] = ce;
    } else {
        this.constrained_edge[0] = ce;
    }
}


RealFlow.poly2tri_Triangle.prototype.SetConstrainedEdgeCCW = function(p, ce) {
    if (p.equals(this.points_[0])) {
        this.constrained_edge[2] = ce;
    } else if (p.equals(this.points_[1])) {
        this.constrained_edge[0] = ce;
    } else {
        this.constrained_edge[1] = ce;
    }
}


RealFlow.poly2tri_Triangle.prototype.GetDelaunayEdgeCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.delaunay_edge[1];
    } else if (p.equals(this.points_[1])) {
        return this.delaunay_edge[2];
    } else {
        return this.delaunay_edge[0];
    }
}


RealFlow.poly2tri_Triangle.prototype.GetDelaunayEdgeCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.delaunay_edge[2];
    } else if (p.equals(this.points_[1])) {
        return this.delaunay_edge[0];
    } else {
        return this.delaunay_edge[1];
    }
}


RealFlow.poly2tri_Triangle.prototype.SetDelaunayEdgeCW = function(p, e) {
    if (p.equals(this.points_[0])) {
        this.delaunay_edge[1] = e;
    } else if (p.equals(this.points_[1])) {
        this.delaunay_edge[2] = e;
    } else {
        this.delaunay_edge[0] = e;
    }
}


RealFlow.poly2tri_Triangle.prototype.SetDelaunayEdgeCCW = function(p, e) {
    if (p.equals(this.points_[0])) {
        this.delaunay_edge[2] = e;
    } else if (p.equals(this.points_[1])) {
        this.delaunay_edge[0] = e;
    } else {
        this.delaunay_edge[1] = e;
    }
}


/**
* The neighbor across to given point.
*/
RealFlow.poly2tri_Triangle.prototype.NeighborAcross = function(p) {
    if (p.equals(this.points_[0])) {
        return this.neighbors_[0];
    } else if (p.equals(this.points_[1])) {
        return this.neighbors_[1];
    } else {
        return this.neighbors_[2];
    }
}


RealFlow.poly2tri_Triangle.prototype.OppositePoint = function(t, p) {
    var cw = t.PointCW(p);
    return this.PointCW(cw);
}


/**
* Legalize triangle by rotating clockwise.<br>
* This method takes either 1 parameter (then the triangle is rotated around
* points(0)) or 2 parameters (then the triangle is rotated around the first
* parameter).
*/
RealFlow.poly2tri_Triangle.prototype.Legalize = function() {
    if (arguments.length == 1) {
        this.Legalize(this.points_[0], arguments[0]);
    } else if (arguments.length == 2) {
        var opoint = arguments[0];
        var npoint = arguments[1];


        if (opoint.equals(this.points_[0])) {
            this.points_[1] = this.points_[0];
            this.points_[0] = this.points_[2];
            this.points_[2] = npoint;
        } else if (opoint.equals(this.points_[1])) {
            this.points_[2] = this.points_[1];
            this.points_[1] = this.points_[0];
            this.points_[0] = npoint;
        } else if (opoint.equals(this.points_[2])) {
            this.points_[0] = this.points_[2];
            this.points_[2] = this.points_[1];
            this.points_[1] = npoint;
        } else {
            alert('Invalid RealFlow.poly2tri_Triangle.Legalize call!');
        }
    } else {
        alert('Invalid RealFlow.poly2tri_Triangle.Legalize call!');
    }
}


RealFlow.poly2tri_Triangle.prototype.Index = function(p) {
    if (p.equals(this.points_[0])) return 0;
    else if (p.equals(this.points_[1])) return 1;
    else if (p.equals(this.points_[2])) return 2;
    else return -1;
}


RealFlow.poly2tri_Triangle.prototype.EdgeIndex = function(p1, p2) {
    if (p1.equals(this.points_[0])) {
        if (p2.equals(this.points_[1])) {
            return 2;
        } else if (p2.equals(this.points_[2])) {
            return 1;
        }
    } else if (p1.equals(this.points_[1])) {
        if (p2.equals(this.points_[2])) {
            return 0;
        } else if (p2.equals(this.points_[0])) {
            return 2;
        }
    } else if (p1.equals(this.points_[2])) {
        if (p2.equals(this.points_[0])) {
            return 1;
        } else if (p2.equals(this.points_[1])) {
            return 0;
        }
    }
    return -1;
}


/**
* Mark an edge of this triangle as constrained.<br>
* This method takes either 1 parameter (an edge index or an Edge instance) or
* 2 parameters (two Point instances defining the edge of the triangle).
*/
RealFlow.poly2tri_Triangle.prototype.MarkConstrainedEdge = function() {
    if (arguments.length == 1) {
        if (typeof (arguments[0]) == 'number') {
            this.constrained_edge[arguments[0]] = true;
        } else {
            this.MarkConstrainedEdge(arguments[0].p, arguments[0].q);
        }
    } else if (arguments.length == 2) {
        var p = arguments[0];
        var q = arguments[1];
        if ((q.equals(this.points_[0]) && p.equals(this.points_[1])) || (q.equals(this.points_[1]) && p.equals(this.points_[0]))) {
            this.constrained_edge[2] = true;
        } else if ((q.equals(this.points_[0]) && p.equals(this.points_[2])) || (q.equals(this.points_[2]) && p.equals(this.points_[0]))) {
            this.constrained_edge[1] = true;
        } else if ((q.equals(this.points_[1]) && p.equals(this.points_[2])) || (q.equals(this.points_[2]) && p.equals(this.points_[1]))) {
            this.constrained_edge[0] = true;
        }
    } else {
        alert('Invalid RealFlow.poly2tri_Triangle.MarkConstrainedEdge call!');
    }
}


// ------------------------------------------------------------------------utils
RealFlow.poly2tri_PI_3div4 = 3 * Math.PI / 4;
RealFlow.poly2tri_PI_2 = Math.PI / 2;
RealFlow.poly2tri_EPSILON = 1e-20;


/* 
* Inital triangle factor, seed triangle will extend 30% of
* PointSet width to both left and right.
*/
RealFlow.poly2tri_kAlpha = 0.3;


RealFlow.poly2tri_Orientation = {
    "CW": 1,
    "CCW": -1,
    "COLLINEAR": 0
};


/**
* Forumla to calculate signed area<br>
* Positive if CCW<br>
* Negative if CW<br>
* 0 if collinear<br>
* <pre>
* A[P1,P2,P3]  =  (x1*y2 - y1*x2) + (x2*y3 - y2*x3) + (x3*y1 - y3*x1)
*              =  (x1-x3)*(y2-y3) - (y1-y3)*(x2-x3)
* </pre>
*/
RealFlow.poly2tri_Orient2d = function(pa, pb, pc) {
    var detleft = (pa.x - pc.x) * (pb.y - pc.y);
    var detright = (pa.y - pc.y) * (pb.x - pc.x);
    var val = detleft - detright;
    if (val > -(RealFlow.poly2tri_EPSILON) && val < (RealFlow.poly2tri_EPSILON)) {
        return RealFlow.poly2tri_Orientation.COLLINEAR;
    } else if (val > 0) {
        return RealFlow.poly2tri_Orientation.CCW;
    } else {
        return RealFlow.poly2tri_Orientation.CW;
    }
}


RealFlow.poly2tri_InScanArea = function(pa, pb, pc, pd) {
    var pdx = pd.x;
    var pdy = pd.y;
    var adx = pa.x - pdx;
    var ady = pa.y - pdy;
    var bdx = pb.x - pdx;
    var bdy = pb.y - pdy;


    var adxbdy = adx * bdy;
    var bdxady = bdx * ady;
    var oabd = adxbdy - bdxady;


    if (oabd <= (RealFlow.poly2tri_EPSILON)) {
        return false;
    }


    var cdx = pc.x - pdx;
    var cdy = pc.y - pdy;


    var cdxady = cdx * ady;
    var adxcdy = adx * cdy;
    var ocad = cdxady - adxcdy;


    if (ocad <= (RealFlow.poly2tri_EPSILON)) {
        return false;
    }


    return true;
}


// ---------------------------------------------------------------AdvancingFront
RealFlow.poly2tri_Node = function() {
    this.point = null; // Point
    this.triangle = null; // Triangle


    this.next = null; // Node
    this.prev = null; // Node


    this.value = 0.0; // double


    if (arguments.length == 1) {
        this.point = arguments[0];
        this.value = this.point.x;
    } else if (arguments.length == 2) {
        this.point = arguments[0];
        this.triangle = arguments[1];
        this.value = this.point.x;
    } else {
        alert('Invalid RealFlow.poly2tri_Node constructor call!');
    }
}


RealFlow.poly2tri_AdvancingFront = function(head, tail) {
    this.head_ = head; // Node
    this.tail_ = tail; // Node
    this.search_node_ = head; // Node
}


RealFlow.poly2tri_AdvancingFront.prototype.head = function() {
    return this.head_;
}


RealFlow.poly2tri_AdvancingFront.prototype.set_head = function(node) {
    this.head_ = node;
}


RealFlow.poly2tri_AdvancingFront.prototype.tail = function() {
    return this.tail_;
}


RealFlow.poly2tri_AdvancingFront.prototype.set_tail = function(node) {
    this.tail_ = node;
}


RealFlow.poly2tri_AdvancingFront.prototype.search = function() {
    return this.search_node_;
}


RealFlow.poly2tri_AdvancingFront.prototype.set_search = function(node) {
    this.search_node_ = node;
}


RealFlow.poly2tri_AdvancingFront.prototype.FindSearchNode = function(x) {
    return this.search_node_;
}


RealFlow.poly2tri_AdvancingFront.prototype.LocateNode = function(x) {
    var node = this.search_node_;


    if (x < node.value) {
        while ((node = node.prev) != null) {
            if (x >= node.value) {
                this.search_node_ = node;
                return node;
            }
        }
    } else {
        while ((node = node.next) != null) {
            if (x < node.value) {
                this.search_node_ = node.prev;
                return node.prev;
            }
        }
    }
    return null;
}


RealFlow.poly2tri_AdvancingFront.prototype.LocatePoint = function(point) {
    var px = point.x;
    var node = this.FindSearchNode(px);
    var nx = node.point.x;


    if (px == nx) {
        // We might have two nodes with same x value for a short time
        if (point.equals(node.prev.point)) {
            node = node.prev;
        } else if (point.equals(node.next.point)) {
            node = node.next;
        } else if (point.equals(node.point)) {
            // do nothing
        } else {
            alert('Invalid RealFlow.poly2tri_AdvancingFront.LocatePoint call!');
            return null;
        }
    } else if (px < nx) {
        while ((node = node.prev) != null) {
            if (point.equals(node.point)) break;
        }
    } else {
        while ((node = node.next) != null) {
            if (point.equals(node.point)) break;
        }
    }


    if (node != null) this.search_node_ = node;
    return node;
}


// ------------------------------------------------------------------------Basin
RealFlow.poly2tri_Basin = function() {
    this.left_node = null; // Node
    this.bottom_node = null; // Node
    this.right_node = null; // Node
    this.width = 0.0; // number
    this.left_highest = false;
}


RealFlow.poly2tri_Basin.prototype.Clear = function() {
    this.left_node = null;
    this.bottom_node = null;
    this.right_node = null;
    this.width = 0.0;
    this.left_highest = false;
}


// --------------------------------------------------------------------EdgeEvent
RealFlow.poly2tri_EdgeEvent = function() {
    this.constrained_edge = null; // Edge
    this.right = false;
}


// -----------------------------------------------------------------SweepContext
RealFlow.poly2tri_SweepContext = function(polyline) {
    this.triangles_ = [];
    this.map_ = [];
    this.points_ = polyline;
    this.edge_list = [];
    this.offsetX = 0;
    this.offsetY = 0;




    var xmax = this.points_[0].x;
    var xmin = this.points_[0].x;
    var ymax = this.points_[0].y;
    var ymin = this.points_[0].y;



    // Calculate bounds
    for (var i in this.points_) {

        var p = this.points_[i];
        if (p.x > xmax) xmax = p.x;
        if (p.x < xmin) xmin = p.x;
        if (p.y > ymax) ymax = p.y;
        if (p.y < ymin) ymin = p.y;
    }
    //puesto que estamos en coordenadas geograficas, el perimetro con valores negativos tiene q ser pasado a un espacio con coordenadas positivas
    //para hacerlo bien se deberia tener en cuenta las deformaciones geograficas, pero por simplificar NO SE HAN TENIDO EN CUENTA


    //Desplazamos coordenadas a un espacio de coordenadas positivas
    //ojo pq en Oeste los min y maximos no tienen sentido logico -> xmax = -0.3775 ; xmin = - 0.3655
    var aux; //cambio de min a max para que al hacer el modulo mas tarde, la resta Max - min de la linea 13259 tenga sentido
    if (xmax < 0 || xmin < 0) {
        if (xmax < xmin) { this.offsetX = Math.abs(xmax); }
        else { this.offsetX = Math.abs(xmin); }
        aux = xmin;
        xmin = xmax;
        xmax = aux;

    }

    if (ymax < 0 || ymin < 0) {
        if (ymax < ymin) {
            this.offsetY = Math.abs(ymax);
        }
        else {
            this.offsetY = Math.abs(ymin);
        }
        aux = ymin;
        ymin = ymax;
        ymax = aux;
    }

    //sumamos los offsets para situar todos los vertices del techo en un espacio postivo
    for (var i in this.points_) {



        this.points_[i].x = (parseFloat(this.points_[i].x) + this.offsetX);
        this.points_[i].y = (parseFloat(this.points_[i].y) + this.offsetY);
    }

    //calculamos los limites de nuevo para actualizar valores tras aplicar el offset
    var xmax = this.points_[0].x;
    var xmin = this.points_[0].x;
    var ymax = this.points_[0].y;
    var ymin = this.points_[0].y;
    for (var i in this.points_) {

        var p = this.points_[i];
        if (p.x > xmax) xmax = p.x;
        if (p.x < xmin) xmin = p.x;
        if (p.y > ymax) ymax = p.y;
        if (p.y < ymin) ymin = p.y;
    }

    // Advancing front
    this.front_ = null; // AdvancingFront
    // head point used with advancing front
    this.head_ = null; // Point
    // tail point used with advancing front
    this.tail_ = null; // Point


    //necesitamos pasar los minimos tambien al nuevo espacio
    xmax = Math.abs(xmax);
    xmin = Math.abs(xmin);
    ymax = Math.abs(ymax);
    ymin = Math.abs(ymin);


    //al hacer el valor absoluto de los valores anteriores, no tiene sentido hacer xmax - xmin pq seria negativo


    //Inital triangle factor, seed triangle will extend 30% of
    //PointSet width to both left and right.
    //poly2tri_kAlpha = 0.3 


    var dx = RealFlow.poly2tri_kAlpha * (xmax - xmin);
    var dy = RealFlow.poly2tri_kAlpha * (ymax - ymin);

    /* 
    * Inital triangle factor, seed triangle will extend 30% of
    * PointSet width to both left and right.
    */
    this.head_ = new RealFlow.poly2tri_Point(xmax + dx, ymin - dy);
    this.tail_ = new RealFlow.poly2tri_Point(xmin - dy, ymin - dy);

    //A PARTIR DE ESTE PUNTO DEBERIAMOS ESTAR YA TRABAJANDO EN UN ESPACIO POSITIVO







    /*
    // Advancing front
    this.front_ = null; // AdvancingFront
    // head point used with advancing front
    this.head_ = null; // Point
    // tail point used with advancing front
    this.tail_ = null; // Point
    */

    this.af_head_ = null; // Node
    this.af_middle_ = null; // Node
    this.af_tail_ = null; // Node


    this.basin = new RealFlow.poly2tri_Basin();
    this.edge_event = new RealFlow.poly2tri_EdgeEvent();


    this.InitEdges(this.points_);

    return this;
}


RealFlow.poly2tri_SweepContext.prototype.AddHole = function(polyline) {
    this.InitEdges(polyline);
    for (var i in polyline) {
        this.points_.push(polyline[i]);
    }
}


RealFlow.poly2tri_SweepContext.prototype.front = function() {
    return this.front_;
}


RealFlow.poly2tri_SweepContext.prototype.point_count = function() {
    return this.points_.length;
}


RealFlow.poly2tri_SweepContext.prototype.head = function() {
    return this.head_;
}


RealFlow.poly2tri_SweepContext.prototype.set_head = function(p1) {
    this.head_ = p1;
}


RealFlow.poly2tri_SweepContext.prototype.tail = function() {
    return this.tail_;
}


RealFlow.poly2tri_SweepContext.prototype.set_tail = function(p1) {
    this.tail_ = p1;
}


RealFlow.poly2tri_SweepContext.prototype.GetTriangles = function() {
    return this.triangles_;
}


RealFlow.poly2tri_SweepContext.prototype.GetMap = function() {
    return this.map_;
}


RealFlow.poly2tri_SweepContext.prototype.InitTriangulation = function() {
    /*var xmax = this.points_[0].x;
    var xmin = this.points_[0].x;
    var ymax = this.points_[0].y;
    var ymin = this.points_[0].y;
    var offsetX = 0;
    var offsetY = 0;


    // Calculate bounds
    for (var i in this.points_) {

        var p = this.points_[i];
    if (p.x > xmax) xmax = p.x;
    if (p.x < xmin) xmin = p.x;
    if (p.y > ymax) ymax = p.y;
    if (p.y < ymin) ymin = p.y;
    }
    //puesto que estamos en coordenadas geograficas, el perimetro con valores negativos tiene q ser pasado a un espacio con coordenadas positivas
    //para hacerlo bien se deberia tener en cuenta las deformaciones geograficas, pero por simplificar NO SE HAN TENIDO EN CUENTA
	
	
    //Desplazamos coordenadas a un espacio de coordenadas positivas
    //ojo pq en Oeste los min y maximos no tienen sentido logico -> xmax = -0.3775 ; xmin = - 0.3655
    if(xmax <0 || xmin <0){
    if(xmax > xmin){offsetX = Math.abs(xmax);}
    else{offsetX = Math.abs(xmin);}
    }
	
	if(ymax <0 || ymin <0){
    if(ymax > ymin){offsetY =Math.abs(ymax);}
    else{offsetY = Math.abs(ymin);}
    }
	
	//sumamos los offsets para situar todos los vertices del techo en un espacio postivo
    for (var i in this.points_) {
	
	var p = this.points_[i];
		
		this.points_[i].x = (parseFloat(p.x) + offsetX);
    this.points_[i].y = (parseFloat(p.y) + offsetY);
    }
	
	var dx = RealFlow.poly2tri_kAlpha * (xmax - xmin);
    var dy = RealFlow.poly2tri_kAlpha * (ymax - ymin);
    this.head_ = new RealFlow.poly2tri_Point(xmax + dx, ymin - dy);
    this.tail_ = new RealFlow.poly2tri_Point(xmin - dy, ymin - dy);
    */














    // Sort points along y-axis
    this.points_.sort(RealFlow.poly2tri_cmp);
}


RealFlow.poly2tri_SweepContext.prototype.InitEdges = function(polyline) {
    for (var i = 0; i < polyline.length; ++i) {
        this.edge_list.push(new RealFlow.poly2tri_Edge(polyline[i], polyline[(i + 1) % polyline.length]));
    }
}


RealFlow.poly2tri_SweepContext.prototype.GetPoint = function(index) {
    return this.points_[index];
}


RealFlow.poly2tri_SweepContext.prototype.AddToMap = function(triangle) {
    this.map_.push(triangle);
}


RealFlow.poly2tri_SweepContext.prototype.LocateNode = function(point) {
    return this.front_.LocateNode(point.x);
}


RealFlow.poly2tri_SweepContext.prototype.CreateAdvancingFront = function() {
    var head;
    var middle;
    var tail;
    // Initial triangle
    var triangle = new RealFlow.poly2tri_Triangle(this.points_[0], this.tail_, this.head_);


    this.map_.push(triangle);


    head = new RealFlow.poly2tri_Node(triangle.GetPoint(1), triangle);
    middle = new RealFlow.poly2tri_Node(triangle.GetPoint(0), triangle);
    tail = new RealFlow.poly2tri_Node(triangle.GetPoint(2));


    this.front_ = new RealFlow.poly2tri_AdvancingFront(head, tail);


    head.next = middle;
    middle.next = tail;
    middle.prev = head;
    tail.prev = middle;
}


RealFlow.poly2tri_SweepContext.prototype.RemoveNode = function(node) {
    // do nothing
}


RealFlow.poly2tri_SweepContext.prototype.MapTriangleToNodes = function(t) {
    for (var i = 0; i < 3; ++i) {
        if (t.GetNeighbor(i) == null) {
            var n = this.front_.LocatePoint(t.PointCW(t.GetPoint(i)));
            if (n != null) {
                n.triangle = t;
            }
        }
    }
}


RealFlow.poly2tri_SweepContext.prototype.RemoveFromMap = function(triangle) {
    for (var i in this.map_) {
        if (this.map_[i] == triangle) {
            delete this.map_[i];
            break;
        }
    }
}


RealFlow.poly2tri_SweepContext.prototype.MeshClean = function(triangle) {
    if (triangle != null && !triangle.IsInterior()) {
        triangle.IsInterior(true);
        this.triangles_.push(triangle);
        for (var i = 0; i < 3; ++i) {
            if (!triangle.constrained_edge[i]) {
                this.MeshClean(triangle.GetNeighbor(i));
            }
        }
    }
}


// ------------------------------------------------------------------------Sweep
//Namespace('RealFlow.poly2tri_sweep');


/**
* Triangulate simple polygon with holes.
* @param   tcx SweepContext object.
*/
RealFlow.poly2tri_sweep_Triangulate = function(tcx) {
    tcx.InitTriangulation();
    tcx.CreateAdvancingFront();
    // Sweep points; build mesh
    RealFlow.poly2tri_sweep_SweepPoints(tcx);
    // Clean up
    RealFlow.poly2tri_sweep_FinalizationPolygon(tcx);

    //le restamos el offset que metimos en un inicio para volver a los puntos originales
    for (var i in tcx.points_) {
        tcx.points_[i].x = (tcx.points_[i].x - tcx.offsetX);
        tcx.points_[i].y = (tcx.points_[i].y - tcx.offsetY);
    }

    //devolvemos el array de puntos que conforman los triangulos
    return tcx.triangles_;
}


RealFlow.poly2tri_sweep_SweepPoints = function(tcx) {
    for (var i = 1; i < tcx.point_count(); ++i) {
        var point = tcx.GetPoint(i);
        var node = RealFlow.poly2tri_sweep_PointEvent(tcx, point);
        for (var j = 0; j < point.edge_list.length; ++j) {
            RealFlow.poly2tri_sweep_EdgeEvent(tcx, point.edge_list[j], node);
        }
    }
}


RealFlow.poly2tri_sweep_FinalizationPolygon = function(tcx) {
    // Get an Internal triangle to start with
    var t = tcx.front().head().next.triangle;
    var p = tcx.front().head().next.point;
    while (!t.GetConstrainedEdgeCW(p)) {
        t = t.NeighborCCW(p);
    }


    // Collect interior triangles constrained by edges
    tcx.MeshClean(t);
}


/**
* Find closes node to the left of the new point and
* create a new triangle. If needed new holes and basins
* will be filled to.
*/
RealFlow.poly2tri_sweep_PointEvent = function(tcx, point) {
    var node = tcx.LocateNode(point);
    var new_node = RealFlow.poly2tri_sweep_NewFrontTriangle(tcx, point, node);


    // Only need to check +epsilon since point never have smaller
    // x value than node due to how we fetch nodes from the front
    if (point.x <= node.point.x + (RealFlow.poly2tri_EPSILON)) {
        RealFlow.poly2tri_sweep_Fill(tcx, node);
    }


    //tcx.AddNode(new_node);


    RealFlow.poly2tri_sweep_FillAdvancingFront(tcx, new_node);
    return new_node;
}


RealFlow.poly2tri_sweep_EdgeEvent = function() {
    var tcx;
    if (arguments.length == 3) {
        tcx = arguments[0];
        var edge = arguments[1];
        var node = arguments[2];


        tcx.edge_event.constrained_edge = edge;
        tcx.edge_event.right = (edge.p.x > edge.q.x);


        if (RealFlow.poly2tri_sweep_IsEdgeSideOfTriangle(node.triangle, edge.p, edge.q)) {
            return;
        }


        // For now we will do all needed filling
        // TODO: integrate with flip process might give some better performance
        //       but for now this avoid the issue with cases that needs both flips and fills
        RealFlow.poly2tri_sweep_FillEdgeEvent(tcx, edge, node);
        RealFlow.poly2tri_sweep_EdgeEvent(tcx, edge.p, edge.q, node.triangle, edge.q);
    } else if (arguments.length == 5) {
        tcx = arguments[0];
        var ep = arguments[1];
        var eq = arguments[2];
        var triangle = arguments[3];
        var point = arguments[4];


        if (RealFlow.poly2tri_sweep_IsEdgeSideOfTriangle(triangle, ep, eq)) {
            return;
        }


        var p1 = triangle.PointCCW(point);
        var o1 = RealFlow.poly2tri_Orient2d(eq, p1, ep);
        if (o1 == RealFlow.poly2tri_Orientation.COLLINEAR) {
            alert('RealFlow.poly2tri_sweep_EdgeEvent: Collinear not supported!');
            return;
        }


        var p2 = triangle.PointCW(point);
        var o2 = RealFlow.poly2tri_Orient2d(eq, p2, ep);
        if (o2 == RealFlow.poly2tri_Orientation.COLLINEAR) {
            alert('RealFlow.poly2tri_sweep_EdgeEvent: Collinear not supported!');
            return;
        }


        if (o1 == o2) {
            // Need to decide if we are rotating CW or CCW to get to a triangle
            // that will cross edge
            if (o1 == RealFlow.poly2tri_Orientation.CW) {
                triangle = triangle.NeighborCCW(point);
            } else {
                triangle = triangle.NeighborCW(point);
            }
            RealFlow.poly2tri_sweep_EdgeEvent(tcx, ep, eq, triangle, point);
        } else {
            // This triangle crosses constraint so lets flippin start!
            RealFlow.poly2tri_sweep_FlipEdgeEvent(tcx, ep, eq, triangle, point);
        }
    } else {
        alert('Invalid RealFlow.poly2tri_sweep_EdgeEvent call!');
    }
}


RealFlow.poly2tri_sweep_IsEdgeSideOfTriangle = function(triangle, ep, eq) {
    var index = triangle.EdgeIndex(ep, eq);
    if (index != -1) {
        triangle.MarkConstrainedEdge(index);
        var t = triangle.GetNeighbor(index);
        if (t != null) {
            t.MarkConstrainedEdge(ep, eq);
        }
        return true;
    }
    return false;
}


RealFlow.poly2tri_sweep_NewFrontTriangle = function(tcx, point, node) {
    var triangle = new RealFlow.poly2tri_Triangle(point, node.point, node.next.point);


    triangle.MarkNeighbor(node.triangle);
    tcx.AddToMap(triangle);


    var new_node = new RealFlow.poly2tri_Node(point);
    new_node.next = node.next;
    new_node.prev = node;
    node.next.prev = new_node;
    node.next = new_node;


    if (!RealFlow.poly2tri_sweep_Legalize(tcx, triangle)) {
        tcx.MapTriangleToNodes(triangle);
    }


    return new_node;
}


/**
* Adds a triangle to the advancing front to fill a hole.
* @param tcx
* @param node - middle node, that is the bottom of the hole
*/
RealFlow.poly2tri_sweep_Fill = function(tcx, node) {
    var triangle = new RealFlow.poly2tri_Triangle(node.prev.point, node.point, node.next.point);


    // TODO: should copy the constrained_edge value from neighbor triangles
    //       for now constrained_edge values are copied during the legalize
    triangle.MarkNeighbor(node.prev.triangle);
    triangle.MarkNeighbor(node.triangle);


    tcx.AddToMap(triangle);


    // Update the advancing front
    node.prev.next = node.next;
    node.next.prev = node.prev;




    // If it was legalized the triangle has already been mapped
    if (!RealFlow.poly2tri_sweep_Legalize(tcx, triangle)) {
        tcx.MapTriangleToNodes(triangle);
    }


    //tcx.RemoveNode(node);
}


/**
* Fills holes in the Advancing Front
*/
RealFlow.poly2tri_sweep_FillAdvancingFront = function(tcx, n) {
    // Fill right holes
    var node = n.next;
    var angle;


    while (node.next != null) {
        angle = RealFlow.poly2tri_sweep_HoleAngle(node);
        if (angle > RealFlow.poly2tri_PI_2 || angle < -(RealFlow.poly2tri_PI_2)) break;
        RealFlow.poly2tri_sweep_Fill(tcx, node);
        node = node.next;
    }


    // Fill left holes
    node = n.prev;


    while (node.prev != null) {
        angle = RealFlow.poly2tri_sweep_HoleAngle(node);
        if (angle > RealFlow.poly2tri_PI_2 || angle < -(RealFlow.poly2tri_PI_2)) break;
        RealFlow.poly2tri_sweep_Fill(tcx, node);
        node = node.prev;
    }


    // Fill right basins
    if (n.next != null && n.next.next != null) {
        angle = RealFlow.poly2tri_sweep_BasinAngle(n);
        if (angle < RealFlow.poly2tri_PI_3div4) {
            RealFlow.poly2tri_sweep_FillBasin(tcx, n);
        }
    }
}


RealFlow.poly2tri_sweep_BasinAngle = function(node) {
    var ax = node.point.x - node.next.next.point.x;
    var ay = node.point.y - node.next.next.point.y;
    return Math.atan2(ay, ax);
}


/**
*
* @param node - middle node
* @return the angle between 3 front nodes
*/
RealFlow.poly2tri_sweep_HoleAngle = function(node) {
    /* Complex plane
    * ab = cosA +i*sinA
    * ab = (ax + ay*i)(bx + by*i) = (ax*bx + ay*by) + i(ax*by-ay*bx)
    * atan2(y,x) computes the principal value of the argument function
    * applied to the complex number x+iy
    * Where x = ax*bx + ay*by
    *       y = ax*by - ay*bx
    */
    var ax = node.next.point.x - node.point.x;
    var ay = node.next.point.y - node.point.y;
    var bx = node.prev.point.x - node.point.x;
    var by = node.prev.point.y - node.point.y;
    return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}


/**
* Returns true if triangle was legalized
*/
RealFlow.poly2tri_sweep_Legalize = function(tcx, t) {
    // To legalize a triangle we start by finding if any of the three edges
    // violate the Delaunay condition
    for (var i = 0; i < 3; ++i) {
        if (t.delaunay_edge[i]) continue;


        var ot = t.GetNeighbor(i);
        if (ot != null) {
            var p = t.GetPoint(i);
            var op = ot.OppositePoint(t, p);
            var oi = ot.Index(op);


            // If this is a Constrained Edge or a Delaunay Edge(only during recursive legalization)
            // then we should not try to legalize
            if (ot.constrained_edge[oi] || ot.delaunay_edge[oi]) {
                t.constrained_edge[i] = ot.constrained_edge[oi];
                continue;
            }


            var inside = RealFlow.poly2tri_sweep_Incircle(p, t.PointCCW(p), t.PointCW(p), op);
            if (inside) {
                // Lets mark this shared edge as Delaunay
                t.delaunay_edge[i] = true;
                ot.delaunay_edge[oi] = true;


                // Lets rotate shared edge one vertex CW to legalize it
                RealFlow.poly2tri_sweep_RotateTrianglePair(t, p, ot, op);


                // We now got one valid Delaunay Edge shared by two triangles
                // This gives us 4 new edges to check for Delaunay


                // Make sure that triangle to node mapping is done only one time for a specific triangle
                var not_legalized = !RealFlow.poly2tri_sweep_Legalize(tcx, t);
                if (not_legalized) {
                    tcx.MapTriangleToNodes(t);
                }


                not_legalized = !RealFlow.poly2tri_sweep_Legalize(tcx, ot);
                if (not_legalized) tcx.MapTriangleToNodes(ot);


                // Reset the Delaunay edges, since they only are valid Delaunay edges
                // until we add a new triangle or point.
                // XXX: need to think about this. Can these edges be tried after we
                //      return to previous recursive level?
                t.delaunay_edge[i] = false;
                ot.delaunay_edge[oi] = false;


                // If triangle have been legalized no need to check the other edges since
                // the recursive legalization will handles those so we can end here.
                return true;
            }
        }
    }
    return false;
}


/**
* <b>Requirement</b>:<br>
* 1. a,b and c form a triangle.<br>
* 2. a and d is know to be on opposite side of bc<br>
* <pre>
*                a
*                +
*               / \
*              /   \
*            b/     \c
*            +-------+
*           /    d    \
*          /           \
* </pre>
* <b>Fact</b>: d has to be in area B to have a chance to be inside the circle formed by
*  a,b and c<br>
*  d is outside B if orient2d(a,b,d) or orient2d(c,a,d) is CW<br>
*  This preknowledge gives us a way to optimize the incircle test
* @param pa - triangle point, opposite d
* @param pb - triangle point
* @param pc - triangle point
* @param pd - point opposite a
* @return true if d is inside circle, false if on circle edge
*/
RealFlow.poly2tri_sweep_Incircle = function(pa, pb, pc, pd) {
    var adx = pa.x - pd.x;
    var ady = pa.y - pd.y;
    var bdx = pb.x - pd.x;
    var bdy = pb.y - pd.y;


    var adxbdy = adx * bdy;
    var bdxady = bdx * ady;
    var oabd = adxbdy - bdxady;


    if (oabd <= 0) return false;


    var cdx = pc.x - pd.x;
    var cdy = pc.y - pd.y;


    var cdxady = cdx * ady;
    var adxcdy = adx * cdy;
    var ocad = cdxady - adxcdy;


    if (ocad <= 0) return false;


    var bdxcdy = bdx * cdy;
    var cdxbdy = cdx * bdy;


    var alift = adx * adx + ady * ady;
    var blift = bdx * bdx + bdy * bdy;
    var clift = cdx * cdx + cdy * cdy;


    var det = alift * (bdxcdy - cdxbdy) + blift * ocad + clift * oabd;
    return det > 0;
}


/**
* Rotates a triangle pair one vertex CW
*<pre>
*       n2                    n2
*  P +-----+             P +-----+
*    | t  /|               |\  t |
*    |   / |               | \   |
*  n1|  /  |n3           n1|  \  |n3
*    | /   |    after CW   |   \ |
*    |/ oT |               | oT \|
*    +-----+ oP            +-----+
*       n4                    n4
* </pre>
*/
RealFlow.poly2tri_sweep_RotateTrianglePair = function(t, p, ot, op) {
    var n1; var n2; var n3; var n4;
    n1 = t.NeighborCCW(p);
    n2 = t.NeighborCW(p);
    n3 = ot.NeighborCCW(op);
    n4 = ot.NeighborCW(op);


    var ce1; var ce2; var ce3; var ce4;
    ce1 = t.GetConstrainedEdgeCCW(p);
    ce2 = t.GetConstrainedEdgeCW(p);
    ce3 = ot.GetConstrainedEdgeCCW(op);
    ce4 = ot.GetConstrainedEdgeCW(op);


    var de1; var de2; var de3; var de4;
    de1 = t.GetDelaunayEdgeCCW(p);
    de2 = t.GetDelaunayEdgeCW(p);
    de3 = ot.GetDelaunayEdgeCCW(op);
    de4 = ot.GetDelaunayEdgeCW(op);


    t.Legalize(p, op);
    ot.Legalize(op, p);


    // Remap delaunay_edge
    ot.SetDelaunayEdgeCCW(p, de1);
    t.SetDelaunayEdgeCW(p, de2);
    t.SetDelaunayEdgeCCW(op, de3);
    ot.SetDelaunayEdgeCW(op, de4);


    // Remap constrained_edge
    ot.SetConstrainedEdgeCCW(p, ce1);
    t.SetConstrainedEdgeCW(p, ce2);
    t.SetConstrainedEdgeCCW(op, ce3);
    ot.SetConstrainedEdgeCW(op, ce4);


    // Remap neighbors
    // XXX: might optimize the markNeighbor by keeping track of
    //      what side should be assigned to what neighbor after the
    //      rotation. Now mark neighbor does lots of testing to find
    //      the right side.
    t.ClearNeigbors();
    ot.ClearNeigbors();
    if (n1) ot.MarkNeighbor(n1);
    if (n2) t.MarkNeighbor(n2);
    if (n3) t.MarkNeighbor(n3);
    if (n4) ot.MarkNeighbor(n4);
    t.MarkNeighbor(ot);
}


/**
* Fills a basin that has formed on the Advancing Front to the right
* of given node.<br>
* First we decide a left,bottom and right node that forms the
* boundaries of the basin. Then we do a reqursive fill.
*
* @param tcx
* @param node - starting node, this or next node will be left node
*/
RealFlow.poly2tri_sweep_FillBasin = function(tcx, node) {
    if (RealFlow.poly2tri_Orient2d(node.point, node.next.point, node.next.next.point) == RealFlow.poly2tri_Orientation.CCW) {
        tcx.basin.left_node = node.next.next;
    } else {
        tcx.basin.left_node = node.next;
    }


    // Find the bottom and right node
    tcx.basin.bottom_node = tcx.basin.left_node;
    while (tcx.basin.bottom_node.next != null && tcx.basin.bottom_node.point.y >= tcx.basin.bottom_node.next.point.y) {
        tcx.basin.bottom_node = tcx.basin.bottom_node.next;
    }
    if (tcx.basin.bottom_node == tcx.basin.left_node) {
        // No valid basin
        return;
    }


    tcx.basin.right_node = tcx.basin.bottom_node;
    while (tcx.basin.right_node.next != null && tcx.basin.right_node.point.y < tcx.basin.right_node.next.point.y) {
        tcx.basin.right_node = tcx.basin.right_node.next;
    }
    if (tcx.basin.right_node == tcx.basin.bottom_node) {
        // No valid basins
        return;
    }


    tcx.basin.width = tcx.basin.right_node.point.x - tcx.basin.left_node.point.x;
    tcx.basin.left_highest = tcx.basin.left_node.point.y > tcx.basin.right_node.point.y;


    RealFlow.poly2tri_sweep_FillBasinReq(tcx, tcx.basin.bottom_node);
}


/**
* Recursive algorithm to fill a Basin with triangles
*
* @param tcx
* @param node - bottom_node
*/
RealFlow.poly2tri_sweep_FillBasinReq = function(tcx, node) {
    // if shallow stop filling
    if (RealFlow.poly2tri_sweep_IsShallow(tcx, node)) {
        return;
    }


    RealFlow.poly2tri_sweep_Fill(tcx, node);


    var o;
    if (node.prev == tcx.basin.left_node && node.next == tcx.basin.right_node) {
        return;
    } else if (node.prev == tcx.basin.left_node) {
        o = RealFlow.poly2tri_Orient2d(node.point, node.next.point, node.next.next.point);
        if (o == RealFlow.poly2tri_Orientation.CW) {
            return;
        }
        node = node.next;
    } else if (node.next == tcx.basin.right_node) {
        o = RealFlow.poly2tri_Orient2d(node.point, node.prev.point, node.prev.prev.point);
        if (o == RealFlow.poly2tri_Orientation.CCW) {
            return;
        }
        node = node.prev;
    } else {
        // Continue with the neighbor node with lowest Y value
        if (node.prev.point.y < node.next.point.y) {
            node = node.prev;
        } else {
            node = node.next;
        }
    }


    RealFlow.poly2tri_sweep_FillBasinReq(tcx, node);
}


RealFlow.poly2tri_sweep_IsShallow = function(tcx, node) {
    var height;
    if (tcx.basin.left_highest) {
        height = tcx.basin.left_node.point.y - node.point.y;
    } else {
        height = tcx.basin.right_node.point.y - node.point.y;
    }


    // if shallow stop filling
    if (tcx.basin.width > height) {
        return true;
    }
    return false;
}


RealFlow.poly2tri_sweep_FillEdgeEvent = function(tcx, edge, node) {
    if (tcx.edge_event.right) {
        RealFlow.poly2tri_sweep_FillRightAboveEdgeEvent(tcx, edge, node);
    } else {
        RealFlow.poly2tri_sweep_FillLeftAboveEdgeEvent(tcx, edge, node);
    }
}


RealFlow.poly2tri_sweep_FillRightAboveEdgeEvent = function(tcx, edge, node) {
    while (node.next.point.x < edge.p.x) {
        // Check if next node is below the edge
        if (RealFlow.poly2tri_Orient2d(edge.q, node.next.point, edge.p) == RealFlow.poly2tri_Orientation.CCW) {
            RealFlow.poly2tri_sweep_FillRightBelowEdgeEvent(tcx, edge, node);
        } else {
            node = node.next;
        }
    }
}


RealFlow.poly2tri_sweep_FillRightBelowEdgeEvent = function(tcx, edge, node) {
    if (node.point.x < edge.p.x) {
        if (RealFlow.poly2tri_Orient2d(node.point, node.next.point, node.next.next.point) == RealFlow.poly2tri_Orientation.CCW) {
            // Concave
            RealFlow.poly2tri_sweep_FillRightConcaveEdgeEvent(tcx, edge, node);
        } else {
            // Convex
            RealFlow.poly2tri_sweep_FillRightConvexEdgeEvent(tcx, edge, node);
            // Retry this one
            RealFlow.poly2tri_sweep_FillRightBelowEdgeEvent(tcx, edge, node);
        }
    }
}


RealFlow.poly2tri_sweep_FillRightConcaveEdgeEvent = function(tcx, edge, node) {
    RealFlow.poly2tri_sweep_Fill(tcx, node.next);
    if (node.next.point != edge.p) {
        // Next above or below edge?
        if (RealFlow.poly2tri_Orient2d(edge.q, node.next.point, edge.p) == RealFlow.poly2tri_Orientation.CCW) {
            // Below
            if (RealFlow.poly2tri_Orient2d(node.point, node.next.point, node.next.next.point) == RealFlow.poly2tri_Orientation.CCW) {
                // Next is concave
                RealFlow.poly2tri_sweep_FillRightConcaveEdgeEvent(tcx, edge, node);
            } else {
                // Next is convex
            }
        }
    }
}


RealFlow.poly2tri_sweep_FillRightConvexEdgeEvent = function(tcx, edge, node) {
    // Next concave or convex?
    if (RealFlow.poly2tri_Orient2d(node.next.point, node.next.next.point, node.next.next.next.point) == RealFlow.poly2tri_Orientation.CCW) {
        // Concave
        RealFlow.poly2tri_sweep_FillRightConcaveEdgeEvent(tcx, edge, node.next);
    } else {
        // Convex
        // Next above or below edge?
        if (RealFlow.poly2tri_Orient2d(edge.q, node.next.next.point, edge.p) == RealFlow.poly2tri_Orientation.CCW) {
            // Below
            RealFlow.poly2tri_sweep_FillRightConvexEdgeEvent(tcx, edge, node.next);
        } else {
            // Above
        }
    }
}


RealFlow.poly2tri_sweep_FillLeftAboveEdgeEvent = function(tcx, edge, node) {
    while (node.prev.point.x > edge.p.x) {
        // Check if next node is below the edge
        if (RealFlow.poly2tri_Orient2d(edge.q, node.prev.point, edge.p) == RealFlow.poly2tri_Orientation.CW) {
            RealFlow.poly2tri_sweep_FillLeftBelowEdgeEvent(tcx, edge, node);
        } else {
            node = node.prev;
        }
    }
}


RealFlow.poly2tri_sweep_FillLeftBelowEdgeEvent = function(tcx, edge, node) {
    if (node.point.x > edge.p.x) {
        if (RealFlow.poly2tri_Orient2d(node.point, node.prev.point, node.prev.prev.point) == RealFlow.poly2tri_Orientation.CW) {
            // Concave
            RealFlow.poly2tri_sweep_FillLeftConcaveEdgeEvent(tcx, edge, node);
        } else {
            // Convex
            RealFlow.poly2tri_sweep_FillLeftConvexEdgeEvent(tcx, edge, node);
            // Retry this one
            RealFlow.poly2tri_sweep_FillLeftBelowEdgeEvent(tcx, edge, node);
        }
    }
}


RealFlow.poly2tri_sweep_FillLeftConvexEdgeEvent = function(tcx, edge, node) {
    // Next concave or convex?
    if (RealFlow.poly2tri_Orient2d(node.prev.point, node.prev.prev.point, node.prev.prev.prev.point) == RealFlow.poly2tri_Orientation.CW) {
        // Concave
        RealFlow.poly2tri_sweep_FillLeftConcaveEdgeEvent(tcx, edge, node.prev);
    } else {
        // Convex
        // Next above or below edge?
        if (RealFlow.poly2tri_Orient2d(edge.q, node.prev.prev.point, edge.p) == RealFlow.poly2tri_Orientation.CW) {
            // Below
            RealFlow.poly2tri_sweep_FillLeftConvexEdgeEvent(tcx, edge, node.prev);
        } else {
            // Above
        }
    }
}


RealFlow.poly2tri_sweep_FillLeftConcaveEdgeEvent = function(tcx, edge, node) {
    RealFlow.poly2tri_sweep_Fill(tcx, node.prev);
    if (node.prev.point != edge.p) {
        // Next above or below edge?
        if (RealFlow.poly2tri_Orient2d(edge.q, node.prev.point, edge.p) == RealFlow.poly2tri_Orientation.CW) {
            // Below
            if (RealFlow.poly2tri_Orient2d(node.point, node.prev.point, node.prev.prev.point) == RealFlow.poly2tri_Orientation.CW) {
                // Next is concave
                RealFlow.poly2tri_sweep_FillLeftConcaveEdgeEvent(tcx, edge, node);
            } else {
                // Next is convex
            }
        }
    }
}


RealFlow.poly2tri_sweep_FlipEdgeEvent = function(tcx, ep, eq, t, p) {
    var ot = t.NeighborAcross(p);
    if (ot == null) {
        // If we want to integrate the fillEdgeEvent do it here
        // With current implementation we should never get here
        alert('[BUG:FIXME] FLIP failed due to missing triangle!');
        return;
    }
    var op = ot.OppositePoint(t, p);


    if (RealFlow.poly2tri_InScanArea(p, t.PointCCW(p), t.PointCW(p), op)) {
        // Lets rotate shared edge one vertex CW
        RealFlow.poly2tri_sweep_RotateTrianglePair(t, p, ot, op);
        tcx.MapTriangleToNodes(t);
        tcx.MapTriangleToNodes(ot);


        if (p == eq && op == ep) {
            if (eq == tcx.edge_event.constrained_edge.q && ep == tcx.edge_event.constrained_edge.p) {
                t.MarkConstrainedEdge(ep, eq);
                ot.MarkConstrainedEdge(ep, eq);
                RealFlow.poly2tri_sweep_Legalize(tcx, t);
                RealFlow.poly2tri_sweep_Legalize(tcx, ot);
            } else {
                // XXX: I think one of the triangles should be legalized here?
            }
        } else {
            var o = RealFlow.poly2tri_Orient2d(eq, op, ep);
            t = RealFlow.poly2tri_sweep_NextFlipTriangle(tcx, o, t, ot, p, op);
            RealFlow.poly2tri_sweep_FlipEdgeEvent(tcx, ep, eq, t, p);
        }
    } else {
        var newP = RealFlow.poly2tri_sweep_NextFlipPoint(ep, eq, ot, op);
        RealFlow.poly2tri_sweep_FlipScanEdgeEvent(tcx, ep, eq, t, ot, newP);
        RealFlow.poly2tri_sweep_EdgeEvent(tcx, ep, eq, t, p);
    }
}


RealFlow.poly2tri_sweep_NextFlipTriangle = function(tcx, o, t, ot, p, op) {
    var edge_index;
    if (o == RealFlow.poly2tri_Orientation.CCW) {
        // ot is not crossing edge after flip
        edge_index = ot.EdgeIndex(p, op);
        ot.delaunay_edge[edge_index] = true;
        RealFlow.poly2tri_sweep_Legalize(tcx, ot);
        ot.ClearDelunayEdges();
        return t;
    }


    // t is not crossing edge after flip
    edge_index = t.EdgeIndex(p, op);


    t.delaunay_edge[edge_index] = true;
    RealFlow.poly2tri_sweep_Legalize(tcx, t);
    t.ClearDelunayEdges();
    return ot;
}


RealFlow.poly2tri_sweep_NextFlipPoint = function(ep, eq, ot, op) {
    var o2d = RealFlow.poly2tri_Orient2d(eq, op, ep);
    if (o2d == RealFlow.poly2tri_Orientation.CW) {
        // Right
        return ot.PointCCW(op);
    } else if (o2d == RealFlow.poly2tri_Orientation.CCW) {
        // Left
        return ot.PointCW(op);
    } else {
        alert("[Unsupported] RealFlow.poly2tri_sweep_NextFlipPoint: opposing point on constrained edge!");
        return undefined;
    }
}


RealFlow.poly2tri_sweep_FlipScanEdgeEvent = function(tcx, ep, eq, flip_triangle, t, p) {
    var ot = t.NeighborAcross(p);


    if (ot == null) {
        // If we want to integrate the fillEdgeEvent do it here
        // With current implementation we should never get here
        alert('[BUG:FIXME] FLIP failed due to missing triangle');
        return;
    }
    var op = ot.OppositePoint(t, p);


    if (RealFlow.poly2tri_InScanArea(eq, flip_triangle.PointCCW(eq), flip_triangle.PointCW(eq), op)) {
        // flip with new edge op.eq
        RealFlow.poly2tri_sweep_FlipEdgeEvent(tcx, eq, op, ot, op);
        // TODO: Actually I just figured out that it should be possible to
        //       improve this by getting the next ot and op before the the above
        //       flip and continue the flipScanEdgeEvent here
        // set new ot and op here and loop back to inScanArea test
        // also need to set a new flip_triangle first
        // Turns out at first glance that this is somewhat complicated
        // so it will have to wait.
    } else {
        var newP = NextFlipPoint(ep, eq, ot, op);
        RealFlow.poly2tri_sweep_FlipScanEdgeEvent(tcx, ep, eq, flip_triangle, ot, newP);
    }
}
