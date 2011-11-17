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
