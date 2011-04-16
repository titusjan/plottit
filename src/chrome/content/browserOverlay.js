
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
            Listit.treeView.setPosts(listitPosts);
            Firebug.Console.log('sayHello success');

        } catch (ex) {
            Firebug.Console.log('Parse Failed');
            Firebug.Console.log(ex);
            
        }
        //var narf = document.getElementById('scoreTree');
        //Firebug.Console.log(narf.view);
        //Firebug.Console.log(Listit.treeView.allPosts.length);
        //Firebug.Console.log(Listit);
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
                //Firebug.Console.log('Successfully parsed JSON page for: ' + doc.URL);
                //Firebug.Console.log(page);
                var listitPosts = Listit.getListitPostsFromPage(page);
                Listit.treeView.setPosts(listitPosts);
                Firebug.Console.log('Successfully put JSON page in treeview: ' + doc.URL);
            } catch (ex) {
                Firebug.Console.log('Parse failed: ' + doc.URL.toString());
            }
        } else {
            Firebug.Console.log('doc.activeElement.textContent is undefined.');
            return;
        }
    } else {
        Firebug.Console.log('doc.activeElement is undefined.');
        return;
    }
};



Listit.redditNodeToListitNode = function(redditNode, depth)
{

    if (redditNode.kind != 't1') { // e.g. kind = 'more'
        //Firebug.Console.log(redditNode);
        return null;
    } 

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
            var childNode = Listit.redditNodeToListitNode(children[i], depth + 1);
            if (childNode) 
                listitNode.replies.push(childNode);
        }
    }
    return listitNode;
};

// Get posts in listit format (simplifies the tree)
Listit.getListitPostsFromPage = function(redditJsonPage) 
{
    Firebug.Console.log('getListitPostsFromPage');
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

