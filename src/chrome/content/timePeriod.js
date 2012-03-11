if ('undefined' == typeof(Plottit)) { var Plottit = {}; } // Plottit name space




// A formatter for a time period
Plottit.TimePeriod = function (microSeconds) { // Constructor

    var sec = microSeconds / 1000;
    
    var divYears = sec / Plottit.TimePeriod.SECONDS_PER_YEAR;
    var modYears = sec % Plottit.TimePeriod.SECONDS_PER_YEAR;
    this.years = Plottit.roundToZero(divYears);

    var divMonths = modYears / Plottit.TimePeriod.SECONDS_PER_MONTH;
    var modMonths = modYears % Plottit.TimePeriod.SECONDS_PER_MONTH;
    this.months = Plottit.roundToZero(divMonths);
    
    var divDays = modMonths / Plottit.TimePeriod.SECONDS_PER_DAY;
    var modDays = modMonths % Plottit.TimePeriod.SECONDS_PER_DAY;
    this.days = Plottit.roundToZero(divDays);
    
    var divHours = modDays / Plottit.TimePeriod.SECONDS_PER_HOUR;
    var modHours = modDays % Plottit.TimePeriod.SECONDS_PER_HOUR;
    this.hours = Plottit.roundToZero(divHours);
    
    var divMinutes = modHours / Plottit.TimePeriod.SECONDS_PER_MINUTE;
    var modMinutes = modHours % Plottit.TimePeriod.SECONDS_PER_MINUTE;
    this.minutes = Plottit.roundToZero(divMinutes);
    this.seconds = Plottit.roundToZero(modMinutes);
}


Plottit.TimePeriod.SECONDS_PER_MINUTE = 60;
Plottit.TimePeriod.MINUTES_PER_HOUR   = 60;
Plottit.TimePeriod.HOURS_PER_DAY      = 24;
Plottit.TimePeriod.DAYS_PER_YEAR      = 365.25;
Plottit.TimePeriod.MONTHS_PER_YEAR    = 12;

Plottit.TimePeriod.DAYS_PER_MONTH     = Plottit.TimePeriod.DAYS_PER_YEAR / Plottit.TimePeriod.MONTHS_PER_YEAR;
Plottit.TimePeriod.SECONDS_PER_HOUR   = Plottit.TimePeriod.SECONDS_PER_MINUTE * Plottit.TimePeriod.MINUTES_PER_HOUR;
Plottit.TimePeriod.SECONDS_PER_DAY    = Plottit.TimePeriod.SECONDS_PER_HOUR * Plottit.TimePeriod.HOURS_PER_DAY;
Plottit.TimePeriod.SECONDS_PER_MONTH  = Plottit.TimePeriod.SECONDS_PER_DAY * Plottit.TimePeriod.DAYS_PER_MONTH;
Plottit.TimePeriod.SECONDS_PER_YEAR   = Plottit.TimePeriod.SECONDS_PER_MONTH * Plottit.TimePeriod.MONTHS_PER_YEAR;

Plottit.TimePeriod.prototype.toString = function () {
    return this.toStringMedium2();
    
}

Plottit.TimePeriod.prototype.pad0 = function(n) {
    return n<10 ? '0'+n : n;
}


Plottit.TimePeriod.prototype.toStringShort2 = function () {

    if (this.years) 
        return this.years + "Y:" + this.months + "M" ;
    else if (this.months)
        return this.months + "M:" + this.days + "D" ;
    else if (this.days)
        return this.days + "D:" +  this.hours + "h" ;
    else if (this.hours)
        return this.hours + "h:" +  this.minutes + "m" ;
    else if (this.minutes)
        return this.minutes + "m:" +  this.seconds + "s" ;
    else
        return this.seconds + "s";
};

Plottit.TimePeriod.prototype.toStringMedium2 = function () {

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

Plottit.TimePeriod.prototype.toStringLong2 = function () {

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

Plottit.TimePeriod.prototype.toStringLong1 = function () {

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


Plottit.TimePeriod.prototype.getYears = function () {
    return this.years;
};

Plottit.TimePeriod.prototype.getMonths = function () {
    return this.months;
};

Plottit.TimePeriod.prototype.getDays = function () {
    return this.days; // Day of the month
};

Plottit.TimePeriod.prototype.getHours = function () {
    return this.hours;
};

Plottit.TimePeriod.prototype.getMinutes = function () {
    return this.minutes;
};

Plottit.TimePeriod.prototype.getSeconds = function () {
    return this.seconds;
};
