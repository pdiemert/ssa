/*
 * Stupid Simple (web) API testing
 *
 */
//var p_ctrl = require('./controller.js');
var p_ast = require('../modules/assert-extras');
var p_u = require('./util.js');
var p_sr = require('./SuiteRunner.js');

exports.assert = p_ast;
exports.runSuite = function(suite, opt, fnc)
{
    // If second and last param is function then treat as callback
    if (arguments.length == 2 && p_u.isFunction(opt))
    {
        fnc = opt;
        opt = null;
    }
    
    var optT = p_u.clone(opt);
    var fncT = fnc;
    var suiteT = suite;

    var s = 0;
    var f = 0;
    var a = 0;
    var c = 0;

    function finish(succeed, fail, aborted, logger)
    {
        s += succeed;
        f += fail;
        a += aborted;

        if (!opt || !('repeat' in optT) || ++c >= optT.repeat)
        {
            if (fncT)
                fncT(s,f,a,logger);
            else
            {

                if (c > 1 && optT && optT.verbose)
                    console.log(c + ' executions completed.');

                if (!optT || !optT.inlineLogging)
                    logger.dumpToConsole();

                var sum = '';
                if (succeed > 0)
                    sum = p_u.commify(sum, p_u.style(s + ' succeeded', 'green'));
                if (fail > 0)
                    sum = p_u.commify(sum, p_u.style(f + ' failed', 'red'));
                if (aborted > 0)
                    sum = p_u.commify(sum, p_u.style(a + ' aborted', 'yellow'));
                sum += '.';

                console.log('=> ' + sum);
            }
        }
        else
        {
            optT.log = logger;
            sr = new p_sr.SuiteRunner(suite, optT);
            sr.run(finish);
        }
    }

    var sr = new p_sr.SuiteRunner(suite, opt);

    sr.run(finish);
}

//exports.runLoad = p_ctrl.runLoad;