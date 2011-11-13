/*
 * Stupid Simple (web) API testing
 *
 */
var p_ctrl = require('./controller.js');
var p_ast = require('./modules/assert-extras');
var p_u = require('./util.js');
var p_sr = require('./SuiteRunner.js');

exports.assert = p_ast;
exports.runSuite = function(suite, opt, fnc)
{
    var sr = new p_sr.SuiteRunner(suite, opt);

    var cb = fnc === undefined ? function(succeed, fail, aborted, logger)
    {
        logger.dumpToConsole();

        var sum = '';
        if (succeed > 0)
            sum = p_u.commify(sum, p_u.style(succeed + ' succeeded', 'green'));
        if (fail > 0)
            sum = p_u.commify(sum, p_u.style(fail + ' failed', 'red-hi'));
        if (aborted > 0)
            sum = p_u.commify(sum, p_u.style(aborted + ' aborted', 'yellow'));
        sum += '.';

        console.log(sum);
    } : fnc;

    sr.run(cb);

}
exports.runLoad = p_ctrl.runLoad;