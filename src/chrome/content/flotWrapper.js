
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space


/*
/ Wrapper around flot plot with some useful routines.
/ Used in plotframe.html were jQuery is also included.
*/

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

Listit.FlotWrapper.prototype.setPlotTitle = function (title) {
    $('#header-div').text(title);
}

Listit.FlotWrapper.prototype.logRange = function () {
    Listit.logger.trace('Listit.FlotWrapper.logRange');
    var range = this.getYRange();
    Listit.logger.debug('def range: ' + range[0] + ' ' + range[1]);
    range = this.getCalculatedYRange();
    Listit.logger.debug('cal range: ' + range[0] + ' ' + range[1]);
}

Listit.FlotWrapper.prototype.drawPlot = function (rescale) {
    Listit.logger.trace('Listit.FlotWrapper.drawPlot');

    if (rescale) {
        Listit.logger.trace('setupGridCalled --');
        this.plot.setupGrid(); // Recalculate (and draw) and set axis scaling, ticks, legend etc.
    }
    this.plot.draw();      // Redraw the canvas (tick values)
}

Listit.FlotWrapper.prototype.getAxisByName = function (axisStr) {
    Listit.assert(axisStr == 'x' || axisStr == 'y', 
        "Invalid axisStr: " + axisStr);
    
    var axes = this.plot.getAxes();
    var axis = (axisStr == 'x' ? axes.xaxis : axes.yaxis);
    return axis;
}


// Merges sourceOptions into the targetOptions dictionary
Listit.FlotWrapper.prototype.mergeOptions = function (sourceOptions, targetOptions) {
    
    targetOptions = $.extend(true, {}, targetOptions, sourceOptions);   
    return targetOptions;
}


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

Listit.FlotWrapper.prototype.resetRange = function (axisStr) {

    Listit.assert(axisStr == 'x' || axisStr == 'y', "Invalid axisStr: " + axisStr);
    if (axisStr == 'x') {
        this.setXRange(null, null);
    } else {
        this.setYRange(null, null);
    }
}

/*
Listit.FlotWrapper.prototype.resetXRange = function () {
    this.setXRange(null, null);
}
    
Listit.FlotWrapper.prototype.resetYRange = function () {
    this.setYRange(null, null);
}
*/

Listit.FlotWrapper.prototype.setAxesAutoscale = function (autoScale) {
    Listit.logger.debug("FlotWrapper.setAxesAutoscale: " + autoScale.toString());

    if (autoScale) {
        this.setXRange(null, null);
        this.setYRange(null, null);    
        this.drawPlot(true);
    } else {
        var xRange = this.getXRange();
        var yRange = this.getYRange();
        this.setXRange(xRange[0], xRange[1]); // TODO: harmonize get/set
        this.setYRange(yRange[0], yRange[1]); // TODO: harmonize get/set
        this.drawPlot(false);
    }
}

// Needed when the selection plug-in is used.
Listit.FlotWrapper.prototype.onPlotSelect = function (event, ranges) {
    Listit.logger.trace("onPlotSelect --");
    this.setRanges(ranges);
    this.plot.clearSelection(true);
    this.drawPlot(true); // rescale
}


