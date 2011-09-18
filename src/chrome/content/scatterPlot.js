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

    var plotSeries = this.getSeries(discussion);
    this.flotWrapper.setPlotSeries(plotSeries);
    
    if (doRedraw) {
        this.flotWrapper.drawPlot();
    }
}

Listit.ScatterPlot.prototype.resetScale = function (event) {
    Listit.logger.trace("Listit.ScatterPlot.resetScale -- ");
try{    
    Listit.logger.debug('Listit.ScatterPlot.resetScale;');
    this.flotWrapper.setXRange(null, null);
    this.flotWrapper.setYRange(null, null);
    this.flotWrapper.drawPlot();
} catch (ex) {
    Listit.logger.error('Exception in Listit.ScatterPlot.resetScale;');
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

