 if ('undefined' == typeof(Listit)) { var Listit = {}; } // Lisit name space


// TODO: namespace
var treeView = {

    typeStr: "treeView",
    init: function(listitPosts)
    {
        this.allPosts = listitPosts;
        this.visibleData = this.getOpenPosts(this.allPosts);
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

    treeBox: null,
    selection: null,

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
    isContainer: function(idx)         { return this.visibleData[idx].replies.length; },
    isContainerOpen: function(idx)     { return this.visibleData[idx].isOpen; },
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
    getProgressMode: function(idx,column) {},
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

