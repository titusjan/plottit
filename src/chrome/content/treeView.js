if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

/////////
// Aux //
/////////


Listit.getTreeBoxObject = function (treeID) {

  var tree = document.getElementById(treeID);
  var boxObject = tree.boxObject;
  boxObject.QueryInterface(Components.interfaces.nsITreeBoxObject); // Casts the object
  return boxObject;
}


//////////////
// TreeView //
//////////////

Listit.TreeView = function () { // Constructor

    this.typeStr = 'treeView';  // TODO in prototype ???
    this.allPosts = [];
    this.visiblePosts = [];
    this.isFlat = false;     // If body column is a tree of flat

    this.treeBox = null;
    this.selection = null;
}

////
// Methods that are not part of the nsITreeView interface
////

Listit.TreeView.prototype.getPosts = function() {
    return this.allPosts;
}

Listit.TreeView.prototype.setPostsSorted = function(comparisonFunction, structure, posts) {

    Listit.logger.debug("setPostsSorted -- ")
    if (posts === undefined) {
        posts = this.allPosts;
    }
    Listit.assert(posts instanceof Array, 'addPosts: listitPosts should be an Array');

    Listit.logger.debug("setPostsSorted, structure: " + structure);    
    this.setStructure(structure);
    this.removeAllPosts();
    
    if (this.isFlat) {
        Listit.logger.debug("setPostsSorted: flat ")
        this.allPosts = posts;
        this.visiblePosts = this._flattenPosts(this.allPosts).sort(comparisonFunction);
    } else {
        Listit.logger.debug("setPostsSorted: tree ")
        this.allPosts = Listit.sortPosts(posts, comparisonFunction);
        this.visiblePosts = this._getOpenPosts(this.allPosts);
    }
    this.treeBox.rowCountChanged(0, this.visiblePosts.length);
}

Listit.TreeView.prototype.__undefine__sortPosts = function(comparisonFunction)  {
    this.setPosts(Listit.sortPosts(this.allPosts, comparisonFunction));
}

Listit.TreeView.prototype.countPosts = function() {
    return Listit.countPosts(this.allPosts);
}

Listit.TreeView.prototype._addPosts = function(listitPosts)  {
    Listit.assert(listitPosts instanceof Array, 'addPosts: listitPosts should be an Array');
    this.allPosts = listitPosts;
    this.visiblePosts = this._getOpenPosts(this.allPosts);

    this.treeBox.rowCountChanged(0, this.visiblePosts.length);
}

Listit.TreeView.prototype.removeAllPosts = function() { // Must be fast because it's called for every page load!

    if (this.rowCount != 0) {
        this.treeBox.rowCountChanged(0, -this.rowCount);
        this.allPosts = [];
        this.visiblePosts = [];
    }
}


Listit.TreeView.prototype.setStructure = function(structure)  {
    
    Listit.assert(structure == "flat" || structure == "tree", 
        "structure should be either 'flat' or 'tree'");
    this.isFlat = (structure == 'flat');
}

Listit.TreeView.prototype.indexOfVisiblePost = function(post) {
    return this.visiblePosts.indexOf(post);
}

Listit.TreeView.prototype._getOpenPosts = function(posts) {  
    var openPosts = [];
    for (var idx = 0; idx < posts.length; idx = idx + 1) {
        var post = posts[idx];
        openPosts.push(post);
        if (post.isOpen) { 
            openPosts = openPosts.concat(this._getOpenPosts(post.replies));
        }
    }
    return openPosts;
}

Listit.TreeView.prototype._flattenPosts = function(posts) {  
    var flatPosts = [];
    for (var idx = 0; idx < posts.length; idx = idx + 1) {
        var post = posts[idx];
        flatPosts.push(post);
        flatPosts = flatPosts.concat(this._flattenPosts(post.replies));
    }
    return flatPosts;
}


////
// Methods that are part of the nsITreeView interface
////

Listit.TreeView.prototype.__defineGetter__("rowCount", function() {
    return this.visiblePosts.length; 
});

Listit.TreeView.prototype.setTree = function(treeBox)  { this.treeBox = treeBox; }

Listit.TreeView.prototype.getCellText = function(idx, column) {
    var rowItem = this.visiblePosts[idx];
    switch (column.id)
    {
        case 'treeID'        : return rowItem.id;
        case 'treeAuthor'    : return rowItem.author;
        case 'treeScore'     : return rowItem.score;
        case 'treeUp'        : return rowItem.ups;
        case 'treeDown'      : return rowItem.downs;
        case 'treeVotes'     : return rowItem.votes;
        case 'treeReplies'   : return rowItem.numReplies;
        case 'treeDepth'     : return rowItem.depth;
        case 'treeBody'      : return rowItem.body;
        case 'treeUtcDate'   : return Listit.UtcDateString(rowItem.dateCreated);
        case 'treeLocalDate' : return Listit.LocalDateString(rowItem.dateCreated);
        case 'treeDebug'     : return rowItem.debug;
        //case 'treeDebug'    : return column.width;
        default : return "** Unknown id: '" + column.id + "' **";
    }
}



Listit.TreeView.prototype.isContainer = function(idx) {
    return !this.isFlat && this.visiblePosts[idx].replies.length; // No containers when tree is flat
}

Listit.TreeView.prototype.isContainerOpen = function(idx) {
    //return this.isFlat || this.visiblePosts[idx].isOpen; // Always open when structure is flat
    return this.visiblePosts[idx].isOpen; 
}
Listit.TreeView.prototype.isContainerEmpty = function(idx)    { return false; }
Listit.TreeView.prototype.isSeparator = function(idx)         { return false; }
Listit.TreeView.prototype.isSorted = function()               { return false; }
Listit.TreeView.prototype.isEditable = function(idx, column)  { return false; }

Listit.TreeView.prototype.getParentIndex = function(idx) {
    var thisDepth = this.visiblePosts[idx].depth;
    if (thisDepth == 0) return -1;

    // iterate backwards until we find the item with the lower depth
    for (var i = idx - 1; i >= 0; i--) {
        if (this.visiblePosts[i].depth < thisDepth) return i;
    }
}

Listit.TreeView.prototype.getLevel = function(idx) { 
    return this.isFlat ? 0 : this.visiblePosts[idx].depth 
}


Listit.TreeView.prototype.hasNextSibling = function(idx, after) {
    var thisLevel = this.getLevel(idx);
    for (var t = after + 1; t < this.visiblePosts.length; t++) {
        var nextLevel = this.getLevel(t);
        if (nextLevel == thisLevel) return true;
        if (nextLevel < thisLevel) break;
    }
    return false;
}

Listit.TreeView.prototype.toggleOpenState = function(idx) {

    if (!this.isContainer(idx)) return;
    if (this.isContainerOpen(idx)) {
        this.visiblePosts[idx].isOpen = false;

        // Walk downwards to next sibling to count children to delete
        var thisLevel = this.getLevel(idx);
        var deleteCount = 0;
        for (var t = idx + 1; t < this.visiblePosts.length; t++) {
            if (this.getLevel(t) > thisLevel)
                deleteCount++;
            else break;
        }
        if (deleteCount) {
            this.visiblePosts.splice(idx + 1, deleteCount);
            this.treeBox.rowCountChanged(idx + 1, -deleteCount);
        }
    } else {
        this.visiblePosts[idx].isOpen = true;
        var toInsert = this._getOpenPosts(this.visiblePosts[idx].replies);
        for (var i = 0; i < toInsert.length; i++) {
            this.visiblePosts.splice(idx + i + 1, 0, toInsert[i]);
        }
        this.treeBox.rowCountChanged(idx + 1, toInsert.length);
    }
    this.treeBox.invalidateRow(idx);
}

Listit.TreeView.prototype.getImageSrc = function(idx, column) {}
Listit.TreeView.prototype.getProgressMode = function(idx, column) {}
Listit.TreeView.prototype.getCellValue = function(idx, column) {}
Listit.TreeView.prototype.cycleHeader = function(col, elem) {}
Listit.TreeView.prototype.selectionChanged = function() {}
Listit.TreeView.prototype.cycleCell = function(idx, column) {}
Listit.TreeView.prototype.performAction = function(action) {}
Listit.TreeView.prototype.performActionOnCell = function(action, index, column) {}
Listit.TreeView.prototype.getRowProperties = function(idx, column, prop) {}
Listit.TreeView.prototype.getCellProperties = function(idx, column, prop) {}
Listit.TreeView.prototype.getColumnProperties = function(column, element, prop) {}


