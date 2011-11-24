global.config = {
  commondb: {
    user: "metricmonster", 
    password: "monster", 
    database: "integration_tests", 
    hostname: "metricmonster.crgwhwndlaju.us-west-1.rds.amazonaws.com"
  }
};

var ssa = require("ssa"), 
    repo = require("../../lib/repository");

ssa.runSuite([{
  template: 'find',
  expect: function(err, data){ 
    console.log(data);
    this.assert.isNull(err);
    this.assert.equal(data[0].id, 1);
    this.assert.equal(data[0].name, "AlphaShack");
    this.assert.equal(data[0].account_id, 1);
  }
},
{
  test: "can create a project", 
  setup: function() {
    testProject = {
      name: "AlphaShack", 
      account: { id: 1 }
    };
    repo.project.create(testProject, this.callback);
  },
  expect: function(err, result) {
    this.assert.isNull(err);
    this.assert.equal(result.name, "AlphaShack");
    this.assert.equal(result.account.id, 1);
  }
},
{
  test: 'can find a project by name',
  dependsOn: "can create a project",
  setup: function(){
    repo.project.find({ name: "AlphaShack" }, this.callback);
  },
    isA: "find"
}, 
{
  test: "can update a project", 
  dependsOn: "can find a project by name", 
  setup: function() {
    callback = this.callback;
    repo.project.find({ name: "AlphaShack" }, function(err, result) {
      repo.project.update({ id: result[0].id, name: "BetaShack" }, callback);
    });
  }, 
  expect: function(err, result) {
    this.assert.isNull(err);
    this.assert.equal(result.name, "BetaShack");
  }
},
{
  test: "can remove a project",
  dependsOn: "can update a project", 
  setup: function() { 
    callback = this.callback;
    repo.project.find({ name: "BetaShack" }, function(err, result) {
      console.log(result);
      repo.project.remove({ id: result[0].id }, callback);
    });
  }, 
  expect: function(err, result) {
    this.assert.isNull(err);
    this.assert.equal(result, true);
  }
},
{
  test: "can find no project called AlphaShack", 
  dependsOn: "can remove a project",
  setup: function() { repo.project.find({ name: "AlphaShack" }, this.callback); },
  expect: function(err, result) {
    this.assert.equal(result.length, 0);
  }
},
{
  test: "can find no project called BetaShack", 
  dependsOn: "can find no project called AlphaShack",
  setup: function() { repo.project.find({ name: "BetaShack" }, this.callback); },
  expect: function(err, result) {
    this.assert.equal(result.length, 0);
  }
}
]);
