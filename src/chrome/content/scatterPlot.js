if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

/* 
Bug:

Open: 
    1) file:///Users/titusjan/Programming/firefox/test_json/reddit_germany_just_sold_200_tanks_to_saudi.json
    2) file:///Users/titusjan/Programming/firefox/test_json/nailed_it.json (or other tab)
    
    (reset firefox)
    set autoscale first to true, then to false:
    switch tab and switch back
    resize plot frame
    
    This is because resizing always recalculates new grids (which makes sense).
    However, apparently setting different data back changes the tick calculation)
    
*/

//////////////////
// ScatterPlot //
//////////////////

// A class that links the data from the current discussion to a flotWrapper on the plotframe.html page.
// Private methods start with and underscore.

// Constructor
Listit.ScatterPlot = function (plotFrameId, state, axesAutoscale, 
        xAxisVariable, yAxisVariable, 
        xAxisPanZoomEnabled, yAxisPanZoomEnabled) 
{
    this.plotFrameId = plotFrameId;
    this.plotFrame = document.getElementById(this.plotFrameId);
    
    this.discussion = null;
    this.xAxisVariable = xAxisVariable;
    this.yAxisVariable = yAxisVariable;
    
    this.axesAutoscale =  axesAutoscale;

    this.flotWrapper = this.plotFrame.contentWindow.flotWrapper;
    this.flotWrapper.setAxisPanZoomEnabled('x', xAxisPanZoomEnabled);
    this.flotWrapper.setAxisPanZoomEnabled('y', yAxisPanZoomEnabled);
}


Listit.ScatterPlot.prototype.toString = function () {
    return "Listit.ScatterPlot";
};


// Global dictionary with plot settings per variable
Listit.ScatterPlot.VAR_LONG_NAMES = {
    'depth'            : 'Depth', 
    'score'            : 'Score', 
    'ups'              : 'Up votes', 
    'downs'            : 'Down votes', 
    'votes'            : 'Votes', 
    'likesPerc'        : 'Like', 
    'hot'              : 'Hot', 
    'best'             : 'Best', 
    'numChars'         : 'Characters', 
    'numReplies'       : 'Replies', 
    'dateCreatedValue' : 'UTC Date and time' 
}


// Global dictionary with plot settings per variable
Listit.ScatterPlot.VAR_AXIS_OPTIONS = {
    'depth'            : { mode: null, panRange: [     0,   100], zoomRange: [ 5,     100] }, 
    'score'            : { mode: null, panRange: [-10000, 10000], zoomRange: [10,   20000] }, 
    'ups'              : { mode: null, panRange: [     0, 10000], zoomRange: [10,   10000] }, 
    'downs'            : { mode: null, panRange: [     0, 10000], zoomRange: [10,   10000] }, 
    'votes'            : { mode: null, panRange: [     0, 20000], zoomRange: [10,   20000] }, 
    'likesPerc'        : { mode: null, panRange: [     0,   100], zoomRange: [ 5,     200] }, // TODO: fix
    'hot'              : { mode: null, panRange: [-10000, 10000], zoomRange: [ 0.1, 20000] }, 
    'best'             : { mode: null, panRange: [-10000, 10000], zoomRange: [10,   20000] }, 
    'numChars'         : { mode: null, panRange: [     0, 10000], zoomRange: [10,   10000] },
    'numReplies'       : { mode: null, panRange: [     0,  1000], zoomRange: [ 5,    1000] },
    'dateCreatedValue' : { mode     : "time", 
                           panRange : [new Date('2005-01-01').valueOf(), new Date('2015-01-01').valueOf()], 
                           zoomRange: [30000, 1000*3600*24*365.25*10] },  // 30 sec to 10 years 
}

// To be called the first time the plot is drawn.
// Cannot be called in the constructor because the placeholder div may not be visible yet
// and the flotWrapper.plot may therefore be undefined.
Listit.ScatterPlot.prototype._initPlot = function () {
        
    Listit.logger.debug("Listit.scatterPlot.initPlot -- ");        
    
    var initialPlotOptions = { 
        selection : { mode: "xy" },
        xaxis: { 
            mode: "time",
            color: "black", 
            labelHeight: 25, 
            zoomRange: false,
            panRange: false, 
            show: true,
        },
        yaxis: { 
            color: "black",
            zoomRange: false,
            panRange: false, 
            labelWidth: 25, 
            show: true,
        },
        zoom: {
            interactive: true,
            amount: Math.sqrt(2.0),
        },
        pan: {
            interactive: true
        }         
        
    };        
    
    this.flotWrapper.createPlot(initialPlotOptions);     // Draws/creates plot in flotwrapper
    this._updateAxisOptions('x', this.xAxisVariable);
    this._updateAxisOptions('y', this.yAxisVariable);
    this.flotWrapper.plot.resize();
    this.flotWrapper.drawPlot(true);
    this._updatePlotTitle();
    this.flotWrapper.logRange();
}



// Shows or hides the graph-div and messages-div inside the plotFrame on the HTML page.
Listit.ScatterPlot.prototype.display = function (bDisplay) {
    Listit.logger.trace("Listit.scatterPlot.display -- ");
    
    var plotFrameDoc = this.plotFrame.contentDocument;
    if (bDisplay) {
        plotFrameDoc.getElementById('graphs-div').style.display   = 'block';
        plotFrameDoc.getElementById('messages-div').style.display = 'none';
        
        // Force resize, otherwise it won't resize if previous tab doesn't contain discussion
        this.plotFrame.contentWindow.wrappedJSObject.onResize();
        
    } else {
        plotFrameDoc.getElementById('graphs-div').style.display   = 'none';
        plotFrameDoc.getElementById('messages-div').style.display = 'block';
    }
}


Listit.ScatterPlot.prototype._getSeries = function(discussion) {
    
    var plotSeries = [ {
        data   : [],
        points : { show: true },
        color  : 'orangered',
    } ];
    if (discussion) {
        plotSeries[0].data = Listit.getCommentDataAsTuples(discussion.comments, 
            this.xAxisVariable, this.yAxisVariable);
    }
    return plotSeries;
}


Listit.ScatterPlot.prototype.setDiscussion = function (discussion) {
    Listit.logger.debug("Listit.ScatterPlot.setDiscussion -- ");

    var isFirstTime = (this.flotWrapper.plot === null);
    if (isFirstTime) {
        this.initialized = true;
         this._initPlot();
    }
        
    this.discussion = discussion;
    var plotSeries = this._getSeries(discussion);
    this.flotWrapper.setData(plotSeries);
    this.flotWrapper.setAxesAutoscale(this.axesAutoscale || isFirstTime);
}

Listit.ScatterPlot.prototype.toggleAxesAutoScale = function (checkbox) {
    Listit.logger.trace("Listit.ScatterPlot.setDiscussion -- ");
    
    this.axesAutoscale = Listit.getCheckboxValue(checkbox);
    if (!this.axesAutoscale) {
        checkbox.setAttribute('checked', 'false'); // set to false for persistence
    }
    this.flotWrapper.setAxesAutoscale(this.axesAutoscale);

}
 

Listit.ScatterPlot.prototype.togglePanZoomEnabled = function (menuItem, axisStr) {
    Listit.logger.trace("Listit.ScatterPlot.togglePanZoomEnabled -- ");

    var wasChecked = Listit.stringToBoolean(menuItem.getAttribute("checked"));
    var enabled = ! wasChecked;
    menuItem.setAttribute('checked', enabled);
    this.flotWrapper.setAxisPanZoomEnabled(axisStr, enabled);
}


Listit.ScatterPlot.prototype.resetRange = function (axisStr) {

    this.flotWrapper.resetRange(axisStr);
    this.flotWrapper.drawPlot(true);
}


Listit.ScatterPlot.prototype._updateAxisOptions = function (axisStr) {

    Listit.assert(axisStr == 'x' || axisStr == 'y', "Invalid axisStr: " + axisStr);
    
    var axisVar = (axisStr == 'x') ? this.xAxisVariable : this.yAxisVariable;
    var varOptions = Listit.safeGet(Listit.ScatterPlot.VAR_AXIS_OPTIONS, axisVar);
    this.flotWrapper.setAxisOptions(axisStr, varOptions);
}

Listit.ScatterPlot.prototype.setAxisVariable = function (axisStr, menuItem, axisVar) {
try{
    Listit.logger.trace("Listit.ScatterPlot.setAxisVariable -- ");
    Listit.assert(axisStr == 'x' || axisStr == 'y', "Invalid axisStr: " + axisStr);
    
    var menuPopup = menuItem.parentNode;
    if (axisStr == 'x') {
        this.xAxisVariable = axisVar;
        menuPopup.setAttribute("xvarselected", axisVar); // store in persistent attribute
    } else {
        this.yAxisVariable = axisVar;
        menuPopup.setAttribute("yvarselected", axisVar); // store in persistent attribute
    }
    
    this._updateAxisOptions(axisStr); 
    this.setDiscussion(this.discussion);
    this.resetRange(axisStr);
    this._updatePlotTitle();
    
} catch (ex) {
    Listit.logger.error('Exception in Listit.ScatterPlot.setAxisVariable;');
    Listit.logger.error(ex);
}
}

Listit.ScatterPlot.prototype._updatePlotTitle = function () {
    this.flotWrapper.setPlotTitle(
        Listit.getProp(Listit.ScatterPlot.VAR_LONG_NAMES, this.yAxisVariable, this.yAxisVariable) + 
        ' versus ' +
        Listit.getProp(Listit.ScatterPlot.VAR_LONG_NAMES, this.xAxisVariable, this.xAxisVariable) );
}
