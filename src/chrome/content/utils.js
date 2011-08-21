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


/* not used
// Loads jQuery into chrome.
// Use with: doc.defaultView.Listit_jQuery = Listit.loadjQuery(doc.defaultView);
// From: http://forums.mozillazine.org/viewtopic.php?f=19&t=2105087
Listit.loadjQuery = function(wnd) {
    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
        .getService(Components.interfaces.mozIJSSubScriptLoader);
    loader.loadSubScript("chrome://xulschoolhello/content/jquery-1.6.2.min.js", wnd);
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

/////////////
// Logging //
/////////////

/*
Utils.js defines two loggin mechanisms:
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
            Components.utils.import("resource://xulschoolhello/log4moz.js");
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
    let capp = new Log4Moz.ConsoleAppender(formatter); // to the JS Error Console
    capp.level = Log4Moz.Level["Info"];
    root.addAppender(capp);
    
    let dapp = new Log4Moz.DumpAppender(formatter); // To stdout
    dapp.level = Log4Moz.Level["Debug"];
    root.addAppender(dapp);
}

