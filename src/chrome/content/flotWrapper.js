// Licensed under the MIT license. See license.txt for details

/*
/ Wrapper around flot plot with some useful routines.
/ Used in plotframe.html where jQuery is also included.
*/

// Constructor

Plottit.FlotWrapper = function (placeHolderDivId) 
{
    this.plot = null; // Don't call jQuery.plot yet, the placeholder may not be visible
    this.placeHolderDivId = placeHolderDivId;
    
    this.zoomRange = null;
    this.panRange = null;
    
    var highlightedIndex = null; // the series index that is highlighted
    var highlightedId = null;    // the comment.id of that belongs to the point that is highlighted.
    this.indexOfId = {};  // maps series.dataIndes to comment.index 
    this.idOfIndex = {};  // maps comment.index to series.dataIndes
    
    // The _axisOptionCache is necessary to remember the zoom and pan range when panning and
    // zooming is disabled. In that case the flot axis.options zoomRange and panRange will be 
    // set to false and thus the old setting is lost in flot :-(
    this._axisOptionCache = {};
    this._axisOptionCache.x = {
        zoomRange : null,
        panRange : null
    }
    this._axisOptionCache.y = {
        zoomRange : null,
        panRange : null
    }
}


Plottit.FlotWrapper.prototype.toString = function () {
    return "<Plottit.FlotWrapper>";
};

Plottit.FlotWrapper.prototype.assertAxisStringIsValid = function (axisStr) {
    Plottit.assert(axisStr == 'x' || axisStr == 'y', "Invalid axisStr: " + axisStr); 
}

Plottit.FlotWrapper.prototype.getAxisByName = function (axisStr) {
    this.assertAxisStringIsValid(axisStr);
    var axes = this.plot.getAxes();
    var axis = (axisStr == 'x' ? axes.xaxis : axes.yaxis);
    return axis;
}


// Make sure to call this only when the place holder is visible!
Plottit.FlotWrapper.prototype.createPlot = function (plotOptions) {
    this.plot = $.plot($('#'+this.placeHolderDivId), [], plotOptions);

    // Pass on the plot options set so far
    this._updateFlotAxisOptions('x');
    this._updateFlotAxisOptions('y');
}

Plottit.FlotWrapper.prototype.setData = function (plotSeries, commentIdList) {
    this.plot.setData(plotSeries);
    
    this.highlightedIndex = null;
    this.highlightedId = null;
    this.indexOfId = {};
    this.idOfIndex = {}; 
    
    if (commentIdList) {
        for (let [idx, id] in Iterator(commentIdList)) {
            this.indexOfId[id] = idx;
            this.idOfIndex[idx] = id;
        }
    }
}


Plottit.FlotWrapper.prototype.highlight = function (selectedCommentId)
{
    this.highlightedIndex = this.indexOfId[selectedCommentId];
    this.highlightedId = selectedCommentId;
    this.drawHighlight();
}


Plottit.FlotWrapper.prototype.removeHighlight = function ()
{
    if (this.plot) {
        this.plot.unhighlight();
    }
}


Plottit.FlotWrapper.prototype.drawHighlight = function ()
{
    if (this.plot) {
        this.plot.unhighlight();
        if (this.highlightedIndex != null) { // null or undefined
            this.plot.highlight(0, this.highlightedIndex);
        }
    }
}

Plottit.FlotWrapper.prototype.onPlotClicked = function (item) {
    Plottit.logger.trace('Plottit.FlotWrapper.dispatchPlottitPlotClicked');
    
    if (!item) return;
    
    this.highlightedIndex = item.dataIndex;
    this.highlightedId = this.idOfIndex[item.dataIndex];
    
    // Trigger event to so that XUL code can handle it
    var event = document.createEvent("Events");  
    event.initEvent("PlottitPlotClickedEvent", true, false);  
    var placeHolder = document.getElementById(this.placeHolderDivId);
    placeHolder.dispatchEvent(event);  
}


Plottit.FlotWrapper.prototype.setPlotTitle = function (title) {
    $('#header-div').text(title);
}

Plottit.FlotWrapper.prototype.drawPlot = function (rescale) {
    Plottit.logger.trace('Plottit.FlotWrapper.drawPlot');

    if (rescale) {
        Plottit.logger.trace('setupGridCalled --');
        this.plot.setupGrid(); // Recalculate (and draw) and set axis scaling, ticks, legend etc.
    }
    this.plot.draw();      // Redraw the canvas (tick values)
    
    this.drawHighlight();
}

// Update the flot axis options from the axisOptionCache
Plottit.FlotWrapper.prototype._updateFlotAxisOptions = function (axisStr) {
    Plottit.logger.trace('Plottit.FlotWrapper._updateFlotAxisOptions --');
    Plottit.assert(this.plot, "In _updateFlotAxisPanOptions: this.plot not initialized");
    this._updateFlotAxisPanOptions(axisStr);
    this._updateFlotAxisZoomOptions(axisStr);
}

// Update the flot axis pan options from the axisOptionCache
Plottit.FlotWrapper.prototype._updateFlotAxisPanOptions = function (axisStr) {
    var axis = this.getAxisByName(axisStr);
    axis.options.panRange = this._axisOptionCache[axisStr].panRange;
}

// Update the flot axis zoom options from the axisOptionCache
Plottit.FlotWrapper.prototype._updateFlotAxisZoomOptions = function (axisStr) {
    var axis = this.getAxisByName(axisStr);
    axis.options.zoomRange = this._axisOptionCache[axisStr].zoomRange;
}

// Merges sourceOptions into the targetOptions dictionary
Plottit.FlotWrapper.prototype._mergeOptions = function (sourceOptions, targetOptions) {
    
    targetOptions = $.extend(true, {}, targetOptions, sourceOptions);   
    return targetOptions;
}

Plottit.FlotWrapper.prototype.setAxisOptions = function (axisStr, varOptions) {
    Plottit.logger.trace('Plottit.FlotWrapper.setAxisOptions -- ');
    this.assertAxisStringIsValid(axisStr);
    this._axisOptionCache[axisStr].panRange = varOptions.panRange;
    this._axisOptionCache[axisStr].zoomRange = varOptions.zoomRange;
    if (this.plot) {
        var axis = this.getAxisByName(axisStr);
        axis.options = this._mergeOptions(varOptions, axis.options);
        this._updateFlotAxisOptions(axisStr);
    }
}

/*
Plottit.FlotWrapper.prototype.logRange = function () {
    Plottit.logger.trace('Plottit.FlotWrapper.logRange');
    var range = this.getYRange();
    Plottit.logger.debug('def range: ' + range[0] + ' ' + range[1]);
    range = this.getCalculatedYRange();
    Plottit.logger.debug('cal range: ' + range[0] + ' ' + range[1]);
}*/

Plottit.FlotWrapper.prototype.getCalculatedXRange = function () {
    var xAxis = this.plot.getXAxes()[0]; 
    return [xAxis.min, xAxis.max];
}

Plottit.FlotWrapper.prototype.getCalculatedYRange = function () {
    var yAxis = this.plot.getYAxes()[0]; 
    return [yAxis.min, yAxis.max];
}


Plottit.FlotWrapper.prototype.getXRange = function () {
    var axes = this.plot.getAxes();                    
    var xAxis = axes.xaxis;
    return [xAxis.options.min, xAxis.options.max];
}

Plottit.FlotWrapper.prototype.getYRange = function () {
    var axes = this.plot.getAxes();
    var yAxis = axes.yaxis;
    return [yAxis.options.min, yAxis.options.max];
}

Plottit.FlotWrapper.prototype.setXRange = function (minX, maxX) {
    var axes = this.plot.getAxes();
    var xAxis = axes.xaxis;
    xAxis.options.min = minX;
    xAxis.options.max = maxX;
}

Plottit.FlotWrapper.prototype.setYRange = function (minY, maxY) {
    var axes = this.plot.getAxes();
    var yAxis = axes.yaxis;
    yAxis.options.min = minY;
    yAxis.options.max = maxY;
}

Plottit.FlotWrapper.prototype.setRanges = function (ranges) {
    Plottit.logger.trace("FlotWrapper.setRanges -- ranges");

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

Plottit.FlotWrapper.prototype.resetRange = function (axisStr) {

    Plottit.assert(axisStr == 'x' || axisStr == 'y', "Invalid axisStr: " + axisStr);
    if (axisStr == 'x') {
        this.setXRange(null, null);
    } else {
        this.setYRange(null, null);
    }
}


// TODO: refactor to updateAxesScale? (make autoscale flotWrapper member)
Plottit.FlotWrapper.prototype.setAxesAutoscale = function (autoScale) {
    Plottit.logger.trace("FlotWrapper.setAxesAutoscale: " + autoScale.toString());

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

Plottit.FlotWrapper.prototype.addAxisDivs = function () {

    var flotWrapper = this;
    var plot = this.plot;
    if (!plot) return;
    var placeholder = plot.getPlaceholder(); 
    var overlay = placeholder.children("canvas.overlay");        

    function getBoundingBoxForAxis(plot, axis) {
        var left = axis.box.left, top = axis.box.top,
            right = left + axis.box.width, bottom = top + axis.box.height;
        return { left: left, top: top, width: right - left, height: bottom - top };
    }    

    $(".axisTarget").remove();  // Remove old divs
    
    $.each(plot.getAxes(), function (i, axis) {
        if (!axis.show)
            return;
        
        var box = getBoundingBoxForAxis(plot, axis);
        
        $('<div class="axisTarget" style="position:absolute;left:' 
                + box.left + 'px;top:' + box.top + 'px;width:' + box.width +  'px;height:' + box.height + 'px"></div>')
            .css({ backgroundColor: "hsl(210, 100%, 50%)", opacity: 0, 'z-index': 1 })
            .appendTo(plot.getPlaceholder())
            .hover(
                function () { 
                    $(this).css({ opacity: 0.3 });
                    if (axis.direction == 'x') { // fix other axis
                        plot.getAxes().yaxis.options.zoomRange = false;
                    } else {
                        plot.getAxes().xaxis.options.zoomRange = false;
                    }
                },
                function () { 
                    $(this).css({ opacity: 0 });
                    flotWrapper._updateFlotAxisZoomOptions( (axis.direction == 'x') ? 'y':'x');
                }
            )
            .dblclick(function () { 
                // Double click resets the scale for this axis
                flotWrapper.resetRange(axis.direction);
                flotWrapper.drawPlot(true);
            })
            .bind("dragstart", function (e) { 
                e.stopPropagation(); 
                if (axis.direction == 'x') { // fix other axis
                    plot.getAxes().yaxis.options.panRange = false;
                } else {
                    plot.getAxes().xaxis.options.panRange = false;
                }                
                overlay.trigger(e) 
            } )
            .bind("drag",      function (e) { e.stopPropagation(); overlay.trigger(e) } )
            .bind("dragend",   function (e) { overlay.trigger(e) } ) // don't end propagation so it reaches the body.dragend handler             
            .mousewheel(function (e, delta) { e.stopPropagation(); overlay.trigger(e, delta); });            
    });
}    


// Needed when the selection plug-in is used.
Plottit.FlotWrapper.prototype.onPlotSelect = function (event, ranges) {
    Plottit.logger.trace("onPlotSelect --");
    this.setRanges(ranges);
    this.plot.clearSelection(true);
    this.drawPlot(true); // rescale
}


