var vows = require("vows"),
	assert = require("assert"),
	userauth = require("../lib/userauth");

var knownHash = "HKomKzNnBxktwkXBUWVSgWSbdBL-Tt50opYHl3Qc9tE1";
var knownProjectId = 3;
var knownProjectName = "Digital Five Sydney";

vows.describe("User Authentication").addBatch({
	"Decrypting code should" : {
		topic: userauth.decrypt(knownHash),
		"produce an id": function(result){
			assert.equal(result.id, knownProjectId);
		},
		"produce a project name": function(result){
			assert.equal(result.name, knownProjectName);
		}
	}	
}).export(module);
