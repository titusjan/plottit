
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Lisit name space

// XULSchoolChrome name space
if ('undefined' == typeof(XULSchoolChrome)) {
    var XULSchoolChrome = {};
}

XULSchoolChrome.BrowserOverlay = {
    // Used as a debugging function
    sayHello: function(aEvent) {
    
        let stringBundle = document.getElementById('xulschoolhello-string-bundle');
        let message = stringBundle.getString('xulschoolhello.greeting.label');

        Firebug.Console.info('saying Hello');
        
        try {
            Listit.logger.error('Test');            
        } catch (ex) {
            Listit.logger.warning('Exception in Listit.sayHello;');
            Listit.logger.warning(ex);
        }
    }
};

///////////////////////////////////
//                               //
///////////////////////////////////



// Initializes listit. Is called when the XUL window has loaded
Listit.onLoad = function() {
    
    Components.utils.import("resource://xulschoolhello/log4moz.js");
    Listit.setupLogging();
    Listit.logger = Log4Moz.repository.getLogger('Listit');
    Listit.logger.level = Log4Moz.Level['All'];
    Listit.logger.trace('Listit.onLoad');
    
    
    // Initialize state object
    Listit.state = {};

    //var listitPosts = Listit.getListitPostsFromPage(Listit.getTestRedditJSONPage());
    //Listit.treeView.init(listitPosts);
    document.getElementById('scoreTree').view = Listit.treeView;

    // Add event handlers 
    var appcontent = document.getElementById('appcontent');   // browser
    if (appcontent) {
        appcontent.addEventListener('DOMContentLoaded', Listit.onPageLoad, true);
    }
    
    var container = gBrowser.tabContainer;
    container.addEventListener("TabOpen", Listit.onTabOpen, false);
    container.addEventListener("TabClose", Listit.onTabClose, false);
    container.addEventListener("TabSelect", Listit.onTabSelect, false);
};


Listit.setupLogging = function () {
    
    let formatter = new Log4Moz.BasicFormatter();
    
    // Loggers are hierarchical, lowering this log level will affect all output
    let root = Log4Moz.repository.rootLogger;
    root.level = Log4Moz.Level["All"];
    
    let capp = new Log4Moz.ConsoleAppender(formatter); // to the JS Error Console
    capp.level = Log4Moz.Level["Info"];
    root.addAppender(capp);
    
    let dapp = new Log4Moz.DumpAppender(formatter); // To stdout
    dapp.level = Log4Moz.Level["Trace"];
    root.addAppender(dapp);
    /**/
}


Listit.onTabOpen = function(event) {
    Listit.logger.trace("Listit.onTabOpen");
}

Listit.onTabClose = function(event) {
    Listit.logger.trace("Listit.onTabClose");
}

Listit.onTabSelect = function(event) {
    Listit.logger.trace("Listit.onTabSelect");
}

Listit.onPageLoad = function(event) {

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
    if (doc.activeElement) {
        if (doc.activeElement.textContent) {
            try {
                // Parse content
                var page = JSON.parse(doc.activeElement.textContent);
                //Listit.logger.info('Successfully parsed JSON page for: ' + doc.URL);
                //Firebug.Console.log(page);
                var listitPosts = Listit.getListitPostsFromPage(page);
                Listit.treeView.setPosts(listitPosts);
                Listit.logger.info('Successfully put JSON page in treeview: ' + doc.URL);
            } catch (ex) {
                Listit.logger.warning('Parse failed: ' + doc.URL.toString());
            }
        } else {
            Listit.logger.warning('doc.activeElement.textContent is undefined.');
            return;
        }
    } else {
        Listit.logger.warning('doc.activeElement is undefined.');
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

// Call Listit.onLoad to intialize 
window.addEventListener('load', Listit.onLoad, true);

