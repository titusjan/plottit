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

Listit.TreeView = function (localDateFormat, utcDateFormat) { // Constructor

    this.typeStr = 'treeView';  // TODO in prototype ???
    this.discussion = null;     
    this.allComments = [];      // Nested list (tree) of all comments (TODO: use discussion.comments?)
    this.visibleComments = [];  // List of comments currently in the table (may be necessary to scroll)
    this.isFlat = false;        // If body column is a tree of flat
    
    this.localDateFormat = localDateFormat;
    this.utcDateFormat   = utcDateFormat;

    // Part of the nsITreeView interface
    this.treeBox = null;
    this.selection = null; 
}


////
// Methods that are not part of the nsITreeView interface
////

Listit.TreeView.prototype.getComments = function() {
    return this.allComments;
}

Listit.TreeView.prototype.setDiscussionSorted = function(columnID, sortDirection, structure, discussion) {

    Listit.logger.trace("setDiscussionSorted -- ")
    
    var comments;

    if (discussion === undefined) { 
        // Nothing changes
        comments = this.allComments;
    } else {
        this.discussion = discussion;        
        comments = discussion.comments;
    }
    
    Listit.assert(comments instanceof Array, 'addComments: listitComments should be an Array');

    //Listit.logger.debug("setDiscussionSorted, structure: " + structure);    
    this.setStructure(structure);
    var comparisonFunction = this.getComparisonFunction(columnID, sortDirection);

    this.removeAllComments();
    
    if (this.isFlat) {
        this.allComments = comments;
        this.visibleComments = this._flattenComments(this.allComments).sort(comparisonFunction);
    } else {
        this.allComments = Listit.sortComments(comments, comparisonFunction);
        this.visibleComments = this._getOpenComments(this.allComments);
    }
    this.treeBox.rowCountChanged(0, this.visibleComments.length);
}


Listit.TreeView.prototype.countComments = function() {
    return Listit.countComments(this.allComments);
}

Listit.TreeView.prototype._addComments = function(listitComments)  {
    Listit.assert(listitComments instanceof Array, 'addComments: listitComments should be an Array');
    this.allComments = listitComments;
    this.visibleComments = this._getOpenComments(this.allComments);

    this.treeBox.rowCountChanged(0, this.visibleComments.length);
}

Listit.TreeView.prototype.removeAllComments = function() { // Must be fast because it's called for every page load!

    if (this.rowCount != 0) {
        if (this.treeBox) this.treeBox.rowCountChanged(0, -this.rowCount);
        this.allComments = [];
        this.visibleComments = [];
    }
}

Listit.TreeView.prototype.getTreeDomElement = function() {
    // ridiculous steps neccesary to get the tree element.
    if (this.treeBox == null) return null;
    return this.treeBox.treeBody.parentNode;
}


// Expands the path from the root to the selected comment.
Listit.TreeView.prototype.expandPath = function(selectedComment) {

    Listit.fbLog('Listit.TreeView.prototype.expandPath: ' + selectedComment);

    if (selectedComment == null) { return null }
    
    var path = this.discussion.getCommentPathById(selectedComment.id);
    Listit.fbLog('expand path: ' +  [ p.id for each (p in path ) ]);

    for (let [idx, comment] in Iterator(path)) {
        this.expandComment(comment, false);
    }
}

Listit.TreeView.prototype.selectComment = function(selectedComment) {

    Listit.fbLog('Listit.TreeView.selectComment: ' + selectedComment);
    
    if (selectedComment == null) {
        Listit.fbLog('clearSelection() called');
        // First remove the caret from the tree so that when clearSelection triggers the onSelect
        // event we can have the proper selected index.
        this.getTreeDomElement().currentIndex = -1; 
        this.selection.clearSelection();
    } else { 
        var selectedIndex = this.indexOfVisibleComment(selectedComment, true);
        this.selection.select(selectedIndex);
        this.treeBox.ensureRowIsVisible(selectedIndex);
    }    
}

Listit.TreeView.prototype.expandOrCollapseComment = function(selectedComment, expand, makeVisible) {
    
    //Listit.fbLog("Listit.TreeView.expandOrCollapseComment: selectedComment: " + selectedComment + ", expand: " + expand );
    
    if (selectedComment == null) return;
    if (expand == null) return;
    if (expand) {
        this.expandComment(selectedComment, makeVisible);
    } else { 
        this.collapseComment(selectedComment, makeVisible);
    }
}


// Returns the index of the comment in the visible comments list.
// Side effect: if makeVisible == true the path to the comment is expanded to make the
// comment visible in case it's not found.
Listit.TreeView.prototype.indexOfVisibleComment = function(comment, makeVisible) {

    var index = this.visibleComments.indexOf(comment);
    if (makeVisible && index == -1) {
        Listit.fbLog('comment not visible in tree: ' + comment);
        this.expandPath(comment);
        var index = this.indexOfVisibleComment(comment, false);
        Listit.fbLog('expandPath done, index: ' + index);
    }
    return index;
}

Listit.TreeView.prototype.expandComment = function(comment, makeVisible) {
    Listit.logger.trace("Listit.TreeView.expandComment: ");
    this.expandRowByIndex(this.indexOfVisibleComment(comment, makeVisible))
}


Listit.TreeView.prototype.expandRowByIndex = function(idx) {
    Listit.logger.trace("Listit.TreeView.expandRowByIndex: " + idx );

    Listit.fbLog("Listit.TreeView.expandRowByIndex: " + idx );
    
    if (idx < 0) return;
    if (this.isContainer(idx) === false) return;
    if (this.visibleComments[idx].isOpen === true) { 
        Listit.fbLog('container already open, skipping ....');
        return; // container already open, skip;
    }
    this.visibleComments[idx].isOpen = true;
    var toInsert = this._getOpenComments(this.visibleComments[idx].replies);
    for (var i = 0; i < toInsert.length; i++) {
        this.visibleComments.splice(idx + i + 1, 0, toInsert[i]);
    }
    this.treeBox.rowCountChanged(idx + 1, toInsert.length);
    this.treeBox.invalidateRow(idx);

    // Dispatch event
    var event = document.createEvent("Events");  
    event.initEvent("ListitTreeViewExpandCollapseEvent", true, false);  
    event.expandedOrCollapsedIndex = idx;
    event.comment = this.visibleComments[idx];
    event.expanded = true;
    this.getTreeDomElement().dispatchEvent(event);   
}


Listit.TreeView.prototype.collapseComment = function(comment, makeVisible) {
    Listit.logger.trace("Listit.TreeView.collapseComment: ");
    this.collapseRowByIndex(this.indexOfVisibleComment(comment, makeVisible))
}


Listit.TreeView.prototype.collapseRowByIndex = function(idx) {
    Listit.logger.trace("Listit.TreeView.collapseRowByIndex: " + idx );

    Listit.fbLog("Listit.TreeView.collapseRowByIndex: " + idx );
    
    if (idx < 0) return;
    if (this.isContainer(idx) === false) return;
    if (this.visibleComments[idx].isOpen === false) {
        Listit.fbLog('container already closed, skipping ....');
        return; // container closed open, skip;
    }
    this.visibleComments[idx].isOpen = false;

    // Walk downwards to next sibling to count children to delete
    var thisLevel = this.getLevel(idx);
    var deleteCount = 0;
    for (var t = idx + 1; t < this.visibleComments.length; t++) {
        if (this.getLevel(t) > thisLevel)
            deleteCount++;
        else break;
    }
    if (deleteCount) {
        this.visibleComments.splice(idx + 1, deleteCount);
        this.treeBox.rowCountChanged(idx + 1, -deleteCount);
    }
    this.treeBox.invalidateRow(idx);

    // Dispatch event
    var event = document.createEvent("Events");  
    event.initEvent("ListitTreeViewExpandCollapseEvent", true, false);  
    event.expandedOrCollapsedIndex = idx;    
    event.comment = this.visibleComments[idx];    
    event.expanded = false;    
    this.getTreeDomElement().dispatchEvent(event);    
}


Listit.TreeView.prototype._getOpenComments = function(comments) {  
    var openComments = [];
    for (var idx = 0; idx < comments.length; idx = idx + 1) {
        var comment = comments[idx];
        openComments.push(comment);
        if (comment.isOpen) { 
            openComments = openComments.concat(this._getOpenComments(comment.replies));
        }
    }
    return openComments;
}

Listit.TreeView.prototype._flattenComments = function(comments) {  
    var flatComments = [];
    for (var idx = 0; idx < comments.length; idx = idx + 1) {
        var comment = comments[idx];
        flatComments.push(comment);
        flatComments = flatComments.concat(this._flattenComments(comment.replies));
    }
    return flatComments;
}

Listit.TreeView.prototype.setStructure = function(structure)  {
    
    Listit.assert(structure == "flat" || structure == "tree", 
        "structure should be either 'flat' or 'tree'");
    this.isFlat = (structure == 'flat');
}


// Returns a function that sorts by column and directoin
Listit.TreeView.prototype.getComparisonFunction = function(columnID, direction) {

    Listit.assert(direction == "ascending" || direction == "descending", 
        'direction should be "ascending" or "descending", got: ' + direction);
        
    var fn;
    switch (columnID)
    {
        case 'treeID': 
            fn = function(a, b) { return Listit.compareIDs(a.id, b.id) };
            break;
        case 'treeAuthor':
            fn = function(a, b) { return Listit.compareCaseInsensitiveStrings(a.author, b.author) };
            break;
        case 'treeScore': 
            fn = function(a, b) { return Listit.compareNumbers(a.score, b.score) };
            break;
        case 'treeUp':
            fn = function(a, b) { return Listit.compareNumbers(a.ups, b.ups) };
            break;
        case 'treeDown':
            fn = function(a, b) { return Listit.compareNumbers(a.downs, b.downs) };
            break;
        case 'treeVotes':
            fn = function(a, b) { return Listit.compareNumbers(a.votes, b.votes) };
            break;
        case 'treeHot':
            fn = function(a, b) { return Listit.compareNumbers(a.hot, b.hot) };
            break;
        case 'treeBest':
            fn = function(a, b) { return Listit.compareNumbers(a.best, b.best) };
            break;
        case 'treeLikes':
            fn = function(a, b) { 
                var resLikes = Listit.compareNumbers(a.likes, b.likes) 
                if (resLikes == 0) 
                    return Listit.compareNumbers(a.ups, b.ups)
                else
                    return resLikes;
            };
            break;
        case 'treeReplies':
            fn = function(a, b) { return Listit.compareNumbers(a.numReplies, b.numReplies) };
            break;
        case 'treeDepth':
            fn = function(a, b) { return Listit.compareNumbers(a.depth, b.depth) };
            break;
        case 'treeChars':
            fn = function(a, b) { return Listit.compareNumbers(a.numChars, b.numChars) };
            break;
        case 'treeLocalDate':
        case 'treeUtcDate': 
        case 'treeAge': 
        case 'treePostedAfter': 
            fn = function(a, b) { return Listit.compareDates(a.dateCreated, b.dateCreated) };    
            break;
        default: 
            Listit.assert(false, "** getComparisonFunction Unknown id: '" + columnID + "' **");
    } // switch

    if (direction == "ascending") {
        return fn;
    } else {
        return Listit.swapArgs(fn);
    }
}

////
// Methods that are part of the nsITreeView interface
////


Listit.TreeView.prototype.__defineGetter__("rowCount", function() {
    return this.visibleComments.length; 
});

Listit.TreeView.prototype.setTree = function(treeBox)  { 
    Listit.logger.trace("Listit.TreeView.setTree, treeBox: " + treeBox);
    this.treeBox = treeBox; 
}

Listit.TreeView.prototype.getCellText = function(idx, column) {

    var rowItem = this.visibleComments[idx];
    switch (column.id)
    {
        case 'treeID'        : return rowItem.id;
        case 'treeAuthor'    : return rowItem.author;
        case 'treeScore'     : return rowItem.score;
        case 'treeUp'        : return rowItem.ups;
        case 'treeDown'      : return rowItem.downs;
        case 'treeVotes'     : return rowItem.votes;
        case 'treeHot'       : return rowItem.hot.toFixed(3);
        case 'treeBest'      : return rowItem.best;
        case 'treeLikes'     : return (rowItem.likes*100).toFixed(1) + '%';
        case 'treeReplies'   : return rowItem.numReplies;
        case 'treeDepth'     : return rowItem.depth;
        case 'treeChars'     : return rowItem.numChars;
        case 'treeBody'      : return rowItem.body;
        case 'treeUtcDate'   : 
            return Listit.dateFormat(rowItem.dateCreated, this.utcDateFormat, true);
        case 'treeLocalDate' : 
            return Listit.dateFormat(rowItem.dateCreated, this.localDateFormat, false);
        case 'treeAge' : 
            return new Listit.TimePeriod(rowItem.age).toString();
        case 'treePostedAfter' : 
            return new Listit.TimePeriod(rowItem.postedAfter).toString();
            
        case 'treeDebug'     : return rowItem.debug;
        //case 'treeDebug'    : return column.width;
        default : return "** Unknown id: '" + column.id + "' **";
    }
}



Listit.TreeView.prototype.isContainer = function(idx) {
    return !this.isFlat && (this.visibleComments[idx].replies.length !== 0); // No containers when tree is flat
}

Listit.TreeView.prototype.isContainerOpen = function(idx) {
    //return this.isFlat || this.visibleComments[idx].isOpen; // Always open when structure is flat
    return this.visibleComments[idx].isOpen; 
}
Listit.TreeView.prototype.isContainerEmpty = function(idx)    { return false; }
Listit.TreeView.prototype.isSeparator = function(idx)         { return false; }
Listit.TreeView.prototype.isSorted = function()               { return false; }
Listit.TreeView.prototype.isEditable = function(idx, column)  { return false; }

Listit.TreeView.prototype.getParentIndex = function(idx) {
    
    var thisDepth = this.getLevel(idx);
    if (thisDepth == 0) return -1;

    // iterate backwards until we find the item with the lower depth
    for (var i = idx - 1; i >= 0; i--) {
        if (this.visibleComments[i].depth < thisDepth) return i;
    }
}

Listit.TreeView.prototype.getLevel = function(idx) { 
    return this.isFlat ? 0 : this.visibleComments[idx].depth; 
}


Listit.TreeView.prototype.hasNextSibling = function(idx, after) {

    // Seems not to be called ?
    Listit.logger.debug("Listit.TreeView.hasNextSibling: " + idx + ", " + after);
    
    var thisLevel = this.getLevel(idx);
    for (var t = after + 1; t < this.visibleComments.length; t++) {
        var nextLevel = this.getLevel(t);
        if (nextLevel == thisLevel) return true;
        if (nextLevel < thisLevel) break;
    }
    return false;
}


Listit.TreeView.prototype.toggleOpenState = function(idx) {
    Listit.logger.trace("Listit.TreeView.toggleOpenState: " + idx );
    
    if (this.isContainerOpen(idx)) {
        this.collapseRowByIndex(idx);
    } else {
        this.expandRowByIndex(idx)
    }
}

Listit.TreeView.prototype.getImageSrc = function(idx, column) {}
Listit.TreeView.prototype.getProgressMode = function(idx, column) {}
Listit.TreeView.prototype.getCellValue = function(idx, column) {}
Listit.TreeView.prototype.cycleHeader = function(col, elem) {}
Listit.TreeView.prototype.selectionChanged = function() {}
Listit.TreeView.prototype.cycleCell = function(idx, column) {}
Listit.TreeView.prototype.performAction = function(action) {}
Listit.TreeView.prototype.performActionOnCell = function(action, index, column) {}
Listit.TreeView.prototype.getRowProperties = function(rowIdx, properties) {}
Listit.TreeView.prototype.getCellProperties = function(rowIdx, column, properties) {
    switch (column.id)
    {
        //case 'treeLocalDate': 
        //case 'treeUtcDate': 
        //case 'treeAge': 
        //case 'treePostedAfter': 
        //case 'treeDepth': 
        //case 'treeReplies': 
        //case 'treeScore': 
        case 'treeUp': 
        case 'treeDown': 
        case 'treeVotes': 
        case 'treeLikes': 
        //case 'treeHot': 
        case 'treeBest': 
        //case 'treeChars': 
        case 'treeDebug': 
            var atomService = Components.classes["@mozilla.org/atom-service;1"].getService(Components.interfaces.nsIAtomService);
            var prop = atomService.getAtom("fuzzed");
            properties.AppendElement(prop); 
            break;
    } 
}

Listit.TreeView.prototype.getColumnProperties = function(column, properties) { }


