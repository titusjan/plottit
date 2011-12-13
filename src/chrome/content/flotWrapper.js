
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space


/*
/ Wrapper around flot plot with some useful routines.
/ Used in plotframe.html were jQuery is also included.
*/

// Constructor
// TODO: make all private methods start with underscore
Listit.FlotWrapper = function (placeHolderDivId) 
{
    this.plot = null; // Don't call jQuery.plot yet, the placeholder may not be visible
    this.placeHolderDivId = placeHolderDivId;
    
    this.zoomRange = null;
    this.panRange = null;
    
    // The _axisOptionCache is necessary to remember the zoom and pan range when panning and
    // zooming is disabled. In that case the flot axis.options zoomRange and panRange will be 
    // set to false and thus the old setting is lost in flot :-(
    this._axisOptionCache = {};
    this._axisOptionCache.x = {
        panZoomEnabled : null,
        zoomRange : null,
        panRange : null
    }
    this._axisOptionCache.y = {
        panZoomEnabled : null,
        zoomRange : null,
        panRange : null
    }
}


Listit.FlotWrapper.prototype.toString = function () {
    return "<Listit.FlotWrapper>";
};

Listit.FlotWrapper.prototype.assertAxisStringIsValid = function (axisStr) {
    Listit.assert(axisStr == 'x' || axisStr == 'y', "Invalid axisStr: " + axisStr); 
}

Listit.FlotWrapper.prototype.getAxisByName = function (axisStr) {
    this.assertAxisStringIsValid(axisStr);
    var axes = this.plot.getAxes();
    var axis = (axisStr == 'x' ? axes.xaxis : axes.yaxis);
    return axis;
}


// Make sure to call this only when the place holder is visible!
Listit.FlotWrapper.prototype.createPlot = function (plotOptions) {
    this.plot = $.plot($('#'+this.placeHolderDivId), [], plotOptions);

    // Pases on the plot options set so far
    this._updateFlotAxisOptions('x');
    this._updateFlotAxisOptions('y');
}

Listit.FlotWrapper.prototype.setData = function (plotSeries) {
    this.plot.setData(plotSeries);
}

Listit.FlotWrapper.prototype.setPlotTitle = function (title) {
    $('#header-div').text(title);
}

Listit.FlotWrapper.prototype.drawPlot = function (rescale) {
    Listit.logger.trace('Listit.FlotWrapper.drawPlot');

    if (rescale) {
        Listit.logger.trace('setupGridCalled --');
        this.plot.setupGrid(); // Recalculate (and draw) and set axis scaling, ticks, legend etc.
    }
    this.plot.draw();      // Redraw the canvas (tick values)
}


// Update the flot axis options from the axisOptionCache
Listit.FlotWrapper.prototype._updateFlotAxisOptions = function (axisStr) {

    Listit.logger.trace('Listit.FlotWrapper._updateFlotAxisOptions --');
    Listit.assert(this.plot, "In _updateFlotAxisOptions: this.plot not initialized");
    var axis = this.getAxisByName(axisStr);
    if (this._axisOptionCache[axisStr].panZoomEnabled) {
        axis.options.panRange = this._axisOptionCache[axisStr].panRange;
        axis.options.zoomRange = this._axisOptionCache[axisStr].zoomRange;
    } else {
        axis.options.panRange = false;    
        axis.options.zoomRange = false;
    }
}

// Merges sourceOptions into the targetOptions dictionary
Listit.FlotWrapper.prototype._mergeOptions = function (sourceOptions, targetOptions) {
    
    targetOptions = $.extend(true, {}, targetOptions, sourceOptions);   
    return targetOptions;
}

Listit.FlotWrapper.prototype.setAxisOptions = function (axisStr, varOptions) {
    Listit.logger.trace('Listit.FlotWrapper.setAxisOptions --');
    this.assertAxisStringIsValid(axisStr);
    this._axisOptionCache[axisStr].panRange = varOptions.panRange;
    this._axisOptionCache[axisStr].zoomRange = varOptions.zoomRange;
    if (this.plot) {
        var axis = this.getAxisByName(axisStr);
        axis.options = this._mergeOptions(varOptions, axis.options);
        this._updateFlotAxisOptions(axisStr);
    }
}

Listit.FlotWrapper.prototype.getAxisPanZoomEnabled = function (axisStr) {
    this.assertAxisStringIsValid(axisStr);
    return this._axisOptionCache[axisStr].panZoomEnabled;
}

Listit.FlotWrapper.prototype.setAxisPanZoomEnabled = function (axisStr, enabled) {
    Listit.logger.trace('Listit.FlotWrapper.setAxisPanZoomEnabled --');
    this.assertAxisStringIsValid(axisStr);
    this._axisOptionCache[axisStr].panZoomEnabled = enabled;
    if (this.plot) {
        this._updateFlotAxisOptions(axisStr);
    }
}


Listit.FlotWrapper.prototype.logRange = function () {
    Listit.logger.trace('Listit.FlotWrapper.logRange');
    var range = this.getYRange();
    Listit.logger.debug('def range: ' + range[0] + ' ' + range[1]);
    range = this.getCalculatedYRange();
    Listit.logger.debug('cal range: ' + range[0] + ' ' + range[1]);
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


// TODO: refactor to updateAxesScale? (make autoscale flotWrapper member)
Listit.FlotWrapper.prototype.setAxesAutoscale = function (autoScale) {
    Listit.logger.debug("FlotWrapper.setAxesAutoscale: " + autoScale.toString());

    if (autoScale) {
        this.setXRange(null, null);
        this.setYRange(null, null);    
    } else {
        var xRange = this.getXRange();
        var yRange = this.getYRange();
        this.setXRange(xRange[0], xRange[1]); // TODO: harmonize get/set
        this.setYRange(yRange[0], yRange[1]); // TODO: harmonize get/set
    }
    this.drawPlot(autoScale);
}

// Needed when the selection plug-in is used.
Listit.FlotWrapper.prototype.onPlotSelect = function (event, ranges) {
    Listit.logger.trace("onPlotSelect --");
    this.setRanges(ranges);
    this.plot.clearSelection(true);
    this.drawPlot(true); // rescale
}


