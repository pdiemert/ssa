var hasher = require("../../lib/utils/passwordHasher"),
	ssa = require("ssa");

ssa.runSuite([{
	test: "Random salt is random",
    expect: function(data){ 
    	this.assert.notEqual(data[0], data[1]);
    },
    setupSync: function(){
    	return [hasher.createRandomSalt(), hasher.createRandomSalt()];
    },
    repeat: 10
},{
	test: "expected hash",
	expect: function(data){
		this.assert.equal(data.hash, "h9dtG4q6UuyWRRtPu6PFVg==");
	},
	setupSync: function(){
		return hasher.computeWithSalt("passw0rd", 3, "yG7Pfxot");
	}
},{
	test: "rehash",
	expect: function(hashes){
		hashes.forEach(function(hash){
			var h = hasher.computeWithSalt(hash.original, hash.iterations, hash.salt);
			this.assert.equal(h.hash, hash.hash);
		}, this);
	},
	setupSync: function(){
		var passwords = ["123456", "passw0rd", "foobar123", "m4gic!hat$"];
		var hashes = [];
		passwords.forEach(function(p){
			var h = hasher.compute(p, 3);
			h.original = p;
			hashes.push(h);
		});
		return hashes;
	}
}]);

