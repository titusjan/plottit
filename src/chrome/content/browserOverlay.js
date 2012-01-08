
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

// Initializes listit. Is called when the XUL window has loaded
Listit.onLoad = function() {

try{        
    Listit.initializeLoggers(true, "Debug");
    document.getElementById('plotFrame').contentWindow.Listit.logger = Listit.logger;
    document.getElementById('plotFrame').contentWindow.Listit.fbLog  = Listit.fbLog;

    Listit.logger.warn(' ---------------- Listit loaded ----------------');
    Listit.logger.trace('Listit.onLoad -- begin');

    // Test if the extension is executed for the first time.
    if (Application.extensions)  
        Listit.onFirstRun(Application.extensions);     // Firefox 3
    else  
        Application.getExtensions(Listit.onFirstRun);  // Firefox >= 4

    
    // Initialize state object
    Listit.state = new Listit.State(
        Application.prefs.get("extensions.listit.listitEnabled").value,     // listitEnabled
        document.getElementById('treeLocalDate').getAttribute('format'),    // localDateFormat
        document.getElementById('treeUtcDate').getAttribute('format'),      // utcDateFormat
        document.getElementById('listit-treemap-size-menulist').value,      // treeMapSizeProperty
        Listit.HSL_CONVERSION_FUNCTIONS[
            document.getElementById('listit-treemap-color-menulist').value] // treeMapColorVariable
        );

    // Sets button tooltip text
    Listit.setListitActive(Application.prefs.get("extensions.listit.listitEnabled").value);
        
    // Add existing tabs to the state because there won't be a tabOpen
    // event raised for them
    for (var idx = 0; idx < gBrowser.browsers.length; idx++) {
        var browser = gBrowser.getBrowserAtIndex(idx);
        var browserID = Listit.state.addBrowser(browser);
        Listit.state.setCurrentBrowser(browser); // we need to have a current browser
    }

    Listit.scatterPlot = new Listit.ScatterPlot('plotFrame', Listit.State, 
        Listit.getCheckboxValue(document.getElementById('listit-scatter-axes-autoscale')), 
        document.getElementById('listit-scatter-x-axis-menulist').getAttribute('value'), 
        document.getElementById('listit-scatter-y-axis-menulist').getAttribute('value'), 
        parseFloat(document.getElementById('listit-bin-width-menulist').value));
        
    var scoreTree = document.getElementById('scoreTree');
    scoreTree.view = Listit.state.getCurrentTreeView();
    
    // Add event handlers 
    var treeMapFrame = document.getElementById('listit-treemap-frame');
    treeMapFrame.addEventListener("resize", Listit.onResizeTreeMap, false);
    
    scoreTree.addEventListener("select", Listit.onRowSelect, false);
        
    var container = gBrowser.tabContainer;
    container.addEventListener("TabOpen", Listit.onTabOpen, false);
    container.addEventListener("TabClose", Listit.onTabClose, false);
    container.addEventListener("TabSelect", Listit.onTabSelect, false);

    gBrowser.addEventListener('DOMContentLoaded', Listit.onPageLoad, false); 

    Listit.logger.trace('Listit.onLoad -- end');
} catch (ex) {
    Listit.logger.error('Exception in Listit.onLoad;');
    Listit.logException(ex);
}        
};


Listit.onFirstRun = function (extensions) {
    let extension = extensions.get('listit@titusjan.com');  
    if (extension.firstRun) {  
        Listit.logger.info("Listit runs for the first time");
        Listit.installToolbarButtonAtEnd('nav-bar', 'listit-toggle-active-button');
    } else {
        Listit.logger.debug("Listit runs for the nth time");
    }
}  

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
    column.setAttribute('label', 'Comments as ' + ((newStructure == 'tree') ? 'Tree' : 'List'));
    
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

Listit.RE_ISJSON   = /\.json$/i      // String ends with '.json' 
Listit.RE_ISLOCAL  = /^file:\/\//i   // String begins with 'file://'
Listit.RE_ISREDDIT = /www\.reddit\.com\/r\/.*\/comments\// 

Listit.onPageLoad = function(event) {

    Listit.logger.trace("Listit.onPageLoad");
try {        
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
    // browserState.removeAllComments(); // why is this necessary?
    
    var host = pageURL.split('?')[0];
    var isRedditPage = Listit.RE_ISREDDIT.test(host);
    var isJsonPage   = Listit.RE_ISJSON.test(host);
    var isLocalPage  = Listit.RE_ISLOCAL.test(host) 

    if ( isRedditPage && !isJsonPage) {
        // A reddit html page, the json will be loaded with AJAX
        Listit.logger.debug("Listit.onPageLoad (reddit discussion): URL: " + pageURL);

        // Append listit css style to reddit page (so we can highlight selected comment)
        var $ = doc.defaultView.wrappedJSObject.jQuery;
        var styleElem = $(Listit.SELECTED_ROW_STYLE);
        $('head').append(styleElem);
        
        if (Listit.state.listitEnabled) {
            browserState.setStatus(Listit.PAGE_LOADING);
            Listit.ajaxRequestJsonPage(pageURL, browser);
        } else {
            browserState.setStatus(Listit.PAGE_POSTPONED);
        }
        Listit.updateAllViews(Listit.state, browserID);
        Listit.logger.debug("Listit.onPageLoad done");
        return;
        
    } else if ( isJsonPage && (isRedditPage || isLocalPage)) {
        // A JSON page, either from reddit.com or local; process directly
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
            Listit.logger.debug("No body.textContent found, URL: " + rootDoc.URL);
            Listit.updateAllViews(Listit.state, browserID);
            return;
        } 
        
        Listit.processJsonPage(textContent, browser, rootDoc.URL);
        browserState.setStatus(Listit.PAGE_READY);
        Listit.updateAllViews(Listit.state, browserID);
        return;
        
    } else {
        // All other cases; page to be ignored by Listit 
        Listit.logger.debug("Page ignored by Listit (ignored), URL: " + pageURL);    
        Listit.updateAllViews(Listit.state, browserID); // Will hide pannels
        return;
    }
    
} catch (ex) {
    Listit.logger.error('Exception in Listit.onPageLoad;');
    Listit.logException(ex);
}    
}    

Listit.ajaxRequestJsonPage = function (pageURL, browser) {

    Listit.logger.debug("Listit.ajaxRequestJsonPage: " + pageURL);
    
    // Make AJAX request for corresponding JSON page.
    var jsonURL = Listit.addJsonToRedditUrl(pageURL);
    var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                  .createInstance(Components.interfaces.nsIXMLHttpRequest);
                  
    request.onload = function(aEvent) {
        try {    
            Listit.logger.debug("XMLHttpRequest.onload, URL: " + jsonURL);
            Listit.processJsonPage(aEvent.target.responseText, browser, jsonURL);    
        } catch (ex) {
            Listit.logger.error('Exception in Listit. XMLHttpRequest.onload;');
            Listit.logException(ex);
        }
    };
    
    request.onerror = function(aEvent) {
        Listit.logger.error("XMLHttpRequest.onerror, URL: " + jsonURL)
        Listit.logger.error("Error status: " + aEvent.target.status);
    };

    request.open("GET", jsonURL, true);
    request.send(null);      
}


Listit.processJsonPage = function (jsonContent, browser, url) {
    Listit.logger.debug("Listit.processJsonPage -- ");

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
        Listit.logException(ex);
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
    var detailsFrame = document.getElementById('commentHtmlFrame');
    detailsFrame.contentDocument.body.innerHTML = html;
}

// Updates all views using the application state
Listit.updateAllViews = function(state, eventBrowserID) {
    Listit.logger.trace("Listit.updateAllViews -- ");
    
    if ( !Listit.state.listitEnabled) {
        Listit.setListitVisible(false);
        return;
    }

    // Only update if the events applies to the current browser
    if (eventBrowserID != Listit.state.getCurrentBrowserID()) {
        Listit.logger.debug('Browser not the current browser (ignored): ' + eventBrowserID);
        return;
    }

    var curState = Listit.state.getCurrentBrowserState();
    //Listit.logger.debug("Page status: " + curState.pageStatus);
    switch (curState.pageStatus) {
        case Listit.PAGE_NOT_LISTIT:
            if (true) {
                Listit.setListitVisible(false);
            } else { // Debugging
                Listit.showDescription('The current page is not a reddit discussion');
                Listit.scatterPlot.display(false);
                curState.removeAllComments();
            }
            break;
        case Listit.PAGE_POSTPONED:
            Listit.setListitVisible(true);
            Listit.showDescription('(Postponed) comments loading...');
            Listit.scatterPlot.display(false);
            curState.removeAllComments();
            Listit.setListitVisible(true);
            
            // Page loading was postponed... until now.
            // Load the comments via ajax.
            var browserState = Listit.state.getCurrentBrowserState()
            browserState.setStatus(Listit.PAGE_LOADING);
            var browser = browserState.browser;
            Listit.ajaxRequestJsonPage(browser.currentURI.asciiSpec, browser);
            break;
        case Listit.PAGE_LOADING:
            Listit.setListitVisible(true);
            Listit.showDescription('Loading comments...');
            Listit.scatterPlot.display(false);
            curState.removeAllComments();
            break;
        case Listit.PAGE_READY:
            Listit.setListitVisible(true);
            Listit.hideDescription();
            var discussion = Listit.state.getBrowserDiscussion(eventBrowserID);
            Listit.scatterPlot.display(true);
            Listit.scatterPlot.setDiscussion(discussion);
            Listit.setTreeMapDiscussion(discussion);
            
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
    //Listit.logger.debug("Listit.updateAllViews: done ");
}

Listit.setListitVisible = function (visible) {
    try {
        var deck = document.getElementById('listit-messages-deck');
        var splitter = document.getElementById('listitContentSplitter');
        deck.hidden = !visible;
        splitter.hidden = !visible;
    } catch (ex) {
        Listit.logger.error('Exception in Listit.setListitVisible;');
        Listit.logException(ex);
    }    
}

Listit.onRenderTreeMapTimeOut = function() {

    try {
        Listit.logger.trace("Listit.drawTreeMapCushionedAfterTimeOut: " + window.globalTimeOutId);
        var treeMapFrame = document.getElementById('listit-treemap-frame');
        
        var sliderH0   = document.getElementById("listit-treemap-scale-h0");
        var sliderF    = document.getElementById("listit-treemap-scale-f");
        var sliderIamb = document.getElementById("listit-treemap-scale-iamb");
        Listit.logger.debug("Listit.drawTreeMapCushionedAfterTimeOut, H0: " + 
            sliderH0.value/1000 + ', F: ' + sliderF.value/1000 + ', Iamb: ' + sliderIamb.value/1000);
        
        treeMapFrame.contentWindow.wrappedJSObject.renderCushioned(sliderH0.value/1000, sliderF.value/1000, sliderIamb.value/1000);
        window.globalTimeOutId = null;
    } catch (ex) {
        Listit.logger.error('Exception in Listit.setTreeMapDiscussion;');
        Listit.logException(ex);
    }   
}

Listit.renderTreeMap = function(cushionDelay) {

    var treeMapFrame = document.getElementById('listit-treemap-frame');

    var isCushioned = Listit.getCheckboxValue(document.getElementById('listit-treemap-cushions-checkbox'));
    if (cushionDelay == null)  cushionDelay = 250;
    if ( ! ((cushionDelay === 0) && isCushioned) ) { // skip flat rendering if there is no cushion delay
        treeMapFrame.contentWindow.wrappedJSObject.renderFlat();
    }
    
    if (isCushioned) {
        if (window.globalTimeOutId) {
            window.clearTimeout(window.globalTimeOutId); // Cancel previous time out;
        }
        window.globalTimeOutId = window.setTimeout(Listit.onRenderTreeMapTimeOut, cushionDelay);
    }
}


Listit.onResizeTreeMap = function(event) {

    try {
        Listit.logger.trace("Listit.onResizeTreeMap");
        var treeMapFrame = document.getElementById('listit-treemap-frame');
        treeMapFrame.contentWindow.wrappedJSObject.resizeCanvas();
        Listit.renderTreeMap();
    } catch (ex) {
        Listit.logger.error('Exception in Listit.onResizeTreeMap;');
        Listit.logException(ex);
    } 
}

Listit.setTreeMapDiscussion = function(discussion) {
    try {
        Listit.logger.debug("Listit.setTreeMapDiscussion --");
        
        var treeMap = new Listit.TreeMap(discussion, 
            Listit.state.treeMapSizeProperty,
            Listit.state.fnHslOfComment);
        treeMap.root.sortNodesBySizeDescending();

        var treeMapFrame = document.getElementById('listit-treemap-frame');
        treeMapFrame.contentWindow.wrappedJSObject.setTreeMap(treeMap);
        Listit.renderTreeMap()
    } catch (ex) {
        Listit.logger.error('Exception in Listit.setTreeMapDiscussion;');
        Listit.logException(ex);
    }   
}


Listit.setTreeMapSizeProperty = function(menuList) {
    try {
        Listit.logger.trace("Listit.setTreeMapSizeProperty: " + menuList.value);
        Listit.state.treeMapSizeProperty = menuList.value;
        Listit.setTreeMapDiscussion(Listit.state.getCurrentBrowserDiscussion());
    } catch (ex) {
        Listit.logger.error('Exception in Listit.setTreeMapSizeProperty;');
        Listit.logException(ex);
    }   
}

// Conversion functions that calculate a HSL triplet belonging to a comment.
Listit.HUE_BLUE = 0.6666666667;
Listit.HUE_ORANGE_RED = 0.044444444444444446; // is 16/360 degrees
Listit.HSL_CONVERSION_FUNCTIONS = {

    'none' : function(comment) { return [0, 0, 1] }, // Always grey
    'depth': function(comment) { return [Listit.HUE_BLUE - (comment.depth/10) % 1, 1, 1] },   // maxdepth is 10
    'numReplies': function(comment) { return [Listit.HUE_BLUE - (comment.numReplies/50) % 1, 1, 1] },   // maxdepth is 10
    'score': function(comment) { 
        
        if (comment.score == 0) {
            return [0, 0, 1];
        } else if (comment.score >= 0) {
            return [Listit.HUE_ORANGE_RED, Math.min(1, Listit.log10(comment.score) / 3), 1];
        } else {
            return [Listit.HUE_BLUE, Math.min(1, 0.79 * Listit.log10(-comment.score) / 3), 1];
        }
    },  
}

Listit.setTreeMapColorProperty = function(menuList) {
    try {
        Listit.logger.trace("Listit.setTreeMapColorProperty: " + menuList.value);
        Listit.state.fnHslOfComment = Listit.HSL_CONVERSION_FUNCTIONS[menuList.value];
        Listit.setTreeMapDiscussion(Listit.state.getCurrentBrowserDiscussion());
    } catch (ex) {
        Listit.logger.error('Exception in Listit.setTreeMapColorProperty;');
        Listit.logException(ex);
    }   
}
    

Listit.showDescription = function(msg) {
    var deck = document.getElementById('listit-messages-deck');
    deck.selectedIndex = 0;
    var description = document.getElementById('listit-messages-description');
    description.value = msg;
}

Listit.hideDescription = function() {
    var deck = document.getElementById('listit-messages-deck');
    deck.selectedIndex = 1;
    var description = document.getElementById('listit-messages-description');
    description.value = "Listit...";    
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

Listit.toggleListitActive = function () {
    try{
        Listit.logger.trace("Listit.toggleListitActive -- ");
        this.setListitActive( ! Listit.state.listitEnabled);
        Listit.updateAllViews(Listit.state, Listit.state.getCurrentBrowserID());
    } catch (ex) {
        Listit.logger.error('Exception in Listit.toggleListitActive;');
        Listit.logException(ex);
    }        
}

Listit.setListitActive = function (listitEnabled) {
    Listit.logger.debug("Listit.setListitActive: " + listitEnabled);

    Listit.state.listitEnabled = listitEnabled;
    Application.prefs.get("extensions.listit.listitEnabled").value = Listit.state.listitEnabled; 
    
    var toolbarButton = document.getElementById('listit-toggle-active-button');
    if (toolbarButton) {
        toolbarButton.setAttribute('tooltiptext', listitEnabled ? 'Disable Listit': 'Enable Listit');
    }
}


/* //not yet implemented 

Listit.collapseExpandRedditComment = function(commentId) {
    Listit.logger.trace("Listit.collapseExpandRedditComment -- ");
    
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
*/

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


///////////////////////////////////
//          DEBUGGING            //
///////////////////////////////////

Listit.myDebugRoutine = function () {

    
    let stringBundle = document.getElementById('listit-string-bundle');
    let message = stringBundle.getString('listit.greeting.label');
    
    //var t = Listit.narf.snarf;  // Shows that exception does not show up in firebug or console

    try {
        Listit.logger.debug('Listit.debug');
        Listit.fbLog('Listit.debug');
        Listit.fbLog(Listit.state.summaryString());
        Listit.fbLog(Application.prefs.get("extensions.listit.listitEnabled").value);
        
        var treeMapFrame = document.getElementById('listit-treemap-frame');
        Listit.fbLog(treeMapFrame.contentWindow);
        Listit.fbLog(treeMapFrame.contentDocument);        
        Listit.fbLog(treeMapFrame.contentWindow.treeMap);
        
        
        treeMapFrame.contentWindow.wrappedJSObject.myDebug();
        
        //Listit.fbLog(Listit.state.getCurrentTreeView());
        //Listit.fbLog(Listit.state.getCurrentTreeView().treebox);

        //Listit.fbLog(new Log4Moz.BasicFormatter());
        //Listit.fbLog(new Listit.LogFormatter());
        
        /*
        Listit.logger.info(Listit.state.summaryString() );
        Listit.fbLog(Listit.state.summaryString() );
        
        var details = document.getElementById('commentHtmlFrame');
        Listit.fbLog(details);
        Listit.logger.debug(details.textContent);
        details.contentDocument.body.innerHTML = "Pepijn Kenter <i>rules</i>"
        */
    } catch (ex) {
        Listit.logger.error('Exception in Listit.debug;');
        Listit.logException(ex);
        //Listit.logException(ex);
        //Listit.fbLog(ex);
    }
}
