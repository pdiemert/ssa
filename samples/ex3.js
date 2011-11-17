require('ssa').runSuite([
	{
		template: 'googlereq',
        expectCode: 201,
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
		test: 'google API returns results for george clooney', isA: 'googlereq',
        getJSON: 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=George%20Clooney'
	}]);

