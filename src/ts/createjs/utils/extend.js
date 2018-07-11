var createjs;
(function (createjs) {
    function extend(subclass, superclass) {
        "use strict";
        function o() { this.constructor = subclass; }
        o.prototype = superclass.prototype;
        return (subclass.prototype = new o());
    }
    createjs.extend = extend;
})(createjs || (createjs = {}));
//# sourceMappingURL=extend.js.map