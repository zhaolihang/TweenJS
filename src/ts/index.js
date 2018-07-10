var gg;
(function (gg) {
    var target = { _x: 0 };
    Object.defineProperty(target, 'x', {
        get: function () {
            return target._x;
        },
        set: function (v) {
            target._x = v;
        }
    });
    gg.Tween.get(target).to({ x: 100 }, 1000);
    // Tween.tick(1/60);
    // Tween.tick(1/60);
})(gg || (gg = {}));
//# sourceMappingURL=index.js.map