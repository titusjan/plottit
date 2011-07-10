
//////////
// Post //
//////////

Listit.Post = function () { // Constructor

}

Listit.Post.prototype.toString = function () {
    return "<Listit.Post, id = '" + this.id + "'>";
};

Listit.Post.prototype.__defineGetter__("id", function() { return this._id} );
Listit.Post.prototype.__defineSetter__("id", function(v) { this._id = v } );

Listit.Post.prototype.__defineGetter__("depth", function() { return this._depth} );
Listit.Post.prototype.__defineSetter__("depth", function(v) { this._depth  = v} );

Listit.Post.prototype.__defineGetter__("author", function() { return this._author} );
Listit.Post.prototype.__defineSetter__("author", function(v) { this._author = v} );

Listit.Post.prototype.__defineGetter__("body", function() { return this._body} );
Listit.Post.prototype.__defineSetter__("body", function(v) { this._body = v} );

Listit.Post.prototype.__defineGetter__("bodyHtml", function() { return this._bodyHtml} );
Listit.Post.prototype.__defineSetter__("bodyHtml", function(v) { this._bodyHtml = v} );

Listit.Post.prototype.__defineGetter__("dateCreated", function() { return this._dateCreated} );
Listit.Post.prototype.__defineSetter__("dateCreated", function(v) { this._dateCreated = v} );

Listit.Post.prototype.__defineGetter__("ups", function() { return this._ups} );
Listit.Post.prototype.__defineSetter__("ups", function(v) { this._ups = v} );

Listit.Post.prototype.__defineGetter__("downs", function() { return this._downs} );
Listit.Post.prototype.__defineSetter__("downs", function(v) { this._downs = v} );

Listit.Post.prototype.__defineGetter__("isOpen", function() { return this._isOpen} );
Listit.Post.prototype.__defineSetter__("isOpen", function(v) { this._isOpen = v} );

Listit.Post.prototype.__defineGetter__("replies", function() { return this._replies} );
Listit.Post.prototype.__defineSetter__("replies", function(v) { this._replies = v} );

/////
// Derived data

Listit.Post.prototype.__defineGetter__("score", function() { 
    return this._ups - this._downs; 
});

Listit.Post.prototype.__defineGetter__("votes", function() { 
    return this._ups + this._downs; 
});

Listit.Post.prototype.__defineGetter__("numChars", function() { 
    return this._body.length; 
});

Listit.Post.prototype.__defineGetter__("numReplies", function() { 
    return this._replies.length; 
});

Listit.Post.prototype.__defineGetter__("debug", function() { 
    return this._replies.length + 1; 
});

//////
// Various functions for processing and sorting the posts
//////

if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

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


Listit.countPosts = function(posts) {

    Listit.assert(posts instanceof Array, 'countPosts: posts should be an Array');
    var result = posts.length;
    for (var idx = 0; idx < posts.length; idx = idx + 1) {
        result += Listit.countPosts(posts[idx].replies);
    }
    return result;
}


////
// Parse JSON
////


Listit.redditNodeToListitNode = function(redditNode, depth) {

    if (redditNode.kind != 't1') { // e.g. kind = 'more'
        //Listit.fbLog(redditNode);
        return null;
    } 

    var data = redditNode.data;
    var listitNode = new Listit.Post();
    listitNode.id = data.id;
    listitNode.depth = depth;
    listitNode.author = data.author;
    listitNode.body = Listit.Encoder.htmlDecode(data.body); 
    listitNode.bodyHtml = Listit.Encoder.htmlDecode(data.body_html);
    listitNode.dateCreated = new Date(data.created_utc * 1000);
    listitNode.downs = data.downs;
    listitNode.ups = data.ups;
    listitNode.isOpen = true;  // true if a node is expanded
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

