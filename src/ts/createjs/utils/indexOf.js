var gg;
(function (gg) {
    function indexOf(array, searchElement) {
        "use strict";
        for (var i = 0, l = array.length; i < l; i++) {
            if (searchElement === array[i]) {
                return i;
            }
        }
        return -1;
    }
    gg.indexOf = indexOf;
})(gg || (gg = {}));
//# sourceMappingURL=indexOf.js.map