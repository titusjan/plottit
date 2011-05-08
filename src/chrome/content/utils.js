if ('undefined' == typeof(Listit)) { var Listit = {}; } // Lisit name space

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
