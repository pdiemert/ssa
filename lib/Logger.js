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
Logger.prototype.error = function(msg,scope)
    {
        this.out('##err##', msg, scope);
    };
Logger.prototype.warning = function(msg, scope)
    {
        this.out('##warn##', msg, scope);
    };
Logger.prototype.info = function(msg, scope)
    {
        this.out('##info##', msg, scope);
    };
Logger.prototype.good = function(msg, scope)
    {
        this.out('##good##', msg, scope);
    };

var _styles = {'##err##': 'red', '##warn##' : 'yellow', '##good##' : 'green'};

function styleMsg(m)
    {
        var msg = '';
        if (m.scope)
            msg += '(' + m.scope + ') ';
            
        msg += m.msg.toString();
        var style = _styles[m.type];
        if (!style)
            return msg;
        else
            return p_u.style(msg, style);
    }
    
Logger.prototype.out = function(type, msg, scope)
    {
        var m = {type:type, msg:msg, ts:this.timeStamp(),scope:scope};
        this.log.push(m);
        if (this.echoToConsole)
            {
                if (_.isObject(m.msg))
                    p_eyes.inspect(m.msg);
                else
                    console.log(styleMsg(m));
            }
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

Logger.prototype.echoToConsole = false;

Logger.prototype.all = function(type)
    {
        var a = [];
        for (var i = 0; i < this.log.length; i++)
            {
                if (this.log[i].type == type)
                    {
                        a.push(this.log[i]);
                    }
            }

        return a;
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
                this.log.push(a[i]);
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
        
        ['syncTime', 'timestamp', 'out', 'dumpToConsole', 'first', 'all', 'forEach', 'append'].forEach(function(e)
        {
            scopethis[e] = function()
            {
                return _logger[e].apply(_logger, arguments);
            };
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