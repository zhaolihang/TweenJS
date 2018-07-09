var gg;
(function (gg) {
    function extend(subclass, superclass) {
        "use strict";
        function o() { this.constructor = subclass; }
        o.prototype = superclass.prototype;
        return (subclass.prototype = new o());
    }
    gg.extend = extend;
})(gg || (gg = {}));
//# sourceMappingURL=extend.js.map