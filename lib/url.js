/**
 * URL - Fliquid URL building/handling class
 *
 * Version: 1.0.0 BETA
 */
function URL(url)
{
	this.scheme = null;
	this.host = null;
	this.port = null;
	this.path = null;
	this.args =
	{
	};
	this.anchor = null;

	if(arguments.length > 0)
		this.set(url);
}

/**
 * thisURL() parses the current window.location and returns a URL object
 */
URL.thisURL = function()
{
	return new URL(window.location.href);
};

URL.prototype = new Object();

/**
 * set() parses a url and sets the properties of the URL object
 */
URL.prototype.set = function(url)
{
	var p;
	if( p = this.parseURL(url))
	{
		this.scheme = p['scheme'];
		this.host = p['host'];
		this.port = p['port'];
		this.path = p['path'];
		this.args = this.parseArgs(p['args']);
		this.anchor = p['anchor'];
	}
};
/**
 * removeArg() is used remove a specified argument from the URL object arguments
 */
URL.prototype.removeArg = function(k)
{
	if(k && String(k.constructor) == String(Array))
	{
		// TODO: Change to use is_array
		var t = this.args;
		for(var i = 0; i < k.length - 1; i++)
		{
			if( typeof t[k[i]] != 'undefined')
			{
				// TODO: Change to use isset
				t = t[k[i]];
			}
			else
			{
				return false;
			}
		}
		delete t[k[k.length - 1]];
		return true;
	}
	else if( typeof this.args[k] != 'undefined')
	{
		// TODO: Change to use isset
		delete this.args[k];
		return true;
	}

	return false;
};
/**
 * addArg() is used to add an argument with specified value to the URL object arguments
 */
URL.prototype.addArg = function(k, v, o)
{
	if(k && String(k.constructor) == String(Array))
	{
		// TODO: Change to use is_array
		var t = this.args;
		for(var i = 0; i < k.length - 1; i++)
		{
			if( typeof t[k[i]] == 'undefined')
				t[k[i]] =
				{
				};
			t = t[k[i]];
		}
		if(o || typeof t[k[k.length - 1]] == 'undefined')
			t[k[k.length - 1]] = v;
		// TODO: Change to use isset
	}
	else if(o || typeof this.args[k] == 'undefined')
	{
		// TODO: Change to use isset
		this.args[k] = v;
		return true;
	}

	return false;
};
/**
 * parseURL() parses the specified url and returns an object containing the various components
 */
URL.prototype.parseURL = function(url)
{
	// TODO: Add support for ftp username
	var p =
	{
	}, m;
	if( m = url.match(/((s?ftp|https?):\/\/)?([^\/:]+)?(:([0-9]+))?([^\?#]+)?(\?([^#]+))?(#(.+))?/))
	{
		p['scheme'] = (m[2] ? m[2] : 'http');
		p['host'] = (m[3] ? m[3] : null);
		p['port'] = (m[5] ? m[5] : null);
		p['path'] = (m[6] ? m[6] : null);
		p['args'] = (m[8] ? m[8] : null);
		p['anchor'] = (m[10] ? m[10] : null);

		return p;
	}

	return false;
};
/**
 * parseArgs() parses a query string and returns an object containing the parsed data
 */
URL.prototype.parseArgs = function(s)
{
	var a =
	{
	};
	if(s && s.length)
	{
		var kp, kv;
		var p;
		if(( kp = s.split('&')) && kp.length)
		{
			for(var i = 0; i < kp.length; i++)
			{
				if(( kv = kp[i].split('=')) && kv.length == 2)
				{
					if( p = kv[0].split(/(\[|\]\[|\])/))
					{
						for(var z = 0; z < p.length; z++)
						{
							if(p[z] == ']' || p[z] == '[' || p[z] == '][')
							{
								p.splice(z, 1);
							}
						}
						var t = a;
						for(var o = 0; o < p.length - 1; o++)
						{
							if( typeof t[p[o]] == 'undefined')
								t[p[o]] =
								{
								};
							// TODO: Change this to isset
							t = t[p[o]];
						}
						t[p[p.length - 1]] = kv[1];
					}
					else
					{
						a[kv[0]] = kv[1];
					}
				}
			}
		}
	}

	return a;
};
/**
 * toArgs() takes an object and returns a query string
 */
URL.prototype.toArgs = function(a, p)
{
	if(arguments.length < 2)
		p = '';
	if(a && typeof a == 'object')
	{
		// TODO: Change this to use is_object
		var s = '';
		for(i in a)
		{
			if( typeof a[i] != 'function')
			{
				if(s.length)
					s += '&';
				if( typeof a[i] == 'object')
				{
					// TODO: Change this to use is_object
					var k = (p.length ? p + '[' + i + ']' : i);
					s += this.toArgs(a[i], k);
				}
				else
				{
					// TODO: Change this to use is_function
					s += p + (p.length && i != '' ? '[' : '') + i + (p.length && i != '' ? ']' : '') + '=' + a[i];
				}
			}
		}
		return s;
	}

	return '';
};
/**
 * toAbsolute() returns a string containing the absolute URL for the current URL object
 */
URL.prototype.toAbsolute = function()
{
	var s = '';
	if(this.scheme != null)
		s += this.scheme + '://';
	if(this.host != null)
		s += this.host;
	if(this.port != null)
		s += ':' + this.port;
	s += this.toRelative();

	return s;
};
/**
 * toRelative() returns a string containing the relative URL for the current URL object
 */
URL.prototype.toRelative = function()
{
	var s = '';
	if(this.path != null)
		s += this.path;
	var a = this.toArgs(this.args);
	if(a.length)
		s += '?' + a;
	if(this.anchor != null)
		s += '#' + this.anchor;

	return s;
};
/**
 * isHost() is used to determine whether the host in the URL object matches the current host
 */
URL.prototype.isHost = function()
{
	return false;
	//	var u = URL.thisURL();
	//	return (this.host == null || this.host == u.host ? true : false);
};
/**
 * toString() returns a string containing the current URL object as a URL
 */
URL.prototype.toString = function()
{
	return (this.isHost() ? this.toRelative() : this.toAbsolute());
};

exports.URL = URL;