/********************************************************************************
 * Extensions
 */
if(!Array.prototype.first)
{
	Array.prototype.first = function(fun /*, thisp */)
	{
		if(this ===	0 || this === null)
			throw new TypeError();

		var t = Object(this);
		var len = t.length >>> 0;
		if( typeof fun !== "function")
			throw new TypeError();

		var thisp = arguments[1];
		for(var i = 0; i < len; i++)
		{
			if( i in t)
			{
				if(fun.call(thisp, t[i], i, t))
					return t[i];
			}
		}
	};
    Array.prototype.firstIndex = function(fun /*, thisp */)
    {
        if(this ===	0 || this === null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if( typeof fun !== "function")
            throw new TypeError();

        var thisp = arguments[1];
        for(var i = 0; i < len; i++)
        {
            if( i in t)
            {
                if(fun.call(thisp, t[i], i, t))
                    return i;
            }
        }
    };
}
