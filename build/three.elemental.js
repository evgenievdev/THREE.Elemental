/*
	
	@package: [ THREE.Elemental ]

	@version: [ 0.1 ]
	
	@description: --------------------------------------------------------------------------------------------------------
	
		THREE.Elemental is an extension library for THREE.js providing an array of geometry functions. 
		
		The library uses a shared vertex approach. Neighbouring faces share vertices, eliminating any unnecessary vertex duplicates.
		
		This lowers the overall complexity (vertex count) of the geometry and increases performance.
		
		Additionally, several functions are available for texture coordinate manipulation (UV data) and geometry modification.
		
		The library has been tested on THREE.js v74+ 
		
	----------------------------------------------------------------------------------------------------------------------

	@dependencies: [ THREE.js ] 
	
	@author: evgeniev.dev@gmail.com
	
	@github: [ https://github.com/evgenievdev/THREE.Elemental ]
	
	
*/

// Namespace declaration
var THREE = THREE || {};
THREE.Elemental = {};



/*
	Basic utility functions
*/
THREE.Elemental.Utils = {
	
	RandomInt: function( min , max ) {
	
		return Math.floor( Math.random() * ( max - min + 1 ) + min );
		
	},
	
	Deg2Rad: function( degrees ) {

		return degrees * (Math.PI/180);

	},
	
	// Linear interpolation between two points (w = weight in range : 0.0-1.0)
	Lerp: function( p1 , p2 , w ) {
 
		return ( 1.0 - w ) * p1 + w * p2;
	
	},
	
	CalcNormals: function( geo , calcFaceNormals , calcVertexNormals ) {
		
		if( calcVertexNormals === true ) {
	
			geo.computeVertexNormals();
			
		}
		
		if( calcFaceNormals === true ) {
		
			geo.computeFaceNormals();
		
		}
		
	},
	
	GetTextureData: function( image ) {

		var w = image.width , h = image.height;
		
		var canvas = document.createElement( 'canvas' );
		canvas.width = w;
		canvas.height = h;

		var context = canvas.getContext( '2d' );
		context.drawImage( image , 0, 0 );

		return context.getImageData( 0, 0, w, h );

	},
	
	GetPixelData: function( imagedata, x, y ) {

		var data = imagedata.data;
		var position = ( x + imagedata.width * y ) * 4;
		
		return { 
		
			r: data[ position ],  // Red
			g: data[ position + 1 ], // Green
			b: data[ position + 2 ], // Blue
			a: data[ position + 3 ] // Alpha (transparency) channel
			
		};

	}

};



THREE.Elemental.PolylineGeometry = function( data , height , options ) {
	
	// If there are less than 2 data points a polyline can not be created
	if( data.constructor !== Array || data.length < 2 ) {
		
		return false;
		
	}
	
	// Optional parameter. If undefined, assume this structure as default.
	options = options || {
		
		vertexNormals: false,
		faceNormals: true,
		uvMethod: 0,
		xPivot: 0,
		yPivot: 0
		
	};
 
	//1 - Span across texture space ; 0 - Tiled (each quad shares 100% of texture space - useful for terrain generation)
	var uvMethod = options.uvMethod || 0;
	
	// Vertex normals. False by default
	var calcVertexNormals = options.vertexNormals || false;
	var calcFaceNormals = options.faceNormals || true;
	
	var xPivot = options.xPivot || 0;
	var yPivot = options.yPivot || 0;
	
	// Create an empty three.js geometry object
	var geo = new THREE.Geometry();
	
	var len = data.length , vec1, vec2;
	
	for( var s = 0; s < len; s++ ) {
	 
		vec1 = new THREE.Vector3( data[s].x , data[s].y , data[s].z );
		vec2 = new THREE.Vector3( data[s].x , data[s].y , data[s].z );
		vec1.y += (height/2) * (yPivot-1);
		vec2.y = vec1.y + height;
		
		geo.vertices.push(
			vec2,
			vec1
		);
		
		if( s < len-1 ) {
		
			geo.faces.push(
				new THREE.Face3( s*2 , s*2 + 1 , s*2 + 2 ),
				new THREE.Face3( s*2 + 2 , s*2 + 1 , s*2 + 3 )
			);
			
		}

	}
	
	// Calculate normals
	THREE.Elemental.Utils.CalcNormals( geo , calcFaceNormals , calcVertexNormals );
	
	// Set the geometry variable for this instance of the function. Must be called before calling the setUVs function and after the normals calculations
	this.geometry = geo;
	
	// Calculate UV coordinates
	this.setUVs( geo , uvMethod );
 

};

THREE.Elemental.PolylineGeometry.prototype.setUVs = function( method ) {
	
	var geo = this.geometry;
	
	// Reset UV data first
	geo.faceVertexUvs[0] = [];
	
	var len = geo.faces.length/2;
	var interval = 1.0 / len;
	var s1 = 0 , s2 = 1.0;
	
	for( var s = 0; s < len; s++ ) {
		
		if( method === 1 ) {
		 
			s1 = s * interval;
			s2 = s1 + interval;
		
		}
		
		geo.faceVertexUvs[0].push(
			[
				new THREE.Vector2( s1 , 1 ),
				new THREE.Vector2( s1 , 0 ),
				new THREE.Vector2( s2 , 1 )
			],
			[
				new THREE.Vector2( s2 , 1 ),
				new THREE.Vector2( s1 , 0 ),
				new THREE.Vector2( s2 , 0 )
			]
		);
		
	
	}
	
	geo.uvsNeedUpdate = true;
	
};
 

THREE.Elemental.PlaneGeometry = function( width , height , options ) {

	// new instane of THREE's native geometry object
	var geo = new THREE.Geometry();
	
	// Optional parameter. If undefined, assume this default structure
	options = options || {
		
		x: 1,
		y: 1,
		vertexNormals: false,
		faceNormals: true,
		uvMethod: 0,
		xPivot: 0,
		yPivot: 0
		
	};
 
	// 1 - Span across texture space ; 0 - Tiled (each quad shares 100% of texture space - useful for terrain generation)
	var uvMethod = options.uvMethod || 0;
	
	// Vertex and Face normals flags.
	var calcVertexNormals = options.vertexNormals || false;
	var calcFaceNormals = options.faceNormals || true;
 
	// Number of quad segments in the plane (each quad consists of 2 triangles)
	var segx = options.x || 1; 
	var segy = options.y || 1;
	
	var xPivot = options.xPivot || 0;
	var yPivot = options.yPivot || 0;
	
	var sx = -width/2,
		sy = -height/2,
		intx = width / segx,
		inty = height / segy;
	 
	
	var v1,v2,v3,v4;
	
	for( var y = 0; y <= segy; y++ ) {
		
		for( var x = 0; x <= segx; x++ ) {
		
			geo.vertices.push(
				new THREE.Vector3( sx + intx * x , sy + inty * y , 0 )
			);
			
			if( x < segx && y < segy ) {
				
				v1 = x + y*(segx+1);
				v2 = x + (y+1)*(segx+1);
				v3 = v2 + 1;
				v4 = v1+1;
				
				// This quad ( consisting of 2 triangles )
				geo.faces.push(
				
					new THREE.Face3( v1 , v4 , v2 ),
					new THREE.Face3( v4 , v3 , v2 )
					
				);
			
			}
		
		}
		
	}
 
	// Calculate normals
	THREE.Elemental.Utils.CalcNormals( geo , calcFaceNormals , calcVertexNormals );
	
	// Return newly created geometry
	this.geometry = geo;
	
	// Also return an object specifying the number of segments in this plane. Used for heightmap application and UV coordinate calc.
	this.segments = {
		x: segx,
		y: segy
	}
	
	// 
	this.dimensions = {
		x: width,
		y: height
	};
	
	// Calculate the UV texture coordinates for the geometry
	this.setUVs( options.uvMethod );
	

};

THREE.Elemental.PlaneGeometry.prototype.setUVs = function( method ) {

	var geo = this.geometry;
	var segs = this.segments;
	
	// Reset UV data first
	geo.faceVertexUvs[0] = [];
	
	var xinterval = 1.0 / segs.x;
	var yinterval = 1.0 / segs.y;
	var sx1 = 0 , sx2 = 1.0 , sy1 = 0 , sy1 = 1.0;
	
	for( var y = 0; y < segs.y; y++ ) {
		
		for( var x = 0; x < segs.x; x++ ) {
			
			if( method === 1 ) {
			
				geo.faceVertexUvs[0].push(
					[
						new THREE.Vector2( 0 , 0 ),
						new THREE.Vector2( 1 , 0 ),
						new THREE.Vector2( 0 , 1 )
					],
					[
						new THREE.Vector2( 1 , 0 ),
						new THREE.Vector2( 1 , 1 ),
						new THREE.Vector2( 0 , 1 )
					]
				);
				
			} else {
				
				sx1 = x * xinterval;
				sx2 = sx1 + xinterval;
				sy1 = y * yinterval;
				sy2 = sy1 + yinterval;
 
				
				geo.faceVertexUvs[0].push(
					[
						new THREE.Vector2( sx1 , sy1 ),
						new THREE.Vector2( sx2 , sy1 ),
						new THREE.Vector2( sx1 , sy2 )
					],
					[
						new THREE.Vector2( sx2 , sy1 ),
						new THREE.Vector2( sx2 , sy2 ),
						new THREE.Vector2( sx1 , sy2 )

					]
				);
			
			}
		
		}
		
	}
	
	geo.uvsNeedUpdate = true;

};

THREE.Elemental.PlaneGeometry.prototype.applyBendModifier = function( direction , amount , reverse ) {
 
	
	var geo = this.geometry;
	
	var original = geo;
	
	var segs = this.segments;
	var dims = this.dimensions;
 
 
	var dsize , dsegs , rsegs , segdist , aint , aint_rad , id;
	
	if( direction == 'y' ) {
		
		dsegs = segs.y;
		rsegs = segs.x;
		dsize = dims.y;
		segdist = dsize / dsegs;
		aint = amount / dsegs;
		aint_rad = deg2rad( aint );
		
		for( var y = 1; y <= dsegs; y++ ) {
		
			for( var x = 0; x <= rsegs ; x++ ) {
				
				id = y*(rsegs+1) + x;
				
				geo.vertices[ id ].z = geo.vertices[ id - (rsegs +1) ].z + Math.sin( aint_rad*y ) * segdist;
				geo.vertices[ id ].y = geo.vertices[ id - (rsegs +1) ].y + Math.cos( aint_rad*y ) * segdist;
		 
				
			}
			
		}
	
	} else if( direction == 'x' ) {
		
		dsegs = segs.x;
		rsegs = segs.y;
		dsize = dims.x;
		segdist = dsize / dsegs;
		aint = amount / dsegs;
		aint_rad = THREE.Elemental.Utils.Deg2Rad( aint );
		
		for( var x = 1; x <= dsegs; x++ ) {
		
			for( var y = 0; y <= rsegs ; y++ ) {
				
				id = y*(dsegs+1) + x;
				
				geo.vertices[ id ].z = geo.vertices[ id - 1 ].z + Math.sin( aint_rad*x ) * segdist;
				geo.vertices[ id ].x = geo.vertices[ id - 1 ].x + Math.cos( aint_rad*x ) * segdist;
		 
				
			}
			
		}
		
	}
	
	
	geo.verticesNeedUpdate = true;
	
	return original;

};

THREE.Elemental.PlaneGeometry.prototype.applyHeightmap = function( map , strength ) {
	
	var geo = this.geometry;
	
	var image = map.image,
		w = image.width, 
		h = image.height,
		segs = this.segments,
		xint = w / segs.x,
		yint = h / segs.y;
 
	
	var imageData = THREE.Elemental.Utils.GetTextureData( image );
 
	var heightMultiplier = strength || 1;
 
	
	var color , avgColor;
	for( var y = 0; y <= segs.y; y++ ) {
		
		for( var x = 0; x <= segs.x; x++ ) {
			
			color = THREE.Elemental.Utils.GetPixelData( imageData , x*xint , y*yint );
			
			avgColor = (color.r + color.g + color.b)/3;
			
			geo.vertices[ y*(segs.x+1) + x ].z = (avgColor/255) * heightMultiplier;
			
		}
		
	}

	geo.verticesNeedUpdate = true;
	
};


THREE.Elemental.CubeGeometry = function( size , options ) {
	 
	// THREE's native geometry object
	var geo = new THREE.Geometry();
 
	// Optional options object. If it is undefined this is the default structure
	options = options || {
		
		vertexNormals: false,
		faceNormals: true,
		uvMethod: 0,
		yPivot: 0,
		xPivot: 0,
		zPivot: 0
		
	};
 
	
	// 1 - Span across texture space ; 0 - Tiled (each quad shares 100% of texture space - useful for terrain generation)
	var uvMethod = options.uvMethod || 0;
	
	// Vertex and Face normals flags (used as params in CalcNormals() below)
	var calcVertexNormals = options.vertexNormals || false;
	var calcFaceNormals = options.faceNormals || true;
	
	var xPivot = options.xPivot || 0;
	var yPivot = options.yPivot || 0;
	var zPivot = options.zPivot || 0;
	
	// Cut the size down in half to allow for a central pivot point 	
	var half = size/2;
	
	// Pivot offsets (0 = centered on the respective axis; -1 = half length left; 1 = half length right)
	var x = half*xPivot;
	var y = half*yPivot;
	var z = half*zPivot;
	
	// Generate Vertex points for cube (8 vertices, shared across face indices; no duplicates)
	geo.vertices = [
	
		// Front 4 vertices
		new THREE.Vector3( -half + x , half + y , half + z ),
		new THREE.Vector3( -half + x , -half + y , half + z ),
		new THREE.Vector3( half + x , -half + y , half + z ),
		new THREE.Vector3( half + x , half + y , half + z ),
		// Back 4 vertices
		new THREE.Vector3( -half + x , half + y , -half + z ),
		new THREE.Vector3( -half + x , -half + y , -half + z ),
		new THREE.Vector3( half + x , -half + y , -half + z ),
		new THREE.Vector3( half + x , half + y , -half + z )
		
	];
	
	
	// Assign vertex indices to each polygon
	geo.faces = [
	
		// Left
		new THREE.Face3( 4 , 5 , 0 ),
		new THREE.Face3( 5 , 1 , 0 ),
		// Front
		new THREE.Face3( 0 , 1 , 3 ),
		new THREE.Face3( 1 , 2 , 3 ),
		// Right
		new THREE.Face3( 3 , 2 , 7 ),
		new THREE.Face3( 2 , 6 , 7 ),
		// Back
		new THREE.Face3( 7 , 6 , 4 ),
		new THREE.Face3( 6 , 5 , 4 ),
		// Bottom
		new THREE.Face3( 1 , 5 , 2 ),
		new THREE.Face3( 5 , 6 , 2 ),
		// Top 
		new THREE.Face3( 4 , 0 , 7 ),
		new THREE.Face3( 0 , 3 , 7 )
		
	];
	
	// Call wrapper function for THREE's native geometry normals calculations.
	THREE.Elemental.Utils.CalcNormals( geo , calcFaceNormals , calcVertexNormals );
	
	// Return newly generate geometry for this instance.
	this.geometry = geo;
	
	// Calculate UV data
	this.setUVs( uvMethod );
	
	
};

THREE.Elemental.CubeGeometry.prototype.setUVs = function( method ) {
	
	var geo = this.geometry;
	
	// Reset UV data
	geo.faceVertexUvs[0] = [];
	
	var xseg = 0.25 , u1 , u2 , v1 , v2;
	
	var edgeBleedFix = 0.001;
	
	for( var f = 0; f < geo.faces.length / 2; f++ ) {
		
		if( method === 1 || method === 2 ) {
			
			// Left , Front , Right and Back faces
			if( f < 4 ) {
				
				u1 = xseg * f;
				u2 = u1 + xseg;
				v1 = 1.0 / 3 + edgeBleedFix;
				v2 = 1.0 / 3 + v1 - edgeBleedFix*2;
				
			} else {
			// Top and Bottom faces
			
				u1 = xseg + edgeBleedFix;
				if( method === 2 ) {
					u1 *= 2;
				}
				u2 = u1 + xseg - edgeBleedFix*2;
				 
				v1 = ( f === 4 ) ? 0 : 1.0 - (1.0 / 3);
				v2 = v1 + 1.0 / 3;
 
			}
			
			geo.faceVertexUvs[0].push(
				[
					new THREE.Vector2( u1 , v2 ),
					new THREE.Vector2( u1 , v1 ),
					new THREE.Vector2( u2 , v2 )
				],
				[
					new THREE.Vector2( u1 , v1 ),
					new THREE.Vector2( u2 , v1 ),
					new THREE.Vector2( u2 , v2 )
				]
			);
		
		} else {
		
			geo.faceVertexUvs[0].push(
				[
					new THREE.Vector2( 0 , 1 ),
					new THREE.Vector2( 0 , 0 ),
					new THREE.Vector2( 1 , 1 )
				],
				[
					new THREE.Vector2( 0 , 0 ),
					new THREE.Vector2( 1 , 0 ),
					new THREE.Vector2( 1 , 1 )
				]
			);
		
		}
	
	}
	
	geo.uvsNeedUpdate = true;
	
	
};

THREE.Elemental.PerlinNoise = function( w , h , octave_count ) {

	var white_noise = this.GenerateWhiteNoise( w , h );
  
	//var smooth_noise = this.GenerateSmoothNoise( white_noise , smoothness );
	
	var perlin_noise = this.GeneratePerlinNoise( white_noise , octave_count );
	
	var w = perlin_noise.length;
	var h = perlin_noise[0].length;
	
	var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
	
	for( var x = 0; x < w; x++ ) {
	
		for( var y = 0; y < h; y++ ) {
		
			//Zoomed in red 'square'
			var col = perlin_noise[x][y] * 255;
			context.fillStyle = 'rgb( '+col+' , '+col+' , '+col+' )';
			context.fillRect( x , y , 1 , 1);
			
		}
	
	}

};

THREE.Elemental.PerlinNoise.prototype.GeneratePerlinNoise = function( baseNoise , octave_count ) {

	var w = baseNoise.length;
	var h = baseNoise[0].length;

	var smoothNoise = new Array( octave_count+1 );

	var persistance = 0.5;

	//generate smooth noise
	for ( var i = 1; i <= octave_count; i++ ) {
		smoothNoise[ i ] = this.GenerateSmoothNoise( baseNoise, i );
	}
	
	var perlinNoise = new Array( w );
    var amplitude = 1.0;
	var totalAmplitude = 0.0;
	
	//blend noise together
    for( var o = 1; o <= octave_count; o++ ) {
	
       amplitude *= persistance;
       totalAmplitude += amplitude;
 
       for( var x = 0; x < w; x++) {
			
			if( o == 1 ) { 
				perlinNoise[ x ] = new Array( h );
			}
			
			for( var y = 0; y < h; y++ ) {
				
				if( o == 1 ) { perlinNoise[x][y] = 0.0; }
				perlinNoise[ x ][ y ] += smoothNoise[ o ][ x ][ y ] * amplitude;
				 

			}
		  
       }
	   
    }
	
	//normalisation
	for ( var x = 0; x < w; x++ ) {
	
		for ( var y = 0; y < h; y++) {
		
			perlinNoise[ x ][ y ] = perlinNoise[x][y] / totalAmplitude;
		 
		}
	
	}

	return perlinNoise;
	

};

THREE.Elemental.PerlinNoise.prototype.GenerateSmoothNoise = function( baseNoise , octave ) {

	var w = baseNoise.length;
	var h = baseNoise[ 0 ].length;
	
	var data = new Array( w );
	
	var samplePeriod = 1 << octave;
	var sampleFrequency = 1.0 / samplePeriod;
	
	var sample_x0, sample_x1 , sample_y0 , sample_y1 , horizontal_blend , vertical_blend , top , bottom;
	
	for( var x = 0; x < w; x++ ) {
		
		data[ x ] = new Array( h );
		
		sample_x0 = ( x  / samplePeriod ) * samplePeriod;
		sample_x1 = ( sample_x0 + samplePeriod ) % w; //wrap around
		horizontal_blend = ( x  - sample_x0 ) * sampleFrequency;
		
		for( var y = 0; y < h; y++ ) {
		
			//calculate the vertical sampling indices
			sample_y0 = (y / samplePeriod) * samplePeriod;
			sample_y1 = (sample_y0 + samplePeriod) % h; //wrap around
			vertical_blend = ( y - sample_y0 ) * sampleFrequency;
	 
			//blend the top two corners
			top = THREE.Elemental.Utils.Lerp( baseNoise[sample_x0][sample_y0],baseNoise[sample_x1][sample_y0] , horizontal_blend );
	 
			//blend the bottom two corners
			bottom = THREE.Elemental.Utils.Lerp( baseNoise[sample_x0][sample_y1] , baseNoise[sample_x1][sample_y1] , horizontal_blend );
	 
			//final blend
			data[ x ][ y ] = THREE.Elemental.Utils.Lerp( top , bottom , vertical_blend );
		
		}
		
	}
	
	return data;

};

THREE.Elemental.PerlinNoise.prototype.GenerateWhiteNoise = function( w , h ) {
 
	var data = new Array( w );
	
	var rnd = 0;
	
	for( var x = 0; x < w; x++ ) {
		
		data[ x ] = new Array( h );
		
		for( var y = 0; y < h; y++ ) {
		
			rnd = THREE.Elemental.Utils.RandomInt( 0 , 1 );
			
			data[ x ][ y ] = rnd;
		
		}
		
	}
	
	return data;

};

// Blend two textures together using Perlin Noise filter [Work in progress]
THREE.Elemental.BlendTextures = function( tex1 , tex2 , noise ) {

};

// Work in progress
THREE.Elemental.TireGeometry = function( radius , width , segments , options ) {

	var geo = new THREE.Geometry();
	
	options = options || {
		
		chamfering: 0.80,
		chamferSegments: 3
		
	};
	
	var tfrac = options.chamfering || 0.80;
	
	var hw = (width/2) * tfrac;
	
	var ainc = (Math.PI*2) / segments;
	
	var p = 0 , f1 , f2 , fix;
	
	for( var v = 0; v < segments; v++ ) {
		
		var ang = ainc * v;
		var x = Math.cos( ang ) * radius;
		var y = Math.sin( ang ) * radius;
		
		p = geo.vertices.push(
			
			// back
			new THREE.Vector3( x , y , hw ),
			// front
			new THREE.Vector3( x , y , -hw ),
			
		) - 2;
		
		 
		/*
			The last face of the cylinder must connect with the first pair of vertices , which follow a different index pattern
			To avoid writing long-winded if-else statements and copying the same code over and over this variable serves as a switch.
			
			The following diagram explains the structure and circuit closing principle:
			
			(0).  (2).  (4). 	  				(4).  (0).  (2).
							  => re-arrange =>
			(1).  (3).  (5). 	  				(5).  (1).  (3).
			
			Each segment contains 2 triangles of equal size created in a counter-clockwise manner.
			Therefore the first segment in the cylinder line will have the following indices:
			
			triangle a : 0 , 1 , 2
			triangle b : 2 , 1 , 3
			
			The last pair of triangles which close the circuit will then have the following indices:
			
			triangle a : 4 , 5 , 0
			triangle b : 0 , 5 , 1
			
			As such, there is a recognizable pattern.
			In both cases, the vertex index in the 3rd position of 'triangle a' and the 1st position of 'triangle b' is the same.
			Additionally, the difference between the 3rd index in both triangle a and b is 1. 
			Therefore, this can be expressed using a ternary operator, where fix = p + 2 in all cases except the last closing segment, where fix = 0;
			
		*/
		
		fix = ( v < segments - 1 ) ? p+2 : 0;
		
		f1 = new THREE.Face3( p , p+1 , fix );
		f2 = new THREE.Face3( fix , p+1 , fix+1 );
		
		geo.faces.push( f1, f2 );
		
	}
	
	this.geometry = geo;

};
