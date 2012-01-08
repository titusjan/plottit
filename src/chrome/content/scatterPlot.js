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
        xAxisVariable, yAxisVariable, binWidth, 
        xAxisPanZoomEnabled, yAxisPanZoomEnabled) 
{
    this.plotFrameId = plotFrameId;
    this.plotFrame = document.getElementById(this.plotFrameId);
    
    this.discussion = null;
    this.xAxisVariable = xAxisVariable;
    this.yAxisVariable = yAxisVariable;
    this.histogramMode = this._axisVariableIsHistogram(xAxisVariable);
    this.binWidth = binWidth;
    
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
    'binCount'              : 'Counted',  // used for yvar in historgrams
    'hist_score'            : 'Score', 
    'depth'                 : 'Depth', 
    'score'                 : 'Score', 
    'ups'                   : 'Up votes', 
    'downs'                 : 'Down votes', 
    'votes'                 : 'Votes', 
    'likesPerc'             : 'Like', 
    'hot'                   : 'Hot', 
    'best'                  : 'Best', 
    'numChars'              : 'Characters', 
    'numReplies'            : 'Replies', 
    'dateCreatedLocalValue' : 'Date and time',
    'dateCreatedValue'      : 'UTC Date and time',
    'postedAfter'           : 'Posted after',
}


// Global dictionary with plot settings per variable
Listit.ScatterPlot.VAR_AXIS_OPTIONS = {
    'binCount'         : { mode: null, panRange: [     0, 10000], zoomRange: [10,   10000], labelWidth: 25, tickFormatter: null }, 
    'depth'            : { mode: null, panRange: [     0,   100], zoomRange: [ 5,     100], labelWidth: 25, tickFormatter: null }, 
    'score'            : { mode: null, panRange: [-10000, 10000], zoomRange: [10,   20000], labelWidth: 25, tickFormatter: null }, 
    'ups'              : { mode: null, panRange: [     0, 10000], zoomRange: [10,   10000], labelWidth: 25, tickFormatter: null }, 
    'downs'            : { mode: null, panRange: [     0, 10000], zoomRange: [10,   10000], labelWidth: 25, tickFormatter: null }, 
    'votes'            : { mode: null, panRange: [     0, 20000], zoomRange: [10,   20000], labelWidth: 25, tickFormatter: null }, 
    'likesPerc'        : { mode: null, panRange: [     0,   100], zoomRange: [ 5,     200], labelWidth: 25, tickFormatter: null }, // TODO: fix
    'hot'              : { mode: null, panRange: [-10000, 10000], zoomRange: [ 0.5, 20000], labelWidth: 35, tickFormatter: null }, 
    'best'             : { mode: null, panRange: [-10000, 10000], zoomRange: [10,   20000], labelWidth: 25, tickFormatter: null }, 
    'numChars'         : { mode: null, panRange: [     0, 10000], zoomRange: [10,   10000], labelWidth: 25, tickFormatter: null },
    'numReplies'       : { mode: null, panRange: [     0,  1000], zoomRange: [ 5,    1000], labelWidth: 25, tickFormatter: null },
    'postedAfter'      : { 
        mode         : null, 
        panRange     : [0            , 10000*3600*1000], 
        zoomRange    : [0.1*3600*1000, 10000*3600*1000], 
        tickFormatter: function (val, axis) 
            { return new Listit.TimePeriod(val).toStringShort2() },
        },
    'dateCreatedValue' : { 
        mode         : "time", 
        tickFormatter: null, 
        panRange     : [new Date('2005-01-01').valueOf(), new Date('2015-01-01').valueOf()], 
        zoomRange    : [30000, 1000*3600*24*365.25*10] },  // 30 sec to 10 years 
    'dateCreatedLocalValue' : { 
        mode         : "time", 
        tickFormatter: null, 
        panRange     : [new Date('2005-01-01').valueOf(), new Date('2015-01-01').valueOf()], 
        zoomRange    : [30000, 1000*3600*24*365.25*10] },  // 30 sec to 10 years 
}

// To be called the first time the plot is drawn.
// Cannot be called in the constructor because the placeholder div may not be visible yet
// and the flotWrapper.plot may therefore be undefined.
Listit.ScatterPlot.prototype._initPlot = function () {
        
    Listit.logger.trace("Listit.scatterPlot.initPlot -- ");        
    
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

    Listit.logger.debug("Listit.ScatterPlot._getSeries");
    
    var plotSerie = {
        data      : [],
        color     : 'orangered',
    };

    if (this.histogramMode) {
        plotSerie.bars = { show: true, barWidth: this.binWidth, fill: true, 
            fillColor: 'rgba(255, 69, 0, 0.3)' }; // orangered 0.3 opacity
        var data = Listit.getCommentDataAsList(discussion.comments, 
            this.xAxisVariable.substring(5)); // remove 'hist_' from xAxisVariable

        Listit.logger.debug("Creating histogram for " + data.length + " elements");
        plotSerie.data = Listit.createHistogram(data, this.binWidth);
        Listit.logger.debug("Created histogram");
    } else {
        plotSerie.points = { show: true };
        plotSerie.data = Listit.getCommentDataAsList(discussion.comments, 
            this.xAxisVariable, this.yAxisVariable);
    }
    return [ plotSerie ];
}


Listit.ScatterPlot.prototype.setDiscussion = function (discussion) {
    Listit.logger.trace("Listit.ScatterPlot.setDiscussion -- ");

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
    axisVar = this._removeHistPrefix(axisVar);
    var varOptions = Listit.safeGet(Listit.ScatterPlot.VAR_AXIS_OPTIONS, axisVar);
    
    // Hack to set the y options for histogram to binCount. TODO: make cleaner solutions
    if (axisStr == 'y' && this.histogramMode) { 
        var varOptions = Listit.safeGet(Listit.ScatterPlot.VAR_AXIS_OPTIONS, 'binCount');
    }
    this.flotWrapper.setAxisOptions(axisStr, varOptions);
}


Listit.ScatterPlot.prototype._axisVariableIsHistogram = function (axisVar) {
    return (axisVar.substring(0, 4) == 'hist');
}

Listit.ScatterPlot.prototype._removeHistPrefix = function (axisVar) {

    // Remove 'hist_' from axisVar if present
    if (this._axisVariableIsHistogram(axisVar)) {
        return axisVar.substr(5) 
    } else {
        return axisVar
    }
}


Listit.ScatterPlot.prototype.setAxisVariable = function (axisStr, menuItem, axisVar) {
try{
    Listit.logger.trace("Listit.ScatterPlot.setAxisVariable -- ");
    Listit.assert(axisStr == 'x' || axisStr == 'y', "Invalid axisStr: " + axisStr);
    
    var menuPopup = menuItem.parentNode;
    if (axisStr == 'x') {
        this.xAxisVariable = axisVar;
        menuPopup.setAttribute("xvarselected", axisVar); // store in persistent attribute
        
        this.histogramMode = this._axisVariableIsHistogram(axisVar);
        Listit.logger.debug("Scatterplot histogram mode is " + this.histogramMode);
    } else {
        this.yAxisVariable = axisVar;
        menuPopup.setAttribute("yvarselected", axisVar); // store in persistent attribute
    }
    
    this._updateAxisOptions(axisStr); 
    if (axisStr == 'x') this._updateAxisOptions('y'); // Hack to also update the y options for histograms. TODO: fix
    this.setDiscussion(this.discussion);
    this.resetRange(axisStr);
    this.flotWrapper.addAxisDivs(); // The widht of the axis can change so recreate the zoom-divs
    this._updatePlotTitle();
    
} catch (ex) {
    Listit.logger.error('Exception in Listit.ScatterPlot.setAxisVariable;');
    Listit.logException(ex);
}
}


Listit.ScatterPlot.prototype.setBinWidth = function (menuList) {
    try{
        this.binWidth = parseFloat(menuList.getAttribute('value'));
        Listit.fbLog(this.binWidth);
        
        if (this.histogramMode) {
            this.setDiscussion(this.discussion);
            this.resetRange('y');
        }
    } catch (ex) {
        Listit.logger.error('Exception in Listit.ScatterPlot.setAxisVariable;');
        Listit.logException(ex);
    }
}


Listit.ScatterPlot.prototype._updatePlotTitle = function () {
    if (this.histogramMode) {
        this.flotWrapper.setPlotTitle(
            Listit.getProp(Listit.ScatterPlot.VAR_LONG_NAMES, 
                this._removeHistPrefix(this.xAxisVariable), this.xAxisVariable) + 
            ' histogram');
    } else {
        this.flotWrapper.setPlotTitle(
            Listit.getProp(Listit.ScatterPlot.VAR_LONG_NAMES, 
                this.yAxisVariable, this.yAxisVariable) + 
            ' versus ' +
            Listit.getProp(Listit.ScatterPlot.VAR_LONG_NAMES, 
                this.xAxisVariable, this.xAxisVariable) );
    }
}
