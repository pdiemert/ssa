#!/usr/bin/env node
;(function ()
{ // wrapper in case we're in module_context mode
// windows: running "ssa blah" in this folder will invoke WSH, not node.
    if (typeof WScript !== "undefined")
    {
        WScript.echo("ssa does not work when run\n" + "with the Windows Scripting Host\n\n" + "'cd' to a different directory,\n" + "or type 'ssa.cmd <args>',\n" + "or type 'node ssa <args>'.");
        WScript.quit(1);
        return;
    }

    require('../lib/string.js');
    require('../lib/array.js');

    var fs = require('fs');
    var eyes = require('eyes');
    var path = require('path');
    var findit = require('findit');

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

            files = files.concat(flattenDir('./test'));
            files = files.concat(flattenDir('./spec'));

            // strip out non-js
            files = files.filter(function(e)
            {
                return e.endsWith('.js')
            });

            if (files.length == 0)
                throw "No tests specified and no test or spec directory";
        }

        filecount = files.length;

        startTest();

    } catch(e)
    {
        putl('Error: ' + e.toString());
    }

    // Finds all files in dir and subdirs
    function flattenDir(dir)
    {
        var files = [];

        try
        {
            findit.sync(dir, function(f, s)
            {
                if (!s.isDirectory())
                    files.push(f);

            });
        } catch(e)
        {

        }

        return files;
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

        putl('==> ' + filecount + ' file(s) processed' + (error > 0 ? ', ' + util.style(error + ' failed', 'red') : ''));

        var sum = util.style(succeed + ' test' + (succeed != 1 ? 's' : '') + ' succeeded', 'green');

        if (fail > 0)
            sum += util.style(', ' + fail + ' failed', 'red');
        if (aborted > 0)
            sum += util.style(', ' + aborted + 'aborted', 'yellow');

        putl(sum);
    }

    function trim(str)
    {
        str = str.replace(/^\s\s*/, ''),ws = /\s/,i = str.length;
        while (ws.test(str.charAt(--i)));
        return str.slice(0, i + 1);

    }

    function finishTest(file, out, code)
    {
        //putl('got out (' + code + ') :' + out);
        // Parse output
        if (code == 0)
        {
            puts(out);
            var i = out.indexOf('=>');
            if (i != -1)
            {
                var sum = out.substr(out.indexOf('=>') + 2).split(',');

                function parseNum(part)
                {
                    var numpart = sum[part].split()[0];
                    return parseInt(numpart.substr(numpart.indexOf('m') + 1));
                }

                if (sum.length > 0)
                    succeed += parseNum(0);
                if (sum.length > 1)
                    fail += parseNum(1);
                if (sum.length > 2)
                    aborted += parseNum(2);
            }
        }
        else if (code == 1)
        {
            error++;

            var lines = out.split('\n');
            var ierr = lines.firstIndex(function(e) { return e.trim().startsWith('Error:'); });
            if (ierr == undefined)
                return;

            var msg = lines[ierr].substr(lines[ierr].indexOf('Error:') + 6).trim();

            // Find the line in the stack trace
            while(++ierr < lines.length)
            {
                var m = /.*\((.*)\).*/.exec(lines[ierr]);
                if (m && m.length == 2)
                {
                    var parts = m[1].split(':');
                    var path = file.substr(file.indexOf('/'));
                    if (parts[0].endsWith(path))
                    {
                        putl(util.style('Error: ' + msg + ' (' + file + ' @ line ' + parts[1] + ')', 'red'));
                        break;
                    }
                }
            }
        }
        else
        {
            error++;
        }

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

        if (filecount > 1)
            putl('==> ' + file);

        var prc = childp.spawn(process.argv[0], [file]);

        var out = '';
        prc.stdout.on("data", function(data)
        {
            out += data;
        });
        prc.stderr.on('data', function(data)
        {
            out += data;
        });

        prc.on("exit", function(code)
        {
            finishTest(file, out, code);
        });
    }
})();

