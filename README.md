# THREE.Elemental
Elemental is an extension library for THREE.js containing several geometry constructors and modifiers, including uv calculations.

---

## Functions and Usage

1. **PolylineGeometry( data , height [, options] )** - generate geometry from a set of points in 3d space with a specified width

```javascript
// Array of 3d points. Although it is not necessary to use THREE.Vector3, it is a must to have the following structure for each point: {x:0,y:0,z:0}
var points = [
  new THREE.Vector3( 0 , 0 , 0 ),
  new THREE.Vector3( 50 , 0 , 0 ),
  new THREE.Vector3( 80 , 0 , -20 ),
  new THREE.Vector3( 140 , 0 , 30 )
];

var height = 100;

// Optional parameter
var options = {
  uvmethod: 0 // Explained in the setUVs() section below
};

var polylineGeo = new THREE.Elemental.PolylineGeometry( points , height , options );
var polylineMesh = new THREE.Mesh( polylineGeo.geometry , your_material_here );
```

2. **PlaneGeometry( width , height [, options] )** - generate plane geometry.

```javascript
var width = 100;
var height = 100;

// Optional parameter
var options = {
  uvmethod: 0 // Explained in the setUVs() section below
};

// Function returns an object with several attributes. To access the raw geometry data use planeGeo.geometry.
var planeGeo = new THREE.Elemental.PlaneGeometry( width , height , options );
var planeMesh = new THREE.Mesh( planeGeo.geometry , your_material_here );
```

**Methods:** for each instance of PlaneGeometry(), there are several methods which can be called.

**2.1. setUVs( method )** - This function calculates the plane's UV texture coordinates. It is automatically called for every instance of PlaneGeometry(), however it can also be called manually if you wish to change the UV layout of the plane at any point. Example:
```javascript
/*
  0 : each segment tile (quad) in the plane takes up 100% of the texture space, causing an overlap between all polygons. 
      This can be useful when generating terrains from a heightmap for example (default) 
  1 : the texture space is spread across the entire plane. 
*/
var method = 0;
planeGeo.setUVs( method );
```


**2.2 applyHeightmap( map )** - This function takes a heightmap image loaded in THREE.js (via THREE.TextureLoader()) and uses its pixel color data to generate a 3d terrain geometry from the plane. 
```javascript

// Create an instance of THREE's texture loader
var loader = new THREE.TextureLoader();

// Attempt to load the texture. The texture should ideally be a square with power of 2 resolution (e.g. 256x256 , 512x512)
loader.load( 'heightmap_texture_file_here.jpg' , 
 
  // On load success execute this function and create terrain geometry
  function( texture ) {
    
    // Dimensions of terrain
    var width = 500;
    var height = 500;
    
    // 64*64 terrain (in general it is good to use powers of 2. Typical sizes are 16x16,32x32,64x64,128x128,256x256).
    var options = {
      x:64,
      y:64,
      uvmethod: 1
    };
    
    // Create plane geometry
    var planeGeo = new THREE.Elemental.PlaneGeometry( width , height , options );
    
    // Apply the heightmap we just loaded to the geometry
    planeGeo.applyHeightmap( texture );
    
    // Create mesh from the terrain geometry and add it to the scene.
    var planeMesh = new THREE.Mesh( plangeGeo.geometry , your_material_here );
    scene.add( planeMesh );
    
  } 
  
);

 
```
**2.3 applyBendModifier( direction , amount , reverse )** - Similar to 3ds Max's bend modifier, this allows to bend the plane geometry to a specified angle and direction.
```javascript

// For this example it is good to have more segments in the plane (particularly in the direction the bend modifier is applied)
var options = {
  x: 10,
  y: 10
};

var planeGeo = new THREE.Elemental.PlaneGeometry( 100 , 100 , options );

// The direction in which the modifier will be applied (string): 'x' - horizontal ; 'y' - vertical
var direction = 'x';

// The angular bend amount (in degrees). If set to 360 a cylinder will be created.
var amount = 90;

// Typically the bend modifier is applied from left to right if direction = 'x' or bottom to top if direction = 'y'. 
// In some cases you might wish to flip the sequence in the opposite order. This can be achieved by setting the reverse parameter to true.
var reverse = false;

// Apply bend modifier. In addition this function returns the previous geometry data before applying the modifier, in case you wish to revert back to the old geometry.
var oldGeo = planeGeo.applyBendModifier( 'x' );

```
