require('ssa').runSuite([
    {test:'make request', get:'http://www.microsoft.com', require:function(bod)
    {
        this.assert.ok(false);
    }},
    {test:'stop test', setup:function()
    {
        this.assert.ok(false);
    }
    }
],{inlineLogging:true})