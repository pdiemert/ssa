/*global require */
var p_zmq = require('zeromq');
var p_lr = require('./LoadRunner.js');
var p_u = require('./util.js');
var p_const = require('./const.js');
var p_wkr = require('./worker.js');
var p_log = require('./Logger.js');

var g_portOut = p_const.defaultWorkerOutPort;
var g_portIn = p_const.defaultWorkerInPort;

var g_workerOut;
var g_workerIn;

function msg(m)
{
    console.log(m);
}

function openHub()
{
    g_workerOut = p_zmq.createSocket('push');
    g_workerOut.bindSync('tcp://*:' + g_portOut);

    msg('Downstream worker hub open on ' + g_portOut);

    g_workerIn = p_zmq.createSocket('pull');
    g_workerIn.bindSync('tcp://*:' + g_portIn);
    g_workerIn.on('message', handleInbound);
    msg('Upstream worker results open on ' + g_portIn);
}
function closeHub()
{
    g_workerOut.close();
    g_workerIn.close();
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
            sum = p_u.commify(sum, p_u.style(o.fail + ' failed', 'red'));
        if (o.aborted > 0)
            sum = p_u.commify(sum, p_u.style(o.aborted + ' aborted', 'yellow'));
        sum += '.';

        console.log(sum);
    }
    
    //console.log('got ' + o.cmd);

    p_wkr.stop();

    closeHub();
}

exports.runSuite = function(suite, opt)
{
    openHub();

    // Kick off a local worker
    p_wkr.start();

    var msg = p_u.packJS({cmd:'runsuite', suite:suite, opt:opt});

    var m = p_u.unpackJS(msg);
    
    g_workerOut.send(msg);
};

exports.runLoad = function(test, opt)
{
    openHub();

    var lr = new p_lr.LoadRunner(test, opt);

    lr.run(function()
    {
        closeHub();
    });

    
};
