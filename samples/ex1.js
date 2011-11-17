require('ssa').runSuite([
    {   test: 'google can query' ,
        getJSON: 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=Paris%20Hilton',
        expectCode: 200,
        expect: function(data)
        {
            this.assert.equal(data.responseData.results.length, 4);
        }
    }]);
