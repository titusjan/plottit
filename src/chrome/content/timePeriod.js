if ('undefined' == typeof(Listit)) { var Listit = {}; } // Listit name space




// A formatter for a time period
Listit.TimePeriod = function (microSeconds) { // Constructor

    var sec = microSeconds / 1000;
    
    var divYears = sec / Listit.TimePeriod.SECONDS_PER_YEAR;
    var modYears = sec % Listit.TimePeriod.SECONDS_PER_YEAR;
    this.years = Listit.roundToZero(divYears);

    var divMonths = modYears / Listit.TimePeriod.SECONDS_PER_MONTH;
    var modMonths = modYears % Listit.TimePeriod.SECONDS_PER_MONTH;
    this.months = Listit.roundToZero(divMonths);
    
    var divDays = modMonths / Listit.TimePeriod.SECONDS_PER_DAY;
    var modDays = modMonths % Listit.TimePeriod.SECONDS_PER_DAY;
    this.days = Listit.roundToZero(divDays);
    
    var divHours = modDays / Listit.TimePeriod.SECONDS_PER_HOUR;
    var modHours = modDays % Listit.TimePeriod.SECONDS_PER_HOUR;
    this.hours = Listit.roundToZero(divHours);
    
    var divMinutes = modHours / Listit.TimePeriod.SECONDS_PER_MINUTE;
    var modMinutes = modHours % Listit.TimePeriod.SECONDS_PER_MINUTE;
    this.minutes = Listit.roundToZero(divMinutes);
    this.seconds = Listit.roundToZero(modMinutes);
}


Listit.TimePeriod.SECONDS_PER_MINUTE = 60;
Listit.TimePeriod.MINUTES_PER_HOUR   = 60;
Listit.TimePeriod.HOURS_PER_DAY      = 24;
Listit.TimePeriod.DAYS_PER_YEAR      = 365.25;
Listit.TimePeriod.MONTHS_PER_YEAR    = 12;

Listit.TimePeriod.DAYS_PER_MONTH     = Listit.TimePeriod.DAYS_PER_YEAR / Listit.TimePeriod.MONTHS_PER_YEAR;
Listit.TimePeriod.SECONDS_PER_HOUR   = Listit.TimePeriod.SECONDS_PER_MINUTE * Listit.TimePeriod.MINUTES_PER_HOUR;
Listit.TimePeriod.SECONDS_PER_DAY    = Listit.TimePeriod.SECONDS_PER_HOUR * Listit.TimePeriod.HOURS_PER_DAY;
Listit.TimePeriod.SECONDS_PER_MONTH  = Listit.TimePeriod.SECONDS_PER_DAY * Listit.TimePeriod.DAYS_PER_MONTH;
Listit.TimePeriod.SECONDS_PER_YEAR   = Listit.TimePeriod.SECONDS_PER_MONTH * Listit.TimePeriod.MONTHS_PER_YEAR;

Listit.TimePeriod.prototype.toString = function () {
    return this.toStringMedium2();
    
}

Listit.TimePeriod.prototype.pad0 = function(n) {
    return n<10 ? '0'+n : n;
}


Listit.TimePeriod.prototype.toStringMedium2 = function () {

    if (this.years) 
        return this.years + " yr " + this.months + " mon" ;
    else if (this.months)
        return this.months + " mon " + this.days + " day" ;
    else if (this.days)
        return this.days + " day " +  this.hours + " hr" ;
    else if (this.hours)
        return this.hours + " hr " +  this.minutes + " min" ;
    else if (this.minutes)
        return this.minutes + " min " +  this.seconds + " sec" ;
    else
        return this.seconds + " sec";
};

Listit.TimePeriod.prototype.toStringLong2 = function () {

    if (this.years) 
        return this.years + " years " + this.pad0(this.months) + " months" ;
    else if (this.months)
        return this.months + " months " + this.pad0(this.days) + " days" ;
    else if (this.days)
        return this.days + " days " + this.pad0(this.hours) + " hours" ;
    else if (this.hours)
        return this.hours + " hours " + this.pad0(this.minutes) + " minutes" ;
    else if (this.minutes)
        return this.minutes + " minutes " + this.pad0(this.seconds) + " seconds" ;
    else
        return this.seconds + " seconds";
};

Listit.TimePeriod.prototype.toStringLong1 = function () {

    if (this.years) 
        return this.years + " years" ;
    else if (this.months)
        return this.months + " months" ;
    else if (this.days)
        return this.days + " days";
    else if (this.hours)
        return this.hours + " hours";
    else if (this.minutes)
        return this.minutes + " minutes";
    else
        return this.seconds + " seconds";
};


Listit.TimePeriod.prototype.getYears = function () {
    return this.years;
};

Listit.TimePeriod.prototype.getMonths = function () {
    return this.months;
};

Listit.TimePeriod.prototype.getDays = function () {
    return this.days; // Day of the month
};

Listit.TimePeriod.prototype.getHours = function () {
    return this.hours;
};

Listit.TimePeriod.prototype.getMinutes = function () {
    return this.minutes;
};

Listit.TimePeriod.prototype.getSeconds = function () {
    return this.seconds;
};
