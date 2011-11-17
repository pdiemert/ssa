var p_u = require('./util.js');

function Logger(pack)
{

    // Each item is:
    // {type:"<log message type>", msg:{<type specific>}, ts:<timestamp>}
    //
    // There are predefined types: "##warn##", "##info##", "##err##", '##good##' all use {text:"some text description"}
    //
    this.log = pack ? p_u.unpackJS(pack) : [];
    this.timeOffset = 0;
}
// Allows an alternate time basis to be used
// (i.e. relative to another machine's time)
Logger.constructor.syncTime = function(dt)
{
    this.timeOffset = new Date().getTime() - dt.getTime();
};
Logger.prototype.timeStamp = function()
{
    return new Date(new Date().getTime() + this.timeOffset);
};
Logger.prototype.error = function(msg)
{
    this.log.push({type:"##err##", msg:{text:msg}, ts:this.timeStamp()});
};
Logger.prototype.warning = function(msg)
{
    this.log.push({type:"##warn##", msg:{text:msg}, ts:this.timeStamp()});
};
Logger.prototype.info = function(msg)
{
    this.log.push({type:"##info##", msg:{text:msg}, ts:this.timeStamp()});
};
Logger.prototype.good = function(msg)
{
    this.log.push({type:"##good##", msg:{text:msg}, ts:this.timeStamp()});
};
Logger.prototype.out = function(type, msg)
{
    this.log.push({type:type, msg:msg, ts:this.timeStamp()});
};

Logger.prototype.pack = function()
{
    return p_u.packJS(this.log);
};

Logger.prototype.dumpToConsole = function()
{
    this.forEach(function(m)
    {
        switch (m.type)
        {
            case '##err##':
                console.log(p_u.style(m.msg.text, 'red'));
                break;
            case '##warn##':
                console.log(p_u.style(m.msg.text, 'yellow'));
                break;
            case '##good##':
                console.log(p_u.style(m.msg.text, 'green'));
                break;
            case '##info##':
                console.log(p_u.style(m.msg.text, 'gray'));
                break;

        }
    });
};

Logger.prototype.first = function(type)
{
    for(var i=0; i < this.log.length; i++)
    {
        if (this.log[i].type == type)
            return this.log[i];
    }
    return null;
};

Logger.prototype.all = function(type)
{
    var a = [];
    for(var i=0; i < this.log.length; i++)
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

exports.Logger = Logger;