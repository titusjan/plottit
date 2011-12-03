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

// A class that links the data from the current discussion to a flotWrapper.

// Constructor
Listit.ScatterPlot = function (plotFrameId, state, axesAutoscale) {
 
    this.plotFrameId = plotFrameId;
    this.plotFrame = document.getElementById(this.plotFrameId);
    this.flotWrapper = this.plotFrame.contentWindow.flotWrapper;

    this.state = state;
    this.axesAutoscale =  axesAutoscale;
    //this.xAxisAutoscale =  xAxisAutoscale;
    //this.yAxisAutoscale =  yAxisAutoscale;
    //this.xRange = [null, null];
    //this.yRange = [null, null];
}


Listit.ScatterPlot.prototype.toString = function () {
    return "Listit.ScatterPlot";
};


Listit.ScatterPlot.prototype.initPlot = function () {
        
    Listit.logger.debug("Listit.scatterPlot.initPlot -- ");        
    var plotOptions = { 
        selection : { mode: "xy" },
        xaxis: { 
            mode: "time",
            color: "black", 
            labelHeight: 25, 
            zoomRange: false,
            panRange: false, 
            min: new Date('2008-07-09').valueOf(), 
            max: new Date('2008-09-07').valueOf(), 
            show: true,
        },
        yaxis: { 
            color: "black",
            zoomRange: [10, 20000],
            panRange: [-10000, 10000],
            labelWidth: 25, 
            min: -1000, 
            max: -600,
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
    
    // Initializes plot if this is the first call
    this.flotWrapper.createPlot(plotOptions);

    // Initialize some range (todo: depends on which variables are displayed)
    //this.flotWrapper.setXRange(new Date('2007-07-09').valueOf(), new Date('2007-09-07').valueOf());
    //this.flotWrapper.setYRange(-1000, -500);
    this.flotWrapper.plot.resize();
    this.flotWrapper.drawPlot(true);
}



// Shows or hides the graph-div and messages-div inside the plotFrame on the HTML page.
Listit.ScatterPlot.prototype.display = function (bDisplay) {
    Listit.logger.trace("Listit.scatterPlot.display -- ");
    
    var plotFrameDoc = this.plotFrame.contentDocument;
    if (bDisplay) {
        plotFrameDoc.getElementById('graphs-div').style.display   = 'block';
        plotFrameDoc.getElementById('messages-div').style.display = 'none';
        
        if (this.flotWrapper.plot === null) {
            this.initPlot();
        }
        //this.setAxisFromVariableId(variableId);
        
        // Force resize, otherwise it won't resize if previous tab doesn't contain discussion
        var cw = document.getElementById('plotFrame').contentWindow.wrappedJSObject.onResize();
    } else {
        plotFrameDoc.getElementById('graphs-div').style.display   = 'none';
        plotFrameDoc.getElementById('messages-div').style.display = 'block';
    }
}

Listit.ScatterPlot.prototype.getCurrentDiscussion = function () {
    var eventBrowserID = Listit.state.getCurrentBrowserID();
    var discussion = Listit.state.getBrowserDiscussion(eventBrowserID);
    return discussion;
}


Listit.ScatterPlot.prototype.setDiscussion = function (discussion) {
    Listit.logger.debug("Listit.ScatterPlot.setDiscussion -- ");

    Listit.fbLog('Listit.ScatterPlot.setDiscussion');
    var yAxis = this.flotWrapper.plot.getYAxes()[0];
    Listit.fbLog(yAxis);
    var plotSeries = this.getSeries(discussion);
    this.flotWrapper.setData(plotSeries);
    
    if (this.axesAutoscale) {
        this.flotWrapper.setXRange(null, null);
        this.flotWrapper.setYRange(null, null);
    } else {
        this.flotWrapper.logRange();

        //this.flotWrapper.setXRange(null, null);
        //this.flotWrapper.setYRange(null, null);
        var xRange = this.flotWrapper.getCalculatedXRange();
        var yRange = this.flotWrapper.getCalculatedYRange();
        
        this.flotWrapper.setXRange(xRange[0], xRange[1]); // TODO: harmonize get/set
        this.flotWrapper.setYRange(yRange[0], yRange[1]); // TODO: harmonize get/set

        this.flotWrapper.logRange();
    }
    Listit.logger.debug("Autoscale: " + this.axesAutoscale);
    this.flotWrapper.drawPlot(this.axesAutoscale);

}

Listit.ScatterPlot.prototype.toggleAxesAutoScale = function (checkbox) {
    
    Listit.fbLog("toggleAxesAutoScale");
    
    //this.axesAutoscale = Listit.stringToBoolean(checkbox.getAttribute("checked"));
    this.axesAutoscale = Listit.getCheckboxValue(checkbox);

    Listit.fbLog(this.axesAutoscale);
    
    if (this.axesAutoscale) {
        this.flotWrapper.setXRange(null, null);
        this.flotWrapper.setYRange(null, null);    
        this.flotWrapper.drawPlot(true);
    } else {
        checkbox.setAttribute('checked', 'false'); // set to false for persistence
        // TODO: set range explicitely?
        var xRange = this.flotWrapper.getXRange();
        this.flotWrapper.setXRange(xRange[0], xRange[1]); // TODO: harmonize get/set
        
        var yRange = this.flotWrapper.getYRange();
        this.flotWrapper.setYRange(yRange[0], yRange[1]); // TODO: harmonize get/set
        
        this.flotWrapper.drawPlot(false);
    }
}
    

Listit.ScatterPlot.prototype.resetXScale = function () {
    this.flotWrapper.setXRange(null, null);
    this.flotWrapper.drawPlot(true);
}
    
Listit.ScatterPlot.prototype.resetYScale = function () {
    this.flotWrapper.setYRange(null, null);
    this.flotWrapper.drawPlot(true);
    Listit.fbLog("resetYScale after rescale");
    Listit.fbLog(this.flotWrapper.plot.getYAxes()[0]);    
}
    
Listit.ScatterPlot.prototype.getAxisByName = function (axisStr) {
    Listit.assert(axisStr == 'x' || axisStr == 'y', 
        "Invalid axisStr: " + axisStr);
    
    var axes = this.flotWrapper.plot.getAxes();
    var axis = (axisStr == 'x' ? axes.xaxis : axes.yaxis);
    return axis;
}

Listit.ScatterPlot.prototype.togglePanZoomEnabled = function (menuItem, axisStr) {
    Listit.logger.debug("Listit.ScatterPlot.togglePanZoomEnabled -- ");

    try{    
        var axis = this.getAxisByName(axisStr)
        //var menuItem = event.originalTarget;
        var wasChecked = Listit.stringToBoolean(menuItem.getAttribute("checked"));

        if (wasChecked) {
            menuItem.setAttribute('checked', false);
            axis.options.zoomRange = false;
            axis.options.panRange = false;
        } else {
            menuItem.setAttribute('checked', true);
            if (axisStr == 'x') {
                axis.options.zoomRange = [30000, 1000*3600*24*365.25*10]; // 30 sec to 10 years
                axis.options.panRange  = [new Date('2005-01-01').valueOf(), new Date('2015-01-01').valueOf()];
            } else {
                axis.options.zoomRange = [10, 20000];
                axis.options.panRange  = [-10000, 10000] ;
            }
        }
    } catch (ex) {
        Listit.logger.error('Exception in Listit.ScatterPlot.togglePanZoomEnabled;');
        Listit.logger.error(ex);
    }
}    

Listit.ScatterPlot.prototype.toggleAutoscaleEnabled = function (event, axisStr) {
    Listit.logger.debug("Listit.ScatterPlot.toggleAutoscaleEnabled -- ");

    try{    
        Listit.assert(axisStr == 'x' || axisStr == 'y', "Invalid axisStr: " + axisStr);

        var menuItem = event.originalTarget;
        var wasChecked = Listit.stringToBoolean(menuItem.getAttribute("checked"));
        
        if (wasChecked) {
            menuItem.setAttribute('checked', false);
        } else {
            menuItem.setAttribute('checked', true);
        }
        if (axisStr == 'x') {
            Listit.logger.debug("Set X-Axis autoScale to: " + !wasChecked);
            this.xAxisAutoscale = !wasChecked;
        } else {
            Listit.logger.debug("Set Y-Axis autoScale to: " + !wasChecked);
            this.yAxisAutoscale = !wasChecked;
        }
    } catch (ex) {
        Listit.logger.error('Exception in Listit.ScatterPlot.toggleAutoscaleEnabled;');
        Listit.logger.error(ex);
    }
}    


Listit.ScatterPlot.prototype.getSeries = function(discussion) {
    
    var data = Listit.getCommentDataAsTuples(discussion.comments);
    var plotSeries = [ {
        data   : data,
        points : { show: true },
        color  : 'orangered',
    } ];
    return plotSeries;
}


Listit.ScatterPlot.prototype.selectVariable = function (varID) {
        
    Listit.logger.debug("Listit.scatterPlot.selectVariable -- ");
        
    
}