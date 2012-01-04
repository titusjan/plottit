
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

/////////////
// TreeMap //
/////////////

Listit.TreeMap = function (data, sizeProperty, fnHslOfComment) { // Constructor

    this.root = null;
    if (data instanceof Listit.Discussion) 
        this.root = this.createNodesFromDiscussion(data, sizeProperty, fnHslOfComment);
    else if (data instanceof Array) 
        this.root = this.createNodesFromArray(data);
    
}

Listit.TreeMap.prototype.toString = function () {
    return "Listit.TreeMap";
};

// Helper function
Listit.TreeMap.prototype._assert = function(expression, message) {
    if (!expression) throw new Error(message);
}
//


Listit.TreeMap.prototype.createNodesFromDiscussion  = function (discussion, sizeProperty, fnHslOfComment) {

    this._assert(discussion instanceof Listit.Discussion, 
        'createNodesFromDiscussion: data should be a Listit.Discussion');
    this._assert(sizeProperty, 'sizeProperty is not defined!');    
    this._assert(fnHslOfComment instanceof Function, 'fnHslOfComment should be a function');
    
    // Create root node
    var node = new Listit.TreeMap.Node(0, false);
    node.depthIncrement = 0; // this node is the root and does not increase the depth!
    
    for (let [idx, comments] in Iterator(discussion.comments)) {
        node.addChild( this._auxCreateNodeFromComment(comments, sizeProperty, fnHslOfComment) );
    }
    return node;
}


Listit.TreeMap.prototype._auxCreateNodeFromComment = function (comment, sizeProperty, fnHslOfComment) {

    var size = Math.max(1, comment[sizeProperty]); // All sizes < 1 are rendered as 1.
    var hsl = fnHslOfComment(comment);

    if ( comment.numReplies == 0 ) {
        var node = new Listit.TreeMap.Node( size, true, hsl[0], hsl[1] );
        node.depthIncrement = 0;
        return node;
    } else {

        var node = new Listit.TreeMap.Node(0, true);
        node.depthIncrement = 0; // this node is only to split up, does not represent a new depth!
        node.addChild( new Listit.TreeMap.Node(size, false, hsl[0], hsl[1]) ); 
        
        var childrenNode = new Listit.TreeMap.Node(0, false); 
        for (let [idx, reply] in Iterator(comment.replies)) {
            childrenNode.addChild( this._auxCreateNodeFromComment(reply, sizeProperty, fnHslOfComment) );
        }
        node.addChild(childrenNode); // Add after the childrenNode.size is final!
        return node;
    }
}


Listit.TreeMap.prototype.createNodesFromArray = function (data) {

    //Listit.fbLog('createNodesFromArray', data);
    if ( !(data instanceof Array) ) {
        // Create leaf node
        var node = new Listit.TreeMap.Node(data, true);
        return node;
    } else {
        // Create branche node
        var node = new Listit.TreeMap.Node(0, true);
        for (let [idx, elem] in Iterator(data)) {
            node.addChild( this.createNodesFromArray(elem) );
        }
        //Listit.fbLog('  --return: createNodesFromArray', node);
        return node;
    }
};


//////////////////
// TreeMap.Node //
//////////////////

Listit.TreeMap.Node = function (size, addCushion, hue, saturation) { // Constructor
    
    this.size = size;   // Relative size. For a branch node this should be the sum of its childrens sizes
    this._depthIncrement = null;
    this.addCushion      = addCushion; // Not every internal node may represent a cushion
    this._children       = null;
    this.rectangle       = null;
    this._hue            = hue;
    this._saturation     = saturation;
}

Listit.TreeMap.Node.prototype.toString = function () {
    return "Listit.TreeMap.Node";
};

Listit.TreeMap.Node.prototype._assert = function(expression, message) { // helper function
    if (!expression) throw new Error(message);
}

// Make sure that an empty list is returned if there are no children defined.
// This is so that we don't have to create empty lists objects for the leaf nodes.
Listit.TreeMap.Node.prototype.__defineGetter__("children", function() { 
    if (this._children == null) {
        return [];
    } else {
        return this._children;
    }
} );
Listit.TreeMap.Node.prototype.__defineSetter__("children", function(v) { this._children = v } );


// saturation is 1 by default
Listit.TreeMap.Node.prototype.__defineGetter__("saturation", function() { 
    return (this._saturation == null) ? 0.5 : this._saturation; 
} );
Listit.TreeMap.Node.prototype.__defineSetter__("saturation", function(v) { this._saturation = v } );


// hue is 1 by default
Listit.TreeMap.Node.prototype.__defineGetter__("hue", function() { 
    return (this._hue == null) ? 0.5 : this._hue; 
} );
Listit.TreeMap.Node.prototype.__defineSetter__("hue", function(v) { this._hue = v } );



// depthIncrement is 1 by default
Listit.TreeMap.Node.prototype.__defineGetter__("depthIncrement", function() { 
    return (this._depthIncrement == null) ? 1 : this._depthIncrement; 
} );
Listit.TreeMap.Node.prototype.__defineSetter__("depthIncrement", function(v) { this._depthIncrement = v } );


Listit.TreeMap.Node.prototype.addChild = function (child) {
    if (this._children == null) this._children = [];
    this._children.push(child);
    this.size += child.size;  // The parent node size must be the sum of the childrens sizes
    return child;
}

Listit.TreeMap.Node.prototype.isLeafNode = function () {
    return this.children.length == 0;
}


// Shows return string containing internal representation
Listit.TreeMap.Node.prototype.repr = function () {
    if (this.isLeafNode() ) {
        return this.size.toString();
    } else {
        var result = '<' + this.size + ': ';
        var childStrings = [c.repr() for each (c in this.children)];
        result += (childStrings).join(', ');
        result += '>';
        return result;        
    }
}


Listit.TreeMap.Node.prototype.sortNodesBySizeDescending = function () {

    if (this.children.length == 0) return; 
    this.children.sort( function(a, b) { return b.size - a.size } );
    for (let [idx, child] in Iterator(this.children) ) {
        child.sortNodesBySizeDescending();
    }
}


Listit.TreeMap.Node.prototype.layoutInStrips = function (rectangle) {
    
    if (rectangle) this.rectangle = rectangle;
    
    // layout node
    this._layoutStrip(this.rectangle.x, this.rectangle.y, 
        this.rectangle.width, this.rectangle.height) 
        
    for (let [idx, child] in Iterator(this.children)) {
        child.layoutInStrips();
    }
}


// Lays out the children[start, end] of the node
Listit.TreeMap.Node.prototype._layoutStrip = function (x, y, width, height, start, end) {

    //Listit.fbLog('Listit.TreeMap.Node._layoutStrip', x, y, width, height, start, end);

    var layoutSum = this.children.slice(start, end).
        reduce( function (prev, cur) { return prev+cur.size }, 0);
        
    var accumSize = 0; 
    for (let [idx, child] in Iterator(this.children.slice(start, end))) {
        
        var relSize = child.size/layoutSum;
        if (height > width) {
            // Lay out from top to bottom.
            child.rectangle = { x: x, y: y+accumSize, width: width, height: relSize*height };
            accumSize += relSize*height;
        } else {
            // Lay out from left to right.
            child.rectangle = { x: x+accumSize, y: y, width: relSize*width, height: height };
            accumSize += relSize*width;
        }
        //Listit.fbLog('Layout: ', child.size, child.rectangle);
    }
}


// Layout a tree in so called squarified manner. See "Squarified Treemaps" by
// by Mark Bruls, Kees Huizing, and Jarke J. van Wijk.
// www.win.tue.nl/~vanwijk/stm.pdf
Listit.TreeMap.Node.prototype.layoutSquarified = function (rectangle) {
    
    // first call needs to set a rectangle, for the children this is done in _squarify
    if (rectangle) this.rectangle = rectangle;  
    
    // layout node
    this._squarify(this.rectangle.x, this.rectangle.y, 
        this.rectangle.width, this.rectangle.height) 
        
    for (let [idx, child] in Iterator(this.children)) {
        child.layoutSquarified();
    }
}


// Lays out the children of the node using the squarify algorithm.
Listit.TreeMap.Node.prototype._squarify = function (x, y, width, height) {

    this.rectangle = { x: x, y: y, width: width, height: height };
    
    var sizeSum = this.children.reduce( function (prev, cur) { return prev+cur.size }, 0);
    var areas = [ c.size / sizeSum * width*height for each (c in this.children)];
    
    var start = 0;
    while (start < this.children.length) {
    
        var shortestSide = (height < width) ? height : width;
        var longestSide  = (height >= width) ? height : width;
        
        // Find end index for which the worst aspect ratio of children[start, end] is the best (lowest)
        var bestSoFar = 1e9;
        var end = start;
        
        for (var tryEnd = start+1; tryEnd <= this.children.length; tryEnd++) {
            
            var tryRow = areas.slice(start, tryEnd);
            var currentAspectRatio = Listit.TreeMap.Node.worstAspectRatio(tryRow, shortestSide);
                
            if (currentAspectRatio < bestSoFar) {
                bestSoFar = currentAspectRatio;
                end = tryEnd;
            } else {
                break;
            }
        }
        
        // Lay out children[start, end]
        var layoutSum = areas.slice(start, end).
            reduce( function (prev, cur) { return prev+cur }, 0);
        var restSum = areas.slice(start).
            reduce( function (prev, cur) { return prev+cur }, 0);

        if (height < width) { // Split along the longest side
            // split along width
            var split = width * (layoutSum / restSum);
            this._layoutStrip(x, y, split, height, start, end);
            width -= split;
            x += split;
        } else {
            // split along height
            var split = height * (layoutSum / restSum);
            this._layoutStrip(x, y, width, split, start, end);
            height -= split;
            y += split;
        }

        // Process the rest
        start = end;
    } // while
}  


Listit.TreeMap.Node.prototype.renderFlat = function (context, depth) {

    if (this.size <= 0) return;
    
    if (depth == null) depth = 0;
    
    if (this.isLeafNode() ) { // Draw node
        
        var rect = this.rectangle;
        var color = 'hsl(' + this.hue*360 + ', ' + this.saturation*100 + '%, 50%)';
        context.fillStyle = color;
        context.lineWidth = 0.75; // Don't use 1, this is ugly with antialiassing.
        context.strokeStyle ='black';
        context.strokeRect(rect.x, rect.y, rect.width, rect.height);
        context.fillRect(rect.x, rect.y, rect.width, rect.height);

    } else { // Draw children
        for (let [idx, child] in Iterator(this.children)) {
            child.renderFlat(context, depth + this.depthIncrement);
        }
    }
}


// Renders cushioned tree maps. See "Cushion Treemaps: Visualization of Hierarchical Information"
// by Jarke J. van Wijk and Huub van de Wetering. 
// www.win.tue.nl/~vanwijk/ctm.pdf
Listit.TreeMap.Node.prototype.renderCushioned = function (context, h0, f, Iamb) {


    this._assert(this.rectangle, "Listit.TreeMap.Node.render: No layout for root node"); 

    var rect = this.rectangle;
    context.clearRect(rect.x, rect.y, rect.width, rect.height);
    var imgData = context.createImageData(Math.round(rect.width), Math.round(rect.height));
    var image = {pixels  : imgData.data, 
                 context : context, // include canvas context for e.g. debugging.
                 width   : Math.round(rect.width), 
                 height  : Math.round(rect.height)}

    this._auxRenderCushioned(image, 0, 0, 0, 0, 0, h0, f, Iamb); // Start recursion with flat cushion.

    context.putImageData(imgData, 0, 0);
}


// Auxilairy function to renderCushioned that renders the cushions recursively.
// The sx1, sy1, sx2, sy2 parameters are the coefficients of the parabola shaped cushions:
//   f(x, y) = sx2*x^2 + sx1*x + sy2*y^2 + sy1*y + c. 
Listit.TreeMap.Node.prototype._auxRenderCushioned = function (image, depth, sx1, sy1, sx2, sy2, h0, f, Iamb) {

    if (this.size <= 0) return;
    var rect = this.rectangle;
    
    //var h = h0 * Math.pow(f, depth); // The sugestion from the article
    
    // The cushions at	depth=0 will be twice the height of those at depth 1 and heigher; 
    // This gives the best looking results. Otherwise cushions at depth >= 1 will look too steep.
    var h = (depth===0) ? h0 : (h0/f); // misuse slider-f (f is not the f from the article on this line)

    //var h = (depth===0) ? 1.2 : (1.2/2.5);
    
    if ( this.addCushion === true ) { 
        // Adds a new cushion for this level
        [sx1, sx2] = Listit.TreeMap.Node._addRidge( rect.x, rect.width+rect.x,  h, sx1, sx2);
        [sy1, sy2] = Listit.TreeMap.Node._addRidge( rect.y, rect.height+rect.y, h, sy1, sy2);
    }
        
    
    if (this.isLeafNode() ) {
    
        var Isource = 1 - 2*Iamb;
        var L = [-1, -1, 10];
        var lengthL = Math.sqrt(L[0]*L[0] + L[1]*L[1] + L[2]*L[2]);
        var Lx = L[0] / lengthL;
        var Ly = L[1] / lengthL;
        var Lz = L[2] / lengthL;
        
        var minX = Math.floor(rect.x + 0.5);
        var minY = Math.floor(rect.y + 0.5);
        var maxX = Math.floor(rect.x + rect.width - 0.5);
        var maxY = Math.floor(rect.y + rect.height - 0.5);
        
        pixels = image.pixels;
        for (var y = minY; y <= maxY; y += 1) {
            var i = 4 * (minX + (y * image.width)); 
            for (var x = minX; x <= maxX; x += 1) {
            
                var nx = - (2 * sx2 * (x+0.5) + sx1); // Normal vector of cushion
                var ny = - (2 * sy2 * (y+0.5) + sy1); 
                var cosAngle = (nx*Lx + ny*Ly + Lz) / Math.sqrt(nx*nx + ny*ny + 1.0);
                //var cosAngle = 1 / Math.sqrt(nx*nx + ny*ny + 1.0); // Only for Lxyz = [0,0,1]!
                
                var Ispec = Isource * cosAngle
                var Intensity = Iamb + Math.max(Ispec, 0);
                
                var rgb = Listit.hslToRgb(this.hue, this.saturation, Intensity);

                pixels[i  ] = rgb[0]; // R channel
                pixels[i+1] = rgb[1]; // G channel
                pixels[i+2] = rgb[2]; // B channel
                pixels[i+3] = 255; // Alpha channel
                
                i += 4; // i = 4 * (x + (y * image.width));
            }
        }
    } else {
        // Draw children
        for (let [idx, child] in Iterator(this.children)) {
            child._auxRenderCushioned(image, depth + this.depthIncrement, sx1, sy1, sx2, sy2, h0, f, Iamb);
        }
    }
}



///////
// Static functions

// Determines the worst aspect ratio given a list of areas of rectangles
// that share a common width (but have different heigths).
Listit.TreeMap.Node.normalizeData = function (areas, targetSum) {
    var sum = areas.reduce(function (prev, cur) { return prev+cur }, 0);
    return [ area  / sum * targetSum  for each (area in areas ) ];
}

// Determines the worst aspect ratio given a list of areas of rectangles
// that share a common width (but have different heigths).
Listit.TreeMap.Node.worstAspectRatio = function (areas, width) {

    var sum = areas.reduce(function (prev, cur) { return prev+cur }, 0);
    var max = 0;
    for (var [idx, area] in Iterator(areas)) {
        var aspectRatio = (width*width * area) / (sum*sum);
        if (aspectRatio > max) max = aspectRatio;
        if (1/aspectRatio > max) max = 1/aspectRatio;
    }
    return max;
}


// Add cushion
Listit.TreeMap.Node._addRidge = function (v1, v2, h, s1, s2) {

    return [s1 + 4*h*(v2+v1)/(v2-v1), s2 - 4*h/(v2-v1)];
}


////////////
// Colors //
////////////

// From: http://mjijackson.com/

/**
 * Converts an RGB color size to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color size
 * @param   Number  g       The green color size
 * @param   Number  b       The blue color size
 * @return  Array           The HSL representation
 */
Listit.rgbToHsl = function (r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

Listit.hue2rgb = function (p, q, t){
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
}
        
/**
 * Converts an HSL color size to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
Listit.hslToRgb = function (h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = Listit.hue2rgb(p, q, h + 1/3);
        g = Listit.hue2rgb(p, q, h);
        b = Listit.hue2rgb(p, q, h - 1/3);
    }
    return [r * 255, g * 255, b * 255];
}


