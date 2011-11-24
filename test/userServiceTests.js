// user services test
global.repositoryPath = "../../mocks/repository";

var ssa = require('ssa'),
	user = require("../lib/services/user");


ssa.runSuite([{
	template: 'findUser',
    expect: function(err, data){ 
    	this.assert.isNull(err);
    	this.assert.isArray(data);
    	this.assert.equal(data.length, 1);
    	this.assert.equal(data[0].id, 2);
    	this.assert.equal(data[0].username, "sugendran");
    	this.assert.equal(data[0].email, "sugendran@sugendran.net");
    }
},{
    test: 'can find a user by username',
    setup: function(){
    	user.find({username: "sugendran"}, this.callback);
    },
    isA: "findUser"
},{
	test: "can find a user by email",
	setup: function(){
		user.find({email: "sugendran@sugendran.net"}, this.callback);	
	},
    isA: "findUser"
},{
	test: "can find a user by id",
	setup: function(){
		user.find({id: 2}, this.callback);	
	},
    isA: "findUser"
},{
	test: "email is available",
	setup: function(){
		user.checkAvailability("dmitry@metricmonster.com", this.callback);
	},
	expect: function(err, data){
		this.assert.isNull(err);
		this.assert.equal(data, true);
	}
},{
	test: "email is unavailable",
	setup: function(){
		user.checkAvailability("sugendran@sugendran.net", this.callback);
	},
	expect: function(err, data){
		this.assert.isNull(err);
		this.assert.equal(data, false);
	}
},{
	test: "register user",
	setup: function(){
		user.register({
			username: "bill",
			email: "bill@microsoft.com",
			password: "123456"
		}, this.callback);
	},
	expect: function(err, data){
    	this.assert.isNull(err);
    	this.assert.equal(data.username, "bill");
    	this.assert.equal(data.email, "bill@microsoft.com");
	}
},{
	test: "registered user can login",
	dependsOn: "register user",
	setup: function(){
		user.validate({
			email: "bill@microsoft.com",
			password: "123456"
		}, this.callback);
	},
	expect: function(err, data){
		this.assert.isNull(err);
		this.assert.isNotNull(data);
    	this.assert.equal(data.username, "bill");
    	this.assert.equal(data.email, "bill@microsoft.com");
	}
},{
	test: "registered user can login with username",
	dependsOn: "registered user can login",
	setup: function(){
		user.validate({
			username: "bill",
			password: "123456"
		}, this.callback);
	},
	expect: function(err, data){
		this.assert.isNull(err);
		this.assert.isNotNull(data);
    	this.assert.equal(data.username, "bill");
    	this.assert.equal(data.email, "bill@microsoft.com");
	}
},{
	test: "delete user",
	dependsOn: "registered user can login with username",
	setup: function(){
		user.find({username: "bill"}, function(err, data){
			if(err) throw err;
			user.remove(data[0].id, this.callback);
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
		user.find({username: "bill"}, this.callback);
	},
	expect: function(err, data){
		this.assert.isNull(err);
		this.assert.equal(data.length, 0);
	}
}]);
