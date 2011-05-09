if ('undefined' == typeof(Listit)) { var Listit = {}; } // Lisit name space


Listit.State = function () { // Constructor

    this.currentBrowserID = null;
    this.numBrowsers = 0;
    this.posts = {}

}

Listit.State.prototype.toString = function () {
    return "Listit.State";
};


Listit.State.prototype.summaryString = function () {
    return [ 'Tab ' + k + ': ' + (v.length) for each ([k,v] in Iterator(this.posts))];
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
        browserID = this.numBrowsers.toString();
        this.posts[browserID] = [];
        Listit.state.numBrowsers += 1;
        browser.setAttribute("ListitBrowserID", browserID);
        Listit.logger.debug("Listit.State.prototype.addBrowser: added browser " + browserID);
    }
    return browserID;
};

Listit.State.prototype.removeBrowser = function (browser) {
    Listit.logger.trace("Listit.State.removeBrowser -- ");
    
    var browserID = browser.getAttribute("ListitBrowserID");
    Listit.assert(browserID, "Browser has no ListitBrowserID");
    delete this.posts[browserID];
    return browserID;
};

Listit.State.prototype.setBrowserPosts = function (browser, posts) {
    Listit.logger.trace("Listit.State.setBrowserPosts -- ");
    
    var browserID = browser.getAttribute("ListitBrowserID");;
    Listit.assert(browserID, "setBrowserPosts: Browser has no ListitBrowserID");
    this.posts[browserID] = posts;
}

Listit.State.prototype.getCurrentBrowserPosts = function () {
    return this.posts[this.currentBrowserID];
}


