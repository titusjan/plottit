
if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space


Listit.FlotWrapper = function (placeHolderDivId, plotOptions) { // Constructor

    this.placeHolderDivId = placeHolderDivId;
    this.plotOptions = plotOptions;
    this.plotSeries = [];
    this.volatileMode = true; // If true, the plotSeries are flushed after each operation, if false they are cached.
    this.ranges = null;       // TODO: remove?
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
}

Listit.FlotWrapper.prototype.drawPlot = function () {
    Listit.logger.trace("FlotWrapper.drawPlot --  options: " + this.plotOptions);
    this.plot = $.plot($('#'+this.placeHolderDivId), this.plotSeries, this.plotOptions);
}

Listit.FlotWrapper.prototype.releasePlotSeries = function (force) {
    Listit.logger.trace("FlotWrapper.releasePlotSeries -- force: " + force);
    if (this.volatileMode || force) {
        this.plotSeries = [];
    }
}

Listit.FlotWrapper.prototype.removeRanges = function () {
    Listit.logger.info("FlotWrapper.removeRanges -- ");
    this.ranges = null;
    
    // Set ranges in plot options
    this.plotOptions = $.extend(true, {}, this.plotOptions, {
      xaxis: { min: null, max: null },
      yaxis: { min: null, max: null }
    });   
    
}

Listit.FlotWrapper.prototype.setRanges = function (ranges) {
    Listit.logger.trace("FlotWrapper.setRanges -- ranges");

    var msg = "(" +
        ranges.xaxis.from + ", " + ranges.yaxis.from + "),  (" +
        ranges.xaxis.to   + ", " + ranges.yaxis.to + ")" ;
    //Listit.logger.debug("FlotWrapper.setRanges, ranges: " + msg);
    //$('#footer-div').text(msg)
    this.ranges = ranges;

    // clamp the zooming to prevent eternal zoom
    var epsilon = 0.00001;
    if (this.ranges.xaxis.to - this.ranges.xaxis.from < epsilon)
        this.ranges.xaxis.to = this.ranges.xaxis.from + epsilon;
    if (this.ranges.yaxis.to - this.ranges.yaxis.from < epsilon)
        this.ranges.yaxis.to = this.ranges.yaxis.from + epsilon;
    
    // Set ranges in plot options
    this.plotOptions = $.extend(true, {}, this.plotOptions, {
      xaxis: { min: this.ranges.xaxis.from, max: this.ranges.xaxis.to },
      yaxis: { min: this.ranges.yaxis.from, max: this.ranges.yaxis.to }
    });    
}


Listit.FlotWrapper.prototype.onPlotSelect = function (event, ranges) {
    Listit.logger.trace("onPlotSelect --");

    // do the zooming
    this.setRanges(ranges);
    this.triggerPlotSeriesRequest();
    this.drawPlot();
    this.releasePlotSeries(false);
    Listit.logger.trace("onPlotSelect done\n");
}


