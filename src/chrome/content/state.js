if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space


Listit.PAGE_NOT_LISTIT  = 0; // Not a page listit can process
Listit.PAGE_LOADING     = 1; // Loading JSON posts via AJAX
Listit.PAGE_READY       = 2; // Posts loaded

//////////////////
// BrowserState //
//////////////////


// The state per browser in the global browser object;
Listit.BrowserState = function () { // Constructor

    this.pageStatus = Listit.PAGE_NOT_LISTIT;
    this.treeView =  new Listit.TreeView();
    this.selectedPost = null; // The post that is selected in the table
}

Listit.BrowserState.prototype.toString = function () {
    return "Listit.BrowserState";
};

Listit.BrowserState.prototype.summaryString = function () {
    return "Listit.BrowserState: status=" + this.pageStatus 
        + ", posts=" + this.treeView.getPosts().length 
        + ", selectedPost=" + (this.selectedPost ? this.selectedPost.id : this.selectedPost) ;
};

Listit.BrowserState.prototype.removeAllPosts = function (status) {
    this.treeView.removeAllPosts();
    this.selectedPost = null;
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
Listit.State = function () { // Constructor

    this.currentBrowserID = null;
    this.nextBrowserID = 0;
    this.browserStates = {}

}

Listit.State.prototype.toString = function () {
    return "Listit.State";
};


Listit.State.prototype.summaryString = function () {
    return [ 'Tab ' + k + ': ' + (v.treeView.countPosts()) for 
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
        this.browserStates[browserID] = new Listit.BrowserState();
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

Listit.State.prototype.setBrowserPosts = function (browserID, posts) {
    Listit.logger.trace("Listit.State.setBrowserPosts -- ");
    Listit.assert(browserID, "setBrowserPosts: Browser has no ListitBrowserID");
    this.browserStates[browserID].posts = posts;
}

Listit.State.prototype.getBrowserPosts = function (browserID) {
    return this.browserStates[browserID].posts;
}

Listit.State.prototype.getCurrentBrowserState = function () {
    return this.browserStates[this.currentBrowserID];
}

Listit.State.prototype.getCurrentTreeView = function () {
    return this.browserStates[this.currentBrowserID].treeView;
}

/*
Listit.State.prototype.getCurrentBrowserPosts = function () {
    return this.browserStates[this.currentBrowserID].posts;
}
*/

