/*global output console require exports*/

require('./array.js');
require('./string.js');
var p_req = require('../modules/request');
var p_assert = require('../modules/assert-extras');
var p_url = require('./url.js');
var p_u = require('./util.js');
var p_log = require('./Logger.js');
var p_jpath = require('./JSONPath.js');
var p_eyes = { inspect:require('eyes').inspector({maxLength:99999999}) };

/********************************************************************************
 * Suite Runner
 *
 * Options passed on construct can be:
 *
 * verbosity                Verbosity level, each higher level will include all lower level messages, can be:
 *                              -1  Absolutely no output
 *                              0   No messages, just show errors and summary
 *                              1   All test results
 *                              2   All info messages
 *                              3   All request/responses
 * host                     Default host to use if not specified
 * port                     Default port to use if not specified
 * proxy                    Optional proxy server to use, ex: http://localhost:8888
 * log                      An optional Logger object to use for logging
 * loadTest                 LoadTester object if there is one available
 * repeat                   Number of times to repeat the suite
 * resourceProp             For use with the follow property, the property name used for resource URLs, default is ":self"
 * typeProp                 For use with the follow property, the property name used in the Accept header for the resource, default is ":type"
 * reqclock                 An optional request clock object.  If the 'clock' property exists on a test, the named
 *                          clock on this object is updated with the number of requests and total time taken.  For example:
 *                          var myclocks = {};
 *                          runSuite([{test:'foo', get:'google.com',clock:'googleget'} ], {reqclock:myclocks})
 *                          // When finished, myclocks.googleget.count = number of requests, myclocks.googleget.elapsed = total time of requests
 *
 *
 * Each object in the suite can have the following properties:
 *
 * test                     Name for the test if it is a test
 *
 * template                 Name for the template if it is a template
 *
 * dependsOn                Name or array of test names that this test is dependent on finishing first
 *
 * get/post/put/del         Issue http request, either get, post, put, del.  Can precede JSON (e.g. getJSON) if response expected is JSON
 *                          If a function is specified it is evaluated and return value used as url, just prior to invocation
 *
 * headers                  An object or function specifying name/values for headers to pass
 *
 * follow                   Can be either:
 *
 *                          - A Javascript expression string to evaluate which returns either a URL or an object used for making the next request
 *                          Within scope of the expression is an object called 'data' which is the result of the request
 *                          specified by the dependsOn property.
 *
 *                          - A JSONPath in the format of "jpath:json path".  The root object ($) is result of the request
 *                          specified by the dependsOn property. (read about JSON Path @ http://goessner.net/articles/JsonPath/)
 *
 *                          If dependsOn is an array, the first dependency will be used.
 *
 *                          The GET http method will be used unless a data body specified in which case POST is used.
 *                          If the expression evaluates to an object the object will be interrogated for a property
 *                          specified by the resourceProp name in the Options.
 *                          If a typeProp property exists then this will be used as the Accept header.
 *
 *                          For example, if the dependsOn test returned JSON like:
 *                          {
 *                              foo : { ":self" : "/blah/bar", ":type", "application/vnd.biff+json" }
 *                          }
 *
 *                          Then the follow expression "data.foo" would attempt to get the document "/blah/bar"
 *                          Useful for REST/JSON patterns
 *
 * data                     Body to send with the request, can be a function
 *
 * expectCode               The http response code expected (default is 200)
 *
 * expectJSON               The body of the response is parsed as JSON, if an object is specified, they are compared, if a function is specied
 *                          the function is called with (obj) where obj is the response body JSON object
 *
 * expectType               A mime type that should be returned
 *
 * setup                    A function, if specified, that will be run on start of the test
 * setupSync                A function, if specified, that will be run on start after which the test will be completed (no async call made)
 *
 * teardown                 A function, if specified, that will be run on end of the test
 *
 * expect                   Can be a function or an object.  If an object then each property is a text description of
 *                          the case being checked and the value is a function to call.  Call is made after the setup function
 *                          or after this.callback (if used) returns.  The function is called with two parameters:
 *                          data    - The body of the request response, if JSON it will be the Javascript object
 *                          headers - An object with a property / value pair for each header received
 *                          code    - HTTP status code
 *
 * clock                    The name of clock object on the options.reqclock property.  Will increment the 'count' of
 *                          requests and add to the 'elapsed' time
 *
 * wait                     Number of milliseconds to wait before starting (after dependencies execute)
 *
 * dump                     If set to true, the response is dumped to the console
 *                          If the response is JSON then a colored, indented JSON output is provided. useful for debugging
 *
 ******* All callbacks are called with the 'this' reference set to an object with the following properties:
 *
 * responses                An object, each property name is the name of a test, the value is an array of API responses
 *
 * requests                 An object, each property name is the name of a test, the value is an array of Request objects for each request made:
 *                          host, port, path, method, uri
 *
 * log                      A logging object whose methods are:
 *                              error, info, warning, good - adds a message to the log, pass a message as parameter
 *                              logArray - returns an array of objects, each one has:
 *                                  type - string type of message, can be ##error##, ##info##, ##warning##, ##good##, or user defined
 *                                  msg - a string in most cases, can be any object
 *                                  ts - timestamp of when the message was logged
 *                                  scope - string describing the context of the message
 *                              output(type, msg) - adds a message to the log, type is a string for type of message, and msg is some object
 *
 * testdata                 An object that can be used by tests to keep state
 *
 * callback                 A callback to be used as where needed, see the 'expect' property above
 *
 * resExp                   Evaluates an expression in the format allowed by 'follow' except that that
 *                          the 'data' value will be the current response body
 *
 * assert                   An object with the standard ASSERT methods:
 *                              fail: Function,
 *                              ok: Function,
 *                              equal: Function,
 *                              notEqual: Function,
 *                              deepEqual: Function,
 *                              notDeepEqual: Function,
 *                              strictEqual: Function,
 *                              notStrictEqual: Function,
 *                              throws: Function,
 *                              doesNotThrow: Function,
 *                              ifError: Function,
 *                              isNull: Function,
 *                              isNotNull: Function,
 *                              isTypeOf: Function,
 *                              isNotTypeOf: Function,
 *                              isObject: Function,
 *                              isFunction: Function,
 *                              isString: Function,
 *                              isBoolean: Function,
 *                              isNumber: Function,
 *                              isUndefined: Function,
 *                              isNotUndefined: Function,
 *                              isArray: Function,
 *                              isNaN: Function,
 *                              isNotNaN: Function,
 *                              match: Function,
 *                              noMatch: Function,
 *                              isPrototypeOf: Function,
 *                              isNotPrototypeOf: Function,
 *                              isWritable: Function,
 *                              isNotWritable: Function,
 *                              isConfigurable: Function,
 *                              isNotConfigurable: Function,
 *                              isEnumerable: Function,
 *                              isNotEnumerable: Function
 *
 * loadTest                 Reference to the LoadRunner object in context if available (see Sally)
 */
function SuiteRunner(suite, options)
{
    var self = this;
    var _log = (options && options.log) || new p_log();

    // Maps test name to an array of responses
    var _responses = {};

    // Maps test name to an array of request parameters objects (corresponds to _responses)
    var _requestParams = {};

    var _usertestdata = {};

    var _dumphttp = false;

    var _suite = suite;
    var _options = p_u.clone(options) || {};

    self.responses = _responses;
    self.requests = _requestParams;
    self.assert = p_assert;
    self.log = _log;
    self.loadTest = _options.loadTest;
    self.params = _options.params || {};
    self.testdata = _usertestdata;

    if (_options.verbosity != undefined)
    {
        switch (_options.verbosity)
        {
            case 3:
                _dumphttp = true;
                _log.echoToConsole(true);
                break;
            case 2:
                _log.echoToConsole(true);
                break;
            case 1:
                _log.echoToConsole([_log.ErrorType, _log.WarningType, _log.GoodType]);
                break;
            case 0:
                _log.echoToConsole([_log.ErrorType]);
                break;
            case -1:
                _log.echoToConsole(false);
                _dumphttp = false;
                break;
        }
    }


    if (_options.inlineLogging)
        _log.echoToConsole = true;

    // Maps a test name to an object which has properties:
    //
    // test         The user specified test object
    // deps         Current list of tests that are dependant on this test
    // depcount     The current count of tests that this test is dependant on
    // repeat       The current number of times to repeat the test
    // started      Whether the test has been started at least once
    var _testdata = {};

    // Maps a template name to a template object
    var _tempmap = {};

    var _completed = 0;
    var _success = 0;
    var _testcount = 0;
    var _requests = [];
    var _quitting = false;

    /********************************************************************************
     * helpers
     */
    function info(msg)
    {
        _log.info(msg);
    }

    function error(msg)
    {
        _log.error(msg);
    }

    function success(msg)
    {
        _log.good(msg);
    }

    function testProp(o, name, def)
    {
        var val;
        if (name in o)
        {
            val = o[name];
            if (p_u.isFunction(val))
                val = callfunc(val, o);

            if (!p_u.isObject(val))
                return val;
        }

        // Check inheritance
        var isa = p_u.toArray(o['isA']);
        var pval;
        for (var i = isa.length - 1; i >= 0; i--)
        {
            var temp = isa[i];

            if (!( temp in _tempmap))
                throw 'Unknown template \'' + temp + '\'';

            var tmp = _tempmap[temp];

            pval = testProp(tmp, name);
            if (pval != undefined)
                break;
        }

        if (val != undefined)
        {
            if (pval != undefined)
            {
                if (p_u.isObject(pval))
                {
                    // our val is an object, the parent val is an object, combine into a new one (we override)
                    var o = p_u.clone(pval);
                    for (var prop in val)
                        o[prop] = val[prop];

                    return o;
                }
                else
                {
                    // Parent val is not an object be we have overriden with an object, return our object
                    return val;
                }
            }
            else
            {
                return val;
            }
        }
        else
        {
            if (pval != undefined)
                return pval;

            // No parent value, no value of ours, return default
            return def;
        }
    }

    /*
     function propOrFunc(t, name, def)
     {
     var p = testProp(t, name, def);

     if (p)
     {
     if (p_u.isFunction(p))
     return callfunc(p, t);
     else
     return p;
     }

     return null;
     }
     */
    function hasProp(o, name)
    {
        return testProp(o, name, undefined) != undefined;
        //return name in o;
    }


    function init()
    {
        var nondep = [];

        // Build test map, first with templates
        _suite.forEach(function (o)
        {
            var tempname = o['template'];
            if (tempname)
            {
                _tempmap[tempname] = o;
            }
        });


        _suite.forEach(function (o)
        {
            var testname = o['test'];
            var dep = p_u.toArray(testProp(o, 'dependsOn'));

            if (testname)
            {
                _testdata[testname] = {test:o, deps:[], depcount:0, started:false, callbackCount:0, isJSON:false};
                _testcount++;

                if (dep.length > 0)
                {
                    _testdata[testname].depcount = dep.length;
                    dep.forEach(function (d)
                    {
                        _testdata[d].deps.push(o);
                    });
                }
                else
                    nondep.push(o);
            }
        });

        // return all with no dep
        return nondep;
    }

    function genHttpFunc(t, f, params, retries)
    {
        return genCallback(f, t, (new Date()).getTime(), params, retries);
    }

    function genCallback(f)
    {
        var fnc = f;
        var args = [];
        for (var i = 1; i < arguments.length; i++)
            args.push(arguments[i]);
        return function ()
        {
            for (var i = 0; i < arguments.length; i++)
                args.push(arguments[i]);

            fnc.apply(null, args);
        };
    }

    function testExcMsg(e)
    {
        if (e.name && e.name.match(/AssertionError/))
            return e.toString();
        else if (e.message)
            return e.message;
        else
            return e;
    }

    // checks test against criteria taking into account inheritance
    // returns null on success or the error message if fail
    function checkTest(t, res, args)
    {
        var isa = p_u.toArray(t['isA']);

        for (var i = 0; i < isa.length; i++)
        {
            var temp = isa[i];

            if (!( temp in _tempmap))
                return 'Unknown template \'' + temp + '\'';

            var tmp = _tempmap[temp];

            var r = checkTest(tmp, res, args);

            if (r != null)
                return r;
        }

        var code = t['expectCode'];
        var jsono = t['expectJSON'];
        var type = t['expectType'];
        var exp = t['expect'];

        if (code && res)
        {
            if (res.statusCode != code)
                return 'Result was ' + res.statusCode + ', expected ' + code;
        }
        if (type && res)
        {
            var ct = 'content-type' in res.headers ? res.headers['content-type'] : '';

            if (type.indexOf(';') == -1)
                ct = ct.split(';')[0];

            if (ct != type)
                return 'Type received was \"' + ct + '\", expected \"' + type + '\"';
        }
        if (jsono)
        {
            try
            {
                p_assert.deepEqual(jsono, args && args[0]);
            }
            catch (e)
            {
                return testExcMsg(e);
            }
        }
        if (exp)
        {
            if (p_u.isFunction(exp))
            {
                try
                {
                    callfuncA(exp, t, args);
                }
                catch (e)
                {
                    return testExcMsg(e);
                }
            }
            else if (p_u.isObject(exp))
            {
                for (var p in exp)
                {
                    try
                    {
                        callfuncA(exp[p], t, args);
                    }
                    catch (e)
                    {
                        return p + ', ' + testExcMsg(e);
                    }
                }
            }
        }

        return null;
    }

    function typeIsJSON(type)
    {
        return /application\/.*\+json/.test(type) || /application\/.*\+javascript/.test(type);
    }

    function responseIsJSON(res)
    {
        if (!('content-type' in res.headers))
            return false;

        var type = res.headers['content-type'].split(';')[0];

        return typeIsJSON(type);
    }

    function handleHttp(t, ts, params, retries, err, res, body)
    {
        // Requests not aborting?
        if (_quitting)
            return;

        if (err)
        {
            var ihang = err.message.indexOf('socket hang up');

            // Retry if avail
            if (retries > 0 || ihang != -1)
            {
                _requests.push(p_req(params, genHttpFunc(t, handleHttp, params, ihang == -1 ? retries : (retries - 1))));
                return;
            }

            finishTest(t, 'Unexpected error making request: ' + err.message);
            return;
        }

        var obj;
        if (responseIsJSON(res) && p_u.isString(body) && t.isJSON)
        {
            obj = JSON.parse(body);
            if (t.dump)
                p_eyes.inspect(obj);
        }
        else
        {
            obj = body;
            if (t.dump)
                console.log(obj);
        }

        if (_dumphttp || t.dump)
        {
            console.log('Response (' + res.statusCode + ') headers ->');
            p_eyes.inspect(res.headers);
            console.log('Body ->');
            p_eyes.inspect(obj);
        }

        if (!(t.test in _responses))
            _responses[t.test] = [];

        _responses[t.test].push(obj);

        if (_options.reqclock)
        {
            var c = testProp(t, 'clock');
            if (c)
            {
                if (!(c in _options.reqclock))
                    _options.reqclock[c] = {count:0, elapsed:0};

                var clock = _options.reqclock[c];

                clock.count++;
                clock.elapsed += ((new Date()).getTime() - ts);
                clock.avg = (clock.elapsed / clock.count).toFixed(2);
            }
        }

        finishTest(t, checkTest(t, res, [obj, res.headers, res.statusCode]));
    }

    function abortRequests()
    {
        // todo, remove finished requests as they stop so this is less brutal
        while (_requests.length > 0)
        {
            var req = _requests.pop();

            try
            {
                req.abort();
            }
            catch (e)
            {

            }
        }
    }

    function parseUrl(str)
    {
        try
        {
            var u = new p_url.URL(str);
            if (!u.host)
                u.host = _options.host;
            if (!u.port)
                u.port = _options.port;

            return u.toString();
        }
        catch (e)
        {
            throw 'Unable to parse url \"' + str.toString() + '\"';
        }
    }

    function handleCallbacks(t)
    {
        t.callbackCount--;

        // Check result, if a failure or this is the last callback then finish
        var err = checkTest(t, null, Array.prototype.slice.call(arguments, 1));
        if (err || !t.callbackCount)
            finishTest(t, err);
    }


    function callfunc(f, t)
    {
        var a = [];
        for (var i = 2; i < arguments.length; i++)
            a.push(arguments[i]);

        return callfuncA(f, t, a);
    }

    function callfuncA(f, t, a)
    {
        if (!f)
            return;

        var thistest = t;

        // Set up callback
        self.__defineGetter__('callback', function ()
        {
            _testdata[thistest.test].callbackCount++;

            return genCallback(handleCallbacks, thistest);
        });

        self.resExp = function(e)
        {
            return resExp(e, _responses[thistest.test][_responses[thistest.test].length-1]);
        }

        return f.apply(self, a);
    }

    // Resource expression
    // Return {res,type} as available
    function resExp(e, r)
    {
        var res = {};
        var f;

        if (e.substr(0, 6) == 'jpath:')
        {
            var path = e.substr(6);
            f = p_jpath.jsonPath(r, path, {results:"VALUE"})[0];
        }
        else
        {
            with ({data:r})
            {
                f = eval(e);
            }
        }

        if (!f)
            return res;

        if (p_u.isString(f))
            res.url = f;
        else
        {
            res.url = f[testProp(_options, 'resourceProp', ':self')];
            res.type = f[testProp(_options, 'typeProp', ':type')];
        }

        return res;

    }

    function startTest(t)
    {
        info('starting: ' + t.test);

        try
        {
            var url;
            var meth = 'GET';
            var accept;
            var td = _testdata[t.test];
            var start = testProp(t, 'setup');
            var startSync = testProp(t, 'setupSync');
            var data = testProp(t, 'data');
            var follow = testProp(t, 'follow');
            var heads = testProp(t, 'headers');

            if (!td.started)
            {
                var count = testProp(t, 'repeat', 0);
                td.repeat = count;
                td.started = true;
            }

            // For sync setup, just check it and return
            if (startSync)
            {
                finishTest(t, checkTest(t, null, [callfunc(startSync, t)]));
                return;
            }

            callfunc(start, t);

            if (follow && t.dependsOn)
            {
                var d = p_u.isArray(t.dependsOn) ? t.dependsOn[0] : t.dependsOn;

                // Get response
                var r = _responses[d];
                if (r)
                    r = r[0];

                var res = resExp(follow, r);

                if (!res.url)
                    throw {message:"No value found for follow expression '" + follow + "'"};

                if (res.type)
                    t.isJSON = typeIsJSON(res.type);

                if (data)
                    meth = 'POST';
            }

            ['put', 'post', 'get', 'del', 'putJSON', 'postJSON', 'getJSON', 'delJSON'].first(function (el)
            {
                var u = testProp(t, el);
                if (u)
                {
                    url = u;
                    if (el.endsWith('JSON'))
                    {
                        t.isJSON = true;
                        meth = el.substr(0, el.length - 4).toUpperCase();
                    }
                    else
                        meth = el.toUpperCase();

                    return true;
                }
            });

            if (url)
            {
                url = parseUrl(url);

                // info('Web request executing -> ' + meth + ' ' + url.toString());

                var params = {
                    uri:url, method:meth, headers:p_u.clone(heads) || {}
                };
                if (_options.proxy)
                    params.proxy = _options.proxy;

                if (accept)
                    params.headers.Accept = accept;

                if (data)
                {
                    if (p_u.isObject(data))
                        params.json = data;
                    else
                        params.body = data;
                }

                if (!(t.test in _requestParams))
                    _requestParams[t.test] = [];

                _requestParams[t.test].push(params);

                if (_dumphttp || t.dump)
                {
                    console.log('Making request ->');
                    p_eyes.inspect(params);
                }

                _requests.push(p_req(params, genHttpFunc(t, handleHttp, params, 0)));
            }
            else if (td.callbackCount == 0)
                finishTest(t, checkTest(t));

        }
        catch (e)
        {
            finishTest(t, testExcMsg(e));
        }
    }


    function finishSuite()
    {
        if (self._quitting)
            return;

        self._quitting = true;

        abortRequests();

        if (self._fncComplete)
            self._fncComplete(_success, _testcount - _success, _testcount - _completed, self.log);
    }

    function finishTest(t, failmsg)
    {
        var name = testProp(t, 'test');
        var td = _testdata[name];

        var res = {
            test:name
        };
        if (failmsg)
        {
            res.err = failmsg;
            error('✗ ' + name + ' failed, ' + failmsg);
        }
        else
        {
            _success++;
            success('✓ ' + name);
        }

        callfunc(t.teardown, t);

        // Repeat if needed
        if (td.repeat)
        {
            td.repeat--;
            startTest(t);
        }
        else
        {
            _completed++;

            if (_completed == _testcount)
            {
                finishSuite();
            }
            else if (_testdata[name].deps.length > 0)
            {
                // We have dependencies, if this test failed then abort suite (todo: continue parallel tests)
                if (failmsg)
                {
                    finishSuite();
                    return;
                }

                var deps = _testdata[name].deps;

                var ready = [];

                // For each dependent test, decrement its dep count
                deps.forEach(function (d)
                {
                    if (--_testdata[d.test].depcount == 0)
                        ready.push(d);
                });

                // Get rid of us from the deps
                _testdata[name].deps = [];

                // signal waiting
                startBatch(ready);
            }
        }
    }

    function startBatch(batch)
    {
        batch.forEach(function (t)
        {
            if (t.wait)
                setTimeout(genCallback(startTest, t), t.wait);
            else
                startTest(t);
        });
    }


    this.run = function (fnc)
    {
        self._fncComplete = fnc;

        try
        {
            var tests = init();
            if (!tests.length)
                throw 'No tests without dependencies exist';

            if (_options.name)
            {
                success('>> Starting suite: ' + _options.name);
            }

            startBatch(tests);

        }
        catch (e)
        {
            if (e.message)
            {
                error(e.message);
                error(e.stack);
            }
            else
                error(e);
        }

    };

    // Copy context if specified
    if ('context' in  _options)
    {
        p_u.copyPrototype(this, _options.context);
    }

}

exports.SuiteRunner = SuiteRunner;
exports.Logger = p_log.Logger;

