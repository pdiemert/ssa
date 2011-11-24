/********************************************************************************
 * Extensions
 */
if (!String.prototype.endsWith)
{
    String.prototype.endsWith = function(s)
    {
        if (this === 0 || this === null)
            throw new TypeError();

        if (s.length > this.length)
            return false;

        return this.substr(this.length - s.length) == s;
    };
}

if (!String.prototype.startsWith)
{
    String.prototype.startsWith = function(s)
    {
        if (this === 0 || this === null)
            throw new TypeError();

        if (s.length > this.length)
            return false;

        return this.substr(0, s.length) == s;
    };
}

if (!String.prototype.LTrim)
{
// Removes leading whitespaces
    String.prototype.LTrim = function(value)
    {

        var re = /\s*((\S+\s*)*)/;
        return value.replace(re, "$1");

    }
}
if (!String.prototype.RTrim)
{
// Removes ending whitespaces
    String.prototype.RTrim = function(value)
    {

        var re = /((\s*\S+)*)\s*/;
        return value.replace(re, "$1");

    }
}

if (!String.prototype.trim)
{
// Removes leading and ending whitespaces
    String.prototype.trim = function(value)
    {

        return this.LTrim( this.RTrim(value));

    }
}