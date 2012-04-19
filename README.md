#SSA
###Stupid Simple Asynchronous
> a testing framework for node.js that can also be used for load testing using Sally


Designed to make the task of testing web API and other async API as easy as possible.

Installation:

	npm install ssa

Usage:

	ssa

This searches for a directory called /test or /spec.  All test suites in the directory and sub-directories are executed.

or

	ssa mytest.js

A single js file can hold one or more test suites.


**Here's an example testing a JSON Web API response:**

	require('ssa').runSuite([
	{
		test: 'google API returns results for paris hilton' ,
        getJSON: 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=Paris%20Hilton',
        expectCode: 200,
        expect: function(data){ this.assert.equal(data.responseData.results.length, 4); }
    }]);

Results:

	✓ google API returns results for paris hilton
	=> 1 succeeded.

**Let's put in multiple checks to make it interesting:**

	require('ssa').runSuite([
    {
		test: 'google can query' ,
        getJSON: 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=Paris%20Hilton',
        expectCode: 200,
        expect:
        {
            "has 4 results" : function(data) { this.assert.equal(data.responseData.results.length, 4); },
            "is correct class" : function(data) { this.assert.equal(data.responseData.results[0].GsearchResultClass,  'GwebSearch'); }
        }
    }]);

Results:

	✓ google API returns results for paris hilton
	=> 1 succeeded.

**Now add another test to the mix:**

	require('ssa').runSuite([
    {
		test: 'google API returns results for paris hilton' ,
        getJSON: 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=Paris%20Hilton',
        expectCode: 200,
        expect:
        {
            "has 4 results" : function(data) { this.assert.equal(data.responseData.results.length, 4); },
            "is correct class" : function(data) { this.assert.equal(data.responseData.results[0].GsearchResultClass,  'GwebSearch'); }
        }
    },
	{
		test: 'google API returns results for george clooney' ,
        getJSON: 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=George%20Clooney',
        expectCode: 200,
        expect:
        {
            "has 4 results" : function(data) { this.assert.equal(data.responseData.results.length, 4); },
            "is correct class" : function(data) { this.assert.equal(data.responseData.results[0].GsearchResultClass,  'GwebSearch'); }
        }
	}]);

Results:

	✓ google API returns results for paris hilton
	✓ google API returns results for george clooney
	=> 2 succeeded.

**I see a pattern here, let's use a template:**

	require('ssa').runSuite([
	{
		template: 'googlereq',
        expectCode: 200,
        expect: function(data){ this.assert.equal(data.responseData.results.length, 4); }
	},
    {
		test: 'google API returns results for paris hilton', isA: 'googlereq',
        getJSON: 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=Paris%20Hilton'
    },
	{
		test: 'google API returns results for george clooney', isA: 'googlereq',
        getJSON: 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=George%20Clooney'
	}]);

Results:

	✓ google API returns results for paris hilton
	✓ google API returns results for george clooney
	=> 2 succeeded.


**Let's say one test depended on the results of another:**

	require('ssa').runSuite([
	{
		template: 'googlereq',
        expectCode: 200,
        expect:
        {
            "has 4 results" : function(data) { this.assert.equal(data.responseData.results.length, 4); },
            "is correct class" : function(data) { this.assert.equal(data.responseData.results[0].GsearchResultClass,  'GwebSearch'); }
        }
	},
    {
		test: 'google API returns results for paris hilton', isA: 'googlereq',
        getJSON: 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=Paris%20Hilton'
    },
	{
		test: 'google search result has proper cache', dependsOn : 'google API returns results for paris hilton',
        get: function() {
            return this.responses["google API returns results for paris hilton"][0].responseData.results[0].cacheUrl; },
        expect: function(bod) {
            this.assert.notEqual(bod.indexOf('This is Google&#39;s cache'), -1); }
	}]);

**And how about some other async call:**

	require('ssa').runSuite([
    {
		test: 'connect to flickr' , expect : function(err, api)
    	{
       		this.assert.isNull(err);
        	this.log.out('api', api);
    	},
    	setup : function()
    	{
        	require('flickr-reflection')
				.flickr.connect([key:'9a0554259914a86fb9e7eb014e4e5d52',
					secret: '000005fab4534d05', apis: ['photos']], this.callback);
        }
	},
	{
		test: 'search for photos', dependsOn : 'connect to flickr',
		setup : function()
		{
			this.log.first('api').photos.search({tags: 'beach'}, this.callback);
		},
		expect : function(err, data)
		{
		}
	}]);

**And finally, for those less interested in async calls, not to worry:**

    require('ssa').runSuite([
    {
        test: 'Divide zero by zero',
        setupSync: function()
        {
            return 0 / 0;
        },
        expect :
        {
            "is not a number" : function(val)
            {
                this.assert.isNaN(val);
            },
            "is not equal to itself" : function(val)
            {
                this.assert.notEqual(val, val);
            }
        }
    }]);

##Reference##

The SSA module has single function:

	runSuite(suite, [options], [callback])

or

    runSuite(suite, [callback])

##Suites###
A ***suite*** is an array of objects.  
Each object can be either a *test* or a *template*.
A **test** object has the follow properties:

####test
A descriptive name of the test (required) 
####isA
The name of a template to apply. (optional)
####dependsOn
A test name or an array of test names that must be completed before this test. (optional)
####setup
A function that is called at the beginning of the test (optional)
####teardown
A function that is called at the end of the test (optional)
####get, post, put, del
An url or a function.  If an url then an http request is made using the associated method.  If a function then this function is called to retrieve a url at the moment when the request is being made.  The body of the response will be passed to the function(s) specified in ***expect***. (optional)
####getJSON, postJSON, putJSON, delJSON
Similar to above with exception that the response is expected to be in JSON format passed as an object. (optional)
####data
Either text or an object that is passed as the body for any http request. (optional)
####wait
Amount of time (in milliseconds) to wait before executing the test.  Note that if this test is dependent on another test the clock will not start ticking until the dependency completes. (optional)
####expectCode
For http requests, the response code expected. (optional)
####repeat
The number of times to repeat the test.  Every response is stored in the responses array described below. (optional)
####expect
Either a function or an object. If a function then this function is called after the setup function and any http request to test some expectation.  If an object then each property value is expected to be a function with the property name used as a description name of the expectation.
####follow
For REST style of interfaces. Can be either:

*	A Javascript expression string to evaluate which returns either a URL or an object used for making the next request.  Within scope of the expression is an object called 'data' which is the result of the request specified by the dependsOn property.
*	A JSONPath in the format of "jpath:json path".  The root object ($) is result of the request specified by the dependsOn property. (read about JSON Path [http://goessner.net/articles/JsonPath](http://goessner.net/articles/JsonPath/))

If dependsOn is an array, the first dependency will be used.

The GET http method will be used unless a data body specified in which case POST is used.
If the expression evaluates to an object the object will be interrogated for a property specified by the resourceProp name in the Options.
If a typeProp property exists then this will be used as the Accept header. For example, if the dependsOn test returned JSON like:

	{
		foo : { ":self" : "/blah/bar", ":type", "application/vnd.biff+json" }
	}
 
Then the follow expression "data.foo" would attempt to get the document "/blah/bar"

A **template** can have the same properties as above with the exception of http requests and instead of a ***test*** property there is property called ***template*** which identifies the template name.

##Options##
Can an object with the following optional properties:

####verbosity
Verbosity level, each higher level will include all lower level messages, can be:

*	-1  Absolutely no output
*	0   No messages, just show errors and summary
*	1   All test results
*	2   All info messages
*	3   All request/responses
 
####host
If relative urls are specified for http requests, this host will be used
####port
If specied, this port will be used for all http requests
####repeat
The number of times the suite is meant to be executed
####inlineLogging
By default all log messages are displayed at the end of the suite run.  Setting this option to true will cause messages to go to the console as they are logged.
####name
A name for the suite displayed in the output if specified
####proxy
Optional proxy server to use, ex: http://localhost:8888
####log
An optional Logger object to use for logging
####loadTest
LoadTester object if there is one available (set if using Sally)
####repeat
Number of times to repeat the suite
####resourceProp
For use with the follow property, the property name used for resource URLs, default is ":self"
####typeProp
For use with the follow property, the property name used in the Accept header for the resource, default is ":type"
####reqclock
An optional request clock object.  If the 'clock' property exists on a test, the named clock on this object is updated with the number of requests and total time taken.  For example:

	var myclocks = {};
 	runSuite([{test:'foo', get:'google.com',clock:'googleget'} ], {reqclock:myclocks})
	// When finished, myclocks.googleget.count = number of requests,
	// myclocks.googleget.elapsed = total time of requests

##Callback##
The optional ***callback*** parameter is a function to call on completion of the suite.  This function is passed 4 parameters; # of successful tests, # of failed tests, # of aborted tests, a log object (see below).

##Suite Functions##
Every callback function used in a suite that is called by the framework has an available **this** reference which has the following properties:

####responses
An object whose property names are names of tests that have been completed.  Each value is an array of response values (body text or JSON object), one for each time the test made a request.  This is useful for examining prior response values in dependent tests.
####log
An object that manages logging.  This object has the following functions:

*	**error(msg), warning(msg), info(msg), good(msg)** - Adds a message to the log of the associated type. The type name will be one of ##error##, ##warning##, ##info##, ##good##.
*	**out(type,msg)** - Takes a type and message.  The type is a user defined text name and the message is a user defined object.
*	**first(type)** - Takes a type and returns the first message found of this type. See forEach for log message format.
*	**filter(type)** - Takes a type and returns all messages found of this type. See forEach for log message format.
*	**forEach(fnc)** - Calls fnc for each log item, passes log item.  Each log item object has the properties:

	* **type** - the text type name of the message
	* **msg** - the message itself, is a user defined object
	* **ts** - timestamp of when the message was logged
	* **scope** - text name of scope, if nested, each scope is separated by /
*	**newScope(name)**
Generates new log scope. Returns a new child log object which will add messages into the parent list but marked with the scope name.  Scopes can be nested.


####callback
A function that can be used as the callback for any arbitrary API that allows for an asynchronous callback mechanism.
####loadTest
Reference to the Sally load test object in context if available (see Sally)

####assert
An object with the following methods:

*	***fail***(actual, expected, message, operator)
*	***ok***(value, [message])
*	***equal***(actual, expected, [message])
*	***notEqual***(actual, expected, [message])
*	***deepEqual***(actual, expected, [message])
*	***notDeepEqual***(actual, expected, [message])
*	***strictEqual***(actual, expected, [message])
*	***notStrictEqual***(actual, expected, [message])
*	***throws***(block, [error], [message])
*	***doesNotThrow***(block, [error], [message])
*	***ifError***(value)
*	***isNull***(value, message)                               
*	***isNotNull***(value, message)                            
*	***isTypeOf***(value, type, message)                       
*	***isNotTypeOf***(value, type, message)                    
*	***isObject***(value, message)                             
*	***isFunction***(value, message)                           
*	***isString***(value, message)                             
*	***isNumber***(value, message)                             
*	***isBoolean***(value, message)                            
*	***isUndefined***(value, message)                          
*	***isNotUndefined***(value, message)                       
*	***isArray***(value, message)                              
*	***isNaN***(value, message)                                
*	***isNotNaN***(value, message)                             
*	***match***(value, pattern, message)                       
*	***noMatch***(value, pattern, message)                     
*	***isPrototypeOf***(proto, object, message)                
*	***isNotPrototypeOf***(proto, object, message)
