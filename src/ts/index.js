var createjs;
(function (createjs) {
    var target = { _x: 0 };
    Object.defineProperty(target, 'x', {
        get: function () {
            return target._x;
        },
        set: function (v) {
            target._x = v;
        }
    });
    createjs.Tween.get(target).to({ x: 100 }, 1000);
    // Tween.tick(1 / 60, false);
    // Tween.tick(1 / 60, false);
})(createjs || (createjs = {}));
//# sourceMappingURL=index.js.map