#SSA
###Stupid Simple Asynchronous
>a testing framework for node.js


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


##Reference##

The SSA module has single function:

	runSuite(suite, [options], [callback])

or

    runSuite(suite, [callback])

Where ***suite*** is an array of objects.  
Each object can be either a *test* or a *template*.
A **test** object has the follow properties:

*	***test*** - A descriptive name of the test (required) 
*	***isA*** - The name of a template to apply. (optional)
*	***dependsOn*** - A test name or an array of test names that must be completed before this test. (optional)
*	***setup*** - A function that is called at the beginning of the test (optional)
*	***teardown*** - A function that is called at the end of the test (optional)
*	***get***, ***post***, ***put***, ***del*** - An url or a function.  If an url then an http request is made using the associated method.  If a function then this function is called to retrieve a url at the moment when the request is being made.  The body of the response will be passed to the function(s) specified in ***expect***. (optional)
*	***getJSON***, ***postJSON***, ***putJSON***, ***delJSON*** - Similar to above with exception that the response is expected to be in JSON format passed as an object. (optional)
*	***data*** - Either text or an object that is passed as the body for any http request. (optional)
*	***wait*** - Amount of time (in milliseconds) to wait before executing the test.  Note that if this test is dependent on another test the clock will not start ticking until the dependency completes. (optional)
*	***expectCode*** - For http requests, the response code expected. (optional)
*	***repeat*** - The number of times to repeat the test.  Every response is stored in the responses array described below. (optional)
*	***expect*** - Either a function or an object. If a function then this function is called after the setup function and any http request to test some expectation.  If an object then each property value is expected to be a function with the property name used as a description name of the expectation.

A **template** can have the same properties as above with the exception of http requests and instead of a ***test*** property there is property called ***template*** which identifies the template name.

The ***options*** parameter can be null or can be an object with the following optional properties:

*	***verbose*** - Set to true or false, provides verbose output
*	***host*** - If relative urls are specified for http requests, this host will be used
*	***port*** - If specied, this port will be used for all http requests
*   ***repeat*** - The number of times the suite is meant to be executed
*   ***inlineLogging*** - By default all log messages are displayed at the end of the suite run.  Setting this option to true will cause messages to go to the console as they are logged.
*   ***name*** - A name for the suite displayed in the output if specified

The optional ***callback*** parameter is a function to call on completion of the suite.  This function is passed 4 parameters; # of successful tests, # of failed tests, # of aborted tests, a log object (see below).

Every function that is called by the framework has an available **this** reference which has the following properties:

*	***responses*** - An object whose property names are names of tests that have been completed.  Each value is an array of response values (body text or JSON object), one for each time the test made a request.  This is useful for examining prior response values in dependent tests.
*	***log*** - An object that manages logging.  This object has the following functions:
	*	***error***, ***warning***, ***info***, ***good*** - Adds a message to the log of the associated type.  The type name will be one of ##error##, ##warning##, ##info##, ##good##
	*	***out*** - takes a type and message.  The type is a user defined text name and the message is a user defined object.
	*	***first*** - takes a type and returns the first message found of this type
	*	***all*** - takes a type and returns all messages found of this type
*	***callback*** - A function that can be used as the callback for any arbitrary API that allows for an asynchronous callback mechanism.
*	***assert*** - An object with the following methods:
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
