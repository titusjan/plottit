if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

//////////////////
// ScatterPlot //
//////////////////

// A class that links the data from the current discussion to a flotWrapper.
// A flotWrapper is a wrapper of a Flot plot inside an regular Html page that
// can send a listitPlotSeriesRequest request to ask for plot data. It can 
// optionally cache this and maintain a zoom range.

Listit.ScatterPlot = function (plotFrameId, state) { // Constructor
 
    this.plotFrameId = plotFrameId;
    this.plotFrame = document.getElementById(this.plotFrameId);
    this.flotWrapper = this.plotFrame.contentWindow.flotWrapper;
    
    this.state = state;
}


Listit.ScatterPlot.prototype.toString = function () {
    return "Listit.ScatterPlot";
};

// Shows or hides the graph-div and messages-div inside the plotFrame on the HTML page.
Listit.ScatterPlot.prototype.display = function (bDisplay) {
    Listit.logger.trace("Listit.scatterPlot.display -- ");
    
    var plotFrameDoc = this.plotFrame.contentDocument;
    if (bDisplay) {
        plotFrameDoc.getElementById('graphs-div').style.display   = 'block';
        plotFrameDoc.getElementById('messages-div').style.display = 'none';
        
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

/* Not used 
Listit.ScatterPlot.prototype.onPlotSeriesRequest = function (event) {

try{  
    Listit.logger.debug("Listit.onPlotSeriesRequest -- "); 
    var discussion = this.getCurrentDiscussion();
    this.setDiscussion(discussion, false);
} catch (ex) {
    Listit.logger.error('Exception in Listit.onPlotSeriesRequest;');
    Listit.logger.error(ex);
}    
}
*/

Listit.ScatterPlot.prototype.setDiscussion = function (discussion, doRedraw) {
    Listit.logger.trace("Listit.ScatterPlot.update -- ");

    //Listit.fbLog(this);
    var plotSeries = this.getSeries(discussion);
    this.flotWrapper.setPlotSeries(plotSeries);
    
    if (doRedraw) {
        this.flotWrapper.drawPlot();
    }
}

Listit.ScatterPlot.prototype.resetXScale = function () {
    this.flotWrapper.setXRange(null, null);
    this.flotWrapper.drawPlot();
}
    
Listit.ScatterPlot.prototype.resetYScale = function () {
    this.flotWrapper.setYRange(null, null);
    this.flotWrapper.drawPlot();
}
    
Listit.ScatterPlot.prototype.getAxisByName = function (axisStr) {
    Listit.assert(axisStr == 'x' || axisStr == 'y', 
        "Invalid axisStr: " + axisStr);
    
    var axes = this.flotWrapper.plot.getAxes();
    var axis = (axisStr == 'x' ? axes.xaxis : axes.yaxis);
    return axis;
}

Listit.ScatterPlot.prototype.togglePanZoomEnabled = function (event, axisStr) {
    Listit.logger.trace("Listit.ScatterPlot.togglePanZoomEnabled -- ");

    try{    
        var axis = this.getAxisByName(axisStr)

        var menuItem = event.originalTarget;
        var oldState = menuItem.getAttribute("checked");
        Listit.assert(oldState == 'true' || oldState == 'false', 
            "Invalid 'checked' attribute value: " + oldState);

        if (oldState == 'true') {
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


Listit.ScatterPlot.prototype.getSeries = function(discussion) {
    
    var data = Listit.getCommentDataAsTuples(discussion.comments);
    var plotSeries = [ {
        data   : data,
        points : { show: true },
        color  : 'orangered',
    } ];
    return plotSeries;
}

