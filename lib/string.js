/********************************************************************************
 * Extensions
 */
if(!String.prototype.endsWith)
{
	String.prototype.endsWith = function(s)
	{
		if(this ===	0 || this === null)
			throw new TypeError();

        if (s.length > this.length)
            return false;

        return this.substr(this.length - s.length) == s;
	};
}
