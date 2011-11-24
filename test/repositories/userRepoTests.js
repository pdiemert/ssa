global.config = {
	commondb: {
        user: 'metricmonster',
        password: 'monster',
        database: 'integration_tests',
        hostname: 'metricmonster.crgwhwndlaju.us-west-1.rds.amazonaws.com'
	}
}
var ssa = require('ssa'),
	repos = require("../../lib/repository");

var randUserName = "bill_" + (new Date()).getTime();

ssa.runSuite([{
	template: 'findUser',
    expect: function(err, data){ 
    	this.assert.isNull(err);
    	this.assert.isArray(data);
    	this.assert.equal(data.length, 1);
    	this.assert.equal(data[0].id, 2);
    	this.assert.equal(data[0].username, "sugendran");
    	this.assert.equal(data[0].email, "sugendran_ganess@digitalfivesydney.com");
    }
},{
    test: 'can find a user by username',
    setup: function(){
    	repos.user.find({username: "sugendran"}, this.callback);
    },
    isA: "findUser"
},{
	test: "can find a user by email",
	setup: function(){
		repos.user.find({email: "sugendran_ganess@digitalfivesydney.com"}, this.callback);	
	},
    isA: "findUser"
},{
	test: "can find a user by id",
	setup: function(){
		repos.user.find({id: 2}, this.callback);	
	},
    isA: "findUser"
},{
	test: "create user",
	setup: function(){
		repos.user.create({
			username: randUserName,
			email: "bill@microsoft.com",
			password: "123456",
			salt: "xyz",
			hashIterations: 5
		}, this.callback);
	},
	expect: function(err, data){
    	this.assert.isNull(err);
    	this.assert.equal(data.username, randUserName);
    	this.assert.equal(data.email, "bill@microsoft.com");
	}
},{
	test: "created user can be found",
	dependsOn: "create user",
	setup: function(){
		repos.user.find({email: "bill@microsoft.com"}, this.callback);
	},
	expect: function(err, data){
		this.assert.isNull(err);
    	this.assert.equal(data[0].username, randUserName);
    	this.assert.equal(data[0].email, "bill@microsoft.com");
	}
},{
	test: "delete user",
	dependsOn: "created user can be found",
	setup: function(){
		var callback = this.callback;
		repos.user.find({username: randUserName}, function(err, data){
			if(err) throw err;
			repos.user.remove(data[0].id, callback);
		});
	},
	expect: function(err, result){
		this.assert.isNull(err);
		this.assert.equal(result, true);
	}
},{
	test: "deleted user cannot be found",
	dependsOn: "delete user",
	setup: function(){
		repos.user.find({username: randUserName}, this.callback);
	},
	expect: function(err, data){
		this.assert.isNull(err);
		this.assert.equal(data.length, 0);
	}
}]);

