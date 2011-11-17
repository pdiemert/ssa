/*global require*/
var p_zmq = require('zeromq');
var p_const = require('./const.js');
var p_u = require('./util.js');
var p_sr = require('./SuiteRunner.js');

var g_inbound;
var g_outbound;

function msg(m)
{
    console.log(m);
}

function start(controller)
{
    if (!controller)
        controller = 'localhost';
    
    g_inbound = p_zmq.createSocket('pull');
    g_inbound.connect('tcp://' + controller + ':' + p_const.defaultWorkerOutPort);

    g_outbound = p_zmq.createSocket('push');
    g_outbound.connect('tcp://' + controller + ':' + p_const.defaultWorkerInPort);

    g_inbound.on('message', handleIncoming);
}

function handleIncoming(env)
{
    var msg = env.toString();

    var o = p_u.unpackJS(msg);

    if (o.cmd == 'runsuite')
    {
        var sr = new p_sr.SuiteRunner(o.suite, o.opt);

        sr.run(function(succeed, fail, aborted, logger)
        {
            var msg = JSON.stringify({cmd:'runsuite_res', succeed:succeed, fail:fail, aborted:aborted, log:logger.pack()});

            g_outbound.send(msg);
        });
    }
}

function stop()
{
    g_inbound.close();
    g_outbound.close();
}


exports.start = start;
exports.stop = stop;