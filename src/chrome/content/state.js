if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space


Listit.PAGE_NOT_LISTIT  = 0; // Not a page listit can process
Listit.PAGE_POSTPONED   = 1; // Comments loading postponed
Listit.PAGE_LOADING     = 2; // Loading JSON comments via AJAX
Listit.PAGE_READY       = 3; // Comments loaded

//////////////////
// BrowserState //
//////////////////


// The state per browser in the global browser object;
Listit.BrowserState = function (localDateFormat, utcDateFormat) { // Constructor

    this.pageStatus = Listit.PAGE_NOT_LISTIT;
    this.treeView =  new Listit.TreeView(localDateFormat, utcDateFormat);
    this.selectedComment = null; // The comment that is selected in the table
}

Listit.BrowserState.prototype.toString = function () {
    return "Listit.BrowserState";
};

Listit.BrowserState.prototype.summaryString = function () {
    return "Listit.BrowserState: status=" + this.pageStatus 
        + ", comments=" + this.treeView.getComments().length 
        + ", selectedComment=" + (this.selectedComment ? this.selectedComment.id : this.selectedComment) ;
};

Listit.BrowserState.prototype.removeAllComments = function (status) {
    this.treeView.removeAllComments();
    this.selectedComment = null;
};

Listit.BrowserState.prototype.getStatus = function (status) {
    return this.pageStatus;
};

Listit.BrowserState.prototype.setStatus = function (status) {
    this.pageStatus = status;
};

/*
*/
///////////
// State //
///////////

// The application state of Listit (there will be one per browser window).
Listit.State = function (listitEnabled, localDateFormat, utcDateFormat) { // Constructor

    this.listitEnabled = listitEnabled;
    this.currentBrowserID = null;
    this.nextBrowserID = 0;
    this.browserStates = {}
    
    this._localDateFormat = localDateFormat;
    this._utcDateFormat   = utcDateFormat;

}

Listit.State.prototype.toString = function () {
    return "Listit.State";
};


Listit.State.prototype.summaryString = function () {
    return 'Enabled: ' + this.listitEnabled + ', ' + 
        [ 'Tab ' + k + ': ' + (v.treeView.countComments()) for 
            each ([k,v] in Iterator(this.browserStates))];
};


Listit.State.prototype.getCurrentBrowserID = function () {
    return this.currentBrowserID;
}

Listit.State.prototype.setCurrentBrowser = function (browser) {
    Listit.logger.trace("Listit.State.setCurrentBrowser -- ");
    
    var browserID = browser.getAttribute("ListitBrowserID");
    Listit.assert(browserID, "Browser has no ListitBrowserID");
    this.currentBrowserID = browserID;
    return browserID;
};

Listit.State.prototype.addBrowser = function (browser) {
    Listit.logger.trace("Listit.State.addBrowser -- ");
    
    var browserID;
    if (browser.hasAttribute("ListitBrowserID")) { // Test just in case
        browserID = browser.getAttribute("ListitBrowserID");
        var msg = "Browser already has ListitBrowserID attribute: " + browserID;
        Listit.logger.error(msg);
        throw new Error(msg);
    } else {
        browserID = this.nextBrowserID.toString();
        Listit.state.nextBrowserID += 1;
        this.browserStates[browserID] = new Listit.BrowserState(
            this._localDateFormat, this._utcDateFormat);
        browser.setAttribute("ListitBrowserID", browserID);
        Listit.logger.debug("Listit.State.prototype.addBrowser: added browser " + browserID);
    }
    return browserID;
};

Listit.State.prototype.removeBrowser = function (browser) {
    Listit.logger.trace("Listit.State.removeBrowser -- ");
    
    var browserID = browser.getAttribute("ListitBrowserID");
    Listit.assert(browserID, "Browser has no ListitBrowserID");
    delete this.browserStates[browserID];
    return browserID;
};

Listit.State.prototype.setBrowserDiscussion = function (browserID, discussion) {
    Listit.logger.trace("Listit.State.setBrowserDiscussion -- ");
    Listit.assert(browserID, "setBrowserDiscussion: Browser has no ListitBrowserID");
    this.browserStates[browserID].discussion = discussion;
}

Listit.State.prototype.getBrowserDiscussion = function (browserID) {
    return this.browserStates[browserID].discussion;
}


Listit.State.prototype.getCurrentBrowserState = function () {
    return this.browserStates[this.currentBrowserID];
}

Listit.State.prototype.getCurrentTreeView = function () {
    return this.browserStates[this.currentBrowserID].treeView;
}

Listit.State.prototype.getUtcDateFormat = function () {
    return this._utcDateFormat;
}

Listit.State.prototype.setUtcDateFormat = function (format) {
    this._utcDateFormat = format;
 
    // Update all treeViews
    for (var browserID in this.browserStates) {
        var treeView = this.browserStates[browserID].treeView;
        treeView.utcDateFormat = format;
    }
}

Listit.State.prototype.getLocalDateFormat = function () {
    return this._localDateFormat;
}

Listit.State.prototype.setLocalDateFormat = function (format) {
    this._localDateFormat = format;
 
    // Update all treeViews
    for (var browserID in this.browserStates) {
        var treeView = this.browserStates[browserID].treeView;
        treeView.localDateFormat = format;
    }
}

/*
Listit.State.prototype.getCurrentBrowserComments = function () {
    return this.browserStates[this.currentBrowserID].discussion.comments;
}
*/

