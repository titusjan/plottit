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

/////////////
// Sorting //
/////////////


Listit.swapArgs = function(fun) {
    return function(a, b) { return fun(b,a); }
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

Listit.compareCaseInsensitiveStrings = function(a, b) {
    return Listit.compareStrings(a.toLowerCase(), b.toLowerCase());
}

/////////////
// Logging //
/////////////

// Log to the Firebug console if defined
Listit.fbLog = function(msg) {

    if ('undefined' == typeof(Firebug)) {
        Listit.logger.debug('Listit.fbLog: Firebug not installed');
        Listit.logger.info(msg);
    } else {
        Firebug.Console.log(msg);
    }
}

Listit.configureRootLogger = function () {
    
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
