//////
// Various functions for processing and sorting the posts
//////

if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

// For each column a sorting function that compares two listitNodes
Listit.sortBy = {};
Listit.sortBy["treeID"]        = function(a, b) { return Listit.compareStrings(a.id, b.id) };
Listit.sortBy["treeAuthor"]    = function(a, b) { return Listit.compareCaseInsensitiveStrings(a.author, b.author) };
//Listit.sortBy["treeScore"]     = function(a, b) { return Listit.compareNumbers(a.author, b.author) };
Listit.sortBy["treeUp"]        = function(a, b) { return Listit.compareNumbers(a.ups, b.ups) };
Listit.sortBy["treeDown"]      = function(a, b) { return Listit.compareNumbers(a.downs, b.downs) };
//Listit.sortBy["treeVotes"]     = function(a, b) { return Listit.compareNumbers(a.author, b.author) };
//Listit.sortBy["treeChildren"]  = function(a, b) { return Listit.compareNumbers(a.author, b.author) };
//Listit.sortBy["treeDepth"]     = function(a, b) { return Listit.compareNumbers(a.depth, b.depth) };
Listit.sortBy["treeLocalDate"] = function(a, b) { return Listit.compareDates(a.dateCreated, b.dateCreated) };
Listit.sortBy["treeUtcDate"]   = function(a, b) { return Listit.compareDates(a.dateCreated, b.dateCreated) };
//Listit.sortBy["treePruts"]      = function(a, b) { return Listit.compareNumbers(a.downs, b.downs) };


Listit.getDirectedComparisonFunction = function(comparisonFunction, direction) {

    Listit.assert(direction == "ascending" || direction == "descending", 
        'direction should be "ascending" or "descending", got: ' + direction);
        
    if (direction == "ascending") {
        return comparisonFunction;
    } else {
        return Listit.swapArgs(comparisonFunction);
    }
}

Listit.sortPosts = function(listitPosts, comparisonFunction) {
    Listit.logger.trace("Listit.sortPosts -- ");
    Listit.assert(comparisonFunction instanceof Function, 'comparisonFunction should be a Function');
    Listit.assert(listitPosts instanceof Array, 'sortPosts: listitPosts should be an Array');
    
    if (!listitPosts) {
        return listitPosts;
    }
    
    for (var i = 0; i < listitPosts.length; i++) { // Recursively sort children
        Listit.sortPosts(listitPosts[i].replies, comparisonFunction);
    }
    return listitPosts.sort(comparisonFunction);
}

Listit.redditNodeToListitNode = function(redditNode, depth) {

    if (redditNode.kind != 't1') { // e.g. kind = 'more'
        //Listit.fbLog(redditNode);
        return null;
    } 

    var data = redditNode.data;
    var listitNode = {};
    listitNode.id = data.id;
    listitNode.depth = depth;
    listitNode.author = data.author;
    listitNode.body = Listit.Encoder.htmlDecode(data.body); 
    listitNode.bodyHtml = Listit.Encoder.htmlDecode(data.body_html);
    listitNode.dateCreated = new Date(data.created_utc * 1000);
    listitNode.downs = data.downs;
    listitNode.ups = data.ups;
    listitNode.isOpen = false;  // true if a node is expanded
    listitNode.replies = []; // For convenience always make an empty replies list (TODO: optimize?)

    if (data.replies) {  // Recursively add children
        var children = data.replies.data.children;
        for (var i = 0; i < children.length; i++) {
            var childNode = Listit.redditNodeToListitNode(children[i], depth + 1);
            if (childNode) 
                listitNode.replies.push(childNode);
        }
    }
    return listitNode;
};

// Get posts in as list (of lists) of ListitNodes
Listit.getListitPostsFromPage = function(redditJsonPage) {

    //Listit.logger.trace('getListitPostsFromPage');
    var redditPosts = redditJsonPage[1];
    var listitPosts = [];
    var children = redditPosts.data.children; // TODO: what is data.after/before?

    for (var i = 0; i < children.length; i++) {
        var listitNode = Listit.redditNodeToListitNode(children[i], 0);
        if (listitNode) 
            listitPosts.push(listitNode);
    }

    return listitPosts;
};

