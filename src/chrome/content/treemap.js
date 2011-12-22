
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
    for (let [idx, reply] in Iterator(discussion.comments)) {
        var child = node.addChild( this._auxCreateNodeFromComment(reply) );
        node.value += child.value;
    }
    return node;
    
    node._calculatesubtreeValues();
    return node;
}


Listit.TreeMap.prototype._auxCreateNodeFromComment  = function (comment) {

    //var value = comment.score;
    var value = comment.numChars;
    if (value < 1) value = 1;
    var node = new Listit.TreeMap.Node(value);
    
    for (let [idx, reply] in Iterator(comment.replies)) {
        var child = node.addChild( this._auxCreateNodeFromComment(reply) );
        node.value += child.value;
    }
    return node;
}


Listit.TreeMap.prototype.createNodesFromArray = function (data) {

    if ( !(data instanceof Array) ) {
        // Create leave node
        var node = new Listit.TreeMap.Node(data);
        return node;
    } else {
        // Create branche node
        var node = new Listit.TreeMap.Node(0);
        for (let [idx, elem] in Iterator(data)) {
            var child = node.addChild( this.createNodesFromArray(elem) );
            node.value += child.value; // branch node.value is sum of childrens value
        }
        return node;
    }
};




//////////////////
// TreeMap.Node //
//////////////////

Listit.TreeMap.Node = function (value) { // Constructor
    
    this.value = value;   // for a branch node this should be the sum of its childrens values
    this._children = null;
    this.rectangle = null;
}

Listit.TreeMap.Node.prototype.toString = function () {
    return "Listit.TreeMap.Node";
};

Listit.TreeMap.Node.prototype._assert = function(expression, message) { // helper function
    if (!expression) throw new Error(message);
}

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
    return child;
}

Listit.TreeMap.Node.prototype.isLeaveNode = function () {
    return this.children.length = 0;
}



Listit.TreeMap.Node.prototype.calculateLayout = function (x, y, width, height) {

    //console.log("calculateLayout: ", x, y, width, height, (height > width));
    
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

Listit.TreeMap.Node.prototype.render = function (context, depth) {
    
    if (!this.isLeaveNode) return;
     
    if (!depth) depth = 0;
   
    var maxDepth = 7;
    context.lineWidth = (depth < maxDepth) ? maxDepth-depth+2 : 1;
    
    var color = 'hsl(' + depth/maxDepth*255 + ', 100%, 50%)';
    context.fillStyle = color;
    
    context.lineWidth = 0.3;
    context.strokeStyle ='black';
    
    var rect = this.rectangle;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    
    for (let [idx, child] in Iterator(this.children)) {
        child.render(context, depth+1);
    }
}

