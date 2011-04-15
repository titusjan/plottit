
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
            treeView.init(listitPosts);
            Firebug.Console.log('sayHello success');

        } catch (ex) {
            Firebug.Console.log('Parse Failed');
            Firebug.Console.log(ex);
        }
        var narf = document.getElementById('scoreTree')
        Firebug.Console.log(narf.view);
        //Firebug.Console.log(treeView.allPosts.length);
    }
};



if ('undefined' == typeof(Listit)) { var Listit = {}; } // Lisit name space

gMessage = 'gMessage start'; // global message


// Add listener to event handler
Listit.init = function() {
    gMessage = 'Listit.init';

    //var listitPosts = Listit.getListitPostsFromPage(Listit.getTestRedditJSONPage());
    //treeView.init(listitPosts);
    treeView.init([]);
    document.getElementById('scoreTree').view = treeView;

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
                treeView.init(listitPosts);
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

