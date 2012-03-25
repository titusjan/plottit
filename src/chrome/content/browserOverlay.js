// Licensed under the MIT license. See license.txt for details


// Initializes plottit. Is called when the XUL window has loaded
Plottit.onLoad = function(event) {

    Plottit.initializeLoggers(true, 
        Application.prefs.get("extensions.plottit.logLevel").value,  
        Application.prefs.get("extensions.plottit.debugMode").value);
        
    Plottit.logger.info(' ---------------- Plottit loaded ----------------');
    Plottit.logger.trace('Plottit.onLoad -- begin');

    document.getElementById('plottit-scatter-plot-iframe').contentWindow.Plottit.logger = Plottit.logger;
    document.getElementById('plottit-scatter-plot-iframe').contentWindow.Plottit.fbLog  = Plottit.fbLog;

    // Test if the extension is executed for the first time.
    if (Application.extensions)  
        Plottit.onFirstRun(Application.extensions);     // Firefox 3
    else  
        Application.getExtensions(Plottit.onFirstRun);  // Firefox >= 4

    
    // Initialize state object
    Plottit.state = new Plottit.State(
        Application.prefs.get("extensions.plottit.plottitEnabled").value,     // plottitEnabled
        document.getElementById('plottit-comment-tree-column-local-date').getAttribute('format'),    // localDateFormat
        document.getElementById('plottit-comment-tree-column-utc-date').getAttribute('format'),      // utcDateFormat
        document.getElementById('plottit-treemap-size-menulist').value,      // treeMapSizeProperty
        Plottit.getHslConversionFunction(
            document.getElementById('plottit-treemap-color-menulist').value) // treeMapColorVariable
        );

    // Sets button tooltip text
    Plottit.setPlottitActive(Application.prefs.get("extensions.plottit.plottitEnabled").value);
        
    // Add existing tabs to the state because there won't be a tabOpen
    // event raised for them
    for (var idx = 0; idx < gBrowser.browsers.length; idx++) {
        var browser = gBrowser.getBrowserAtIndex(idx);
        var browserID = Plottit.state.addBrowser(browser);
        Plottit.state.setCurrentBrowser(browser); // we need to have a current browser
    }

    Plottit.scatterPlot = new Plottit.ScatterPlot('plottit-scatter-plot-iframe', 
        Plottit.getCheckboxValue(document.getElementById('plottit-scatter-axes-autoscale')), 
        document.getElementById('plottit-scatter-x-axis-menulist').getAttribute('value'), 
        document.getElementById('plottit-scatter-y-axis-menulist').getAttribute('value'), 
        parseFloat(document.getElementById('plottit-bin-width-menulist').value),
        0);

    Plottit.histogram = new Plottit.ScatterPlot('plottit-histogram-iframe', 
        Plottit.getCheckboxValue(document.getElementById('plottit-histogram-axes-autoscale')), 
        document.getElementById('plottit-histogram-x-axis-menulist').getAttribute('value'), 
        '',
        parseFloat(document.getElementById('plottit-bin-width-menulist').value));
        
    
    var treeMapIframe = document.getElementById('plottit-treemap-frame');
    //var tmDiv = treeMapIframe.contentWindow.wrappedJSObject.getElementById('tm-div');
    var tmDiv = treeMapIframe.contentWindow.document.getElementById('tm-div');
    Plottit.treeMap = new Plottit.TreeMap(tmDiv, 3, !Plottit.commentTreeStructureIsFlat()); // mode depends on if comment tree is flat
    Plottit.onResizeTreeMap(); // resize to fill the complete iframe
    
    var commentTree = document.getElementById('plottit-comment-tree');
    commentTree.view = Plottit.state.getCurrentTreeView();
    
    // Add event handlers 
    treeMapIframe.addEventListener("resize", Plottit.onResizeTreeMap, false);
    
    commentTree.addEventListener("select", Plottit.onRowSelect, false);
    commentTree.addEventListener("PlottitTreeViewExpandCollapseEvent", Plottit.onRowExpandOrCollapse, false);
        
    var container = gBrowser.tabContainer;
    container.addEventListener("TabOpen", Plottit.onTabOpen, false);
    container.addEventListener("TabClose", Plottit.onTabClose, false);
    container.addEventListener("TabSelect", Plottit.onTabSelect, false);

    gBrowser.addEventListener('DOMContentLoaded', Plottit.onPageLoad, false); 
    
    // See: https://developer.mozilla.org/en/Code_snippets/Interaction_between_privileged_and_non-privileged_pages
    window.addEventListener('PlottitPlotClickedEvent', Plottit.onScatterPlotClicked, false, true); 
    window.addEventListener('PlottitTreeMapClickedEvent', Plottit.onTreeMapClicked, false, true); 

    // Remove event that got us here in the first place
    window.removeEventListener('load', Plottit.onLoad, true);

    window.addEventListener('unload', Plottit.onUnload, false); // capture is false (otherwise we get also subwindows unloads)

    Plottit.logger.trace('Plottit.onLoad -- end');
};


Plottit.onFirstRun = function (extensions) {
    let extension = extensions.get('plottit@titusjan.com');  
    if (extension.firstRun) {  
        Plottit.logger.info("Plottit runs for the first time");
        Plottit.installToolbarButtonAtEnd('nav-bar', 'plottit-toggle-active-button');
    } else {
        Plottit.logger.debug("Plottit runs for the nth time");
    }
}  

Plottit.onUnload = function(event) {
    Plottit.logger.trace("Plottit.onUnload -- "); 

    Plottit.treeMap.destruct();
    window.removeEventListener('unload', Plottit.onUnload, false);
    
    window.removeEventListener('PlottitTreeMapClickedEvent', Plottit.onTreeMapClicked, false, true);     
    window.removeEventListener('PlottitPlotClickedEvent', Plottit.onScatterPlotClicked, false, true); 
    gBrowser.removeEventListener('DOMContentLoaded', Plottit.onPageLoad, false); 

    var container = gBrowser.tabContainer;
    container.removeEventListener("TabSelect", Plottit.onTabSelect, false);
    container.removeEventListener("TabClose", Plottit.onTabClose, false);
    container.removeEventListener("TabOpen", Plottit.onTabOpen, false);

    var commentTree = document.getElementById('plottit-comment-tree');
    commentTree.removeEventListener("PlottitTreeViewExpandCollapseEvent", Plottit.onRowExpandOrCollapse, false);
    commentTree.removeEventListener("select", Plottit.onRowSelect, false);

    var treeMapIframe = document.getElementById('plottit-treemap-frame');
    treeMapIframe.removeEventListener("resize", Plottit.onResizeTreeMap, false);

    Plottit.logger.trace("Plottit.onUnload done "); 
}


 
/* doesn't work
Plottit.onTreeDoubleClick = function(event) {
    Plottit.logger.trace("Plottit.onRowDoubleClick -- ");
    // onTreeDoubleClick and onRowselect can both occur when a new row is double-clicked.
    // Disable expand collapse. Reserving event for future use.
    event.preventDefault();
    event.stopPropagation();
}*/


// Selects comment and possibly collapses/expands.
// (set collapsed to null to it this unchanged).
// Always makes the comment visible by expanding the path to it!.
Plottit.selectAndExpandOrCollapseComment = function(selectedComment, expand, scrollRedditPage) {
    Plottit.logger.trace("Plottit.selectAndExpandOrCollapseComment -- ");

    var curState = Plottit.state.getCurrentBrowserState();
    var makeVisible = true; // ALWAYS MAKE COMMENT VISIBLE BY EXPANDING PATH TO IT
    curState.treeView.expandOrCollapseComment(selectedComment, expand, makeVisible); // Must be before selection
    curState.selectedComment = selectedComment;
    
    Plottit.updateViewsForCurrentSelection(scrollRedditPage);
}

// Update tree, comment pane, plots selection.
Plottit.updateViewsForCurrentSelection = function(scrollRedditPage) {
    Plottit.logger.trace("Plottit.updateViewsForCurrentSelection -- ");

    var curState = Plottit.state.getCurrentBrowserState();
    var selectedComment = curState.selectedComment;
    var selectedCommentId = selectedComment ? selectedComment.id : null;
    var expand =  Plottit.commentTreeStructureIsFlat() || (selectedComment ? (selectedComment.isOpen) : null);
    
    curState.treeView.selectComment(selectedComment);
    Plottit.setDetailsFrameHtml(selectedComment ? selectedComment.bodyHtml : '');
    Plottit.scatterPlot.highlight(selectedCommentId);
    Plottit.treeMap.highlight(selectedCommentId, expand);
    Plottit.selectCommentInRedditPage(selectedComment, curState.previousSelectedComment, scrollRedditPage);

}



Plottit.onRowSelect = function(event) {
    Plottit.logger.trace("Plottit.onRowSelect -- ");
    
    // Get current selected row (TODO: use treeview.selection object?)
    var curState = Plottit.state.getCurrentBrowserState();
    var selectedIndex = document.getElementById('plottit-comment-tree').currentIndex;  // Can be -1 when none selected
    var selectedComment = curState.treeView.visibleComments[selectedIndex]; // Can be undefined if idx = -1
    
    if (selectedComment == curState.selectedComment) {
        return; // comment already selected.
    }
    
    if (selectedComment) {  // selectedComment can be false, e.g. when you click on the headers
        Plottit.selectAndExpandOrCollapseComment(selectedComment, null, true); 
    }
}

Plottit.onRowExpandOrCollapse = function(event) {
    Plottit.logger.trace("Plottit.onRowExpandOrCollapse -- ");
    
    var curState = Plottit.state.getCurrentBrowserState();
    if (event.comment ==  curState.selectedComment) {
        // Only update when the expanded node is actually selected.
        Plottit.updateViewsForCurrentSelection(false); 
    }
    
    if (true) { // TODO: configuration option?
        Plottit.expandOrCollapseRedditComment(event.comment, event.comment.isOpen);
    }
        
}


Plottit.onCommentTreeBlur = function(event) {
    Plottit.logger.trace("Plottit.onCommentTreeBlur -- ");
    Plottit.selectAndExpandOrCollapseComment(null, null, true);
}


Plottit.onScatterPlotClicked = function(event) {
    Plottit.logger.trace("Plottit.onScatterPlotClicked -- ");
    
    var commentId = Plottit.scatterPlot.flotWrapper.highlightedId;
    var discussion = Plottit.state.getCurrentBrowserDiscussion();
    var selectedComment = discussion.getCommentById(commentId);
    Plottit.selectAndExpandOrCollapseComment(selectedComment, null, true);
    document.getElementById('plottit-comment-tree').focus(); // Set focus to comment tree;
}


Plottit.onTreeMapClicked = function(event) {
    Plottit.logger.trace("Plottit.onTreeMapClicked -- ");

    // Test origin of the event; only update the treemap of Plottit, not from e.g. a test page.
    if (event.originalTarget.id == 'tm-div-overlay') {
        var commentId = Plottit.treeMap.selectedNodeBaseId;
        var discussion = Plottit.state.getCurrentBrowserDiscussion();
        var selectedComment = discussion.getCommentById(commentId);
        
        Plottit.selectAndExpandOrCollapseComment(selectedComment, !Plottit.treeMap.selectedNodeIsGroup, true);
        document.getElementById('plottit-comment-tree').focus(); // Set focus to comment tree;
    }
}


Plottit.onRedditPageClicked = function(event) {
    Plottit.logger.trace("Plottit.onRedditPageClicked -- ");
    
    var $ = content.wrappedJSObject.jQuery;
    if ($ && Plottit.state.plottitEnabled) { // e.g. no jQuery when page is only a .json file

        var target = $(event.target);
        var thing = target.parents('.thing:first');
        var div = thing.get(0);
        
        // Find class containing the ID
        var commentId = null;
        var expand = null;
        if (div) {
            for (let [idx, cls] in Iterator(div.classList)) {
                if (cls.substr(0, 6) == 'id-t1_') {
                    commentId = cls.substr(6);
                    break;
                }
            }
            var display = thing.find('.noncollapsed:first').css('display');
            expand = (display == 'block');
        }
        var discussion = Plottit.state.getCurrentBrowserDiscussion();
        var selectedComment = discussion.getCommentById(commentId);
        Plottit.selectAndExpandOrCollapseComment(selectedComment, expand, false);        
    }
}


Plottit.onTabOpen = function(event) {
    Plottit.logger.trace("Plottit.onTabOpen -- ");
    
    var browser = gBrowser.getBrowserForTab(event.target);
    var browserID = Plottit.state.addBrowser(browser);
}

Plottit.onTabClose = function(event) {
    Plottit.logger.trace("Plottit.onTabClose -- ");
    
    var browser = gBrowser.getBrowserForTab(event.target);
    var browserID = Plottit.state.removeBrowser(browser);
}

Plottit.onTabSelect = function(event) {
    Plottit.logger.trace("Plottit.onTabSelect -- ");
    
    var browser = gBrowser.getBrowserForTab(event.target);
    var browserID = Plottit.state.setCurrentBrowser(browser);
    
    var commentTree = document.getElementById('plottit-comment-tree');
    commentTree.view = Plottit.state.getCurrentTreeView();    
    
    Plottit.updateAllViews(Plottit.state, browserID);
}

Plottit.onDetailsTabSelect = function(event) {
    Plottit.logger.trace("Plottit.onDetailsTabSelect -- ");
    Plottit.updateAllViews(Plottit.state, Plottit.state.getCurrentBrowserID());
}
 
Plottit.setTreeColsSplittersResizeBehaviour = function(event) {
    Plottit.logger.trace("Plottit.setTreeColsSplittersResizeBehaviour -- ");
    
    // Afwul hack to make set the resizebefore and resizeafter attributes of the tree splitters
    // All splitters left of the body column have resizebefore='closest' and resizeafter = 'flex'
    // All splitters left of the body column have resizebefore='flex' and resizeafter = 'closest'
    // Currently executed onmouse down.
    
    var treeCols = event.target.parentNode;
    var bodyColumn = document.getElementById('plottit-comment-tree-column-body');
    
    for(let [idx, childNode] in Iterator(treeCols.childNodes)) {
        if (childNode.tagName == 'splitter') {
            var splitter = childNode;
            if (childNode.boxObject.screenX <= bodyColumn.boxObject.screenX) {
                splitter.setAttribute('resizebefore', 'closest');
                splitter.setAttribute('resizeafter',  'flex');
            } else {
                splitter.setAttribute('resizebefore', 'flex');
                splitter.setAttribute('resizeafter',  'closest');
            }
        }
    }
}

Plottit.onClickTreeHeader = function(event) {
    Plottit.logger.trace("Plottit.onClickTreeHeader -- ");

    if (event.button != 0) return; // Only left mouse button
    
    var column = event.originalTarget;
    var commentTree = document.getElementById('plottit-comment-tree');
    var oldSortResource = commentTree.getAttribute('sortResource');
    var oldColumn = document.getElementById(oldSortResource);
    var oldSortDirection = commentTree.getAttribute('sortDirection');
   
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
    
    var structure = document.getElementById('plottit-comment-tree-column-body').getAttribute('structure');
    Plottit.state.getCurrentTreeView().setDiscussionSorted(column.id, newSortDirection, structure);
    Plottit.ensureCurrentRowVisible();
    
    // Set after actual sorting for easier dection of error in during sort
    commentTree.setAttribute('sortDirection', newSortDirection);
    commentTree.setAttribute('sortResource', newSortResource);
    column.setAttribute('sortDirection', newSortDirection);
    Plottit.logger.trace("Plottit.onClickTreeHeader done ");
}



Plottit.onClickCommentTreeHeader = function(event) {
    Plottit.logger.trace("Plottit.onClickCommentTreeHeader -- ");
    
    if (event.button != 0) return; // Only left mouse button
    
    var column = event.originalTarget;
    var oldStructure = column.getAttribute('structure');
    var newStructure = (oldStructure == 'tree') ? 'flat' : 'tree';  

    column.setAttribute('structure', newStructure);
    var headerLabel = (newStructure == 'tree') ?
        document.getElementById('plottit-string-bundle').getString('plottit.comments.asTree') :
        document.getElementById('plottit-string-bundle').getString('plottit.comments.asList');
    column.setAttribute('label', headerLabel);
    
    var curTreeView = Plottit.state.getCurrentTreeView();
    curTreeView.setStructure(newStructure);
    
    // Sort and set comments in score tree
    var commentTree = document.getElementById('plottit-comment-tree');
    var sortResource = commentTree.getAttribute('sortResource');
    var sortDirection = commentTree.getAttribute('sortDirection');
    
    // Set treemap mode so that only parent is returned on repeat select in tree mode
    Plottit.treeMap.returnParentOnRepeatSelectMode = (newStructure == 'tree');

    curTreeView.setDiscussionSorted(sortResource, sortDirection, newStructure);
    Plottit.ensureCurrentRowVisible();
    
    Plottit.logger.trace("Plottit.onClickCommentTreeHeader done ");
}


Plottit.commentTreeStructureIsFlat = function() {
    var structure = document.getElementById('plottit-comment-tree-column-body').getAttribute('structure');
    Plottit.assert(structure == 'flat' || structure == 'tree', 
        "Invalid tree structure: " + structure);
    return structure == 'flat';
}


Plottit.setTreeColumnDateFormat = function (event) {
    Plottit.logger.trace("Plottit.setTreeColumnDateFormat -- ");
  
    var format = event.target.value;
    var column = document.popupNode; 

    var key;
    switch (column.id) {
        case 'plottit-comment-tree-column-local-date':
            key = ['localDateFormat'];
            Plottit.state.setLocalDateFormat(format);
            break;
        case 'plottit-comment-tree-column-utc-date':
            key = ['utcDateFormat'];
            Plottit.state.setUtcDateFormat(format);
            break;
        default:
            Plottit.assert(false, "Invalid column ID: " + column.id);
    } // switch
    
    // Set attribute for persistence
    column.setAttribute('format', format);
    
    // Force repainting of the column;
    var treeBoxColumns = Plottit.getTreeBoxObject('plottit-comment-tree').columns;
    var nsiTreeColumn = treeBoxColumns.getNamedColumn(column.id);
    Plottit.getTreeBoxObject('plottit-comment-tree').invalidateColumn(nsiTreeColumn);        
    
    Plottit.logger.trace("Plottit.setTreeColumnDateFormat done ");    
}

// Sets the check mark depending on which column is the context of the date-format popup
Plottit.onDateFormatPopupShowing = function(menu) {
    Plottit.logger.trace("Plottit.onDateFormatPopupShowing -- ");   

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
Plottit.getRootHtmlDocument = function(doc) { 

    if (doc.defaultView.frameElement) { 
        // Frame within a tab was loaded, find the root document:
        while (doc.defaultView.frameElement) {
            doc = doc.defaultView.frameElement.ownerDocument;
        }
    }
    return doc;
}

// Updates binWidth drop down box
Plottit.showHideBinWidths = function (histo, menuListId) {

    return false; // not yet impelemented.
    var binWidthMenuList = document.getElementById(menuListId);
    
    Plottit.logger.debug("Update binWidth drop down box, axisVar: " + histo._removeHistPrefix(histo.xAxisVariable));
    
    var isTime = (Plottit.ScatterPlot.VAR_AXIS_OPTIONS[histo._removeHistPrefix(histo.xAxisVariable)].mode == 'time');
    Plottit.logger.debug("Plottit.ScatterPlot.showHideBinWidths -- isTime: " + isTime);
}



Plottit.RE_ISJSON   = /\.json$/i      // String ends with '.json' 
Plottit.RE_ISLOCAL  = /^file:\/\//i   // String begins with 'file://'
Plottit.RE_ISREDDIT = /www\.reddit\.com\/r\/.*\/comments\// 

Plottit.onPageLoad = function(event) {
    Plottit.logger.trace("Plottit.onPageLoad");

    var doc = event.originalTarget;
    if (!(doc instanceof HTMLDocument)) return;
    
    var pageURL = doc.URL;
    var browser = gBrowser.getBrowserForDocument(doc);
    if (browser == null) {
        // Happens when document is not the root; with iFrames (e.g.: www.redditmedia.com/ads)
        Plottit.logger.debug("Plottit.onPageLoad: no browser for URL: " + pageURL);
        return;
    }

    var browserID = browser.getAttribute("PlottitBrowserID");
    var browserState = Plottit.state.browserStates[browserID];
    browserState.setStatus(Plottit.PAGE_NOT_PLOTTIT);
    
    var host = pageURL.split('?')[0];
    var isRedditPage = Plottit.RE_ISREDDIT.test(host);
    var isJsonPage   = Plottit.RE_ISJSON.test(host);
    var isLocalPage  = Plottit.RE_ISLOCAL.test(host) 

    if ( isRedditPage && !isJsonPage) {
        // A reddit html page, the json will be loaded with AJAX
        Plottit.logger.info("Plottit.onPageLoad (reddit discussion): URL: " + pageURL);

        // Append plottit css style to reddit page (so we can highlight selected comment)
        var $ = doc.defaultView.wrappedJSObject.jQuery;
        var styleElem = $(Plottit.SELECTED_ROW_STYLE);
        $('head').append(styleElem);
        
        // When the document is clicked we call ...
        var documentWindow = doc.defaultView.wrappedJSObject.window
        documentWindow.addEventListener('click', Plottit.onRedditPageClicked, false, true); 
       
        // Clean up onclick event handler
        event.originalTarget.defaultView.addEventListener("unload", 
            function(event) { 
                documentWindow.addEventListener('click', Plottit.onRedditPageClicked, false, true); 
            }, 
            true); 
        
        if (Plottit.state.plottitEnabled) {
            browserState.setStatus(Plottit.PAGE_LOADING);
            Plottit.ajaxRequestJsonPage(pageURL, browser);
        } else {
            browserState.setStatus(Plottit.PAGE_POSTPONED);
        }
        Plottit.updateAllViews(Plottit.state, browserID);
        Plottit.logger.trace("Plottit.onPageLoad done");
        return;
        
    } else if ( isJsonPage && (isRedditPage || isLocalPage)) {
        // A JSON page, either from reddit.com or local; process directly
        Plottit.logger.info("Plottit.onPageLoad (.JSON): URL: " + pageURL);

        var rootDoc = Plottit.getRootHtmlDocument(doc);
        if (pageURL != rootDoc.URL) {
            Plottit.updateAllViews(Plottit.state, browserID);
            return;
        }
        doc = null; // to prevent mistakes
        
        var body = Plottit.safeGet(rootDoc, 'body');
        var textContent = Plottit.safeGet(body, 'textContent');
    
        if (!textContent) {
            Plottit.logger.debug("No body.textContent found, URL: " + rootDoc.URL);
            Plottit.updateAllViews(Plottit.state, browserID);
            return;
        } 
        
        Plottit.processJsonPage(textContent, browser, rootDoc.URL);
        browserState.setStatus(Plottit.PAGE_READY);
        Plottit.updateAllViews(Plottit.state, browserID);
        return;
        
    } else {
        // All other cases; page to be ignored by Plottit 
        Plottit.logger.debug("Page ignored by Plottit (ignored), URL: " + pageURL);    
        Plottit.updateAllViews(Plottit.state, browserID); // Will hide pannels
        return;
    }
}    

Plottit.ajaxRequestJsonPage = function (pageURL, browser) {

    Plottit.logger.trace("Plottit.ajaxRequestJsonPage: " + pageURL);
    
    // Make AJAX request for corresponding JSON page.
    var jsonURL = Plottit.addJsonToRedditUrl(pageURL);
    var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                  .createInstance(Components.interfaces.nsIXMLHttpRequest);
                  
    request.onload = function(aEvent) {
        try {    
            Plottit.logger.debug("XMLHttpRequest.onload, URL: " + jsonURL);
            Plottit.processJsonPage(aEvent.target.responseText, browser, jsonURL);    
        } catch (ex) {
            Plottit.logger.error('Exception in Plottit. XMLHttpRequest.onload;');
            Plottit.logException(ex);
        }
    };
    
    request.onerror = function(aEvent) {
        Plottit.logger.error("XMLHttpRequest.onerror, URL: " + jsonURL)
        Plottit.logger.error("Error status: " + aEvent.target.status);
    };

    request.open("GET", jsonURL, true);
    request.send(null);      
}


Plottit.processJsonPage = function (jsonContent, browser, url) {
    Plottit.logger.trace("Plottit.processJsonPage -- ");

    try {
        var browserID = browser.getAttribute("PlottitBrowserID");
        var page = JSON.parse(jsonContent); // Parse content
        Plottit.logger.debug('Successfully parsed JSON page for: ' + url);
        var discussion = Plottit.getPlottitDiscussionFromPage(page);
        Plottit.state.setBrowserDiscussion(browserID, discussion);
        
        var browserState = Plottit.state.browserStates[browserID];
        browserState.setStatus(Plottit.PAGE_READY);
        Plottit.updateAllViews(Plottit.state, browserID);
       
    } catch (ex) {
        Plottit.logger.error('Failed processing JSON: ' + url.toString());
        Plottit.logException(ex);
    }
}

Plottit.addJsonToRedditUrl = function(url) {

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


Plottit.setDetailsFrameHtml = function(html) {
    Plottit.logger.trace('setDetailsFrameHtml: ' + html);

    var detailsFrame = document.getElementById('plottit-comment-html-iframe');
    var docBody = detailsFrame.contentDocument.body;

    // First delete the contents of the details frame html body.
    while (docBody.firstChild) {
        docBody.removeChild(docBody.firstChild);
    }
    
    var scriptableUnescapeHTML = Components.classes["@mozilla.org/feed-unescapehtml;1"]
                                 .getService(Components.interfaces.nsIScriptableUnescapeHTML);
    try { 
        var fragment = scriptableUnescapeHTML.parseFragment(html, false, null, docBody); 
        docBody.appendChild(fragment);
    } catch (ex) {
        docBody.appendChild(detailsFrame.contentDocument.
            createTextNode('Unable to parse comment HTML'));
        Plottit.logger.error('Failed parsing comment Html: ' + html);
        Plottit.logException(ex);
    }
}

// Updates all views using the application state
Plottit.updateAllViews = function(state, eventBrowserID) {
    Plottit.logger.trace("Plottit.updateAllViews -- ");
    
    if ( !Plottit.state.plottitEnabled) {
        Plottit.setPlottitVisible(false);
        return;
    }

    // Only update if the events applies to the current browser
    if (eventBrowserID != Plottit.state.getCurrentBrowserID()) {
        Plottit.logger.debug('Browser not the current browser (ignored): ' + eventBrowserID);
        return;
    }

    var curState = Plottit.state.getCurrentBrowserState();
    switch (curState.pageStatus) {
        case Plottit.PAGE_NOT_PLOTTIT:
            if (true) {
                Plottit.setPlottitVisible(false);
            } else { // Debugging
                Plottit.showDescription('The current page is not a reddit discussion');
                Plottit.scatterPlot.display(false);
                Plottit.histogram.display(false);
                curState.removeDiscussion();
            }
            break;
        case Plottit.PAGE_POSTPONED:
            Plottit.setPlottitVisible(true);
            Plottit.showDescription('(Postponed) comments loading...');
            Plottit.scatterPlot.display(false);
            Plottit.histogram.display(false);
            curState.removeDiscussion();
            Plottit.setPlottitVisible(true);
            
            // Page loading was postponed... until now.
            // Load the comments via ajax.
            var browserState = Plottit.state.getCurrentBrowserState()
            browserState.setStatus(Plottit.PAGE_LOADING);
            var browser = browserState.browser;
            Plottit.ajaxRequestJsonPage(browser.currentURI.asciiSpec, browser);
            break;
        case Plottit.PAGE_LOADING:
            Plottit.setPlottitVisible(true);
            Plottit.showDescription('Loading comments...');
            Plottit.scatterPlot.display(false);
            Plottit.histogram.display(false);
            curState.removeDiscussion();
            break;
        case Plottit.PAGE_READY:
            Plottit.setPlottitVisible(true);
            Plottit.hideDescription();
            var discussion = Plottit.state.getBrowserDiscussion(eventBrowserID);
            Plottit.scatterPlot.display(true);
            Plottit.histogram.display(true);
            
            // Sort and set comments in comment tree
            var commentTree = document.getElementById('plottit-comment-tree');
            var sortResource = commentTree.getAttribute('sortResource');
            var sortDirection = commentTree.getAttribute('sortDirection');
            var structure = document.getElementById('plottit-comment-tree-column-body').getAttribute('structure');
            
            var column = document.getElementById(sortResource);
            column.setAttribute('sortDirection', sortDirection);
            
            curState.treeView.setDiscussionSorted(column.id, sortDirection, structure, discussion);
            Plottit.ensureCurrentRowVisible();
            
            // Update the visible details pane
            var tabPanels = document.getElementById('plottit-tabpanels');
            var selectedPanelId = tabPanels.selectedPanel.id;

            switch (selectedPanelId) // only update the visible tab
            {
                case 'plottit-comment-tab': 
                    var selectedComment = curState.selectedComment;
                    Plottit.setDetailsFrameHtml(selectedComment ? selectedComment.bodyHtml : '');
                    break;
                case 'plottit-plot-tab': 
                    Plottit.scatterPlot.setDiscussion(discussion);
                    break;
                case 'plottit-histogram-tab': 
                    Plottit.histogram.setDiscussion(discussion);
                    break;
                case 'plottit-treemap-tab': 
                    Plottit.setTreeMapDiscussion(discussion);
                    break;
                default:
                    Plottit.assert(false, 'Invalid panelId: ' + selectedPanelId);
            } // switch
            
            this.updateViewsForCurrentSelection(true);
            
            break;
        default:
            Plottit.assert(false, "Invalid pageStatus: " + curState.pageStatus);
    } // switch
}

Plottit.setPlottitVisible = function (visible) {

    var deck = document.getElementById('plottit-messages-deck');
    var splitter = document.getElementById('plottit-content-splitter');
    deck.hidden = !visible;
    splitter.hidden = !visible;
}

Plottit.onRenderTreeMapTimeOut = function() {

    Plottit.logger.trace("Plottit.drawTreeMapCushionedAfterTimeOut: " + Plottit.globalTimeOutId);
    
    var sliderH0   = document.getElementById("plottit-treemap-scale-h0").value / 1000;
    var sliderF    = document.getElementById("plottit-treemap-scale-f").value / 1000;
    var sliderIamb = document.getElementById("plottit-treemap-scale-iamb").value / 1000;
    //var sliderH0   = 1.2;
    //var sliderF    = 2.5;
    //var sliderIamb = 0.12;
    Plottit.logger.debug("Plottit.drawTreeMapCushionedAfterTimeOut, H0: " + 
        sliderH0 + ', F: ' + sliderF + ', Iamb: ' + sliderIamb);
    
    Plottit.treeMap.renderCushioned(sliderH0, sliderF, sliderIamb);
    Plottit.globalTimeOutId = null;
}

Plottit.renderTreeMap = function(cushionDelay) {

    var isCushioned = Plottit.getCheckboxValue(document.getElementById('plottit-treemap-cushions-checkbox'));
    if (cushionDelay == null)  cushionDelay = 250;
    if ( ! ((cushionDelay === 0) && isCushioned) ) { // skip flat rendering if there is no cushion delay
        Plottit.treeMap.renderFlat();
    }
    
    if (isCushioned) {
        if (Plottit.globalTimeOutId) {
            window.clearTimeout(Plottit.globalTimeOutId); // Cancel previous time out;
        }
        Plottit.globalTimeOutId = window.setTimeout( 
            function () { Plottit.onRenderTreeMapTimeOut() }, // use function expression for validator
            cushionDelay);
    }
}


Plottit.onResizeTreeMap = function(event) {
    Plottit.logger.trace("Plottit.onResizeTreeMap");

    var treeMapFrame = document.getElementById('plottit-treemap-frame');
    Plottit.treeMap.resize(0, 0,
        treeMapFrame.contentWindow.innerWidth, 
        treeMapFrame.contentWindow.innerHeight);        
            
    Plottit.renderTreeMap();
}

Plottit.setTreeMapDiscussion = function(discussion) {
    Plottit.logger.trace("Plottit.setTreeMapDiscussion --");
    
    Plottit.treeMap.setDataFromDiscussion(discussion,
        Plottit.state.treeMapSizeProperty,
        Plottit.state.fnHslOfComment);

    Plottit.renderTreeMap()
}


Plottit.setTreeMapSizeProperty = function(menuList) {
    Plottit.logger.trace("Plottit.setTreeMapSizeProperty: " + menuList.value);

    Plottit.state.treeMapSizeProperty = menuList.value;
    Plottit.setTreeMapDiscussion(Plottit.state.getCurrentBrowserDiscussion());
}


// create Conversion functions that calculate a HSL triplet belonging to a comment.
Plottit.getHslConversionFunction = function (varId) {

    // Create function that maps v in [vMin, vMax] to y in [yMin, yMax]
    function getMapV(vMin, vMax, yMin, yMax) {
        return function(v) {
            var vNorm = (v - vMin) / (vMax - vMin);  // vNorm lies between 0 and 1 if v lies between vMin and vMax
            vNorm = Math.max(0, Math.min(1, vNorm)); // Force vNorm to be between 0 and 1
            return vNorm * (yMax - yMin) + yMin;
        }
    }

    var SAT_MAX = 0.8; // Maximum saturation to keep look and feel classy :-)

    var HUE_ORANGE_RED =  16 / 360;
    var HUE_BLUE       = 240 / 360;
    var HUE_GREEN      = 120 / 360;
    var HUE_MAGENTA    = 300 / 360;

    var SAT_RAINBOW       = SAT_MAX;      // Saturation used for rainbow color scales.
    //var HUE_RAINBOW_START = 0.59861;   // Darkish blue
    //var HUE_RAINBOW_RANGE = 11/12;     // Part of the complete hue-circle used in rainbow color scales.
    var HUE_RAINBOW_START = HUE_BLUE;   // Blue
    var HUE_RAINBOW_RANGE = 4/6;     // Part of the complete hue-circle used in rainbow color scales.
    
    //// For tweaking colors
    //HUE_RAINBOW_START = HUE_BLUE - document.getElementById("plottit-treemap-scale-h0").value / 3000 * 30 / 360 ;
    //SAT_RAINBOW       = document.getElementById("plottit-treemap-scale-f").value / 4000 ;
    //Plottit.logger.debug('HUE_RAINBOW_START: ' + HUE_RAINBOW_START + ', SAT_RAINBOW: ' + SAT_RAINBOW);
    
    var HUE_LOG    = HUE_GREEN;
    var HUE_LINEAR = HUE_MAGENTA;
    var HUE_UPS    = HUE_ORANGE_RED;
    var HUE_DOWNS  = HUE_BLUE;
    
    var SAT_LOG     = SAT_MAX;
    var SAT_LINEAR  = SAT_MAX;
    var SAT_UPS     = SAT_MAX;
    var SAT_DOWNS   = 0.8 * SAT_MAX;  // Downvote blue color on reddit is less saturated

    switch (varId) 
    {
        case 'none': return function(comment) { 
            return [0, 0, 1]; // always grey
        };
        case 'depth': return function(comment) {
            var mapFn = getMapV(0, 10, HUE_RAINBOW_START, HUE_RAINBOW_START - HUE_RAINBOW_RANGE);
            return [mapFn(comment.depth) % 1, SAT_RAINBOW, 1];
            //var mapFn = getMapV(1, 10, 0, SAT_LINEAR); 
            //return [HUE_LINEAR, mapFn(comment.depth), 1];
        }; 
        case 'score': return function(comment) { 
            var mapFnPos = getMapV(0, 3, 0, SAT_UPS);         // truncate at 10^3
            var mapFnNeg = getMapV(0, 3, 0, SAT_DOWNS); // truncate at 10^3 
            if (comment.score == 0) {
                return [0, 0, 1];
            } else if (comment.score > 0) {
                return [HUE_UPS, mapFnPos(Plottit.log10(comment.score)), 1];
            } else {
                return [HUE_DOWNS, mapFnNeg(Plottit.log10(-comment.score)), 1];
            }
        };
        case 'ups': return function(comment) { 
            var mapFn = getMapV(0, 3, 0, SAT_UPS);  // truncate at 10^3
            return [HUE_UPS, mapFn(Plottit.log10(comment.ups)), 1];
        };
        case 'downs': return function(comment) { 
            var mapFn = getMapV(0, 3, 0, SAT_DOWNS); // truncate at 10^3 
            return [HUE_DOWNS, mapFn(Plottit.log10(comment.downs)), 1];
        };
        case 'votes': return function(comment) { 
            var mapFn = getMapV(0, 3, 0, SAT_LOG);  // truncate at 2*10^3
            return [HUE_LOG, mapFn(Plottit.log10(comment.votes/2)), 1];
        };
        case 'likesPerc': return function(comment) { 
            var mapFnNeg = getMapV( 0,  50, 0, SAT_DOWNS);
            var mapFnPos = getMapV(50, 100, 0, SAT_UPS);
            if (comment.likesPerc <= 50) {
                return [HUE_DOWNS, mapFnNeg(comment.likesPerc), 1];
            } else {
                return [HUE_UPS, mapFnPos(comment.likesPerc), 1];
            }
        };
        case 'controversial': return function(comment) { 
            var mapFn = getMapV(1, 10, 0, SAT_LINEAR);  // 
            return [HUE_LINEAR, mapFn(comment.controversial), 1];
        };
        case 'bestPerc': return function(comment) { 
            var mapFnNeg = getMapV( 0,  50, 0, SAT_DOWNS);
            var mapFnPos = getMapV(50, 100, 0, SAT_UPS);
            if (comment.bestPerc <= 50) {
                return [HUE_DOWNS, mapFnNeg(comment.bestPerc), 1];
            } else {
                return [HUE_UPS, mapFnPos(comment.bestPerc), 1];
            }            
        };        
        case 'numChars': return function(comment) { 
            var mapFn = getMapV(0, 1000, 0, SAT_LINEAR); 
            return [HUE_LINEAR, mapFn(comment.numChars), 1];
        };
        case 'numWords': return function(comment) { 
            var mapFn = getMapV(0, 200, 0, SAT_LINEAR);  // 
            return [HUE_LINEAR, mapFn(comment.numWords), 1];
        };
        case 'numReplies': return function(comment) { 
            //var mapFn = getMapV(0, 20, HUE_RAINBOW_START, HUE_RAINBOW_START - HUE_RAINBOW_RANGE);
            //return [mapFn(comment.numReplies) % 1, SAT_RAINBOW, 1];
            var mapFn = getMapV(0, 10, 0, SAT_LINEAR); 
            return [HUE_LINEAR, mapFn(comment.numReplies), 1];
        };
        case 'postedAfter': return function(comment) { 
            var mapFn = getMapV(0, 24*3600000, 1+HUE_BLUE, 1+HUE_BLUE - 8/12);
            return [mapFn(comment.postedAfter ) % 1, SAT_RAINBOW, 1];
            
            //var mapFn = getMapV(0, 1000, 0, SAT_LINEAR); 
            //return [HUE_LINEAR, mapFn(comment.postedAfter / 24 / 3600 ), 1];
        };
        default:
            Plottit.assert(false, "Invalid varId: " + varId);
    } // switch
}

Plottit.setTreeMapColorProperty = function(menuList) {
    Plottit.logger.trace("Plottit.setTreeMapColorProperty: " + menuList.value);

    Plottit.state.fnHslOfComment = Plottit.getHslConversionFunction(menuList.value);
    Plottit.setTreeMapDiscussion(Plottit.state.getCurrentBrowserDiscussion());
}
    

Plottit.showDescription = function(msg) {
    var deck = document.getElementById('plottit-messages-deck');
    deck.selectedIndex = 0;
    var description = document.getElementById('plottit-messages-description');
    description.value = msg;
}

Plottit.hideDescription = function() {
    var deck = document.getElementById('plottit-messages-deck');
    deck.selectedIndex = 1;
    var description = document.getElementById('plottit-messages-description');
    description.value = "Plottit...";    
}

/*
Plottit.ensureCurrentRowVisible = function () {
    Plottit.logger.trace("Plottit.ensureCurrentRowVisible -- ");

    var curState = Plottit.state.getCurrentBrowserState();
    if (curState.selectedComment != null) {
        var selectedIndex = curState.treeView.indexOfVisibleComment(curState.selectedComment)
        if (curState.selectedComment.isOpen) {
            curState.treeView.expandRowByIndex(selectedIndex);
        } else {
            curState.treeView.collapseRowByIndex(selectedIndex);
        }
        curState.treeView.selection.select(selectedIndex);
        Plottit.getTreeBoxObject('plottit-comment-tree').ensureRowIsVisible(selectedIndex);
    }
}
*/

Plottit.ensureCurrentRowVisible = function () {
    Plottit.logger.trace("Plottit.ensureCurrentRowVisible -- ");
    Plottit.updateViewsForCurrentSelection(true);
}

Plottit.togglePlottitActive = function () {
    Plottit.logger.trace("Plottit.togglePlottitActive -- ");

    this.setPlottitActive( ! Plottit.state.plottitEnabled);
    Plottit.updateAllViews(Plottit.state, Plottit.state.getCurrentBrowserID());
}

Plottit.setPlottitActive = function (plottitEnabled) {
    Plottit.logger.info("Plottit.setPlottitActive: " + plottitEnabled);

    Plottit.state.plottitEnabled = plottitEnabled;
    Application.prefs.get("extensions.plottit.plottitEnabled").value = Plottit.state.plottitEnabled; 
    
    var toolbarButton = document.getElementById('plottit-toggle-active-button');
    if (toolbarButton) {
        toolbarButton.setAttribute('tooltiptext', plottitEnabled ? 
            document.getElementById('plottit-string-bundle').getString('plottit.disableProgram') :
            document.getElementById('plottit-string-bundle').getString('plottit.enableProgram'));
    }
}



// Style that will be added to reddit page to highlight selected comments.
Plottit.SELECTED_ROW_STYLE = "<style type='text/css'>"
    + "div.plottit-selected {background-color:#EFF7FF; outline:1px dashed #5F99CF}"
    + "</style>";
    

Plottit.selectCommentInRedditPage = function (selectedComment, prevSelectedComment, scrollToComment) {
    var $ = content.wrappedJSObject.jQuery;
    if ($) { // e.g. no jQuery when page is only a .json file
        var selectedCommentId = selectedComment ? selectedComment.id : null;
        if (prevSelectedComment !== null) {
            $('div.id-t1_' + prevSelectedComment.id + ' div.entry')
                .filter(':first').removeClass('plottit-selected');
        }
        var offset = $('div.id-t1_' + selectedCommentId)
                        .filter(':visible').find('div.entry:first')
                        .addClass('plottit-selected')
                        .offset();
        if (scrollToComment && offset) {
            $('html').stop().animate( { 'scrollTop' : (offset.top - 100)}, 'fast', 'linear');
        }
    }
}


Plottit.expandOrCollapseRedditComment = function(comment, expand) {
    Plottit.logger.trace("Plottit.expandOrCollapseRedditComment -- ");
    
    var $ = content.wrappedJSObject.jQuery;
    if ($) { // e.g. no jQuery when page is only a .json file
    
        if (expand) {
            // there can be 2 two expands: '[+]' and '1 child', we take the first.
            var anchor = $('div.id-t1_' + comment.id + ' .collapsed:first .expand:first'); 
            content.wrappedJSObject.showcomment(anchor);

        } else {
            var anchor = $('div.id-t1_' + comment.id + ' .noncollapsed:first .expand');
            content.wrappedJSObject.hidecomment(anchor);
        }
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

// Call Plottit.onLoad to intialize 
window.addEventListener('load', Plottit.onLoad, true);


///////////////////////////////////
//          DEBUGGING            //
///////////////////////////////////

Plottit.myDebugRoutine = function () {

    
    let stringBundle = document.getElementById('plottit-string-bundle');
    let message = stringBundle.getString('plottit.greeting');
    
    //bla = 5;
    
    try {
        Plottit.logger.error('Plottit.error');
        Plottit.logger.warn('Plottit.warning');
        Plottit.logger.info('Plottit.info');
        Plottit.logger.debug('Plottit.debug');
        Plottit.logger.trace('Plottit.trace');

        Plottit.fbLog('Plottit.debug');
        Plottit.fbLog(Plottit.state.summaryString());
        Plottit.fbLog(Application.prefs.get("extensions.plottit.plottitEnabled").value);
        
        Plottit.fbLog(window);
        
        Plottit.logger.error('LogLevel: ' + Plottit.logger.level);

        
    } catch (ex) {
        Plottit.logger.error('Exception in Plottit.debug;');
        Plottit.logException(ex);
    }
}
