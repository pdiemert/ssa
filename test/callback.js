// github issue #1

function runSomething(callback){
    setTimeout(function(){
        callback(null, { val: 1 });
    }, 500)
}

require("ssa").runSuite([{
    test: "simple callback",
    expect: function(err, data){
        this.assert.isNull(err);
        this.assert.equal(data.val, 1);
    },
    setup: function(){
        runSomething(this.callback);
    }
}]);