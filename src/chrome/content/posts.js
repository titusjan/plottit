
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

////////////////
// Discussion //
////////////////


Listit.Discussion = function () { // Constructor

    this._refreshDate = new Date();
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

Listit.Discussion.prototype.__defineGetter__("refreshDate", function() { return this._refreshDate} );
Listit.Discussion.prototype.__defineSetter__("refreshDate", function(v) { this._refreshDate = v} );


Listit.Discussion.prototype.getCommentById = function (commentId) {
    
    for (let [idx, comment] in Iterator(this.comments)) {
        var resultingComment = comment.getCommentById(commentId);
        if (resultingComment) return resultingComment;
    } 
    return null;
};

Listit.Discussion.prototype.getCommentPathById = function (commentId) {

    for (let [idx, comment] in Iterator(this.comments)) {
        var path = comment.getCommentPathById(commentId);
        if (path.length > 0) {
            return path;
        }
    } 
    return [];
};




/////////////
// Comment //
/////////////

Listit.Comment = function (discussion) { // Constructor

    // Comment belongs to a discussion
    this._discussion = discussion;
}

Listit.Comment.prototype.toString = function () {
    return "<Listit.Comment, id = '" + this.id + "'>";

};


Listit.Comment.prototype.__defineGetter__("discussion", function() { return this._discussion} ); // read-only

Listit.Comment.prototype.__defineGetter__("id", function() { return this._id} );
Listit.Comment.prototype.__defineSetter__("id", function(v) { this._id = v } );

Listit.Comment.prototype.__defineGetter__("pageOrder", function() { return this._pageOrder} );
Listit.Comment.prototype.__defineSetter__("pageOrder", function(v) { this._pageOrder = v } );

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

Listit.Comment.prototype.__defineGetter__("numWords", function() { return this._numWords} );
Listit.Comment.prototype.__defineSetter__("numWords", function(v) { this._numWords = v} );

/////
// Derived data

Listit.Comment.prototype.__defineGetter__("level", function() { 
    return this._depth - 1; // level is zero-based depth
} );

Listit.Comment.prototype.__defineGetter__("score", function() { 
    return this._ups - this._downs; 
});

Listit.Comment.prototype.__defineGetter__("votes", function() { 
    return this._ups + this._downs; 
});

Listit.Comment.prototype.__defineGetter__("likes", function() { 
    if (this.votes != 0) 
        return this._ups / (this.votes); 
    else 
        return 0; // prevent divide by zero
});

Listit.Comment.prototype.__defineGetter__("likesPerc", function() { 
    return 100 * this._ups / (this._ups + this._downs) ;  
});

Listit.Comment.prototype.__defineGetter__("controversial", function() { 
    return (this.votes) / Math.max(Math.abs(this.score), 1)
});

Listit.Comment.EPOCH_START_MS = 1134028003 * 1000; // 2005-12-08 07:46:43
Listit.Comment.prototype.__defineGetter__("hot", function() { 

    var s = this.score;
    var order = Listit.log10(Math.max(Math.abs(s), 1));
    var sign = Listit.compare(this._ups, this._downs);
    var epochSeconds = this._dateCreated.valueOf() - Listit.Comment.EPOCH_START_MS;
    return order + sign * epochSeconds / 45000000;
});

Listit.Comment.prototype.__defineGetter__("best", function() { 
    
    // Let b is best(up, down) then, given the number of up and down votes, and
    // assuming the votes in reddit are distributred binomially, there is 90% confidence that
    // the least b% of the redditors voters likes the comment. 
    // We make an 80% confidence interval, so 20% is outside this interval: 10% lower and 10% higher.
    // This gives the 90% above.
    
    var n = this.votes;
    if (n == 0) return 0;

    var z = 1.281551565545 // 80% confidence.
    var p = this.likes;

    var left = p + 1/(2*n)*z*z;
    var right = z*Math.sqrt(p*(1-p)/n + z*z/(4*n*n));
    var under = 1 + 1/n*z*z;

    return (left - right) / under; // returns percentage
});

Listit.Comment.prototype.__defineGetter__("bestPerc", function() { 
    return 100 * this.best ;  
});


Listit.Comment.prototype.__defineGetter__("numChars", function() { 
    return this._body.length; 
});

Listit.Comment.prototype.__defineGetter__("numReplies", function() { 
    return this._replies.length; 
});

Listit.Comment.prototype.__defineGetter__("dateCreatedValue", function() { 
    return this._dateCreated.valueOf(); 
});

Listit.Comment.prototype.__defineGetter__("dateCreatedLocalValue", function() { 
    return this._dateCreated.valueOf() - this._dateCreated.getTimezoneOffset() * 60000; 
});

Listit.Comment.prototype.__defineGetter__("postedAfter", function() { 
    return (this._dateCreated.valueOf() - this.discussion.dateCreated.valueOf()) ; 
});

Listit.Comment.prototype.__defineGetter__("age", function() { 
    return (this.discussion.refreshDate.valueOf() - this._dateCreated.valueOf()) ; 
});


Listit.Comment.prototype.__defineGetter__("one", function() { 
    return 1; 
});

Listit.Comment.prototype.__defineGetter__("debug", function() { 
    return this._replies.length + 1; 
});


Listit.Comment.prototype.getCommentById = function (commentId) {
    
    if (this.id === commentId) return this;

    for (let [idx, comment] in Iterator(this._replies)) {
        var resultingComment = comment.getCommentById(commentId);
        if (resultingComment) return resultingComment;
    }   
    return null;
};

Listit.Comment.prototype.getCommentPathById = function (commentId) {
    
    if (this.id === commentId) { return [this]; }

    for (let [idx, comment] in Iterator(this._replies)) {
        var path = comment.getCommentPathById(commentId);
        if (path.length > 0) {
            path.unshift(this); // prepend this to path
            return path;
        }
    }   
    return [];
};


//////
// Various stand alone functions for processing and sorting the comments
//////

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

// Retrieves a flat list of comment property (tuples). Output can be used in flot.
Listit.getCommentDataAsList = function(comments, xVarID, yVarID) {
    Listit.assert(comments instanceof Array, 'countComments: comments should be an Array');
 
    var result = [];
    for (var idx = 0; idx < comments.length; idx = idx + 1) {
        var comment = comments[idx];
        if (yVarID) {
            // yvar set, return array of tuples
            result.push( [comment[xVarID], comment[yVarID]]); 
        } else {
            // no yvar set, return array of scalars
            result.push( comment[xVarID] );
        }
        result = result.concat(Listit.getCommentDataAsList(comment.replies, xVarID, yVarID));
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
    discussion.selfText = Listit.XSSDecode(data.selftext); 
    discussion.selftTextHtml = Listit.XSSDecode(data.selftext_html);
    discussion.dateCreated = new Date(data.created_utc * 1000);
    discussion.downs = data.downs;
    discussion.ups = data.ups;
    return discussion;
}



// Get comments in as list (of lists) of ListitNodes
Listit.getListitDiscussionFromPage = function(redditJsonPage) {

    Listit.logger.trace('getListitDiscussionFromPage');

    var processedNodes = 0;
    
    var redditT1NodeToComment = function(redditNode, discussion, depth) {
    
        if (redditNode.kind != 't1') { // e.g. kind = 'more'
            //Listit.fbLog(redditNode);
            return null;
        } 
        
        processedNodes += 1;
    
        var data = redditNode.data;
        var comment = new Listit.Comment(discussion);
        comment.id = data.id;
        comment.pageOrder = processedNodes;
        comment.depth = depth;
        comment.author = data.author;
        comment.body = Listit.XSSDecode(data.body); 
        comment.bodyHtml = Listit.XSSDecode(data.body_html);
        comment.dateCreated = new Date(data.created_utc * 1000);
        comment.downs = data.downs;
        comment.ups = data.ups;
        comment.isOpen = true;  // true if a node is expanded
        comment.replies = []; // For convenience always make an empty replies list (TODO: optimize?)
        
        words = data.body.match(/\S+/g) // count words
        comment.numWords = words ? words.length : 0;
    
        if (data.replies) {  // Recursively add children
            var children = data.replies.data.children;
            for (var i = 0; i < children.length; i++) {
                var childNode = redditT1NodeToComment(children[i], discussion, depth + 1);
                if (childNode) 
                    comment.replies.push(childNode);
            }
        }
        return comment;
    };

    var redditDiscussion = redditJsonPage[0].data.children[0];    
    var discussion = Listit.redditT3NodeToDiscussion(redditDiscussion);
    
    var redditPosts = redditJsonPage[1];
    var comments = [];
    var children = redditPosts.data.children; // TODO: what is data.after/before?

    for (var i = 0; i < children.length; i++) {
        var listitNode = redditT1NodeToComment(children[i], discussion, 1);
        if (listitNode) 
            comments.push(listitNode);
    }
    discussion.comments = comments;
    return discussion;
};

