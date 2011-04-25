if ('undefined' == typeof(Listit)) { var Listit = {}; } // Lisit name space

Listit.State = function () { // Constructor

    this.numTabs = 0;
    this.tabs = {}

}

Listit.State.prototype.toString = function () {
    return "Listit.State";
};


Listit.State.prototype.addBrowser = function (browser) {
    Listit.logger.trace("Listit.State.addBrowser -- begin");
    var browserID = this.numTabs.toString();
    browser.setAttribute("ListitBrowserID", browserID);
    Listit.state.numTabs += 1;
    return browserID;
};



