
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

// XULSchoolChrome name space
if ('undefined' == typeof(XULSchoolChrome)) {
    var XULSchoolChrome = {};
}

Listit.debug = function () {

    let stringBundle = document.getElementById('xulschoolhello-string-bundle');
    let message = stringBundle.getString('xulschoolhello.greeting.label');

    try {
        Listit.logger.info(Listit.state.summaryString() );
        Listit.fbLog(Listit.state.summaryString() );
        
        var details = document.getElementById('commentHtmlFrame');
        Listit.fbLog(details);
        Listit.logger.debug(details.textContent);
        details.contentDocument.body.innerHTML = "Pepijn Kenter <i>rules</i>"
    } catch (ex) {
        Listit.logger.error('Exception in Listit.sayHello;');
        Listit.logger.error(ex);
    }
}

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
    Listit.state = new Listit.State(
        document.getElementById('treeLocalDate').getAttribute('format'), 
        document.getElementById('treeUtcDate').getAttribute('format') );
    
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

    gBrowser.addEventListener('DOMContentLoaded', Listit.onPageLoad, false); 
    Listit.logger.trace('Listit.onLoad -- end');
        
};

Listit.onUnload = function() {
    Listit.logger.debug("Listit.onUnload -- "); // TODO: unload event listeners
}

Listit.SELECTED_ROW_STYLE = "<style type='text/css'>"
    + "div.listit-selected {background-color:#EFF7FF; outline:1px dashed #5F99CF}"
    + "</style>";

Listit.onRowSelect = function(event) {
    Listit.logger.trace("Listit.onRowSelect -- ");
    
    var selectedIndex = document.getElementById('scoreTree').currentIndex;
    var curState = Listit.state.getCurrentBrowserState();
    var prevSelectedComment = curState.selectedComment;
    var selectedComment = curState.treeView.visibleComments[selectedIndex];
    Listit.setDetailsFrameHtml(selectedComment.bodyHtml);
    curState.selectedComment = selectedComment;
    
    // Select post in reddit page
    var $ = content.wrappedJSObject.jQuery;
    if (prevSelectedComment !== null) {
        $('div.id-t1_' + prevSelectedComment.id + ' div.entry')
            .filter(':first').removeClass('listit-selected');
    }
    var offset = $('div.id-t1_' + selectedComment.id)
                    .filter(':visible').find('div.entry:first')
                    .addClass('listit-selected')
                    .offset();
    if (offset) {
        $('html').stop().animate( { 'scrollTop' : (offset.top - 100)}, 'fast', 'linear');
    }
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
 

Listit.onClickTreeHeader = function(event) {
    Listit.logger.trace("Listit.onClickTreeHeader -- ");

    if (event.button != 0) return; // Only left mouse button
    
    var column = event.originalTarget;
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
    
    var structure = document.getElementById('treeBody').getAttribute('structure');
    Listit.state.getCurrentTreeView().setDiscussionSorted(column.id, newSortDirection, structure);
    Listit.ensureCurrentRowVisible();
    
    // Set after actual sorting for easier dection of error in during sort
    scoreTree.setAttribute('sortDirection', newSortDirection);
    scoreTree.setAttribute('sortResource', newSortResource);
    column.setAttribute('sortDirection', newSortDirection);
    Listit.logger.trace("Listit.onClickTreeHeader done ");
}



Listit.onClickBodyTreeHeader = function(event) {
    Listit.logger.trace("Listit.onClickBodyTreeHeader -- ");
    
    if (event.button != 0) return; // Only left mouse button
    
    var column = event.originalTarget;
    var oldStructure = column.getAttribute('structure');
    var newStructure = (oldStructure == 'tree') ? 'flat' : 'tree';
    Listit.logger.debug('oldStructure: ' + oldStructure);    
    Listit.logger.debug('newStructure: ' + newStructure);    
    
    var curTreeView = Listit.state.getCurrentTreeView();
    curTreeView.setStructure(newStructure);
    
    // Sort and set comments in score tree (TODO new function)
    var scoreTree = document.getElementById('scoreTree');
    var sortResource = scoreTree.getAttribute('sortResource');
    var sortDirection = scoreTree.getAttribute('sortDirection');
    curTreeView.setDiscussionSorted(sortResource, sortDirection, newStructure);
    //curTreeView.setDiscussionSorted(sortResource, sortDirection, newStructure, curTreeView.discussion);
    Listit.ensureCurrentRowVisible();
    
    // Set after actual sorting for easier dection of error in during sort
    column.setAttribute('structure', newStructure);
    column.setAttribute('label', 'Body as ' + ((newStructure == 'tree') ? 'tree' : 'list'));
    
    Listit.logger.trace("Listit.onClickBodyTreeHeader done ");
}

Listit.setTreeColumnDateFormat = function (event) {
    Listit.logger.trace("Listit.setTreeColumnDateFormat -- ");
  
    var format = event.target.value;
    var column = document.popupNode; 

    var key;
    switch (column.id) {
        case 'treeLocalDate':
            Listit.logger.debug("Setting treeLocalDate column format to: " + format);
            key = ['localDateFormat'];
            Listit.state.setLocalDateFormat(format);
            break;
        case 'treeUtcDate':
            Listit.logger.debug("Setting treeUtcDate column format to: " + format);
            key = ['utcDateFormat'];
            Listit.state.setUtcDateFormat(format);
            break;
        default:
            Listit.assert(false, "Invalid column ID: " + column.id);
    } // switch
    
    // Set attribute for persistence
    column.setAttribute('format', format);
    
    // Force repainting of the column;
    var treeBoxColumns = Listit.getTreeBoxObject('scoreTree').columns;
    var nsiTreeColumn = treeBoxColumns.getNamedColumn(column.id);
    Listit.getTreeBoxObject('scoreTree').invalidateColumn(nsiTreeColumn);        
    
    Listit.logger.trace("Listit.setTreeColumnDateFormat done ");    
}

// Sets the check mark depending on which column is the context of the date-format popup
Listit.onDateFormatPopupShowing = function(menu) {
    Listit.logger.trace("Listit.onDateFormatPopupShowing -- ");   

    var column = document.popupNode;
    var format = column.getAttribute('format');

    // Unselect all menu items first.
    for (var idx = 0; idx < menu.children.length; idx++) {
        var child = menu.children[idx];
        if (child.hasAttribute('value')) {
            child.removeAttribute('checked');
        }
    }

    for (var idx = 0; idx < menu.children.length; idx++) {
        var child = menu.children[idx];
        if (child.hasAttribute('value')) {
            var childFormat = child.getAttribute('value');
            if (childFormat == format) {
                child.setAttribute('checked', 'true');
            }
        }
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
    var browser = gBrowser.getBrowserForDocument(doc);
    if (browser == null) {
        // Happens when document is not the root; with iFrames (e.g.: www.redditmedia.com/ads)
        Listit.logger.debug("Listit.onPageLoad: no browser for URL: " + pageURL);
        return;
    }

    var browserID = browser.getAttribute("ListitBrowserID");  // TODO: getStateForBrowser?
    var browserState = Listit.state.browserStates[browserID];
    browserState.setStatus(Listit.PAGE_NOT_LISTIT);
    browserState.removeAllComments();
    
    if ( !Listit.RE_ISREDDIT.test(pageURL) && !Listit.RE_ISFILE.test(pageURL) ) {
        Listit.logger.debug("No reddit.com or file:// (ignored), URL: " + pageURL);    
        Listit.updateAllViews(Listit.state, browserID);
        return;
    }
    
    var host = pageURL.split('?')[0];

    if (Listit.RE_ISREDDIT.test(pageURL) && !Listit.RE_ISJSON.test(host)) {
        Listit.logger.debug("Listit.onPageLoad (reddit page): URL: " + pageURL);
try {        
        // Append listit css style to page 
        var $ = content.wrappedJSObject.jQuery;
        var styleElem = $(Listit.SELECTED_ROW_STYLE);
        $('head').append(styleElem);
        Listit.fbLog("Listit.onPageLoad (reddit page): URL: " + pageURL);
        Listit.logger.debug("Head length: " + $('head').length);
        Listit.logger.debug(styleElem);
        
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
        Listit.logger.debug("Listit.onPageLoad done");
        
} catch (ex) {
    Listit.logger.error('Exception in Listit.onPageLoad;');
    Listit.logger.error(ex);
} 
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
        var discussion = Listit.getListitDiscussionFromPage(page);
        Listit.state.setBrowserDiscussion(browserID, discussion);
        
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

Listit.displayScatterPlot = function (bDisplay) {
    Listit.logger.trace("Listit.displayScatterPlot -- ");
    
    var plotFrameDoc = document.getElementById('plotFrame').contentDocument;
    if (bDisplay) {
        plotFrameDoc.getElementById('graphs-div').style.display   = 'block';
        plotFrameDoc.getElementById('messages-div').style.display = 'none';
        
        // Force resize, otherwise it won't resize if previous tab doesn't contain discussion
        var cw = document.getElementById('plotFrame').contentWindow.wrappedJSObject.onResize();
    } else {
        plotFrameDoc.getElementById('graphs-div').style.display   = 'none';
        plotFrameDoc.getElementById('messages-div').style.display = 'block';
    }
}

Listit.updateScaterPlot = function (discussion) {
    Listit.logger.trace("Listit.updateScaterPlot -- ");
    
    var plotFrame = document.getElementById('plotFrame');
    var $ = plotFrame.contentWindow.jQuery;
    
    var data = Listit.getCommentDataAsTuples(discussion.comments);
    var plotSeries = {
        data   : data,
        points : { show: true },
        //xlabel : 'length',
        //ylabel : 'score',
        color  : 'orangered',
    };
    $.plot($("#scatter-plot-div"), [plotSeries],  { xaxis: { mode: "time" } });
}

Listit.setDetailsFrameHtml = function(html) {
    var detailsFrame = document.getElementById('commentHtmlFrame');
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
            Listit.displayScatterPlot(false);
            curState.removeAllComments();
            break;
        case Listit.PAGE_LOADING:
            Listit.setDetailsFrameHtml('<i>Loading comments, please wait</i>');
            Listit.displayScatterPlot(false);
            curState.removeAllComments();
            break;
        case Listit.PAGE_READY:
            var discussion = Listit.state.getBrowserDiscussion(eventBrowserID);
            Listit.setDetailsFrameHtml('');
            Listit.displayScatterPlot(true);
            Listit.updateScaterPlot(discussion);
            
            // Sort and set comments in score tree
            var scoreTree = document.getElementById('scoreTree');
            var sortResource = scoreTree.getAttribute('sortResource');
            var sortDirection = scoreTree.getAttribute('sortDirection');
            var structure = document.getElementById('treeBody').getAttribute('structure');
            
            var column = document.getElementById(sortResource);
            column.setAttribute('sortDirection', sortDirection);
            
            curState.treeView.setDiscussionSorted(column.id, sortDirection, structure, discussion);
            Listit.ensureCurrentRowVisible();
            break;
        default:
            Listit.assert(false, "Invalid pageStatus: " + curState.pageStatus);
    } // switch
}


Listit.ensureCurrentRowVisible = function () {
    Listit.logger.trace("Listit.ensureCurrentRowVisible -- ");

    var curState = Listit.state.getCurrentBrowserState();
    if (curState.selectedComment != null) {
        var selectedIndex = curState.treeView.indexOfVisibleComment(curState.selectedComment)
        curState.treeView.selection.select(selectedIndex);
        Listit.getTreeBoxObject('scoreTree').ensureRowIsVisible(selectedIndex);
    }
}

/*
From: http://www.w3.org/TR/DOM-Level-3-Events/#event-flow
    If true, useCapture indicates that the user wishes to add the event listener for the capture 
    phase and target only, i.e. this event listener will not be triggered during the bubbling phase. 
    If false, the event listener must only be triggered during the target and bubbling phases.
From: https://developer.mozilla.org/en/XUL_School/Adding_Events_and_Commands    
    In general, you should avoid adding event handlers in the capturing phase, or canceling events. 
    This can lead to unexpected behavior for the user since most events have a default behavior 
    associated to them.
*/

// Call Listit.onLoad to intialize 
window.addEventListener('load', Listit.onLoad, true);

