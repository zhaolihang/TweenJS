var gg;
(function (gg) {
    var Timeline = /** @class */ (function (_super) {
        __extends(Timeline, _super);
        function Timeline(props) {
            var _this = this;
            var tweens, labels;
            if (props) {
                tweens = props.tweens;
                labels = props.labels;
            }
            _this = _super.call(this, props) || this;
            _this.tweens = [];
            if (tweens) {
                _this.addTween.apply(_this, tweens);
            }
            _this.setLabels(labels);
            _this._init(props);
            return _this;
        }
        Timeline.prototype.addTween = function (tween) {
            if (tween._parent) {
                tween._parent.removeTween(tween);
            }
            var l = arguments.length;
            if (l > 1) {
                for (var i = 0; i < l; i++) {
                    this.addTween(arguments[i]);
                }
                return arguments[l - 1];
            }
            else if (l === 0) {
                return null;
            }
            this.tweens.push(tween);
            tween._parent = this;
            tween.paused = true;
            var d = tween.duration;
            if (tween.loop > 0) {
                d *= tween.loop + 1;
            }
            if (d > this.duration) {
                this.duration = d;
            }
            if (this.rawPosition >= 0) {
                tween.setPosition(this.rawPosition);
            }
            return tween;
        };
        ;
        Timeline.prototype.removeTween = function (tween) {
            var l = arguments.length;
            if (l > 1) {
                var good = true;
                for (var i_1 = 0; i_1 < l; i_1++) {
                    good = good && this.removeTween(arguments[i_1]);
                }
                return good;
            }
            else if (l === 0) {
                return true;
            }
            var tweens = this.tweens;
            var i = tweens.length;
            while (i--) {
                if (tweens[i] === tween) {
                    tweens.splice(i, 1);
                    tween._parent = null;
                    if (tween.duration >= this.duration) {
                        this.updateDuration();
                    }
                    return true;
                }
            }
            return false;
        };
        ;
        Timeline.prototype.updateDuration = function () {
            this.duration = 0;
            for (var i = 0, l = this.tweens.length; i < l; i++) {
                var tween = this.tweens[i];
                var d = tween.duration;
                if (tween.loop > 0) {
                    d *= tween.loop + 1;
                }
                if (d > this.duration) {
                    this.duration = d;
                }
            }
        };
        ;
        Timeline.prototype.toString = function () {
            return "[Timeline]";
        };
        ;
        Timeline.prototype.clone = function () {
            throw ("Timeline can not be cloned.");
        };
        ;
        // private methods:
        // Docced in AbstractTween
        Timeline.prototype._updatePosition = function (jump, end) {
            var t = this.position;
            for (var i = 0, l = this.tweens.length; i < l; i++) {
                this.tweens[i].setPosition(t, true, jump); // actions will run after all the tweens update.
            }
        };
        ;
        // Docced in AbstractTween
        Timeline.prototype._runActionsRange = function (startPos, endPos, jump, includeStart) {
            //console.log("	range", startPos, endPos, jump, includeStart);
            var t = this.position;
            for (var i = 0, l = this.tweens.length; i < l; i++) {
                this.tweens[i]._runActions(startPos, endPos, jump, includeStart);
                if (t !== this.position) {
                    return true;
                } // an action changed this timeline's position.
            }
        };
        ;
        return Timeline;
    }(gg.AbstractTween));
    gg.Timeline = Timeline;
})(gg || (gg = {}));
//# sourceMappingURL=Timeline.js.map