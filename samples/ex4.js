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

