if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space

Listit.assert = function(expression, message) {

    if (!expression) {
        Listit.logger.error(message);
        throw new Error(message);
    }
}

// Returns obj[propName], returns null if object does not exist
Listit.safeGet = function(obj, propName) {

    if (obj === null) {
        Listit.logger.warn(obj.toString() + ' object does not have property: ' + propName);
        return null;
    } else { 
        return obj[propName];
    }
}

// Returns obj[propName] if the property exists, otherwise returns defaultValue
Listit.getProp = function(obj, propName, defaultValue) {

    if (obj[propName] !== undefined) {
        return obj[propName];
    } else {
        return defaultValue;
    }
}

// Returns false if the 'checked' attribute is false or no present
// the 'checked' attribute must be set to false if persistence is requered,
// if it is just unchecked XUL won't remember this :-(
Listit.getCheckboxValue = function(checkbox) {

    if (checkbox.hasAttribute('checked')) {
        return Listit.stringToBoolean(checkbox.getAttribute('checked'))
    } else {
        return false;
    }
}

// Converts 'true' or 'false' to boolean value
Listit.stringToBoolean = function(boolStr) {

    Listit.assert(boolStr == 'true' || boolStr == 'false', 
        "Expected 'true' or 'false', got'" + boolStr + "'");
    return (boolStr == 'true');
}

// Converts boolean value to 'true' or 'false'
Listit.booleanToString = function(boolStr) {

    return boolStr ? 'true' : 'false';
}

	
Listit.XSSDecode = function(s) {

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
// Use with: doc.defaultView.Listit_jQuery = Listit.loadjQuery(doc.defaultView);
// From: http://forums.mozillazine.org/viewtopic.php?f=19&t=2105087
Listit.loadjQuery = function(wnd) {
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
        .getService(Components.interfaces.mozIJSSubScriptLoader);
    loader.loadSubScript("chrome://listit/content/jquery-1.6.2.min.js", wnd);
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
Listit._pad0 = function(n) {
    return n<10 ? '0'+n : n;
}

Listit.ISODateString = function(d) {
    var pad = Listit._pad0;
    return d.getUTCFullYear() + '-'
        + pad(d.getUTCMonth() +1 ) + '-'
        + pad(d.getUTCDate()) + 'T'
        + pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds()) + 'Z'
}

Listit.UtcDateString = function(d) {
    var pad = Listit._pad0;
    return d.getUTCFullYear() + '-'
        + pad(d.getUTCMonth() +1 ) + '-'
        + pad(d.getUTCDate()) + ' '
        + pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds())
}

Listit.LocalDateString = function(d) {
    var pad = Listit._pad0;
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

Listit.range = function(begin, end) {
    for (let i = begin; i < end; ++i) {
        yield i;
    }
}

//////////
// Math //
//////////

Listit.log10 = function (x) {
    return Math.LOG10E * Math.log(x);
}


// Makes a histogram of an array of numbers. It returns an array of tuples where 
// each tuple is [binStart, binCount]. Only bins having a binCount are returned.
// The data parameter should be an array of floats. Bins specifies the width of the 
// bins of the histogram. The offset parameter is optional (default=0); one of the 
// bins (k=0) starts at this offset. The bins are thus defined as the intervals: 
//   [binWidth*k+offset, binWidth*(k+1)+offset) where k is a certain integer. 
//
Listit.createHistogram = function (data, binWidth, offset) {

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

Listit.roundToZero = function(x) {
    if (x>0) {
        return Math.floor(x);
    } else {
        return -Math.floor(-x);
    }
}


Listit.swapArgs = function(fun) {
    return function(a, b) { return fun(b,a); }
}


Listit.compare = function(a, b) {
    if (a == b) 
        return 0;
    if (a < b) 
        return -1 
    else 
        return 1;
}

Listit.compareNumbers = function(a, b) {
    return a-b;
}

Listit.compareDates = function(a, b) {
    return a.valueOf() - b.valueOf();
}

Listit.compareStrings = function(a, b) {
    if (a == b) 
        return 0;
    if (a < b) 
        return -1 
    else 
        return 1;
}

Listit.compareIDs = function(a, b) {
    var lengthComparison = a.length - b.length;
    if (lengthComparison == 0) 
        return Listit.compareStrings(a, b);
    else
        return lengthComparison;
}

Listit.compareCaseInsensitiveStrings = function(a, b) {
    return Listit.compareStrings(a.toLowerCase(), b.toLowerCase());
}

// Create function that sorts by f2 if a and b are equal in terms of f1
Listit.combineComparisonFunctions = function(f1, f2) {
    
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

Listit.installToolbarButton = function(toolbarId, id, afterId, beforePermanent) 
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

Listit.installToolbarButtonAtEnd = function(toolbarId, id) 
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
    Listit.logger: The log4moz logger object which can be imported only in XUL
    Listit.fbLog: The firebug log function which is useful for inspecting data
    
Use Listit.initializeLoggers to intialize them. The bXul parameter should be true 
when called from a firefox extension, false when called from a stand alone html page.

When a html page is displayed in a iFrame in the FF extension, for instance in 
plotframe.html, initializeLoggers should be called in the page but the loggers can be 
redefined later in Listit.onLoad.
*/

// Setup log4moz and firebug console logging.
// Also works when utils.js is imported on stand alone html page.
Listit.initializeLoggers = function (bXul, level) {

    if (bXul) {
        // When intializing loggers in a firefox extension
        if (level == null) level = 'All';
        
        if ('undefined' == typeof(Log4Moz)) {
            Components.utils.import("resource://listit/log4moz.js");
            Listit._configureRootLogger();
            Listit.logger = Log4Moz.repository.getLogger('Listit');
            Listit.logger.level = Log4Moz.Level[level];
        }
        
        if ('undefined' == typeof(Firebug)) {
            Listit.fbLog = function(msg) { Listit.logger.info('fbLog: ' + msg); } 
        } else {
            Listit.fbLog = function(msg) { Firebug.Console.log(msg) } ;
        }
        
    } else {
        // When called from a stand-alone html page
    
        if ('undefined' == typeof(console)) {
            Listit.fbLog = function(msg) { } // Do nothing.
        } else {
            Listit.fbLog = console.log;
        }
        
        // Mockup logger with the same routines
        Listit.fbConsoleLogger = function (level) { // Constructor

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
            
            this.fatal  = (levels[level] <= levels['Fatal'])  ? Listit.fbLog : noOp;
            this.error  = (levels[level] <= levels['Error'])  ? Listit.fbLog : noOp;
            this.warn   = (levels[level] <= levels['Warn'])   ? Listit.fbLog : noOp;
            this.info   = (levels[level] <= levels['Info'])   ? Listit.fbLog : noOp;
            this.config = (levels[level] <= levels['Config']) ? Listit.fbLog : noOp;
            this.debug  = (levels[level] <= levels['Debug'])  ? Listit.fbLog : noOp;
            this.trace  = (levels[level] <= levels['Trace'])  ? Listit.fbLog : noOp;
        }
        Listit.logger = new Listit.fbConsoleLogger(level);   
    }
}    


Listit._configureRootLogger = function () {
    
    let root = Log4Moz.repository.rootLogger;
    
    if (root.isConfigured) return; // Shared root logger has been configured once already
    root.isConfigured = true;

    // Loggers are hierarchical, lowering this log level will affect all output
    root.level = Log4Moz.Level["All"];

    let formatter = new Log4Moz.BasicFormatter();
    //let formatter = new Listit.LogFormatter();
    let capp = new Log4Moz.ConsoleAppender(formatter); // to the JS Error Console
    capp.level = Log4Moz.Level["Info"];
    root.addAppender(capp);
    
    let dapp = new Log4Moz.DumpAppender(formatter); // To stdout
    dapp.level = Log4Moz.Level["Debug"];
    root.addAppender(dapp);
}

Listit.logException = function(ex) {
    Listit.logger.error('EXCEPTION IN ' + ex.fileName + ' line ' + ex.lineNumber + ' : ' + ex.message);
    Listit.fbLog(ex);
}

/*
/////////////////////////
// Listit.LogFormatter //
/////////////////////////

Listit.LogFormatter = function (dateFormat) { // Constructor
    this.dateFormat = dateFormat;
}

Listit.LogFormatter.prototype.__proto__ = Log4Moz.Formatter.prototype;

Listit.LogFormatter.prototype.format = function (message) {
    return "YYYYYYY" + message.time + "\t" + message.loggerName + "\t" + message.levelDesc 
           + "\t" + message.message + "\n";
}
*/