// Needs Javascript 1.8 because of the reduce call.


if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space


/////////////
// TreeMap //
/////////////

Listit.TreeMap = function (data) { // Constructor

    this.data = data; 
    this.root = this.createNodesFromArray(data);
    
}

Listit.TreeMap.prototype.toString = function () {
    return "Listit.TreeMap";
};

// Helper function
Listit.TreeMap._assert = function(expression, message) {
    if (!expression) throw new Error(message);
}
//this._assert(data instanceof Array, '_createNodes: data should be an Array');


Listit.TreeMap.prototype.createNodesFromArray = function (data) {
    var node = this._auxCreateNodesFromArray(data);
    node._calculatesubtreeValues();
    return node;
}

Listit.TreeMap.prototype._auxCreateNodesFromArray = function (data) {

    if ( !(data instanceof Array) ) {
        // Create leave node
        var node = new Listit.TreeMap.Node(data);
        return node;
    } else {
        // Create branche node
        var node = new Listit.TreeMap.Node(0); // branch nodes doesn't have a nodeValue
        for (let [idx, elem] in Iterator(data)) {
            node.addChild( this._auxCreateNodesFromArray(elem) );
        }
        return node;
    }
};




//////////////////
// TreeMap.Node //
//////////////////

Listit.TreeMap.Node = function (nodeValue) { // Constructor
    
    this.nodeValue = nodeValue;
    this.subtreeValue = null;
    this._children = null;
    this.rectangle = null;
}

Listit.TreeMap.Node.prototype.toString = function () {
    return "Listit.TreeMap.Node";
};

Listit.TreeMap.Node.prototype.__defineGetter__("children", function() { 
    // Make sure that an empty list is returned if there are no children defined.
    // This is so that we don't have to create empty lists objects for the leave nodes.
    if (this._children == null) {
        return [];
    } else {
        return this._children;
    }
} );
Listit.TreeMap.Node.prototype.__defineSetter__("children", function(v) { this._children = v } );

Listit.TreeMap.Node.prototype.addChild = function (child) {
    if (this._children == null) this._children = [];
    this._children.push(child);
}

// Makes the subtreeValue element equal to the nodeValue property plus the sum of the nodeValue
// properties of the descendants.
Listit.TreeMap.Node.prototype._calculatesubtreeValues = function () {

    //console.log("_calculatesubtreeValues: ", this.nodeValue);
    var sum = this.nodeValue;
    for (let [idx, child] in Iterator(this.children)) {
        sum += child._calculatesubtreeValues();
    }
    this.subtreeValue = sum;
    return sum;
}



Listit.TreeMap.Node.prototype.calculateLayout = function (x, y, width, height) {

    //console.log("calculateLayout: ", x, y, width, height, (height > width));
    
    this.rectangle = { x: x, y: y, width: width, height: height }
    
    var values = [ c.subtreeValue for each (c in this.children)];
    var sumValues = values.reduce(function (a,b) { return a+b }, 0); // sum of the values array
    var accumSize = 0; 
    for (let [idx, child] in Iterator(this.children)) {
        
        var relSize = values[idx]/sumValues;
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

Listit.TreeMap.Node.prototype.render = function (context, depth) {
    
    if (!depth) depth = 0;
   
    var maxDepth = 10;
    context.lineWidth = (depth < maxDepth) ? maxDepth-depth+2 : 1;
    
    var color = 'hsl(' + depth/maxDepth*255 + ', 100%, 50%)';
    context.fillStyle = color;
    
    context.lineWidth = 2;
    context.strokeStyle ='black';
    
    var rect = this.rectangle;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    
    for (let [idx, child] in Iterator(this.children)) {
        child.render(context, depth+1);
    }
}

