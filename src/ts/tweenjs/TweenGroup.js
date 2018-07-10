var gg;
(function (gg) {
    var TweenGroup = /** @class */ (function () {
        function TweenGroup(paused, timeScale) {
            this._tweens = [];
            this.paused = paused;
            this.timeScale = timeScale;
            this.__onComplete = this._onComplete.bind(this);
        }
        TweenGroup.prototype._setTimeScale = function (value) {
            var tweens = this._tweens;
            this._timeScale = value = value || null;
            for (var i = tweens.length - 1; i >= 0; i--) {
                tweens[i].timeScale = value;
            }
        };
        ;
        TweenGroup.prototype._getTimeScale = function () {
            return this._timeScale;
        };
        ;
        Object.defineProperty(TweenGroup.prototype, "paused", {
            get: function () {
                return this._paused;
            },
            set: function (value) {
                var tweens = this._tweens;
                this._paused = value = !!value;
                for (var i = tweens.length - 1; i >= 0; i--) {
                    tweens[i].paused = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TweenGroup.prototype, "timeScale", {
            get: function () {
                return this._getTimeScale();
            },
            set: function (value) {
                this._setTimeScale(value);
            },
            enumerable: true,
            configurable: true
        });
        TweenGroup.prototype.get = function (target, props) {
            return this.add(gg.Tween.get(target, props));
        };
        TweenGroup.prototype.add = function (tween) {
            var l = arguments.length, tweens = this._tweens;
            for (var i = 0, l = arguments.length; i < l; i++) {
                tween = arguments[i];
                tween.paused = this._paused;
                if (this._timeScale !== null) {
                    tween.timeScale = this._timeScale;
                }
                tweens.push(tween);
                tween.addEventListener && tween.addEventListener("complete", this.__onComplete);
            }
            return arguments[l - 1];
        };
        TweenGroup.prototype.remove = function (tween) {
            var l = arguments.length, tweens = this._tweens;
            for (var i = 0; i < l; i++) {
                tween = arguments[i];
                for (var j = tweens.length - 1; j >= 0; j--) {
                    if (tweens[j] === tween) {
                        tweens.splice(j, 1);
                        tween.removeEventListener && tween.removeEventListener("complete", this.__onComplete);
                    }
                }
            }
        };
        TweenGroup.prototype.reset = function (keepGroups) {
            var tweens = this._tweens;
            for (var i = tweens.length - 1; i >= 0; i--) {
                var tween = tweens[i];
                if (tween instanceof TweenGroup) {
                    tween.reset();
                    if (keepGroups) {
                        continue;
                    }
                }
                tweens.splice(i, 1);
                tween.paused = true;
                tween.removeEventListener && tween.removeEventListener("complete", this.__onComplete);
            }
            return this;
        };
        TweenGroup.prototype._onComplete = function (evt) {
            this.remove(evt.target);
        };
        return TweenGroup;
    }());
    gg.TweenGroup = TweenGroup;
})(gg || (gg = {}));
//# sourceMappingURL=TweenGroup.js.map