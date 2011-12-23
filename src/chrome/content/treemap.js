
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

    //var value = comment.score;
    var value = comment.numChars;

    if ( comment.numReplies == 0 ) {
        // Create leaf node
        return new Listit.TreeMap.Node( value >= 1 ? value : 1 );
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

    //console.log('createNodesFromArray', data);
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
        //console.log('  --return: createNodesFromArray', node);
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
    
    
    //console.log(this);
    if (!depth) depth = 0;
    //console.log("Listit.TreeMap.Node.render:", depth, this.isLeafNode(), this);
    
    if (this.isLeafNode() ) {
        // Draw node
   
        var maxDepth = 7;
        context.lineWidth = (depth < maxDepth) ? maxDepth-depth+2 : 1;
        
        var color = 'hsl(' + depth/maxDepth*255 + ', 100%, 50%)';
        context.fillStyle = color;
        
        context.lineWidth = 0.3;
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

