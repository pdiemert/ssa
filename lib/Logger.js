var p_u = require('./util.js');
var p_eyes = require('eyes');
var _ = require('underscore');

function Logger(pack)
    {
        if (_.isString(pack))
            this.log = p_u.unpackJS(pack);
        else if (_.isArray(pack))
            this.log = pack;
        else
            this.log = [];

        // Each item is:
        // {type:"<log message type>", msg:{<type specific>}, ts:<timestamp>}
        //
        // There are predefined types: "##warn##", "##info##", "##err##", '##good##' all use {text:"some text description"}
        //
        this.timeOffset = 0;

        this.echo = false;

        this.__defineGetter__('logArray', function()
        {
            return this.log;
        });

    }

// Allows an alternate time basis to be used
// (i.e. relative to another machine's time)
Logger.prototype.syncTime = function(dt)
    {
        this.timeOffset = new Date().getTime() - dt.getTime();
    };
Logger.prototype.timeStamp = function()
    {
        return new Date(new Date().getTime() + this.timeOffset);
    };

        // Can be either a bool or an array, if an array than only types specified are echoed
Logger.prototype.echoToConsole = function(v)
    {
        if (p_u.isArray(v))
        {
            this.echoFilter = {};
            var self = this;
            v.forEach(function(e)
            {
                self.echoFilter[e] = true;
            });
            this.echo = true;
        }
        else
        {
            this.echoFilter = null;
            this.echo = v;
        }
    };


Logger.prototype.ErrorType = '##err##';
Logger.prototype.WarningType = '##warn##';
Logger.prototype.InfoType = '##info##';
Logger.prototype.GoodType = '##good##';

Logger.prototype.error = function(msg,scope)
    {
        this.out(this.ErrorType, msg, scope);
    };
Logger.prototype.warning = function(msg, scope)
    {
        this.out(this.WarningType, msg, scope);
    };
Logger.prototype.info = function(msg, scope)
    {
        this.out(this.InfoType, msg, scope);
    };
Logger.prototype.good = function(msg, scope)
    {
        this.out(this.GoodType, msg, scope);
    };

var _styles = {'##err##': 'red', '##warn##' : 'yellow', '##good##' : 'green'};

function styleMsg(m)
    {
        var msg = '';
        if (m.scope)
            msg += '(' + m.scope + ') ';
            
        var style = _styles[m.type];
        if (!style)
            msg += m.type + ' - ';

        msg += JSON.stringify(m.msg);

        return style ? p_u.style(msg, style) : msg;
    }

Logger.prototype.echoMessage = function(m)
{
    if (!this.echo)
        return;
    if (this.echoFilter && !this.echoFilter[m.type])
        return;

    if (_.isObject(m.msg))
        p_eyes.inspect(m.msg);
    else
        console.log(styleMsg(m));
}

Logger.prototype.out = function(type, msg, scope)
    {
        var m = {type:type, msg:msg, ts:this.timeStamp(),scope:scope};
        this.log.push(m);
        this.echoMessage(m);
    };

Logger.prototype.dumpToConsole = function()
    {
        for(var i=0; i < this.log.length; i++)
        {
            console.log(styleMsg(this.log[i]));
        }
    };

Logger.prototype.first = function(type)
    {
        for (var i = 0; i < this.log.length; i++)
            {
                if (this.log[i].type == type)
                    return this.log[i];
            }
        return null;
    };

// Takes a single type or a set of types
// Returns a new logger object with just those items
Logger.prototype.filter = function(type)
    {
        var a = [];
        var fArray = p_u.isArray(type);
        for (var i = 0; i < this.log.length; i++)
            {
                if (fArray)
                {
                    if (type.indexOf(this.log[i].type) != -1)
                        a.push(this.log[i]);
                }
                else if (this.log[i].type == type)
                    a.push(this.log[i]);
            }

        return new Logger(a);
    };

Logger.prototype.forEach = function(fnc)
    {
        this.log.forEach(fnc);
    };
    
Logger.prototype.append = function(a)
{
        if (_.isArray(a))
        {
            for(var i=0;i < a.length; i++)
            {
                this.log.push(a[i]);
                this.echoMessage(a[i]);
            }
        }
};

Logger.prototype.newScope = function(scp)
{
    var logger = this;
    
    function Scope(scp)
    {
        var _logger = logger;
        var _scope = scp;
        var scopethis = this;
        
        ['syncTime', 'timestamp', 'out', 'dumpToConsole', 'first', 'filter', 'forEach', 'append', 'echoToConsole',
        'WarningType', 'ErrorType', 'GoodType', 'InfoType'].forEach(function(e)
        {
            if (p_u.isFunction(_logger[e]))
            {
                scopethis[e] = function()
                {
                    return _logger[e].apply(_logger, arguments);
                };
            }
            else
                scopethis[e] = _logger[e];
        });
        
        ['error', 'warning', 'info', 'good'].forEach(function(e)
        {
            scopethis[e] = function(msg)
            {
                var s = '';
                if (_logger.scope)
                    s += _logger.scope + '-';
                s += _scope;
                return _logger[e].call(_logger, msg, s);
            };
        });

        scopethis.out = function(type, msg)
        {
            var s = '';
            if (_logger.scope)
                s += _logger.scope + '-';
            s += _scope;

            return _logger.out(type, msg, s);
        };
        
        this.__defineGetter__('logArray', function()
        {
            return _logger.logArray;
        });
        
        this.__defineGetter__('scope', function()
        {
            return _scope;
        });
        
    }
    
    var s = new Scope(scp);
    
    return s;
};


module.exports = Logger;