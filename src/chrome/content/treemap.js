
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
    this.rectangle       = undefined;
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
    this.children.sort( function(a, b) { return b.value - a.value } );
    for (let [idx, child] in Iterator(this.children) ) {
        child.sortNodesByValueDescending();
    }
}

/*
Listit.TreeMap.Node.prototype.calculateLayout = function (x, y, width, height) {

    //Listit.fbLog("calculateLayout: ", x, y, width, height, (height > width));
    this.rectangle = { x: x, y: y, width: width, height: height }
    
    var values = [ c.value for each (c in this.children)];
    var accumSize = 0; 
    for (let [idx, child] in Iterator(this.children)) {
        
        var relSize = values[idx]/this.value;
        if (height > width) {
            // Lay out from top to bottom.
            child.calculateLayout(x, y+accumSize, width, relSize*height);
            accumSize += relSize*height;
        } else {
            // Lay out from left to right.
            child.calculateLayout(x+accumSize, y, relSize*width, height);
            accumSize += relSize*width;
        }
    }
}
*/

Listit.TreeMap.Node.prototype.layoutInStrips = function (rectangle) {

    if (rectangle) this.rectangle = rectangle;
    
    // layout node
    this._layoutStrip(this.rectangle.x, this.rectangle.y, 
        this.rectangle.width, this.rectangle.height) 
        
    for (let [idx, child] in Iterator(this.children)) {
        child.layoutInStrips();
    }
}




Listit.TreeMap.Node.prototype.layoutSquarified = function (rectangle) {

    if (rectangle) this.rectangle = rectangle;
    
    // layout node
    this._squarify(this.rectangle.x, this.rectangle.y, 
        this.rectangle.width, this.rectangle.height) 
        
    for (let [idx, child] in Iterator(this.children)) {
        child.layoutSquarified();
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

// Lays out the children of the node using the squarify algorithm.
Listit.TreeMap.Node.prototype._squarify = function (x, y, width, height) {

    this.rectangle = { x: x, y: y, width: width, height: height };
    
    var valueSum = this.children.reduce( function (prev, cur) { return prev+cur.value }, 0);
    var areas = [ c.value / valueSum * width*height for each (c in this.children)];
    
    var start = 0;
    while (start < this.children.length) {
        //Listit.fbLog("---- LOOP ----");
        //Listit.fbLog('currentRow', [c.value for each (c in this.children.slice(start))] );
    
        var shortestSide = (height < width) ? height : width;
        var longestSide  = (height >= width) ? height : width;
        
        // Find end index for which the worst aspect ratio of children[start, end] is the best (lowest)
        var bestSoFar = 1e9;
        var end = start;
        
        for (var tryEnd = start+1; tryEnd <= this.children.length; tryEnd++) {
            
            //var tryRow = [c.value for each (c in this.children.slice(start, tryEnd))];
            var tryRow = areas.slice(start, tryEnd);
            var currentAspectRatio = Listit.TreeMap.Node.worstAspectRatio(tryRow, shortestSide);
            //Listit.fbLog('currentAspectRatio', currentAspectRatio, tryRow);
                
            if (currentAspectRatio < bestSoFar) {
                bestSoFar = currentAspectRatio;
                end = tryEnd;
            } else {
                break; // TODO?
            }
        }
        
        //Listit.fbLog('layoutRow', [c.value for each (c in this.children.slice(start, end))] );
        
        // Lay out the current children[start, end]
        var layoutSum = areas.slice(start, end).
            reduce( function (prev, cur) { return prev+cur }, 0);
        var restSum = areas.slice(start).
            reduce( function (prev, cur) { return prev+cur }, 0);
            
        //Listit.fbLog('layoutSum', layoutSum);
        //Listit.fbLog('restSum', restSum);


        // Split along the longest side
        if (height < width) {
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
    }
}  


Listit.TreeMap.Node.prototype.render = function (context, depth) {

    //Listit.fbLog(this);
    this._assert(this.rectangle, "Listit.TreeMap.Node.render: No layout for current node"); 

    if (!depth) depth = 0;
    //Listit.fbLog("Listit.TreeMap.Node.render:", depth, this.isLeafNode(), this);
    
    if (this.isLeafNode() ) {
        // Draw node
   
        var maxDepth = 12;
        //context.lineWidth = (depth < maxDepth) ? maxDepth-depth+2 : 1;
        
        var color = 'hsl(' + (240-(depth/maxDepth*360)) % 360 + ', 100%, 50%)';
        context.fillStyle = color;
        
        //context.lineWidth = 0.3;
        context.lineWidth = 0.7;
        context.strokeStyle ='black';
        
        var rect = this.rectangle;
        context.fillRect(rect.x, rect.y, rect.width, rect.height);
        context.strokeRect(rect.x, rect.y, rect.width, rect.height);
        
    } else {
        // Draw children
        for (let [idx, child] in Iterator(this.children)) {
            child.render(context, depth + this.depthIncrement);
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

