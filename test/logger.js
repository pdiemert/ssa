var p_ssa = require('ssa');

var l = new p_ssa.Logger();

l.info('foo');

var s = l.newScope('test');

s.info('bar');

s.dumpToConsole();