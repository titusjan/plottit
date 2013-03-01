// Licensed under the MIT license. See license.txt for details

Plottit.PAGE_NOT_PLOTTIT  = 0; // Not a page plottit can process
Plottit.PAGE_POSTPONED   = 1; // Comments loading postponed
Plottit.PAGE_LOADING     = 2; // Loading JSON comments via AJAX
Plottit.PAGE_READY       = 3; // Comments loaded

//////////////////
// BrowserState //
//////////////////


// The state per browser (in the global browser object);
Plottit.BrowserState = function (browser, localDateFormat, utcDateFormat) { // Constructor

    this.browser = browser; // Keep track of the browser to which this state belongs
    this.pageStatus = Plottit.PAGE_NOT_PLOTTIT;
    this.treeView =  new Plottit.TreeView(localDateFormat, utcDateFormat);
    this._selectedComment = null; // The comment that is selected in the table
    this._previousSelectedComment = null;
    this.style_added = false;
}

Plottit.BrowserState.prototype.__defineGetter__("selectedComment", function() { return this._selectedComment} );
Plottit.BrowserState.prototype.__defineSetter__("selectedComment", function(v) { 
    this._previousSelectedComment = this._selectedComment;
    this._selectedComment = v;
} );
Plottit.BrowserState.prototype.__defineGetter__("previousSelectedComment", function() { return this._previousSelectedComment} );


Plottit.BrowserState.prototype.toString = function () {
    return "Plottit.BrowserState";
};

Plottit.BrowserState.prototype.summaryString = function () {
    return "Plottit.BrowserState: status=" + this.pageStatus 
        + ", comments=" + this.treeView.getComments().length 
        + ", selectedComment=" + (this.selectedComment ? this.selectedComment.id : this.selectedComment) ;
};

Plottit.BrowserState.prototype.removeDiscussion = function () {
    this.treeView.removeDiscussion();
    this.selectedComment = null;
};

Plottit.BrowserState.prototype.getStatus = function (status) {
    return this.pageStatus;
};

Plottit.BrowserState.prototype.setStatus = function (status) {
    this.pageStatus = status;
};

/*
*/
///////////
// State //
///////////

// The application state of Plottit (there will be one per XUL window).
Plottit.State = function (  // Constructor
        plottitEnabled, 
        localDateFormat, 
        utcDateFormat, 
        treeMapSizeProperty,
        fnHslOfComment) 
{ 

    this.plottitEnabled = plottitEnabled;
    this.currentBrowserID = null;
    this.nextBrowserID = 0;
    this.browserStates = {}
    
    this._localDateFormat = localDateFormat;
    this._utcDateFormat   = utcDateFormat;
    
    this.treeMapSizeProperty = treeMapSizeProperty;
    this.fnHslOfComment = fnHslOfComment;

}

Plottit.State.prototype.toString = function () {
    return "Plottit.State";
};


Plottit.State.prototype.summaryString = function () {
    return 'Enabled: ' + this.plottitEnabled + ', ' + 
        [ 'Tab ' + k + ': ' + (v.treeView.countComments()) for 
            each ([k,v] in Iterator(this.browserStates))];
};


Plottit.State.prototype.getCurrentBrowserID = function () {
    return this.currentBrowserID;
}

Plottit.State.prototype.setCurrentBrowser = function (browser) {
    Plottit.logger.trace("Plottit.State.setCurrentBrowser -- ");
    
    var browserID = browser.getAttribute("PlottitBrowserID");
    Plottit.assert(browserID, "Browser has no PlottitBrowserID");
    this.currentBrowserID = browserID;
    return browserID;
};

Plottit.State.prototype.addBrowser = function (browser) {
    Plottit.logger.trace("Plottit.State.addBrowser -- ");
    
    var browserID;
    if (browser.hasAttribute("PlottitBrowserID")) { // Test just in case
        browserID = browser.getAttribute("PlottitBrowserID");
        var msg = "Browser already has PlottitBrowserID attribute: " + browserID;
        Plottit.logger.error(msg);
        throw new Error(msg);
    } else {
        browserID = this.nextBrowserID.toString();
        Plottit.state.nextBrowserID += 1;
        this.browserStates[browserID] = new Plottit.BrowserState(browser, 
            this._localDateFormat, this._utcDateFormat);
        browser.setAttribute("PlottitBrowserID", browserID);
    }
    return browserID;
};

Plottit.State.prototype.removeBrowser = function (browser) {
    Plottit.logger.trace("Plottit.State.removeBrowser -- ");
    
    var browserID = browser.getAttribute("PlottitBrowserID");
    Plottit.assert(browserID, "Browser has no PlottitBrowserID");
    delete this.browserStates[browserID];
    return browserID;
};

Plottit.State.prototype.setBrowserDiscussion = function (browserID, discussion) {
    Plottit.logger.trace("Plottit.State.setBrowserDiscussion -- ");
    Plottit.assert(browserID, "setBrowserDiscussion: Browser has no PlottitBrowserID");
    this.browserStates[browserID].discussion = discussion;
}

Plottit.State.prototype.getBrowserDiscussion = function (browserID) {
    return this.browserStates[browserID].discussion;
}


Plottit.State.prototype.getCurrentBrowserState = function () {
    return this.browserStates[this.currentBrowserID];
}

Plottit.State.prototype.getCurrentTreeView = function () {
    return this.browserStates[this.currentBrowserID].treeView;
}


Plottit.State.prototype.getCurrentBrowserDiscussion = function () {
    return this.browserStates[this.currentBrowserID].discussion;
}

Plottit.State.prototype.getUtcDateFormat = function () {
    return this._utcDateFormat;
}

Plottit.State.prototype.setUtcDateFormat = function (format) {
    this._utcDateFormat = format;
 
    // Update all treeViews
    for (var browserID in this.browserStates) {
        var treeView = this.browserStates[browserID].treeView;
        treeView.utcDateFormat = format;
    }
}

Plottit.State.prototype.getLocalDateFormat = function () {
    return this._localDateFormat;
}

Plottit.State.prototype.setLocalDateFormat = function (format) {
    this._localDateFormat = format;
 
    // Update all treeViews
    for (var browserID in this.browserStates) {
        var treeView = this.browserStates[browserID].treeView;
        treeView.localDateFormat = format;
    }
}

/*
Plottit.State.prototype.getCurrentBrowserComments = function () {
    return this.browserStates[this.currentBrowserID].discussion.comments;
}
*/

