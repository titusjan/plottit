
////////////////
// Discussion //
////////////////


Listit.Discussion = function () { // Constructor

}

Listit.Discussion.prototype.toString = function () {
    return "<Listit.Discussion, id = '" + this.id + "'>";
};

Listit.Discussion.prototype.__defineGetter__("id", function() { return this._id} );
Listit.Discussion.prototype.__defineSetter__("id", function(v) { this._id = v } );

Listit.Discussion.prototype.__defineGetter__("author", function() { return this._author} );
Listit.Discussion.prototype.__defineSetter__("author", function(v) { this._author = v} );

Listit.Discussion.prototype.__defineGetter__("selfText", function() { return this._selfText} );
Listit.Discussion.prototype.__defineSetter__("selfText", function(v) { this._selfText = v} );

Listit.Discussion.prototype.__defineGetter__("selfTextHtml", function() { return this._selfTextHtml} );
Listit.Discussion.prototype.__defineSetter__("selfTextHtml", function(v) { this._selfTextHtml = v} );

Listit.Discussion.prototype.__defineGetter__("dateCreated", function() { return this._dateCreated} );
Listit.Discussion.prototype.__defineSetter__("dateCreated", function(v) { this._dateCreated = v} );

Listit.Discussion.prototype.__defineGetter__("ups", function() { return this._ups} );
Listit.Discussion.prototype.__defineSetter__("ups", function(v) { this._ups = v} );

Listit.Discussion.prototype.__defineGetter__("downs", function() { return this._downs} );
Listit.Discussion.prototype.__defineSetter__("downs", function(v) { this._downs = v} );

Listit.Discussion.prototype.__defineGetter__("title", function() { return this._title} );
Listit.Discussion.prototype.__defineSetter__("title", function(v) { this._title = v} );

Listit.Discussion.prototype.__defineGetter__("url", function() { return this._url} );
Listit.Discussion.prototype.__defineSetter__("url", function(v) { this._url = v} );

Listit.Discussion.prototype.__defineGetter__("comments", function() { return this._comments} );
Listit.Discussion.prototype.__defineSetter__("comments", function(v) { this._comments = v} );

//////////
// Comment //
//////////

Listit.Comment = function () { // Constructor

}

Listit.Comment.prototype.toString = function () {
    return "<Listit.Comment, id = '" + this.id + "'>";
};

Listit.Comment.prototype.__defineGetter__("id", function() { return this._id} );
Listit.Comment.prototype.__defineSetter__("id", function(v) { this._id = v } );

Listit.Comment.prototype.__defineGetter__("depth", function() { return this._depth} );
Listit.Comment.prototype.__defineSetter__("depth", function(v) { this._depth  = v} );

Listit.Comment.prototype.__defineGetter__("author", function() { return this._author} );
Listit.Comment.prototype.__defineSetter__("author", function(v) { this._author = v} );

Listit.Comment.prototype.__defineGetter__("body", function() { return this._body} );
Listit.Comment.prototype.__defineSetter__("body", function(v) { this._body = v} );

Listit.Comment.prototype.__defineGetter__("bodyHtml", function() { return this._bodyHtml} );
Listit.Comment.prototype.__defineSetter__("bodyHtml", function(v) { this._bodyHtml = v} );

Listit.Comment.prototype.__defineGetter__("dateCreated", function() { return this._dateCreated} );
Listit.Comment.prototype.__defineSetter__("dateCreated", function(v) { this._dateCreated = v} );

Listit.Comment.prototype.__defineGetter__("ups", function() { return this._ups} );
Listit.Comment.prototype.__defineSetter__("ups", function(v) { this._ups = v} );

Listit.Comment.prototype.__defineGetter__("downs", function() { return this._downs} );
Listit.Comment.prototype.__defineSetter__("downs", function(v) { this._downs = v} );

Listit.Comment.prototype.__defineGetter__("isOpen", function() { return this._isOpen} );
Listit.Comment.prototype.__defineSetter__("isOpen", function(v) { this._isOpen = v} );

Listit.Comment.prototype.__defineGetter__("replies", function() { return this._replies} );
Listit.Comment.prototype.__defineSetter__("replies", function(v) { this._replies = v} );

/////
// Derived data

Listit.Comment.prototype.__defineGetter__("score", function() { 
    return this._ups - this._downs; 
});

Listit.Comment.prototype.__defineGetter__("votes", function() { 
    return this._ups + this._downs; 
});

Listit.Comment.prototype.__defineGetter__("likes", function() { 
    return this._ups / (this._ups + this._downs); 
});

Listit.Comment.prototype.__defineGetter__("numChars", function() { 
    return this._body.length; 
});

Listit.Comment.prototype.__defineGetter__("numReplies", function() { 
    return this._replies.length; 
});

Listit.Comment.prototype.__defineGetter__("debug", function() { 
    return this._replies.length + 1; 
});

//////
// Various functions for processing and sorting the comments
//////

if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

Listit.sortComments = function(comments, comparisonFunction) { 
    Listit.logger.trace("Listit.sortComments -- ");
    Listit.assert(comparisonFunction instanceof Function, 'comparisonFunction should be a Function');
    Listit.assert(comments instanceof Array, 'sortComments: comments should be an Array');
    
    if (!comments) {
        return comments;
    }
    for (var i = 0; i < comments.length; i++) { // Recursively sort children
        Listit.sortComments(comments[i].replies, comparisonFunction);
    }
    return comments.sort(comparisonFunction);
}


Listit.countComments = function(comments) {

    Listit.assert(comments instanceof Array, 'countComments: comments should be an Array');
    var result = comments.length;
    for (var idx = 0; idx < comments.length; idx = idx + 1) {
        result += Listit.countComments(comments[idx].replies);
    }
    return result;
}


////
// Parse JSON
////



Listit.redditT3NodeToDiscussion = function(redditNode) {

    if (redditNode.kind != 't3') { // e.g. kind = 'Listing'
        //Listit.fbLog(redditNode);
        return null;
    } 
    var data = redditNode.data;
    var discussion = new Listit.Discussion();
    discussion.id = data.id;
    discussion.author = data.author;
    discussion.selfText = Listit.Encoder.htmlDecode(data.selftext); 
    discussion.selftTextHtml = Listit.Encoder.htmlDecode(data.selftext_html);
    discussion.dateCreated = new Date(data.created_utc * 1000);
    discussion.downs = data.downs;
    discussion.ups = data.ups;
    return discussion;
}


Listit.redditT1NodeToComment = function(redditNode, depth) {

    if (redditNode.kind != 't1') { // e.g. kind = 'more'
        //Listit.fbLog(redditNode);
        return null;
    } 

    var data = redditNode.data;
    var discussion = new Listit.Comment();
    discussion.id = data.id;
    discussion.depth = depth;
    discussion.author = data.author;
    discussion.body = Listit.Encoder.htmlDecode(data.body); 
    discussion.bodyHtml = Listit.Encoder.htmlDecode(data.body_html);
    discussion.dateCreated = new Date(data.created_utc * 1000);
    discussion.downs = data.downs;
    discussion.ups = data.ups;
    discussion.isOpen = true;  // true if a node is expanded
    discussion.replies = []; // For convenience always make an empty replies list (TODO: optimize?)

    if (data.replies) {  // Recursively add children
        var children = data.replies.data.children;
        for (var i = 0; i < children.length; i++) {
            var childNode = Listit.redditT1NodeToComment(children[i], depth + 1);
            if (childNode) 
                discussion.replies.push(childNode);
        }
    }
    return discussion;
};

// Get comments in as list (of lists) of ListitNodes
Listit.getListitDiscussionFromPage = function(redditJsonPage) {

    //Listit.logger.trace('getcommentsFromPage');

    var redditDiscussion = redditJsonPage[0].data.children[0];    
    var discussion = Listit.redditT3NodeToDiscussion(redditDiscussion);
    
    var redditPosts = redditJsonPage[1];
    Listit.fbLog(redditPosts);
    var comments = [];
    var children = redditPosts.data.children; // TODO: what is data.after/before?

    for (var i = 0; i < children.length; i++) {
        var listitNode = Listit.redditT1NodeToComment(children[i], 0);
        if (listitNode) 
            comments.push(listitNode);
    }
    discussion.comments = comments;
    return discussion;
};

