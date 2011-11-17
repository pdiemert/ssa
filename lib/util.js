var p_clr = require('../modules/colored');


function packJS(o)
{
    var s = '';

    if (isObject(o))
    {
        var inner = '';

        for (var prop in o)
        {
            if (inner.length > 0)
                inner += ',';
            inner += '\"' + prop + '\"' + ':' + packJS(o[prop]);
        }

        s += '{' + inner + '}';
    } else if (isArray(o))
    {
        s += '[';
        for (var i = 0; i < o.length; i++)
        {
            if (i > 0)
                s += ',';
            s += packJS(o[i]);
        }
        s += ']';
    } else if (isFunction(o))
    {
        s += o.toString();
    }
    else
        s += JSON.stringify(o);

    return s;
}

function style(str, style)
{
    return p_clr[style](str);
    /*
    var styles = {
        'bold' : [1, 22], 'italic' : [3, 23], 'underline' : [4, 24], 'cyan' : [96, 39], 'yellow' : [33, 39], 'green' : [32, 39],
        'red' : [31, 39], 'red-hi' : ['1;31', 39], 'gray' : ['0;37', '0;37;40'],
        'gray-hi' : ['1;37', 39], 'green-hi' : [92, 32]
    };
    var revert = '39';
    return '\033[' + styles[style][0] + 'm' + str + '\033[' + revert + 'm';
    */
}

function unpackJS(s)
{
    var o;

    eval('o = (' + s + ');');

    return o;
}
function isFunction(f)
{
    var getType = {
    };
    return f && getType.toString.call(f) == '[object Function]';
}


function isString(o)
{
    return typeof (o) == 'string';
}

function isArray(o)
{
    return typeof (o) == 'object' && ( o instanceof Array);
}


function isObject(o)
{
    return (Object.prototype.toString.call(o) === '[object Object]' );
}

function forEach(o, fnc)
{
    if (isString(o))
        fnc(o); else if (isArray(o))
        o.forEach(fnc);
}

function toArray(a)
{
    if (!a)
        return []; else if (isArray(a))
        return a;
    else
        return [a];
}
function commify(s, app)
{
    if (s.length > 0)
        s += ', ';
    s += app;

    return s;
}
function propertyCount(o)
{
    var c = 0;
    for (var x in o)
        c++;

    return c;
}

function dumpo(o)
{
    for (var x in o)
        console.log(x + '=' + o[x]);
}
function clone(obj)
{
    if (null == obj || "object" != typeof obj)
        return obj;
    var copy = obj.constructor();
    for (var attr in obj)
    {
        if (obj.hasOwnProperty(attr))
            copy[attr] = obj[attr];
    }
    return copy;
}

function copyPrototype(toObj, fromObj)
{
    var sConstructor = fromObj.toString();
    var aMatch = sConstructor.match(/\s*function (.*)\(/);
    if (aMatch != null)
    {
        toObj.prototype[aMatch[1]] = fromObj;
    }
    for (var m in fromObj.prototype)
    {
        toObj.prototype[m] = fromObj.prototype[m];
    }
}
function stackTrace()
{
    var callstack = [];
    var isCallstackPopulated = false;
    try
    {
        i.dont.exist += 0; //doesn't exist- that's the point
    } catch(e)
    {
        if (e.stack)
        { //Firefox
            var lines = e.stack.split('\n');
            for (var i = 0, len = lines.length; i < len; i++)
            {
                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/))
                {
                    callstack.push(lines[i]);
                }
            }
            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        } else if (window.opera && e.message)
        { //Opera
            var lines = e.message.split('\n');
            for (var i = 0, len = lines.length; i < len; i++)
            {
                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/))
                {
                    var entry = lines[i];
                    //Append next line also since it has the file info
                    if (lines[i + 1])
                    {
                        entry += ' at ' + lines[i + 1];
                        i++;
                    }
                    callstack.push(entry);
                }
            }
            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }
    }
    if (!isCallstackPopulated)
    { //IE and Safari
        var currentFunction = arguments.callee.caller;
        while (currentFunction)
        {
            var fn = currentFunction.toString();
            var fname = fn.substring(fn.indexOf('function') + 8, fn.indexOf('')) || 'anonymous';
            callstack.push(fname);
            currentFunction = currentFunction.caller;
        }
    }
    return callstack.join('\n');

}


exports.packJS = packJS;
exports.unpackJS = unpackJS;
exports.isString = isString;
exports.isArray = isArray;
exports.isObject = isObject;
exports.forEach = forEach;
exports.toArray = toArray;
exports.isFunction = isFunction;
exports.style = style;
exports.commify = commify;
exports.propertyCount = propertyCount;
exports.dumpo = dumpo;
exports.clone = clone;
exports.copyPrototype = copyPrototype;
exports.stackTrace = stackTrace;