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
    }
]);