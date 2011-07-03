
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
    
    Listit.logger.warn(' ---------------- Listit loaded ----------------');
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
    scoreTree.view = Listit.state.getCurrentTreeView();
    
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
    var curState = Listit.state.getCurrentBrowserState();
    var selectedPost = curState.treeView.visiblePosts[selectedIndex];
    Listit.setDetailsFrameHtml(selectedPost.bodyHtml);
    curState.selectedPost = selectedPost;
    
// try {
//     //var doc = event.target.defaultView.document;
//     //var doc = eventt;
//     //Listit.fbLog(gBrowser);
//     //var browser = gBrowser.getBrowserForTab(event.target);
//     Listit.fbLog(gBrowser.contentDocument);
//     var classID = '.id-t1' + curState.treeView.visiblePosts[selectedIndex].id;
//     Listit.logger.debug("Listit.onRowSelect: '" + classID + "'");
//     gBrowser.contentDocument.jQuery(classID).css({'background': '#EFF7FF', 'border': '1px dashed #5F99CF'});
// } catch (ex) {
//     Listit.logger.error('Exception in onRowSelect: ');
//     Listit.logger.error(ex);
// }    
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
    
    var scoreTree = document.getElementById('scoreTree');
    scoreTree.view = Listit.state.getCurrentTreeView();    
    
    Listit.updateAllViews(Listit.state, browserID);
}
 
Listit.onClickTreeHeader = function(column) {
    Listit.logger.trace("Listit.onClickTreeHeader -- ");

try {
    var comparisonFunction = Listit.sortBy[column.id];    
    if (!comparisonFunction) {
        Listit.logger.warn("No comparison function for: " + column.id);
        return null;
    }

    var scoreTree = document.getElementById('scoreTree');
    var oldSortResource = scoreTree.getAttribute('sortResource');
    var oldColumn = document.getElementById(oldSortResource);
    var oldSortDirection = scoreTree.getAttribute('sortDirection');
    /*
    var oldSortDirection = oldColumn.getAttribute('sortDirection');  // persist direction per column
    if (oldSortDirection != 'ascending' && oldSortDirection != 'descending') {
        // Should not occur, sortDirection attribute should be set in browserOverlay.xul
        Listit.logger.warn("Sort direction is '" + oldSortDirection + "' for old column: " + column.id);
        oldSortDirection = 'descending';
    }*/
    Listit.logger.debug('oldSortResource: ' + oldSortResource);    
    Listit.logger.debug('oldSortDirection: ' + oldSortDirection);    
    var newSortDirection;
    var newSortResource;
    
    if (column.id == oldSortResource) {
        newSortResource = oldSortResource;
        newSortDirection = (oldSortDirection == 'ascending') ? 'descending' : 'ascending';
    } else {
        newSortDirection = oldSortDirection;
        newSortResource = column.id;
        oldColumn.setAttribute('sortDirection', 'natural');
    }
    Listit.logger.debug('newSortResource: ' + newSortResource);    
    Listit.logger.debug('newSortDirection: ' + newSortDirection);    
    
    Listit.state.getCurrentTreeView().sortPosts(
        Listit.getDirectedComparisonFunction(comparisonFunction, newSortDirection));
    Listit.ensureCurrentRowVisible();
    
    // Set after actual sorting for easier dection of error in during sort
    scoreTree.setAttribute('sortDirection', newSortDirection);
    scoreTree.setAttribute('sortResource', newSortResource);
    column.setAttribute('sortDirection', newSortDirection);
    Listit.logger.trace("Listit.onClickTreeHeader done ");
       
} catch (ex) {
    Listit.logger.error('Exception in Listit.onClickTreeHeader;');
    Listit.logger.error(ex);
}        
}



Listit.onClickBodyTreeHeader = function(column) {
    Listit.logger.debug("Listit.onClickBodyTreeHeader -- ");
    
try {    

    var oldStructure = column.getAttribute('structure');
    var newStructure = (oldStructure == 'tree') ? 'flat' : 'tree';
    Listit.logger.debug('oldStructure: ' + oldStructure);    
    Listit.logger.debug('newStructure: ' + newStructure);    
    column.setAttribute('structure', newStructure);
    column.setAttribute('label', 'Body (' + newStructure + ')');
    Listit.logger.debug("Listit.onClickBodyTreeHeader done ");
    
} catch (ex) {
     Listit.logger.error('Exception in Listit.onClickBodyTreeHeader;');
    Listit.logger.error(ex);
}        
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

    Listit.logger.trace("Listit.onPageLoad");
    var doc = event.originalTarget;
    var pageURL = doc.URL;
// try{
//     Listit.fbLog('onPageLoad');
//     Listit.fbLog(content);
//     var classID = '.submitter';
//     Listit.logger.debug("Listit.onPageLoad: '" + classID + "'");
//     content.document.jQuery(classID).css({'background': '#EFF7FF', 'border': '1px dashed #5F99CF'});
// } catch (ex) {
//     Listit.logger.error('Exception in onRowSelect: ');
//     Listit.logger.error(ex);
// }    
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
    
    if (Listit.RE_ISREDDIT(pageURL) && !Listit.RE_ISJSON(host)) {
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
 
    } else {
             
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

    var curState = Listit.state.getCurrentBrowserState();
    switch (curState.pageStatus) {
        case Listit.PAGE_NOT_LISTIT:
            Listit.setDetailsFrameHtml('<i>The current page is not a reddit discussion</i>');
            curState.removeAllPosts();
            break;
        case Listit.PAGE_LOADING:
            Listit.setDetailsFrameHtml('<i>Loading posts, please wait</i>');
            curState.removeAllPosts();
            break;
        case Listit.PAGE_READY:
            Listit.setDetailsFrameHtml('');
            
            // Sort and set posts in score tree
            var scoreTree = document.getElementById('scoreTree');
            var sortResource = scoreTree.getAttribute('sortResource');
            var sortDirection = scoreTree.getAttribute('sortDirection');
            var comparisonFunction = Listit.getDirectedComparisonFunction(
                    Listit.sortBy[sortResource], sortDirection); 
            var listitPosts = Listit.sortPosts(
                    Listit.state.getBrowserPosts(eventBrowserID), comparisonFunction);
            curState.treeView.setPosts(listitPosts);
            Listit.ensureCurrentRowVisible();
            break;
        default:
            Listit.assert(false, "Invalid pageStatus: " + curState.pageStatus);
    } // switch
}



Listit.ensureCurrentRowVisible = function () {
    Listit.logger.trace("Listit.ensureCurrentRowVisible -- ");

    var curState = Listit.state.getCurrentBrowserState();
    if (curState.selectedPost != null) {
        var selectedIndex = curState.treeView.indexOfVisiblePost(curState.selectedPost)
        curState.treeView.selection.select(selectedIndex);
        Listit.getTreeBoxObject('scoreTree').ensureRowIsVisible(selectedIndex);
    }
}

/*
 From: http://www.w3.org/TR/DOM-Level-3-Events/#event-flow
    If true, useCapture indicates that the user wishes to add the event listener for the capture 
    phase and target only, i.e. this event listener will not be triggered during the bubbling phase. 
    If false, the event listener must only be triggered during the target and bubbling phases.
*/

// Call Listit.onLoad to intialize 
window.addEventListener('load', Listit.onLoad, true);

