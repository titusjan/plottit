
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

        try {
            Listit.logger.info(Listit.state.summaryString() );
            Listit.fbLog(Listit.state.summaryString() );
        } catch (ex) {
            Listit.logger.error('Exception in Listit.sayHello;');
            Listit.logger.error(ex);
        }
    }
};

///////////////////////////////////
//                               //
///////////////////////////////////



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
    
    // Add existing tabs to the state because there won't be a tabOpen
    // event raised for them
    for (var idx = 0; idx < gBrowser.browsers.length; idx++) {
        var browser = gBrowser.getBrowserAtIndex(idx);
        var browserID = Listit.state.addBrowser(browser);
        Listit.state.setCurrentBrowser(browser); // we need to have a current browser
    }

    document.getElementById('scoreTree').view = Listit.treeView;
    
    // Add event handlers 
    
    var container = gBrowser.tabContainer;
    container.addEventListener("TabOpen", Listit.onTabOpen, false);
    container.addEventListener("TabClose", Listit.onTabClose, false);
    container.addEventListener("TabSelect", Listit.onTabSelect, false);

    gBrowser.addEventListener('DOMContentLoaded', Listit.onPageLoad, true);
    Listit.logger.trace('Listit.onLoad -- end');
};



Listit.onTabOpen = function(event) {
    Listit.logger.trace("Listit.onTabOpen -- ");
    
    var browser = gBrowser.getBrowserForTab(event.target);
    var browserID = Listit.state.addBrowser(browser);
    Listit.logger.debug("Listit.onTabOpen: " + browserID + 
        ", URL: " + browser.contentDocument.URL);
}

Listit.onTabClose = function(event) {
    Listit.logger.debug("Listit.onTabClose -- ");
    
    var browser = gBrowser.getBrowserForTab(event.target);
    var browserID = Listit.state.removeBrowser(browser);
    Listit.logger.debug("Listit.onTabClose: " + browserID + 
        ", URL: " + browser.contentDocument.URL);
    Listit.logger.debug(Listit.state.summaryString());
}

Listit.onTabSelect = function(event) {
    Listit.logger.trace("Listit.onTabSelect -- ");
    
    var browser = gBrowser.getBrowserForTab(event.target);
    var browserID = Listit.state.setCurrentBrowser(browser);
    Listit.logger.debug("Listit.onTabSelect: " + browserID + 
        ", URL: " + browser.contentDocument.URL);
        
    var listitPosts = Listit.state.getCurrentBrowserPosts();
    Listit.treeView.setPosts(listitPosts);
}

// Finds the root document from a HTMLDocument
// Returns null if the document is not a HTMLDocument
Listit.getRootHtmlDocument = function(doc) { 

    if (!(doc instanceof HTMLDocument)) return null;

    if (doc.defaultView.frameElement) { 
        // Frame within a tab was loaded, find the root document:
        while (doc.defaultView.frameElement) {
            doc = doc.defaultView.frameElement.ownerDocument;
        }
    }
    return doc;
}

Listit.RE_ISJSON = /\.json$/i // String ends with '.json' 
Listit.RE_ISREDDIT = /www\.reddit\.com/ 

Listit.onPageLoad = function(event) {

    Listit.logger.trace("Listit.onPageLoad");
    
    Listit.treeView.removeAllPosts();

    var doc = event.originalTarget;  
    if (Listit.RE_ISJSON(doc.URL)) {
        var browser = gBrowser.getBrowserForDocument(doc);
        
        doc = Listit.getRootHtmlDocument(doc);
        Listit.logger.debug("Listit.onPageLoad: , URL: " + doc.URL);
     
        var body = Listit.safeGet(doc, 'body');
        var textContent = Listit.safeGet(body, 'textContent');
    
        try {
            if (textContent) Listit.processJsonPage(textContent, browser, doc.URL);    
        } catch (ex) {
            Listit.logger.error(ex);
        }
    

    } else {
        if (Listit.RE_ISREDDIT(doc.URL)) {
            Listit.logger.debug("Listit.onPageLoad (reddit page): URL: " + doc.URL);

            var browser = gBrowser.getBrowserForDocument(doc);
            var jsonURL = doc.URL + '.json';
            let request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                          .createInstance(Components.interfaces.nsIXMLHttpRequest);
                          
                          
            request.onload = function(aEvent) {
                Listit.fbLog("XMLHttpRequest.onload, URL: " + jsonURL);
                Listit.fbLog(aEvent);
                Listit.logger.debug("XMLHttpRequest.onload, URL: " + jsonURL);
                Listit.processJsonPage(aEvent.target.responseText, browser, jsonURL);    
            };
            
            request.onerror = function(aEvent) {
               Listit.logger.error(aEvent.target.status);
            };
            
            request.open("GET", jsonURL, true);
            request.send(null);            
            
        } else {
            Listit.logger.debug("Listit.d (no json, ignored), URL: " + doc.URL);
        }
    }
}    
    
Listit.processJsonPage = function (jsonContent, browser, url) {
    Listit.logger.trace("Listit.processJsonPage -- ");

    var listitPosts = [];
    var browserID = browser.getAttribute("ListitBrowserID");
    try {
        var page = JSON.parse(jsonContent); // Parse content
        Listit.logger.debug('Successfully parsed JSON page for: ' + url);
        listitPosts = Listit.getListitPostsFromPage(page);
        Listit.state.setBrowserPosts(browser, listitPosts);
    
        if (browserID == Listit.state.getCurrentBrowserID()) {
            // TODO: check if browswer still has matching URL
            Listit.treeView.setPosts(listitPosts);
            Listit.logger.debug('Put JSON page in treeview for browser ' + browserID + ': ' + url);
        } else {
            Listit.logger.debug('Browser not the current browser (ignored): ' + browserID);
        }
    } catch (ex) {
        Listit.logger.error('Failed processing JSON: ' + url.toString());
        Listit.logger.error(ex.toString());
    }
}

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
    If true, useCapture indicates that the user wishes to add the event listener for the capture 
    phase and target only, i.e. this event listener will not be triggered during the bubbling phase. 
    If false, the event listener must only be triggered during the target and bubbling phases.
*/

// Call Listit.onLoad to intialize 
window.addEventListener('load', Listit.onLoad, true);

