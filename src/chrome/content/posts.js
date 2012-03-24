// Licensed under the MIT license. See license.txt for details

////////////////
// Discussion //
////////////////


Plottit.Discussion = function () { // Constructor

    this._refreshDate = new Date();
}

Plottit.Discussion.prototype.toString = function () {
    return "<Plottit.Discussion, id = '" + this.id + "'>";
};

Plottit.Discussion.prototype.__defineGetter__("id", function() { return this._id} );
Plottit.Discussion.prototype.__defineSetter__("id", function(v) { this._id = v } );

Plottit.Discussion.prototype.__defineGetter__("author", function() { return this._author} );
Plottit.Discussion.prototype.__defineSetter__("author", function(v) { this._author = v} );

Plottit.Discussion.prototype.__defineGetter__("selfText", function() { return this._selfText} );
Plottit.Discussion.prototype.__defineSetter__("selfText", function(v) { this._selfText = v} );

Plottit.Discussion.prototype.__defineGetter__("selfTextHtml", function() { return this._selfTextHtml} );
Plottit.Discussion.prototype.__defineSetter__("selfTextHtml", function(v) { this._selfTextHtml = v} );

Plottit.Discussion.prototype.__defineGetter__("dateCreated", function() { return this._dateCreated} );
Plottit.Discussion.prototype.__defineSetter__("dateCreated", function(v) { this._dateCreated = v} );

Plottit.Discussion.prototype.__defineGetter__("ups", function() { return this._ups} );
Plottit.Discussion.prototype.__defineSetter__("ups", function(v) { this._ups = v} );

Plottit.Discussion.prototype.__defineGetter__("downs", function() { return this._downs} );
Plottit.Discussion.prototype.__defineSetter__("downs", function(v) { this._downs = v} );

Plottit.Discussion.prototype.__defineGetter__("title", function() { return this._title} );
Plottit.Discussion.prototype.__defineSetter__("title", function(v) { this._title = v} );

Plottit.Discussion.prototype.__defineGetter__("url", function() { return this._url} );
Plottit.Discussion.prototype.__defineSetter__("url", function(v) { this._url = v} );

Plottit.Discussion.prototype.__defineGetter__("comments", function() { return this._comments} );
Plottit.Discussion.prototype.__defineSetter__("comments", function(v) { this._comments = v} );

Plottit.Discussion.prototype.__defineGetter__("refreshDate", function() { return this._refreshDate} );
Plottit.Discussion.prototype.__defineSetter__("refreshDate", function(v) { this._refreshDate = v} );


Plottit.Discussion.prototype.getCommentById = function (commentId) {
    
    for (let [idx, comment] in Iterator(this.comments)) {
        var resultingComment = comment.getCommentById(commentId);
        if (resultingComment) return resultingComment;
    } 
    return null;
};

Plottit.Discussion.prototype.getCommentPathById = function (commentId) {

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

Plottit.Comment = function (discussion) { // Constructor

    // Comment belongs to a discussion
    this._discussion = discussion;
}

Plottit.Comment.prototype.toString = function () {
    return "<Plottit.Comment, id = '" + this.id + "'>";

};


Plottit.Comment.prototype.__defineGetter__("discussion", function() { return this._discussion} ); // read-only

Plottit.Comment.prototype.__defineGetter__("id", function() { return this._id} );
Plottit.Comment.prototype.__defineSetter__("id", function(v) { this._id = v } );

Plottit.Comment.prototype.__defineGetter__("pageOrder", function() { return this._pageOrder} );
Plottit.Comment.prototype.__defineSetter__("pageOrder", function(v) { this._pageOrder = v } );

Plottit.Comment.prototype.__defineGetter__("depth", function() { return this._depth} );
Plottit.Comment.prototype.__defineSetter__("depth", function(v) { this._depth  = v} );

Plottit.Comment.prototype.__defineGetter__("author", function() { return this._author} );
Plottit.Comment.prototype.__defineSetter__("author", function(v) { this._author = v} );

Plottit.Comment.prototype.__defineGetter__("body", function() { return this._body} );
Plottit.Comment.prototype.__defineSetter__("body", function(v) { this._body = v} );

Plottit.Comment.prototype.__defineGetter__("bodyHtml", function() { return this._bodyHtml} );
Plottit.Comment.prototype.__defineSetter__("bodyHtml", function(v) { this._bodyHtml = v} );

Plottit.Comment.prototype.__defineGetter__("dateCreated", function() { return this._dateCreated} );
Plottit.Comment.prototype.__defineSetter__("dateCreated", function(v) { this._dateCreated = v} );

Plottit.Comment.prototype.__defineGetter__("ups", function() { return this._ups} );
Plottit.Comment.prototype.__defineSetter__("ups", function(v) { this._ups = v} );

Plottit.Comment.prototype.__defineGetter__("downs", function() { return this._downs} );
Plottit.Comment.prototype.__defineSetter__("downs", function(v) { this._downs = v} );

Plottit.Comment.prototype.__defineGetter__("isOpen", function() { return this._isOpen} );
Plottit.Comment.prototype.__defineSetter__("isOpen", function(v) { this._isOpen = v} );

Plottit.Comment.prototype.__defineGetter__("replies", function() { return this._replies} );
Plottit.Comment.prototype.__defineSetter__("replies", function(v) { this._replies = v} );

Plottit.Comment.prototype.__defineGetter__("numWords", function() { return this._numWords} );
Plottit.Comment.prototype.__defineSetter__("numWords", function(v) { this._numWords = v} );

/////
// Derived data

Plottit.Comment.prototype.__defineGetter__("level", function() { 
    return this._depth - 1; // level is zero-based depth
} );

Plottit.Comment.prototype.__defineGetter__("score", function() { 
    return this._ups - this._downs; 
});

Plottit.Comment.prototype.__defineGetter__("votes", function() { 
    return this._ups + this._downs; 
});

Plottit.Comment.prototype.__defineGetter__("likes", function() { 
    if (this.votes != 0) 
        return this._ups / (this.votes); 
    else 
        return 0; // prevent divide by zero
});

Plottit.Comment.prototype.__defineGetter__("likesPerc", function() { 
    return 100 * this._ups / (this._ups + this._downs) ;  
});

Plottit.Comment.prototype.__defineGetter__("controversial", function() { 
    return (this.votes) / Math.max(Math.abs(this.score), 1)
});

Plottit.Comment.EPOCH_START_MS = 1134028003 * 1000; // 2005-12-08 07:46:43
Plottit.Comment.prototype.__defineGetter__("hot", function() { 

    var s = this.score;
    var order = Plottit.log10(Math.max(Math.abs(s), 1));
    var sign = Plottit.compare(this._ups, this._downs);
    var epochSeconds = this._dateCreated.valueOf() - Plottit.Comment.EPOCH_START_MS;
    return order + sign * epochSeconds / 45000000;
});

Plottit.Comment.prototype.__defineGetter__("best", function() { 
    
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

Plottit.Comment.prototype.__defineGetter__("bestPerc", function() { 
    return 100 * this.best ;  
});


Plottit.Comment.prototype.__defineGetter__("numChars", function() { 
    return this._body.length; 
});

Plottit.Comment.prototype.__defineGetter__("numReplies", function() { 
    return this._replies.length; 
});

Plottit.Comment.prototype.__defineGetter__("dateCreatedValue", function() { 
    return this._dateCreated.valueOf(); 
});

Plottit.Comment.prototype.__defineGetter__("dateCreatedLocalValue", function() { 
    return this._dateCreated.valueOf() - this._dateCreated.getTimezoneOffset() * 60000; 
});

Plottit.Comment.prototype.__defineGetter__("postedAfter", function() { 
    return (this._dateCreated.valueOf() - this.discussion.dateCreated.valueOf()) ; 
});

Plottit.Comment.prototype.__defineGetter__("age", function() { 
    return (this.discussion.refreshDate.valueOf() - this._dateCreated.valueOf()) ; 
});


Plottit.Comment.prototype.__defineGetter__("one", function() { 
    return 1; 
});

Plottit.Comment.prototype.__defineGetter__("debug", function() { 
    return this._replies.length + 1; 
});


Plottit.Comment.prototype.getCommentById = function (commentId) {
    
    if (this.id === commentId) return this;

    for (let [idx, comment] in Iterator(this._replies)) {
        var resultingComment = comment.getCommentById(commentId);
        if (resultingComment) return resultingComment;
    }   
    return null;
};

Plottit.Comment.prototype.getCommentPathById = function (commentId) {
    
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

Plottit.sortComments = function(comments, comparisonFunction) { 
    Plottit.logger.trace("Plottit.sortComments -- ");
    Plottit.assert(comparisonFunction instanceof Function, 'comparisonFunction should be a Function');
    Plottit.assert(comments instanceof Array, 'sortComments: comments should be an Array');
    
    if (!comments) {
        return comments;
    }
    for (var i = 0; i < comments.length; i++) { // Recursively sort children
        Plottit.sortComments(comments[i].replies, comparisonFunction);
    }
    return comments.sort(comparisonFunction);
}


Plottit.countComments = function(comments) {

    Plottit.assert(comments instanceof Array, 'countComments: comments should be an Array');
    var result = comments.length;
    for (var idx = 0; idx < comments.length; idx = idx + 1) {
        result += Plottit.countComments(comments[idx].replies);
    }
    return result;
}

// Retrieves a flat list of comment property (tuples). Output can be used in flot.
Plottit.getCommentDataAsList = function(comments, xVarID, yVarID) {
    Plottit.assert(comments instanceof Array, 'countComments: comments should be an Array');
 
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
        result = result.concat(Plottit.getCommentDataAsList(comment.replies, xVarID, yVarID));
    }
    return result;
}


////
// Parse JSON
////

Plottit.redditT3NodeToDiscussion = function(redditNode) {

    if (redditNode.kind != 't3') { // e.g. kind = 'Listing'
        return null;
    } 
    var data = redditNode.data;
    var discussion = new Plottit.Discussion();
    discussion.id = data.id;
    discussion.author = data.author;
    discussion.selfText = Plottit.XSSDecode(data.selftext); 
    discussion.selftTextHtml = Plottit.XSSDecode(data.selftext_html);
    discussion.dateCreated = new Date(data.created_utc * 1000);
    discussion.downs = data.downs;
    discussion.ups = data.ups;
    return discussion;
}



// Get comments in as list (of lists) of PlottitNodes
Plottit.getPlottitDiscussionFromPage = function(redditJsonPage) {

    Plottit.logger.trace('getPlottitDiscussionFromPage');

    var processedNodes = 0;
    
    var redditT1NodeToComment = function(redditNode, discussion, depth) {
    
        if (redditNode.kind != 't1') { // e.g. kind = 'more'
            return null;
        } 
        
        processedNodes += 1;
    
        var data = redditNode.data;
        var comment = new Plottit.Comment(discussion);
        comment.id = data.id;
        comment.pageOrder = processedNodes;
        comment.depth = depth;
        comment.author = data.author;
        comment.body = Plottit.XSSDecode(data.body); 
        comment.bodyHtml = Plottit.XSSDecode(data.body_html);
        comment.dateCreated = new Date(data.created_utc * 1000);
        comment.downs = data.downs;
        comment.ups = data.ups;
        comment.isOpen = true;  // true if a node is expanded
        comment.replies = []; // For convenience always make an empty replies list 
        
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
    var discussion = Plottit.redditT3NodeToDiscussion(redditDiscussion);
    
    var redditPosts = redditJsonPage[1];
    var comments = [];
    var children = redditPosts.data.children; 

    for (var i = 0; i < children.length; i++) {
        var plottitNode = redditT1NodeToComment(children[i], discussion, 1);
        if (plottitNode) 
            comments.push(plottitNode);
    }
    discussion.comments = comments;
    return discussion;
};

