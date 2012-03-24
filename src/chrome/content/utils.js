// TODO: the current implementation is very tailored to Plottit; make more generic.

if ('undefined' == typeof(Plottit)) { var Plottit = {}; } // Plottit name space

Plottit.assert = function(expression, message) {

    if (!expression) {
        Plottit.logger.error(message);
        throw new Error(message);
    }
}

// Returns obj[propName], returns null if object does not exist
Plottit.safeGet = function(obj, propName) {

    if (obj === null) {
        Plottit.logger.warn(obj.toString() + ' object does not have property: ' + propName);
        return null;
    } else { 
        return obj[propName];
    }
}

// Returns obj[propName] if the property exists, otherwise returns defaultValue
Plottit.getProp = function(obj, propName, defaultValue) {

    if (obj[propName] !== undefined) {
        return obj[propName];
    } else {
        return defaultValue;
    }
}

// Returns false if the 'checked' attribute is false or no present
// the 'checked' attribute must be set to false if persistence is requered,
// if it is just unchecked XUL won't remember this :-(
Plottit.getCheckboxValue = function(checkbox) {

    if (checkbox.hasAttribute('checked')) {
        return Plottit.stringToBoolean(checkbox.getAttribute('checked'))
    } else {
        return false;
    }
}

// Converts 'true' or 'false' to boolean value
Plottit.stringToBoolean = function(boolStr) {

    Plottit.assert(boolStr == 'true' || boolStr == 'false', 
        "Expected 'true' or 'false', got'" + boolStr + "'");
    return (boolStr == 'true');
}

// Converts boolean value to 'true' or 'false'
Plottit.booleanToString = function(boolStr) {

    return boolStr ? 'true' : 'false';
}

	
Plottit.XSSDecode = function(s) {

    if (!s) return "";
    
    s = s.replace(/&amp;/g,  "&"); 
    s = s.replace(/&#39;/g,  "'"); 
    s = s.replace(/&quot;/g, '"');
    s = s.replace(/&lt;/g,   "<");
    s = s.replace(/&gt;/g,   ">");
    return s;
}



/* not used
// Loads jQuery into chrome.
// Use with: doc.defaultView.Plottit_jQuery = Plottit.loadjQuery(doc.defaultView);
// From: http://forums.mozillazine.org/viewtopic.php?f=19&t=2105087
Plottit.loadjQuery = function(wnd) {
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
        .getService(Components.interfaces.mozIJSSubScriptLoader);
    loader.loadSubScript("chrome://plottit/content/jquery-1.6.2.min.js", wnd);
    var jQuery = wnd.wrappedJSObject.jQuery.noConflict(true);
    // Load jQuery plugins here...
    //loader.loadSubScript("chrome://clhelper/content/jquery/jquery.hoverIntent.js", jQuery);
    return jQuery;
};
*/


//////////////
// DateTime //
//////////////

/* Not used. Obsolete by dateFormat.js
Plottit._pad0 = function(n) {
    return n<10 ? '0'+n : n;
}

Plottit.ISODateString = function(d) {
    var pad = Plottit._pad0;
    return d.getUTCFullYear() + '-'
        + pad(d.getUTCMonth() +1 ) + '-'
        + pad(d.getUTCDate()) + 'T'
        + pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds()) + 'Z'
}

Plottit.UtcDateString = function(d) {
    var pad = Plottit._pad0;
    return d.getUTCFullYear() + '-'
        + pad(d.getUTCMonth() +1 ) + '-'
        + pad(d.getUTCDate()) + ' '
        + pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds())
}

Plottit.LocalDateString = function(d) {
    var pad = Plottit._pad0;
    return d.getFullYear() + '-'
        + pad(d.getMonth() +1 ) + '-'
        + pad(d.getDate()) + ' '
        + pad(d.getHours()) + ':'
        + pad(d.getMinutes()) + ':'
        + pad(d.getSeconds())
}
*/

////////////////
// Generators //
////////////////

// Can be used for array comprehension. 
// Needs javascript 1.7
// See: https://developer.mozilla.org/en/New_in_JavaScript_1.7
// Also: https://developer.mozilla.org/en/JavaScript/Guide/Iterators_and_Generators

Plottit.range = function(begin, end) {
    for (let i = begin; i < end; ++i) {
        yield i;
    }
}

//////////
// Math //
//////////

Plottit.log10 = function (x) {
    return Math.LOG10E * Math.log(x);
}


// Makes a histogram of an array of numbers. It returns an array of tuples where 
// each tuple is [binStart, binCount]. Only bins having a binCount are returned.
// The data parameter should be an array of floats. Bins specifies the width of the 
// bins of the histogram. The offset parameter is optional (default=0); one of the 
// bins (k=0) starts at this offset. The bins are thus defined as the intervals: 
//   [binWidth*k+offset, binWidth*(k+1)+offset) where k is a certain integer. 
//
Plottit.createHistogram = function (data, binWidth, offset) {

    if (!offset) offset = 0;
    
    // Put data in bins
    var binNumbers = [ Math.floor( (d-offset)/binWidth ) for each (d in data)];

    // Count occurences
    var occurs = {};
    for (let [i, binNr] in Iterator(binNumbers)) {
        if (binNr in occurs) {
            occurs[binNr] += 1;
        } else {
            occurs[binNr] = 1;
        }   
    }
   
    // Convert occurences dictionary to array of [binStart, binCount] tuples
    var histogram = [ [binNr * binWidth + offset, binCount] for each 
        ([binNr, binCount] in Iterator(occurs))];
    
     // Sort by binStart
    histogram.sort( function (a, b) { return a[0] - b[0] })

    return histogram;
}


/////////////
// Sorting //
/////////////

Plottit.roundToZero = function(x) {
    if (x>0) {
        return Math.floor(x);
    } else {
        return -Math.floor(-x);
    }
}


Plottit.swapArgs = function(fun) {
    return function(a, b) { return fun(b,a); }
}


Plottit.compare = function(a, b) {
    if (a == b) 
        return 0;
    if (a < b) 
        return -1 
    else 
        return 1;
}

Plottit.compareNumbers = function(a, b) {
    return a-b;
}

Plottit.compareDates = function(a, b) {
    return a.valueOf() - b.valueOf();
}

Plottit.compareStrings = function(a, b) {
    if (a == b) 
        return 0;
    if (a < b) 
        return -1 
    else 
        return 1;
}

Plottit.compareIDs = function(a, b) {
    var lengthComparison = a.length - b.length;
    if (lengthComparison == 0) 
        return Plottit.compareStrings(a, b);
    else
        return lengthComparison;
}

Plottit.compareCaseInsensitiveStrings = function(a, b) {
    return Plottit.compareStrings(a.toLowerCase(), b.toLowerCase());
}

// Create function that sorts by f2 if a and b are equal in terms of f1
Plottit.combineComparisonFunctions = function(f1, f2) {
    
    return function (a, b) {
        var res = f1(a, b);
        if (res != 0) {
            return res;
        } else {
            return f2(a, b);
        }
    }
}

/////////
// XUL //
/////////

Plottit.installToolbarButton = function(toolbarId, id, afterId, beforePermanent) 
{  
    // from: https://developer.mozilla.org/en/Code_snippets/Toolbar#Adding_button_by_default
    if (!document.getElementById(id)) {  
        var toolbar = document.getElementById(toolbarId);  
  
        var before = toolbar.firstChild;  
        if (afterId) {  
            let elem = document.getElementById(afterId);  
            if (elem && elem.parentNode == toolbar)  
                before = elem.nextElementSibling;  
        }  
  
        toolbar.insertItem(id, before);  
        toolbar.setAttribute("currentset", toolbar.currentSet);  
        document.persist(toolbar.id, "currentset");  
  
        if (toolbarId == "addon-bar")  
            toolbar.collapsed = false;  
    }  
} 

Plottit.installToolbarButtonAtEnd = function(toolbarId, id) 
{  
    if (!document.getElementById(id)) {  
        var toolbar = document.getElementById(toolbarId);  
  
        toolbar.insertItem(id, null, null, false);  // Add to the end of the toolbar
        toolbar.setAttribute("currentset", toolbar.currentSet);  
        document.persist(toolbar.id, "currentset");  
  
        if (toolbarId == "addon-bar")  
            toolbar.collapsed = false;  
    }  
}  

/////////////
// Logging //
/////////////

/*
Utils.js defines two logging mechanisms:
    Plottit.logger: The log4moz logger object which can be imported only in XUL
    Plottit.fbLog: The firebug log function which is useful for inspecting data
    
Use Plottit.initializeLoggers to intialize them. The bXul parameter should be true 
when called from a firefox extension, false when called from a stand alone html page.

When a html page is displayed in a iFrame in the FF extension, for instance in 
plotframe.html, initializeLoggers should be called in the page but the loggers can be 
redefined later in Plottit.onLoad.
*/

// Setup log4moz and firebug console logging.
// Also works when utils.js is imported on stand alone html page.
// If debugMode is truee, fbLog will not output messages.
Plottit.initializeLoggers = function (bXul, level, debugMode) {

    if (bXul) {
        // When intializing loggers in a firefox extension
        if (level == null) level = 'All';
        
        if ('undefined' == typeof(Plottit.Log4Moz)) {
            Components.utils.import("resource://plottit/log4moz.js", Plottit);
            Plottit._configureRootLogger();
            Plottit.logger = Plottit.Log4Moz.repository.getLogger('Plottit');
            
            var lvl = Plottit.Log4Moz.Level[level];
            if (lvl == null) lvl = 50; // Warn
            Plottit.logger.level = lvl;
        }
        
        if (debugMode) {
            if ('undefined' == typeof(Firebug)) {
                Plottit.fbLog = function(msg) { Plottit.logger.info('fbLog: ' + msg); } 
            } else {
                Plottit.fbLog = function(msg) { Firebug.Console.log(msg) } ;
            }
        } else {
            Plottit.fbLog = function(msg) { } // Do nothing.
        }
        
        
    } else {
        // When called from a stand-alone html page
    
        if (('undefined' == typeof(console)) || !debugMode) {
            Plottit.fbLog = function(msg) { } // Do nothing.
        } else {
            Plottit.fbLog = console.log;
        }
        
        // Mockup logger with the same routines
        Plottit.fbConsoleLogger = function (level) { // Constructor

            var levels = {
                Fatal : 70,
                Error : 60,
                Warn  : 50,
                Info  : 40,
                Config: 30,
                Debug : 20,
                Trace : 10,
                All   :  0,
            }
            var noOp = function () { } // do nothing
            
            this.fatal  = (levels[level] <= levels['Fatal'])  ? Plottit.fbLog : noOp;
            this.error  = (levels[level] <= levels['Error'])  ? Plottit.fbLog : noOp;
            this.warn   = (levels[level] <= levels['Warn'])   ? Plottit.fbLog : noOp;
            this.info   = (levels[level] <= levels['Info'])   ? Plottit.fbLog : noOp;
            this.config = (levels[level] <= levels['Config']) ? Plottit.fbLog : noOp;
            this.debug  = (levels[level] <= levels['Debug'])  ? Plottit.fbLog : noOp;
            this.trace  = (levels[level] <= levels['Trace'])  ? Plottit.fbLog : noOp;
        }
        Plottit.logger = new Plottit.fbConsoleLogger(level);   
    }
}    


Plottit._configureRootLogger = function () {
    
    let root = Plottit.Log4Moz.repository.rootLogger;
    
    if (root.isConfigured) return; // Shared root logger has been configured once already
    root.isConfigured = true;

    // Loggers are hierarchical, lowering this log level will affect all output
    root.level = Plottit.Log4Moz.Level["All"];

    let formatter = new Plottit.Log4Moz.BasicFormatter();
    //let formatter = new Plottit.LogFormatter();
    
    //let capp = new Plottit.Log4Moz.ConsoleAppender(formatter); // to the JS Error Console
    //capp.level = Plottit.Log4Moz.Level["Debug"];
    //root.addAppender(capp);
    
    let dapp = new Plottit.Log4Moz.DumpAppender(formatter); // To stdout
    dapp.level = Plottit.Log4Moz.Level["Trace"];
    root.addAppender(dapp);
}

Plottit.logException = function(ex) {
    Plottit.logger.error('EXCEPTION IN ' + ex.fileName + ' line ' + ex.lineNumber + ' : ' + ex.message);
    Plottit.fbLog(ex);
}

/*
/////////////////////////
// Plottit.LogFormatter //
/////////////////////////

Plottit.LogFormatter = function (dateFormat) { // Constructor
    this.dateFormat = dateFormat;
}

Plottit.LogFormatter.prototype.__proto__ = Plottit.Log4Moz.Formatter.prototype;

Plottit.LogFormatter.prototype.format = function (message) {
    return "YYYYYYY" + message.time + "\t" + message.loggerName + "\t" + message.levelDesc 
           + "\t" + message.message + "\n";
}
*/