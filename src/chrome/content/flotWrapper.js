
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space


Listit.FlotWrapper = function (placeHolderDivId) { // Constructor

    this.placeHolderDivId = placeHolderDivId;
    this.plot = null; // Don't call jQuery.plot yet, the placeholder may not be visible
}

Listit.FlotWrapper.prototype.toString = function () {
    return "<Listit.FlotWrapper>";
};


// Make sure to call this only when the place holder is visible!
Listit.FlotWrapper.prototype.createPlot = function (plotOptions) {
    this.plot = $.plot($('#'+this.placeHolderDivId), [], plotOptions);

}

Listit.FlotWrapper.prototype.setData = function (plotSeries) {
    this.plot.setData(plotSeries);
}

Listit.FlotWrapper.prototype.drawPlot = function (rescale) {
    if (rescale) {
        this.plot.setupGrid(); // Recalculate (and draw) and set axis scaling, ticks, legend etc.
    }
    this.plot.draw();      // Redraw the canvas (tick values)
}


/* Not used. Always want to setupGrid as well.  TODO: renavme rescalePlot to drawPlot
Listit.FlotWrapper.prototype.drawPlot = function (rescale) {
    this.plot.draw();      // Redraw the canvas (tick values)
}*/


/*
// Merges options dictionary into plot options
Listit.FlotWrapper.prototype.mergeIntoPlotOptions = function (options) {

    this.plotOptions = $.extend(true, {}, this.plotOptions, options);   
}*/

Listit.FlotWrapper.prototype.getCalculatedXRange = function () {
    var xAxis = this.plot.getXAxes()[0]; 
    return [xAxis.min, xAxis.max];
}

Listit.FlotWrapper.prototype.getCalculatedYRange = function () {
    var yAxis = this.plot.getYAxes()[0]; 
    return [yAxis.min, yAxis.max];
}


Listit.FlotWrapper.prototype.getXRange = function () {
    var axes = this.plot.getAxes();                     // TODO: just use getXAxes?
    var xAxis = axes.xaxis;
    return [xAxis.options.min, xAxis.options.max];
}

Listit.FlotWrapper.prototype.getYRange = function () {
    var axes = this.plot.getAxes();
    var yAxis = axes.yaxis;
    return [yAxis.options.min, yAxis.options.max];
}

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

    //var msg = "(" +
    //    ranges.xaxis.from + ", " + ranges.yaxis.from + "),  (" +
    //    ranges.xaxis.to   + ", " + ranges.yaxis.to + ")" ;

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

// Needed when the selection plug-in is used.
Listit.FlotWrapper.prototype.onPlotSelect = function (event, ranges) {
    Listit.logger.trace("onPlotSelect --");
    this.setRanges(ranges);
    this.plot.clearSelection(true);
    this.drawPlot(true); // rescale
}


