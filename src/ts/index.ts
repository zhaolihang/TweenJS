namespace createjs {
    let target = { _x: 0 };
    Object.defineProperty(target, 'x', {
        get() {
            return target._x;
        },
        set(v) {
            target._x = v;
        }
    });

    Tween.get(target).to({ x: 100 }, 1000);

    // Tween.tick(1 / 60, false);

    // Tween.tick(1 / 60, false);
}