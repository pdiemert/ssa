var p_u = require('./util.js');
var p_eyes = require('eyes');
var _ = require('underscore');

function Logger(pack)
    {

        // Each item is:
        // {type:"<log message type>", msg:{<type specific>}, ts:<timestamp>}
        //
        // There are predefined types: "##warn##", "##info##", "##err##", '##good##' all use {text:"some text description"}
        //
        this.log = pack ? p_u.unpackJS(pack) : [];
        this.timeOffset = 0;

        // Set up callback
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
Logger.prototype.error = function(msg)
    {
        this.out('##err##', msg);
    };
Logger.prototype.warning = function(msg)
    {
        this.out('##warn##', msg);
    };
Logger.prototype.info = function(msg)
    {
        this.out('##info##', msg);
    };
Logger.prototype.good = function(msg)
    {
        this.out('##good##', msg);
    };

var _styles = {'##err##': 'red', '##warn##' : 'yellow', '##good##' : 'green'};

function styleMsg(m)
    {
        var style = _styles[m.type];
        if (!style)
            return m.msg.toString();
        else
            return p_u.style(m.msg.toString(), style);
    }
Logger.prototype.out = function(type, msg)
    {
        var m = {type:type, msg:msg, ts:this.timeStamp()};
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
        this.forEach(function(m)
        {
            console.log(styleMsg(m));
        });
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

module.exports = Logger;