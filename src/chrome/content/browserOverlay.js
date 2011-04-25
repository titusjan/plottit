
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

        Listit.fbLog('saying Hello');
        
        try {
            Listit.logger.error('Test');            
        } catch (ex) {
            Listit.logger.error('Exception in Listit.sayHello;');
            Listit.logger.error(ex);
        }
    }
};

///////////////////////////////////
//                               //
///////////////////////////////////

Listit.fbLog = function(msg) {
    if ('undefined' == typeof(Firebug)) {
        Listit.logger.debug('Listit.fbLog: Firebug not installed');
        Listit.logger.info(msg);
    } else {
        Firebug.Console.log(msg);
    }
}

Listit.configureRootLogger = function () {
    
    let root = Log4Moz.repository.rootLogger;
    
    if (root.isConfigured) return; // Shared root logger has been configured once already
    root.isConfigured = true;

    // Loggers are hierarchical, lowering this log level will affect all output
    root.level = Log4Moz.Level["All"];

    let formatter = new Log4Moz.BasicFormatter();
    let capp = new Log4Moz.ConsoleAppender(formatter); // to the JS Error Console
    capp.level = Log4Moz.Level["Info"];
    root.addAppender(capp);
    
    let dapp = new Log4Moz.DumpAppender(formatter); // To stdout
    dapp.level = Log4Moz.Level["Debug"];
    root.addAppender(dapp);
}


// Initializes listit. Is called when the XUL window has loaded
Listit.onLoad = function() {

    if ('undefined' == typeof(Log4Moz)) {
        Components.utils.import("resource://xulschoolhello/log4moz.js");
        Listit.configureRootLogger();
        Listit.logger = Log4Moz.repository.getLogger('Listit');
        Listit.logger.level = Log4Moz.Level['All'];
    }
    
    Listit.logger.info(' ---------------- Listit loaded ----------------');
    Listit.logger.trace('Listit.onLoad -- begin');
    
    // Initialize state object
    Listit.state = new Listit.State();
    
    document.getElementById('scoreTree').view = Listit.treeView;

    // Add existing tabs to the state because there won't be a tabOpen
    // event raised for them
    var numTabs = gBrowser.browsers.length;
    for (var idx = 0; idx < numTabs; idx++) {
        var currentBrowser = gBrowser.getBrowserAtIndex(idx);
        var browserID = Listit.state.addBrowser(currentBrowser);
    }
    
    var container = gBrowser.tabContainer;
    container.addEventListener("TabOpen", Listit.onTabOpen, false);
    container.addEventListener("TabClose", Listit.onTabClose, false);
    container.addEventListener("TabSelect", Listit.onTabSelect, false);

    // Add event handlers 
    var appcontent = document.getElementById('appcontent');   // browser
    if (appcontent) {
        appcontent.addEventListener('DOMContentLoaded', Listit.onPageLoad, true);
    }

    Listit.logger.trace('Listit.onLoad -- end');
};




Listit.onTabOpen = function(event) {
    Listit.logger.trace("Listit.onTabOpen -- begin");
    
    var browser = gBrowser.getBrowserForTab(event.target);
    Listit.logger.debug("Listit.onTabOpen, URL: " + browser.contentDocument.URL);
    var browserID = Listit.state.addBrowser(browser);
    Listit.logger.debug("Listit.onTabOpen, browserID: " + browserID);
}

Listit.onTabClose = function(event) {
    Listit.logger.trace("Listit.onTabClose");
}

Listit.onTabSelect = function(event) {
    Listit.logger.trace("Listit.onTabSelect");
    
    var browser = gBrowser.getBrowserForTab(event.target);
    var browserID = browser.getAttribute("ListitBrowserID");
    Listit.logger.debug("Listit.onTabSelect URL: " + browser.contentDocument.URL);
    Listit.logger.debug("Listit.onTabSelect: " + browserID);
}

Listit.onPageLoad = function(event) {

    Listit.logger.trace("Listit.onPageLoad");
    
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
    if (!doc.activeElement) {
        Listit.logger.warn('doc.activeElement is undefined.');
        return;
    }
    
    if (!doc.activeElement.textContent) {
        Listit.logger.warn('doc.activeElement.textContent is undefined.');
        return;
    }

    try {
        // Parse content
        var page = JSON.parse(doc.activeElement.textContent);
        Listit.logger.debug('Successfully parsed JSON page for: ' + doc.URL);
        //Listit.fbLog(page);
        var listitPosts = Listit.getListitPostsFromPage(page);
    } catch (ex) {
        Listit.logger.warn('Parse failed: ' + doc.URL.toString());
    }

    Listit.treeView.setPosts(listitPosts);
    Listit.logger.info('Successfully put JSON page in treeview: ' + doc.URL);

};



Listit.redditNodeToListitNode = function(redditNode, depth)
{

    if (redditNode.kind != 't1') { // e.g. kind = 'more'
        //Listit.fbLog(redditNode);
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

/*
 From: http://www.w3.org/TR/DOM-Level-3-Events/#event-flow
    If true, useCapture indicates that the user wishes to add the event listener for the capture phase 
    and target only, i.e. this event listener will not be triggered during the bubbling phase. If false, 
    the event listener must only be triggered during the target and bubbling phases.
*/

// Call Listit.onLoad to intialize 
window.addEventListener('load', Listit.onLoad, true);

