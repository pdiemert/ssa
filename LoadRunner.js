var p_u = require('./util.js');
var p_sr = require('./SuiteRunner.js');
var p_const = require('./const.js');

/********************************************************************************
 * load runner
 *
 * Load tests consist of an object with the following properties:
 *
 * {
 *      // Suite to run first (optional)
 *      start: [],
 *
 *      users:
 *      [
 *          // Array of virtual users, each item is {user:"<name>", suite:[]}
 *
 *      ],
 *
 *      // Suite to run last (optional)
 *      finish: []
 * }
 *
 * All suite functions are passed the following on the context.loadTest:
 *
 * userIndex        The index of this user within the population of running users
 * userCount        Total number of users, of this type, in the population
 * runCount         The total number of times this user suite has been run
 * getUserCount     A function that returns the user count for a user name
 *
 * All logs are merged before finish is called
 *
 * options is an object that can have the same properties as SuiteRunner with the additional:
 *
 * params           Parameters sent to all suites context
 * duration         Duration of test in seconds
 * loadProfile      Can be either:
 *
 *                  1)  An array -  Each item is a two element array, first is a time offset in seconds, second is a user count
 *                                  The user count is divided evenly among the different virtual users.  For example:
 *
 *                                  [[0,10],[120,1000]]
 *                                  Starts with 10 users at the beginning of the test and ramps to 1000 after 120 seconds
 *
 *                  2)  An object - Each property name corresponds to a virtual user name, each value is a two
 *                                  element array of offset, user count as above
 *
 * repeatDelay      Can be either a number which will be the number of milliseconds between suite execution for all users
 *                  or an object with each property a user name and each value the number of millisecond delay for those users
 */

function LoadRunner(test, options)
{
    var self = this;
    var _options = p_u.clone(options);
    _options.loadTest = this;
    var _fncComplete;
    var _log = options.log || new p_u.Logger();
    var _test = test;
    var _workerOut;
    var _workerIn;

    // Calculate population, create object with each prop a user name and each value a user count
    var _population = {};

    function error(msg)
    {
        _log.error(msg);
    }

    function info(msg)
    {
        _log.info(msg);
    }

    function opt(name, def)
    {
        if (!(name in _options))
        {
            if (def === undefined)
                throw 'Missing required option \"' + name + '\"';
            else
                return def;
        }

        return _options[name];
    }

    function calcPopulation()
    {
        // Find peaks for each user type
        var prof = opt('loadProfile');

        if (p_u.isArray(prof))
        {
            var max = 0;
            prof.forEach(function(e)
            {
                if (e[1] > max)
                    max = e[1];
            });

            var pop = Math.max(1, ~~(max / p_u.propertyCount(_test.users)));

            for (var u in _test.users)
            {
                _population[u] = pop;
            }
        }
        else
        {
            for (var u in _test.users)
            {
                if (!(u in _population))
                    _population[u] = 0;

                _test.users[u].forEach(function(e)
                {
                    if (e[1] > _population[u])
                        _population[u] = e[1];
                });
            }
        }
    }

    function handleInbound(data)
    {
        var o = JSON.parse(data.toString());

        if (o.cmd == 'runsuite_res')
        {
            var log = new p_log.Logger(o.log);
            log.dumpToConsole();

            var sum = '';
            if (o.succeed > 0)
                sum = p_u.commify(sum, p_u.style(o.succeed + ' succeeded', 'green'));
            if (o.fail > 0)
                sum = p_u.commify(sum, p_u.style(o.fail + ' failed', 'red-hi'));
            if (o.aborted > 0)
                sum = p_u.commify(sum, p_u.style(o.aborted + ' aborted', 'yellow'));
            sum += '.';

            console.log(sum);
        }

        p_wkr.stop();

        closeHub();
    }

    function closeHub()
    {
        _workerOut.close();
        _workerIn.close();
    }

    function openHub()
    {
        _workerOut = p_zmq.createSocket('push');
        _workerOut.bindSync('tcp://*:' + p_const.defaultWorkerOutPort);

        info('Downstream worker hub open on ' + p_const.defaultWorkerOutPort);

        _workerIn = p_zmq.createSocket('pull');
        _workerIn.bindSync('tcp://*:' + p_const.defaultWorkerInPort);
        _workerIn.on('message', handleInbound);
        info('Upstream worker results open on ' + p_const.defaultWorkerInPort);
    }

    this.getUserCount = function(name)
    {
        if (!(name in _population))
            return 0;
        else
            return _population[name];
    };

    this.run = function(fnc)
    {
        self._fncComplete = fnc;

        openHub();

        calcPopulation();

        // Run start
        if ('start' in _test)
        {
            var sr = new p_sr.SuiteRunner(_test.start, _options);
            sr.run(function(s, f, a, l)
            {
                l.dumpToConsole();

                if (self._fncComplete)
                    self._fncComplete();

                console.log('done');
            });
        }

    };
}

exports.LoadRunner = LoadRunner;