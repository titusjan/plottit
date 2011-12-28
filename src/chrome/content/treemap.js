
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

/////////////
// TreeMap //
/////////////

Listit.TreeMap = function (data) { // Constructor

    this.root = null;
    if (data instanceof Listit.Discussion) 
        this.root = this.createNodesFromDiscussion(data);
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


Listit.TreeMap.prototype.createNodesFromDiscussion  = function (discussion) {

    this._assert(discussion instanceof Listit.Discussion, 
        'createNodesFromDiscussion: data should be a Listit.Discussion');

    // Create root node
    var node = new Listit.TreeMap.Node(0);
    node.depthIncrement = 0; // this node is the root and does not increase the depth!
    
    for (let [idx, comments] in Iterator(discussion.comments)) {
        node.addChild( this._auxCreateNodeFromComment(comments) );
    }
    return node;
}


Listit.TreeMap.prototype._auxCreateNodeFromComment = function (comment) {

    //var value = 1;
    var value = comment.score;
    //var value = comment.numChars;
    if (value < 1) value = 1;

    if ( comment.numReplies == 0 ) {
        // Create leaf node
        return new Listit.TreeMap.Node( value );
    } else {
        // Create branch node
        
        var node = new Listit.TreeMap.Node(0);
        node.depthIncrement = 0; // this node is only to split up, does not represent a new depth!
        node.addChild( new Listit.TreeMap.Node(value) ); 
        
        var childrenNode = new Listit.TreeMap.Node(0); 
        for (let [idx, reply] in Iterator(comment.replies)) {
            childrenNode.addChild( this._auxCreateNodeFromComment(reply) );
        }
        node.addChild(childrenNode); // Add after the childrenNode.value is final!
        return node;
    }
}


Listit.TreeMap.prototype.createNodesFromArray = function (data) {

    //Listit.fbLog('createNodesFromArray', data);
    if ( !(data instanceof Array) ) {
        // Create leaf node
        var node = new Listit.TreeMap.Node(data);
        return node;
    } else {
        // Create branche node
        var node = new Listit.TreeMap.Node(0);
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

Listit.TreeMap.Node = function (value) { // Constructor
    
    this.value = value;   // for a branch node this should be the sum of its childrens values
    this._depthIncrement = null;
    this._children       = null;
    this.rectangle       = null;
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


// depthIncrement is 1 by default
Listit.TreeMap.Node.prototype.__defineGetter__("depthIncrement", function() { 
    return (this._depthIncrement == null) ? 1 : this._depthIncrement; 
} );
Listit.TreeMap.Node.prototype.__defineSetter__("depthIncrement", function(v) { this._depthIncrement = v } );


Listit.TreeMap.Node.prototype.addChild = function (child) {
    if (this._children == null) this._children = [];
    this._children.push(child);
    this.value += child.value;  // The parent node value must be the sum of the childrens values
    return child;
}

Listit.TreeMap.Node.prototype.isLeafNode = function () {
    return this.children.length == 0;
}


// Shows return string containing internal representation
Listit.TreeMap.Node.prototype.repr = function () {
    if (this.isLeafNode() ) {
        return this.value.toString();
    } else {
        var result = '<' + this.value + ': ';
        var childStrings = [c.repr() for each (c in this.children)];
        result += (childStrings).join(', ');
        result += '>';
        return result;        
    }
}


Listit.TreeMap.Node.prototype.sortNodesByValueDescending = function () {

    if (this.children.length == 0) return; 
    this.children.sort( function(a, b) { return b.value - a.value } );
    for (let [idx, child] in Iterator(this.children) ) {
        child.sortNodesByValueDescending();
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
        reduce( function (prev, cur) { return prev+cur.value }, 0);
        
    var accumSize = 0; 
    for (let [idx, child] in Iterator(this.children.slice(start, end))) {
        
        var relSize = child.value/layoutSum;
        if (height > width) {
            // Lay out from top to bottom.
            child.rectangle = { x: x, y: y+accumSize, width: width, height: relSize*height };
            accumSize += relSize*height;
        } else {
            // Lay out from left to right.
            child.rectangle = { x: x+accumSize, y: y, width: relSize*width, height: height };
            accumSize += relSize*width;
        }
        //Listit.fbLog('Layout: ', child.value, child.rectangle);
    }
}


// Layout a tree in so called squarified manner. See "Squariﬁed Treemaps" by
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
    
    var valueSum = this.children.reduce( function (prev, cur) { return prev+cur.value }, 0);
    var areas = [ c.value / valueSum * width*height for each (c in this.children)];
    
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

    if (this.value <= 0) return;
    
    if (depth == null) depth = 0;
    
    if (this.isLeafNode() ) {
        // Draw node
   
        var maxDepth = 12;
        //context.lineWidth = (depth < maxDepth) ? maxDepth-depth+2 : 1;
        
        var color = 'hsl(' + (240-(depth/maxDepth*360)) % 360 + ', 100%, 50%)';
        context.fillStyle = color;
        
        //context.lineWidth = 0.3;
        context.lineWidth = 0.7;
        //context.strokeStyle ='black';
        
        var rect = this.rectangle;
        context.strokeRect(rect.x, rect.y, rect.width, rect.height);
        context.fillRect(rect.x, rect.y, rect.width, rect.height);
       
    } else {
        // Draw children
        for (let [idx, child] in Iterator(this.children)) {
            child.renderFlat(context, depth + this.depthIncrement);
        }
    }
}


// Renders cushioned tree maps. See "Cushion Treemaps: Visualization of Hierarchical Information"
// by Jarke J. van Wijk and Huub van de Wetering. 
// www.win.tue.nl/~vanwijk/ctm.pdf
Listit.TreeMap.Node.prototype.renderCushioned = function (context) {

    var rect = this.rectangle;
    this._assert(this.rectangle, "Listit.TreeMap.Node.render: No layout for root node"); 

    context.clearRect(rect.x, rect.y, rect.width, rect.height);
    var imgData = context.createImageData(Math.round(rect.width), Math.round(rect.height));
    var image = {pixels  : imgData.data, 
                 context : context, // include canvas context for e.g. debugging.
                 width   : Math.round(rect.width), 
                 height  : Math.round(rect.height)}

    this._auxRenderCushioned(image, 0, 0, 0, 0, 0); // Start recursion with flat cushion.

    context.putImageData(imgData, 0, 0);
}


// Auxilairy function to renderCushioned that renders the cushions recursively.
// The sx1, sy1, sx2, sy2 parameters are the coefficients of the parabola shaped cushions:
//   f(x, y) = sx2*x^2 + sx1*x + sy2*y^2 + sy1*y + c. 
Listit.TreeMap.Node.prototype._auxRenderCushioned = function (image, depth, sx1, sy1, sx2, sy2) {

    if (this.value <= 0) return;
    
    // Adds a new cushion for this level
    var f = 0.5; 
    var h0 = 0.2;
    var h = h0 * Math.pow(f, depth);
    var rect = this.rectangle;
    [sx1, sx2] = Listit.TreeMap.Node._addRidge( this.rectangle.x, this.rectangle.width+this.rectangle.x,  h, sx1, sx2);
    [sy1, sy2] = Listit.TreeMap.Node._addRidge( this.rectangle.y, this.rectangle.height+this.rectangle.y, h, sy1, sy2);

    if (this.isLeafNode() ) {
    
        var Iamb = 0.2;            // Ambient intensity
        var Isource = 0.75 - Iamb;  // Light source intensity (choosen so that max intensity = 0.85)
        var Lx = 0;               // Light source from above 
        var Ly = 0;               // Light source must have length 1
        var Lz = 1;
        //var Lx = -0.09759;      // Light source from slightly upper right
        //var Ly = 0.19518;
        //var Lz = 0.9759;
        
        var minX = Math.floor(this.rectangle.x + 0.5);
        var minY = Math.floor(this.rectangle.y + 0.5);
        var maxX = Math.floor(this.rectangle.x + this.rectangle.width - 0.5);
        var maxY = Math.floor(this.rectangle.y + this.rectangle.height - 0.5);
            
        for (var y = minY; y <= maxY; y += 1) {
            for (var x = minX; x <= maxX; x += 1) {
            
                var nx = - (2 * sx2 * (x+0.5) + sx1); // Normal vector of cushion
                var ny = - (2 * sy2 * (y+0.5) + sy1); 
                var cosAngle = (nx*Lx + ny*Ly + Lz) / Math.sqrt(nx*nx + ny*ny + 1.0);
                
                var Ispec = Isource * cosAngle
                var Intensity = Iamb + Math.max(Ispec, 0);
                
                var rgb = Listit.hslToRgb(240/360, 1, Intensity);
                
                var i = 4 * (x + (y * image.width));
                image.pixels[i  ] = rgb[0]; // R channel
                image.pixels[i+1] = rgb[1]; // G channel
                image.pixels[i+2] = rgb[2]; // B channel
                image.pixels[i+3] = 255; // Alpha channel

                if (i%10000 == 0) {
                    console.log('rgb', rgb);
                }                
            }
        }
        
    } else {
        // Draw children
        for (let [idx, child] in Iterator(this.children)) {
            child._auxRenderCushioned(image, depth + this.depthIncrement, sx1, sy1, sx2, sy2);
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


// Add cusion
Listit.TreeMap.Node._addRidge = function (v1, v2, h, s1, s2) {

    return [s1 + 4*h*(v2+v1)/(v2-v1), s2 - 4*h/(v2-v1)];
}

////////////
// Colors //
////////////

// From: http://mjijackson.com/

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
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

/**
 * Converts an HSL color value to RGB. Conversion formula
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
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}


