
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
    node._calculateSumValues();
    return node;
}

Listit.TreeMap.prototype._auxCreateNodesFromArray = function (data) {

    if ( !(data instanceof Array) ) {
        // Create leave node
        var node = new Listit.TreeMap.Node(data);
        return node;
    } else {
        // Create branche node
        var node = new Listit.TreeMap.Node(0); // branch nodes doesn't have a value
        for (let [idx, elem] in Iterator(data)) {
            node.addChild( this._auxCreateNodesFromArray(elem) );
        }
        return node;
    }
};




//////////////////
// TreeMap.Node //
//////////////////

Listit.TreeMap.Node = function (value) { // Constructor
    
    this.value = value;
    this.sumValue = null;
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

// Makes the sumValue element equal to the value property plus the sum of the value
// property of all the children.
Listit.TreeMap.Node.prototype._calculateSumValues = function () {

    console.log("_calculateSumValues: ", this.value);
    var sum = this.value;
    for (let [idx, child] in Iterator(this.children)) {
        sum += child._calculateSumValues();
    }
    this.sumValue = sum;
    return sum;
}
