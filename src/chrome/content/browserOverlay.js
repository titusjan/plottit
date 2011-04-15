
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Lisit name space


gMessage = 'gMessage start'; // global message


// XULSchoolChrome name space
if ('undefined' == typeof(XULSchoolChrome)) {
    var XULSchoolChrome = {};
}

XULSchoolChrome.BrowserOverlay = {

    // Used as a debugging function
    sayHello: function(aEvent) {
        let stringBundle = document.getElementById('xulschoolhello-string-bundle');
        let message = stringBundle.getString('xulschoolhello.greeting.label');


        Firebug.Console.log('sayHello');
        Firebug.Console.log(gMessage);
        try {
            var redditJsonPage = Listit.getTestRedditJSONPage();
            var listitPosts = Listit.getListitPostsFromPage(redditJsonPage);
            Listit.treeView.addPosts(listitPosts);
            Firebug.Console.log('sayHello success');

        } catch (ex) {
            Firebug.Console.log('Parse Failed');
            Firebug.Console.log(ex);
            
        }
        //var narf = document.getElementById('scoreTree');
        //Firebug.Console.log(narf.view);
        //Firebug.Console.log(Listit.treeView.allPosts.length);
        Firebug.Console.log(Listit);
    }
};

Listit.testBO = 'narf browserOverlay.js';

///////////////////////////////////
//                               //
///////////////////////////////////



Listit.init = function() {
    gMessage = 'Listit.init';

    //var listitPosts = Listit.getListitPostsFromPage(Listit.getTestRedditJSONPage());
    //Listit.treeView.init(listitPosts);
    document.getElementById('scoreTree').view = Listit.treeView;

    // Add listener to event handler
    var appcontent = document.getElementById('appcontent');   // browser
    if (appcontent) {
        appcontent.addEventListener('DOMContentLoaded', Listit.onPageLoad, true);
    }
};

window.addEventListener('load', Listit.init, true);


Listit.onPageLoad = function(event) {

    gMessage = 'Listit.onPageLoad';
    let doc = event.originalTarget;         // The content document of the loaded page.
    if (doc instanceof HTMLDocument) {      // Is this an inner frame?
        if (doc.defaultView.frameElement) { // Frame within a tab was loaded.

            // Find the root document:
            while (doc.defaultView.frameElement) {
                doc = doc.defaultView.frameElement.ownerDocument;
            }
        }
    }

    // Get document content
    gMessage = doc.URL;
    if (doc.activeElement) {
        if (doc.activeElement.textContent) {
            try {
                // Parse content
                var page = JSON.parse(doc.activeElement.textContent);
                Firebug.Console.log('Successfully parsed JSON page for: ' + doc.URL);
                alert('Successfully parsed JSON page: ' + page.length.toString());

                var listitPosts = Listit.getListitPostsFromPage(page);
                Listit.treeView.addPosts(listitPosts);
                Firebug.Console.log('Successfully put JSON page in treeview: ' + doc.URL);

            } catch (ex) {
                alert('Parse failed: ' + doc.URL.toString());
            }
        } else {
            alert('doc.activeElement.textContent is undefined.');
            return;
        }
    } else {
        alert('doc.activeElement is undefined.');
        return;
    }
};



Listit.redditNodeToListitNode = function(redditNode, depth)
{
    var data = redditNode.data;
    var listitNode = {};
    listitNode.id = data.id;
    listitNode.depth = depth;
    listitNode.author = data.author;
    listitNode.body = data.body;
    listitNode.created_utc = data.created_utc;
    listitNode.downs = data.downs;
    listitNode.ups = data.ups;
    listitNode.isOpen = false;  // True if a node is expanded
    listitNode.replies = []; // For convenience always make an empty replies list (TODO: optimize?)

    if (data.replies) {  // Recursively add children
        var children = data.replies.data.children;
        for (var i = 0; i < children.length; i++) {
            listitNode.replies.push(Listit.redditNodeToListitNode(children[i], depth + 1));
        }
    }
    return listitNode;
};

// Get posts in listit format (simplifies the tree)
Listit.getListitPostsFromPage = function(redditJsonPage) 
{
    Firebug.Console.log('getListitPostsFromPage');
    Firebug.Console.log(redditJsonPage);

    var redditPosts = redditJsonPage[1];
    var listitPosts = [];
    var children = redditPosts.data.children; // TODO: what is data.after/before?

    for (var i = 0; i < children.length; i++) {
        var listitNode = Listit.redditNodeToListitNode(children[i], 0);
        listitPosts.push(listitNode);
    }
//     Firebug.Console.log("listitPosts");
//     Firebug.Console.log(listitPosts.length);
//     Firebug.Console.log(listitPosts[0]);

    return listitPosts;
};


Listit.testTV = 'narf TV from within browserOverlay.js';

Listit.treeView = {
    // Methods that are not part of the nsITreeView interface

    typeStr: 'treeView',
    allPosts: [],
    visibleData: [],

    treeBox: null,
    selection: null,

    addPosts: function(listitPosts)  {
        Firebug.Console.log('addPost');
        Firebug.Console.log(listitPosts.length);
        
        this.removeAllRows();
        this.allPosts = listitPosts;
        this.visibleData = this.getOpenPosts(listitPosts);

        this.treeBox.rowCountChanged(0, this.visibleData.length);
    },

    removeAllRows: function() {
        Firebug.Console.log('removeAllRows');
        this.treeBox.rowCountChanged(0, -this.rowCount);
    },


    getOpenPosts: function(posts) {
        var openPosts = [];
        for (var idx = 0; idx < posts.length; idx = idx + 1) {
            var post = posts[idx];
            openPosts.push(post);
            if (post.isOpen) {
                openPosts = openPosts.concat(this.getOpenPosts(post.replies));
            }
        }
        return openPosts;
    },
    
    // Methods that are part of the nsITreeView interface

    get rowCount() { return this.visibleData.length; },
    setTree: function(treeBox)         { this.treeBox = treeBox; },

    getCellText: function(idx, column) {
        var rowItem = this.visibleData[idx];
        switch (column.id)
        {
            case 'treeID' : return rowItem.id;
            case 'treeAuthor': return rowItem.author;
            case 'treeUp' : return column.width;
            case 'treeDown' : return rowItem.downs;
            case 'treeTotal' : return rowItem.ups + rowItem.downs;
            case 'treeDepth' : return rowItem.depth;
            case 'treeBody' : return rowItem.body;
            case 'treePruts' : return rowItem.replies.length;
            default : return "** Unknown id: '" + column.id + "' **";
        }
    },
    isContainer: function(idx) {
        return this.visibleData[idx].replies.length;
    },

    isContainerOpen: function(idx) {
        return this.visibleData[idx].isOpen;
    },
    isContainerEmpty: function(idx)    { return false; },
    isSeparator: function(idx)         { return false; },
    isSorted: function()               { return false; },
    isEditable: function(idx, column)  { return false; },

    getParentIndex: function(idx) {
        var thisDepth = this.visibleData[idx].depth;
        if (thisDepth == 0) return -1;

        // iterate backwards until we find the item with the lower depth
        for (var i = idx - 1; i >= 0; i--) {
            if (this.visibleData[i].depth < thisDepth) return i;
        }
    },

    getLevel: function(idx) { return this.visibleData[idx].depth },

    hasNextSibling: function(idx, after) {
        var thisLevel = this.getLevel(idx);
        for (var t = after + 1; t < this.visibleData.length; t++) {
            var nextLevel = this.getLevel(t);
            if (nextLevel == thisLevel) return true;
            if (nextLevel < thisLevel) break;
        }
        return false;
    },

    toggleOpenState: function(idx) {

        if (!this.isContainer(idx)) return;
        if (this.isContainerOpen(idx)) {
            this.visibleData[idx].isOpen = false;

            // Walk downwards to next sibling to count children to delete
            var thisLevel = this.getLevel(idx);
            var deleteCount = 0;
            for (var t = idx + 1; t < this.visibleData.length; t++) {
                if (this.getLevel(t) > thisLevel)
                    deleteCount++;
                else break;
            }
            if (deleteCount) {
                this.visibleData.splice(idx + 1, deleteCount);
                this.treeBox.rowCountChanged(idx + 1, -deleteCount);
            }
        } else {
            this.visibleData[idx].isOpen = true;
            var toInsert = this.getOpenPosts(this.visibleData[idx].replies);
            for (var i = 0; i < toInsert.length; i++) {
                this.visibleData.splice(idx + i + 1, 0, toInsert[i]);
            }
            this.treeBox.rowCountChanged(idx + 1, toInsert.length);
        }
        this.treeBox.invalidateRow(idx);
    },

    getImageSrc: function(idx, column) {},
    getProgressMode: function(idx, column) {},
    getCellValue: function(idx, column) {},
    cycleHeader: function(col, elem) {},
    selectionChanged: function() {},
    cycleCell: function(idx, column) {},
    performAction: function(action) {},
    performActionOnCell: function(action, index, column) {},
    getRowProperties: function(idx, column, prop) {},
    getCellProperties: function(idx, column, prop) {},
    getColumnProperties: function(column, element, prop) {}
};

