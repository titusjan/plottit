// TODO: the current implementation is very tailored to Plottit; make more generic.

if ('undefined' == typeof(Plottit)) { var Plottit = {}; } // Plottit name space

/////////
// Aux //
/////////


Plottit.getTreeBoxObject = function (treeID) {

  var tree = document.getElementById(treeID);
  var boxObject = tree.boxObject;
  boxObject.QueryInterface(Components.interfaces.nsITreeBoxObject); // Casts the object
  return boxObject;
}


//////////////
// TreeView //
//////////////

// A view on a discussion for use in the tree/table. 
// It's not a real view, it will sort the comments inside the discussion when the user clicks the
// table colum headers. I don't want to make a copy of the comments only to prevent this 
// side-effect.

Plottit.TreeView = function (localDateFormat, utcDateFormat) { // Constructor

    this.typeStr = 'treeView';  
    this.discussion = null;     
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

Plottit.TreeView.prototype.getComments = function() {
    return this.discussion.comments;
}

Plottit.TreeView.prototype.setDiscussionSorted = function(columnID, sortDirection, structure, discussion) {
    Plottit.logger.trace("setDiscussionSorted, structure: " + structure);
    
        this.setStructure(structure);
    var comparisonFunction = this.getComparisonFunction(columnID, sortDirection);

    if (discussion === undefined) { 
        discussion = this.discussion; // retain old discussion
    }
    this.removeDiscussion();
    this.discussion = discussion;        

    if (this.isFlat) {
        this.visibleComments = this._flattenComments(this.discussion.comments).sort(comparisonFunction);
    } else {
        this.discussion.comments = Plottit.sortComments(this.discussion.comments, comparisonFunction);
        this.visibleComments = this._getOpenComments(this.discussion.comments);
    }
    this.treeBox.rowCountChanged(0, this.visibleComments.length);
}


Plottit.TreeView.prototype.removeDiscussion = function() { // Must be fast because it's called for every page load!

    if (this.rowCount != 0) {
        if (this.treeBox) this.treeBox.rowCountChanged(0, -this.rowCount);
        this.discussion = null;
        this.visibleComments = [];
    }
}


Plottit.TreeView.prototype.countComments = function() {
    return Plottit.countComments(this.discussion.comments);
}

Plottit.TreeView.prototype.getTreeDomElement = function() {
    // ridiculous steps neccesary to get the tree element.
    if (this.treeBox == null) return null;
    return this.treeBox.treeBody.parentNode;
}


// Expands the path from the root to the selected comment.
Plottit.TreeView.prototype.expandPath = function(selectedComment) {

    if (selectedComment == null) { return null }
    
    for (let [idx, comment] in Iterator(this.discussion.getCommentPathById(selectedComment.id))) {
        this.expandComment(comment, false);
    }
}

Plottit.TreeView.prototype.selectComment = function(selectedComment) {

    if (selectedComment == null) {
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

Plottit.TreeView.prototype.expandOrCollapseComment = function(selectedComment, expand, makeVisible) {
    
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
Plottit.TreeView.prototype.indexOfVisibleComment = function(comment, makeVisible) {

    var index = this.visibleComments.indexOf(comment);
    if (makeVisible && index == -1) {
        this.expandPath(comment);
        var index = this.indexOfVisibleComment(comment, false);
    }
    return index;
}

Plottit.TreeView.prototype.expandComment = function(comment, makeVisible) {
    Plottit.logger.trace("Plottit.TreeView.expandComment: ");
    this.expandRowByIndex(this.indexOfVisibleComment(comment, makeVisible))
}


Plottit.TreeView.prototype.expandRowByIndex = function(idx) {
    Plottit.logger.trace("Plottit.TreeView.expandRowByIndex: " + idx );

    if (idx < 0) return;
    if (this.isContainer(idx) === false) return;
    if (this.visibleComments[idx].isOpen === true) { 
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
    event.initEvent("PlottitTreeViewExpandCollapseEvent", true, false);  
    event.expandedOrCollapsedIndex = idx;
    event.comment = this.visibleComments[idx];
    event.expanded = true;
    this.getTreeDomElement().dispatchEvent(event);   
}


Plottit.TreeView.prototype.collapseComment = function(comment, makeVisible) {
    Plottit.logger.trace("Plottit.TreeView.collapseComment: ");
    this.collapseRowByIndex(this.indexOfVisibleComment(comment, makeVisible))
}


Plottit.TreeView.prototype.collapseRowByIndex = function(idx) {
    Plottit.logger.trace("Plottit.TreeView.collapseRowByIndex: " + idx );
    
    if (idx < 0) return;
    if (this.isContainer(idx) === false) return;
    if (this.visibleComments[idx].isOpen === false) {
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
    event.initEvent("PlottitTreeViewExpandCollapseEvent", true, false);  
    event.expandedOrCollapsedIndex = idx;    
    event.comment = this.visibleComments[idx];    
    event.expanded = false;    
    this.getTreeDomElement().dispatchEvent(event);    
}


Plottit.TreeView.prototype._getOpenComments = function(comments) {  
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

Plottit.TreeView.prototype._flattenComments = function(comments) {  
    var flatComments = [];
    for (var idx = 0; idx < comments.length; idx = idx + 1) {
        var comment = comments[idx];
        flatComments.push(comment);
        flatComments = flatComments.concat(this._flattenComments(comment.replies));
    }
    return flatComments;
}

Plottit.TreeView.prototype.setStructure = function(structure)  {
    
    Plottit.assert(structure == "flat" || structure == "tree", 
        "structure should be either 'flat' or 'tree'");
    this.isFlat = (structure == 'flat');
}


// Returns a function that sorts by column and direction
Plottit.TreeView.prototype.getComparisonFunction = function(columnID, direction) {

    Plottit.assert(direction == "ascending" || direction == "descending", 
        'direction should be "ascending" or "descending", got: ' + direction);
        
    var fn;
    switch (columnID)
    {
        case 'plottit-comment-tree-column-id': 
            fn = function(a, b) { return Plottit.compareIDs(a.id, b.id) };
            break;
        case 'plottit-comment-tree-column-page-order': 
            fn = function(a, b) { return Plottit.compareNumbers(a.pageOrder, b.pageOrder) };
            break;
        case 'plottit-comment-tree-column-author':
            fn = function(a, b) { return Plottit.compareCaseInsensitiveStrings(a.author, b.author) };
            break;
        case 'plottit-comment-tree-column-score': 
            fn = function(a, b) { return Plottit.compareNumbers(a.score, b.score) };
            break;
        case 'plottit-comment-tree-column-up':
            fn = function(a, b) { return Plottit.compareNumbers(a.ups, b.ups) };
            break;
        case 'plottit-comment-tree-column-down':
            fn = function(a, b) { return Plottit.compareNumbers(a.downs, b.downs) };
            break;
        case 'plottit-comment-tree-column-votes':
            fn = function(a, b) { return Plottit.compareNumbers(a.votes, b.votes) };
            break;
        case 'plottit-comment-tree-column-controversial':
            fn = function(a, b) { return Plottit.compareNumbers(a.controversial, b.controversial) };
            break;
        case 'plottit-comment-tree-column-hot':
            fn = function(a, b) { return Plottit.compareNumbers(a.hot, b.hot) };
            break;
        case 'plottit-comment-tree-column-best':
            fn = function(a, b) { return Plottit.compareNumbers(a.best, b.best) };
            break;
        case 'plottit-comment-tree-column-likes':
            fn = function(a, b) { 
                var resLikes = Plottit.compareNumbers(a.likes, b.likes) 
                if (resLikes == 0) 
                    return Plottit.compareNumbers(a.ups, b.ups)
                else
                    return resLikes;
            };
            break;
        case 'plottit-comment-tree-column-replies':
            fn = function(a, b) { return Plottit.compareNumbers(a.numReplies, b.numReplies) };
            break;
        case 'plottit-comment-tree-column-depth':
            fn = function(a, b) { return Plottit.compareNumbers(a.depth, b.depth) };
            break;
        case 'plottit-comment-tree-column-chars':
            fn = function(a, b) { return Plottit.compareNumbers(a.numChars, b.numChars) };
            break;
        case 'plottit-comment-tree-column-words':
            fn = function(a, b) { return Plottit.compareNumbers(a.numWords, b.numWords) };
            break;
        case 'plottit-comment-tree-column-local-date':
        case 'plottit-comment-tree-column-utc-date': 
        case 'plottit-comment-tree-column-age': 
        case 'plottit-comment-tree-column-posted-after': 
            fn = function(a, b) { return Plottit.compareDates(a.dateCreated, b.dateCreated) };    
            break;
        default: 
            Plottit.assert(false, "** getComparisonFunction Unknown id: '" + columnID + "' **");
    } // switch

    // Sort by page order if fn(a, b) results yielss 0
    var pageOrderFn = function(a, b) { return Plottit.compareNumbers(a.pageOrder, b.pageOrder) };

    if (direction == "descending") {
        fn = Plottit.swapArgs(fn);
        pageOrderFn = Plottit.swapArgs(pageOrderFn);
    }
    
    return Plottit.combineComparisonFunctions(fn, pageOrderFn);
}

////
// Methods that are part of the nsITreeView interface
////


Plottit.TreeView.prototype.__defineGetter__("rowCount", function() {
    return this.visibleComments.length; 
});

Plottit.TreeView.prototype.setTree = function(treeBox)  { 
    Plottit.logger.trace("Plottit.TreeView.setTree, treeBox: " + treeBox);
    this.treeBox = treeBox; 
}

Plottit.TreeView.prototype.getCellText = function(idx, column) {

    var rowItem = this.visibleComments[idx];
    
    switch (column.id)
    {
        case 'plottit-comment-tree-column-id'            : return rowItem.id;
        case 'plottit-comment-tree-column-page-order'    : return rowItem.pageOrder;
        case 'plottit-comment-tree-column-author'        : return rowItem.author;
        case 'plottit-comment-tree-column-score'         : return rowItem.score;
        case 'plottit-comment-tree-column-up'            : return rowItem.ups;
        case 'plottit-comment-tree-column-down'          : return rowItem.downs;
        case 'plottit-comment-tree-column-votes'         : return rowItem.votes;
        case 'plottit-comment-tree-column-hot'           : return rowItem.hot.toFixed(3);
        case 'plottit-comment-tree-column-controversial' : return rowItem.controversial.toFixed(2);
        case 'plottit-comment-tree-column-best'          : return rowItem.bestPerc.toFixed(1) + '%';
        case 'plottit-comment-tree-column-likes'         : return rowItem.likesPerc.toFixed(1) + '%';
        case 'plottit-comment-tree-column-replies'       : return rowItem.numReplies;
        case 'plottit-comment-tree-column-depth'         : return rowItem.depth;
        case 'plottit-comment-tree-column-chars'         : return rowItem.numChars;
        case 'plottit-comment-tree-column-words'         : return rowItem.numWords;
        case 'plottit-comment-tree-column-body'          : return rowItem.body;
        case 'plottit-comment-tree-column-utc-date' : 
            return Plottit.dateFormat(rowItem.dateCreated, this.utcDateFormat, true);
        case 'plottit-comment-tree-column-local-date' : 
            return Plottit.dateFormat(rowItem.dateCreated, this.localDateFormat, false);
        case 'plottit-comment-tree-column-age' : 
            return new Plottit.TimePeriod(rowItem.age).toString();
        case 'plottit-comment-tree-column-posted-after' : 
            return new Plottit.TimePeriod(rowItem.postedAfter).toString();
            
        case 'plottit-comment-tree-column-debug'     : return rowItem.debug;
        //case 'plottit-comment-tree-column-debug'    : return column.width;
        default : return "** Unknown id: '" + column.id + "' **";
    }
}



Plottit.TreeView.prototype.isContainer = function(idx) {
    return !this.isFlat && (this.visibleComments[idx].replies.length !== 0); // No containers when tree is flat
}

Plottit.TreeView.prototype.isContainerOpen = function(idx) {
    //return this.isFlat || this.visibleComments[idx].isOpen; // Always open when structure is flat
    return this.visibleComments[idx].isOpen; 
}
Plottit.TreeView.prototype.isContainerEmpty = function(idx)    { return false; }
Plottit.TreeView.prototype.isSeparator = function(idx)         { return false; }
Plottit.TreeView.prototype.isSorted = function()               { return false; }
Plottit.TreeView.prototype.isEditable = function(idx, column)  { return false; }

Plottit.TreeView.prototype.getParentIndex = function(idx) {
    
    var thisLevel = this.getLevel(idx);
    if (thisLevel == 0) return -1;

    // iterate backwards until we find the item with the lower depth
    for (var i = idx - 1; i >= 0; i--) {
        if ((this.visibleComments[i].level) < thisLevel) return i;
    }
}

Plottit.TreeView.prototype.getLevel = function(idx) { 
    return this.isFlat ? 0 : this.visibleComments[idx].level; 
}


Plottit.TreeView.prototype.hasNextSibling = function(idx, after) {
    Plottit.logger.trace("Plottit.TreeView.hasNextSibling: " + idx + ", " + after);     // Seems not to be called ?
    
    var thisLevel = this.getLevel(idx);
    for (var t = after + 1; t < this.visibleComments.length; t++) {
        var nextLevel = this.getLevel(t);
        if (nextLevel == thisLevel) return true;
        if (nextLevel < thisLevel) break;
    }
    return false;
}


Plottit.TreeView.prototype.toggleOpenState = function(idx) {
    Plottit.logger.trace("Plottit.TreeView.toggleOpenState: " + idx );
    
    if (this.isContainerOpen(idx)) {
        this.collapseRowByIndex(idx);
    } else {
        this.expandRowByIndex(idx)
    }
}

Plottit.TreeView.prototype.getImageSrc = function(idx, column) {}
Plottit.TreeView.prototype.getProgressMode = function(idx, column) {}
Plottit.TreeView.prototype.getCellValue = function(idx, column) {}
Plottit.TreeView.prototype.cycleHeader = function(col, elem) {}
Plottit.TreeView.prototype.selectionChanged = function() {}
Plottit.TreeView.prototype.cycleCell = function(idx, column) {}
Plottit.TreeView.prototype.performAction = function(action) {}
Plottit.TreeView.prototype.performActionOnCell = function(action, index, column) {}
Plottit.TreeView.prototype.getRowProperties = function(rowIdx, properties) {}
Plottit.TreeView.prototype.getCellProperties = function(rowIdx, column, properties) {
    switch (column.id)
    {
        case 'plottit-comment-tree-column-up': 
        case 'plottit-comment-tree-column-down': 
        case 'plottit-comment-tree-column-votes': 
        case 'plottit-comment-tree-column-likes': 
        case 'plottit-comment-tree-column-controversial': 
        case 'plottit-comment-tree-column-best': 
        case 'plottit-comment-tree-column-debug': 
            var atomService = Components.classes["@mozilla.org/atom-service;1"].getService(Components.interfaces.nsIAtomService);
            var prop = atomService.getAtom("fuzzed");
            properties.AppendElement(prop); 
            break;
    } 
}

Plottit.TreeView.prototype.getColumnProperties = function(column, properties) { }


