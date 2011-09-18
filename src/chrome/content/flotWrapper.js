
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space


Listit.FlotWrapper = function (placeHolderDivId, plotOptions) { // Constructor

    this.placeHolderDivId = placeHolderDivId;
    this.plotOptions = plotOptions;
    this.plotSeries = [];
    this.volatileMode = true; // If true, the plotSeries are flushed after each operation, if false they are cached.
    this.plot = null;         // Don't call jQuery.plot yet, the placeholder may not be visible
}

Listit.FlotWrapper.prototype.toString = function () {
    return "<Listit.FlotWrapper>";
};

Listit.FlotWrapper.prototype.triggerPlotSeriesRequest = function () {  // TODO: put placeholderID in eventdata
    Listit.logger.info("FlotWrapper.triggerPlotSeriesRequest -- ");
    
    var event = document.createEvent("Events");
    event.initEvent("listitPlotSeriesRequest", true, false);
    var placeHolder = document.getElementById(this.placeHolderDivId);
    placeHolder.dispatchEvent(event);
};

Listit.FlotWrapper.prototype.setPlotSeries = function (plotSeries) {
    Listit.logger.trace("FlotWrapper.setPlotSeries -- " + plotSeries);
    Listit.fbLog(plotSeries);
    this.plotSeries = plotSeries;
    this.plot = $.plot($('#'+this.placeHolderDivId), this.plotSeries, this.plotOptions);
}

Listit.FlotWrapper.prototype.drawPlot = function () {
    Listit.logger.debug("FlotWrapper.drawPlot --  options: " + this.plotOptions);
    this.plot.setupGrid(); // Recalculate (and draw) and set axis scaling, ticks, legend etc.
    this.plot.draw(); // Redraw the canvas (tick values)
}

/*
Listit.FlotWrapper.prototype.updatePlot = function () {
    Listit.logger.trace("FlotWrapper.updatePlot --  options: " + this.plotOptions);
    this.plot = $.plot($('#'+this.placeHolderDivId), this.plotSeries, this.plotOptions);
}*/


Listit.FlotWrapper.prototype.releasePlotSeries = function (force) {
    Listit.logger.trace("FlotWrapper.releasePlotSeries -- force: " + force);
    if (this.volatileMode || force) {
        this.plotSeries = [];
    }
}

/*
Listit.FlotWrapper.prototype.removeRanges = function () {
    Listit.logger.debug("FlotWrapper.removeRanges -- ");

    this.setXRange(null, null);
    this.setYRange(null, null);
}

// Merges options dictionary into plot options
Listit.FlotWrapper.prototype.mergeIntoPlotOptions = function (options) {

    this.plotOptions = $.extend(true, {}, this.plotOptions, options);   
}
*/
Listit.FlotWrapper.prototype.setXRange = function (minX, maxX) {
    var axes = this.plot.getAxes();
    var xAxis = axes.xaxis;
    xAxis.options.min = minX;
    xAxis.options.max = maxX;
}

Listit.FlotWrapper.prototype.setYRange = function (minY, maxY) {
    var axes = this.plot.getAxes();
    var yAxis = axes.yaxis;
    yAxis.options.min = minY;
    yAxis.options.max = maxY;
}

Listit.FlotWrapper.prototype.setRanges = function (ranges) {
    Listit.logger.trace("FlotWrapper.setRanges -- ranges");

    var msg = "(" +
        ranges.xaxis.from + ", " + ranges.yaxis.from + "),  (" +
        ranges.xaxis.to   + ", " + ranges.yaxis.to + ")" ;

    // clamp the zooming to prevent eternal zoom
    var clampedRanges = ranges;
    var epsilon = 0.00001;
    if (clampedRanges.xaxis.to - clampedRanges.xaxis.from < epsilon)
        clampedRanges.xaxis.to = clampedRanges.xaxis.from + epsilon;
    if (clampedRanges.yaxis.to - clampedRanges.yaxis.from < epsilon)
        clampedRanges.yaxis.to = clampedRanges.yaxis.from + epsilon;
    
    this.setXRange(clampedRanges.xaxis.from, clampedRanges.xaxis.to);
    this.setYRange(clampedRanges.yaxis.from, clampedRanges.yaxis.to);
}


Listit.FlotWrapper.prototype.onPlotSelect = function (event, ranges) {
    Listit.logger.trace("onPlotSelect --");
    this.setRanges(ranges);
    this.plot.clearSelection(true);
    this.drawPlot();
    
/*
    // do the zooming
    this.setRanges(ranges);
    this.triggerPlotSeriesRequest();
    this.drawPlot();
    this.releasePlotSeries(false);
    Listit.logger.trace("onPlotSelect done\n");
*/
}


