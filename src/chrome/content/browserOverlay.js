
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

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
            
            var details = document.getElementById('postHtmlFrame');
            Listit.fbLog(details);
            Listit.logger.debug(details.textContent);
            details.contentDocument.body.innerHTML = "Pepijn Kenter <i>rules</i>"
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
    
    var scoreTree = document.getElementById('scoreTree');
    scoreTree.view = Listit.treeView;
    
    // Add event handlers 
    scoreTree.addEventListener("select", Listit.onRowSelect, false);
        
    var container = gBrowser.tabContainer;
    container.addEventListener("TabOpen", Listit.onTabOpen, false);
    container.addEventListener("TabClose", Listit.onTabClose, false);
    container.addEventListener("TabSelect", Listit.onTabSelect, false);

    gBrowser.addEventListener('DOMContentLoaded', Listit.onPageLoad, true);
    Listit.logger.trace('Listit.onLoad -- end');
};


Listit.onRowSelect = function(event) {
    Listit.logger.trace("Listit.onRowSelect -- ");
    
    var selectedIndex = document.getElementById('scoreTree').currentIndex;
    var html = Listit.treeView.visibleData[selectedIndex].bodyHtml;
    Listit.setDetailsFrameHtml(html);
    
    var curState = Listit.state.getCurrentBrowserState();
    curState.selectedPostIndex = selectedIndex;
}

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
    Listit.updateAllViews(Listit.state, browserID);
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
Listit.RE_ISFILE = /^file:\/\//i  // String begins with 'file://'
Listit.RE_ISREDDIT = /www\.reddit\.com\/r\/.*\/comments\// 

Listit.onPageLoad = function(event) {

try {
    Listit.logger.trace("Listit.onPageLoad");
    var doc = event.originalTarget;
    var pageURL = doc.URL;

    var browser = gBrowser.getBrowserForDocument(doc);
    if (browser == null) {
        // Happens when document is not the root; with iFrames (e.g.: www.redditmedia.com/ads)
        Listit.logger.debug("Listit.onPageLoad: no browser for URL: " + pageURL);
        return;
    }

    var browserID = browser.getAttribute("ListitBrowserID");  // TODO: getStateForBrowser?
    var browserState = Listit.state.browserStates[browserID];
    browserState.setStatus(Listit.PAGE_NOT_LISTIT);
    browserState.removeAllPosts();
    
    if ( !Listit.RE_ISREDDIT(pageURL) && !Listit.RE_ISFILE(pageURL) ) {
        Listit.logger.debug("No reddit.com or file:// (ignored), URL: " + pageURL);    
        Listit.updateAllViews(Listit.state, browserID);
        return;
    }
    
    var host = pageURL.split('?')[0];
    Listit.fbLog(host);
    
    if (Listit.RE_ISJSON(host)) {
        Listit.logger.debug("Listit.onPageLoad (.JSON): URL: " + pageURL);

        var rootDoc = Listit.getRootHtmlDocument(doc);
        if (pageURL != rootDoc.URL) {
            // Temporary, to see what happens
            Listit.logger.debug("Listit.onPageLoad: page Url is not rootDoc URL: ");
            Listit.logger.debug("Listit.onPageLoad: page    URL: " + pageURL);
            Listit.logger.debug("Listit.onPageLoad: rootDoc URL: " + rootDoc.URL);
            Listit.updateAllViews(Listit.state, browserID);
            return;
        }
        delete doc; // to prevent mistakes
        
        var body = Listit.safeGet(rootDoc, 'body');
        var textContent = Listit.safeGet(body, 'textContent');
    
        if (!textContent) {
            Listit.debug("No body.textContent found, URL: " + rootDoc.URL);
            Listit.updateAllViews(Listit.state, browserID);
            return;
        } 
        
        Listit.processJsonPage(textContent, browser, rootDoc.URL);
        browserState.setStatus(Listit.PAGE_READY);
        Listit.updateAllViews(Listit.state, browserID);

    } else {
        Listit.logger.debug("Listit.onPageLoad (reddit page): URL: " + pageURL);

        // Make AJAX request for corresponding JSON page.
        var jsonURL = Listit.addJsonToRedditUrl(pageURL);
        var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                      .createInstance(Components.interfaces.nsIXMLHttpRequest);
                      
        request.onload = function(aEvent) {
            Listit.logger.debug("XMLHttpRequest.onload, URL: " + jsonURL);
            Listit.processJsonPage(aEvent.target.responseText, browser, jsonURL);    
        };
        
        request.onerror = function(aEvent) {
            Listit.logger.error("XMLHttpRequest.onerror, URL: " + jsonURL)
            Listit.logger.error("Error status: " + aEvent.target.status);
        };
        
        browserState.setStatus(Listit.PAGE_LOADING);
        Listit.updateAllViews(Listit.state, browserID);
        
        request.open("GET", jsonURL, true);
        request.send(null);            
    }
} catch (ex) {
    Listit.logger.error('Exception in onPageLoad: ');
    Listit.logger.error(ex);
}    

}    
    
Listit.processJsonPage = function (jsonContent, browser, url) {
    Listit.logger.trace("Listit.processJsonPage -- ");

    try {
        var browserID = browser.getAttribute("ListitBrowserID");
        var page = JSON.parse(jsonContent); // Parse content
        Listit.logger.debug('Successfully parsed JSON page for: ' + url);
        var listitPosts = Listit.getListitPostsFromPage(page);
        Listit.state.setBrowserPosts(browserID, listitPosts);
        
        var browserState = Listit.state.browserStates[browserID];
        browserState.setStatus(Listit.PAGE_READY);
        Listit.updateAllViews(Listit.state, browserID);
       
    } catch (ex) {
        Listit.logger.error('Failed processing JSON: ' + url.toString());
        Listit.logger.error(ex);
    }
}

Listit.addJsonToRedditUrl = function(url) {

    var pos = url.indexOf('?');
    if (pos < 0) {
        // No parameter in URL
        return url + '.json';
    } else {
        // Put .json between the hostname and parameters
        return url.substring(0, pos) + '.json' + url.substring(pos);
    }
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


///////////
// Views //
///////////



Listit.setDetailsFrameHtml = function(html) {
    var detailsFrame = document.getElementById('postHtmlFrame');
    detailsFrame.contentDocument.body.innerHTML = html;
}

// Updates all views using the application state
Listit.updateAllViews = function(state, eventBrowserID) {
    Listit.logger.trace("Listit.updateAllViews -- ");

    // Only update if the events applies to the current browser
    if (eventBrowserID != Listit.state.getCurrentBrowserID()) {
        Listit.logger.debug('Browser not the current browser (ignored): ' + eventBrowserID);
        return;
    }

    curState = Listit.state.getCurrentBrowserState();
    switch (curState.pageStatus) {
        case Listit.PAGE_NOT_LISTIT:
            Listit.setDetailsFrameHtml('<i>The current page is not a reddit discussion</i>');
            Listit.treeView.removeAllPosts();
            break;
        case Listit.PAGE_LOADING:
            Listit.setDetailsFrameHtml('<i>Loading posts, please wait</i>');
            Listit.treeView.removeAllPosts();
            break;
        case Listit.PAGE_READY:
            Listit.setDetailsFrameHtml('');
            Listit.treeView.setPosts(Listit.state.getBrowserPosts(eventBrowserID));
            if (curState.selectedPostIndex != null) {
                Listit.treeView.selection.select(curState.selectedPostIndex);
                var scoreTreeObject = Listit.getTreeBoxObject('scoreTree');
                scoreTreeObject.ensureRowIsVisible(curState.selectedPostIndex);
            }
            break;
        default:
            Listit.assert(false, "Invalid pageStatus: " + curState.pageStatus);
    } // switch
}

/*
 From: http://www.w3.org/TR/DOM-Level-3-Events/#event-flow
    If true, useCapture indicates that the user wishes to add the event listener for the capture 
    phase and target only, i.e. this event listener will not be triggered during the bubbling phase. 
    If false, the event listener must only be triggered during the target and bubbling phases.
*/

// Call Listit.onLoad to intialize 
window.addEventListener('load', Listit.onLoad, true);

