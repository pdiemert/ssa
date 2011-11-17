#!/usr/bin/env node
;(function ()
{ // wrapper in case we're in module_context mode

// windows: running "npm blah" in this folder will invoke WSH, not node.
    if (typeof WScript !== "undefined")
    {
        WScript.echo("ssa does not work when run\n" + "with the Windows Scripting Host\n\n" + "'cd' to a different directory,\n" + "or type 'ssa.cmd <args>',\n" + "or type 'node ssa <args>'.");
        WScript.quit(1);
        return;
    }

    require('../lib/string.js');

    var fs = require('fs');
    var eyes = require('eyes');
    var path = require('path');
    var childp = require('child_process');
    var util = require('../lib/util.js');

    var files = [];
    var succeed = 0;
    var fail = 0;
    var aborted = 0;
    var error = 0;
    var filecount = 0;

    try
    {
        if (process.argv.length > 2)
        {
            files = files.concat(process.argv.slice(2));
        }
        else
        {
            if (path.existsSync('./test'))
                files = files.concat(fs.readdirSync('./test').map(function(e){return './test/' + e;}));
            if (path.existsSync('./spec'))
                files = files.concact(fs.readdirSync('./spec').map(function(e){return './spec/' + e;}));

            // strip out non-js
            files = files.filter(function(e){return e.endsWith('.js')});

            if (files.length == 0)
                throw "No tests specified and no test or spec directory";
        }

        filecount = files.length;

        startTest();
        
    } catch(e)
    {
        putl('Error: ' + e.toString());
    }

    function puts(s)
    {
        process.stdout.write(s);
    }

    function putl(s)
    {
        puts(s + '\n');
    }
    function finishAllTests()
    {
        if (filecount == 1)
            return;

        putl('==> ' + filecount + ' file(s) processed');
        
        var sum = util.style(succeed + ' test' + (succeed != 1 ? 's' : '') + ' succeeded', 'green');

        if (fail > 0)
            sum += util.style(', ' + fail + ' failed', 'red');
        if (aborted > 0)
            sum += util.style(', ' + aborted + 'aborted', 'yellow');

        putl(sum);
    }

    function trim(str)
    {
        str = str.replace(/^\s\s*/, ''),
        ws = /\s/,
        i = str.length;
        while (ws.test(str.charAt(--i)));
        return str.slice(0, i + 1);

    }
    function finishTest(file, out, code)
    {
        // Parse output
        if (code == 0)
        {
            putl(out);
            var i = out.indexOf('=>');
            if (i != -1)
            {
                var sum = out.substr(out.indexOf('=>')+2).split(',');

                function parseNum(part)
                {
                    var numpart = sum[part].split()[0];
                    return parseInt(numpart.substr(numpart.indexOf('m')+1));
                }
                if (sum.length > 0)
                    succeed += parseNum(0);
                if (sum.length > 1)
                    fail += parseNum(1);
                if (sum.length > 2)
                    aborted += parseNum(2);
            }
        }
        else
        {
            error++;
        }

        if (filecount > 1)
            putl('==> ' + file);

        //out = trim(out);
        //if (out.length > 0)
        //    putl(trim(out));
        
        // Start next
        startTest();
    }

    function startTest()
    {
        if (files.length == 0)
        {
            finishAllTests();
            return;
        }

        var file = files.shift();

        var prc = childp.spawn(process.argv[0], [file]);

        var out = '';
        prc.stdout.on("data", function(data)
        {
            out += data;
        });

        prc.on("exit", function(code)
        {
            finishTest(file, out, code);
        });
    }
})();

