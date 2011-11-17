require('ssa').runSuite([
    { test: 'ssa starts up' , expect : function(err, api)
    {
        this.assert.isNull(err);
        this.log.out('api', api);

        console.log(this.log.first('api'));
    },
        setup : function(c)
    {
        var flickr = require('flickr-reflection');
        var options = {
            key: '9a0554259914a86fb9e7eb014e4e5d52',
            secret: '000005fab4534d05',
            apis: ['contacts', 'photos'] // add the apis you'd like to use
        };
//https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=Paris%20Hilton

        flickr.connect(options, this.callback);

       // flickr.connect(options, function(err, api)
       // {
       //     if (err) throw err;
            /*
            api.contacts.getList(function(err, data)
            {
                if (err) throw err;

                sys.puts(sys.inspect(data.contacts.contact));
            });
            */
            /*
            api.photos.search({tags: 'beach,iceland'}, function(err, data)
            {
                if (err) throw err;

                console.log(data.photos.photo);
            });
            */
       // });

    }
    }
]);