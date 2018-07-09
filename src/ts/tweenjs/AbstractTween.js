var gg;
(function (gg) {
    var AbstractTween = /** @class */ (function (_super) {
        __extends(AbstractTween, _super);
        function AbstractTween(props) {
            var _this = _super.call(this) || this;
            _this.ignoreGlobalPause = false;
            _this.loop = 0;
            _this.useTicks = false;
            _this.reversed = false;
            _this.bounce = false;
            _this.timeScale = 1;
            _this.duration = 0;
            _this.position = 0;
            _this.rawPosition = -1;
            _this._paused = true;
            _this._next = null;
            _this._prev = null;
            _this._parent = null;
            _this._labels = null;
            _this._labelList = null;
            _this._status = -1;
            _this._lastTick = 0;
            if (props) {
                _this.useTicks = !!props.useTicks;
                _this.ignoreGlobalPause = !!props.ignoreGlobalPause;
                _this.loop = props.loop === true ? -1 : (props.loop || 0);
                _this.reversed = !!props.reversed;
                _this.bounce = !!props.bounce;
                _this.timeScale = props.timeScale || 1;
                props.onChange && _this.addEventListener("change", props.onChange);
                props.onComplete && _this.addEventListener("complete", props.onComplete);
            }
            return _this;
        }
        Object.defineProperty(AbstractTween.prototype, "paused", {
            get: function () {
                return this._getPaused();
            },
            set: function (value) {
                this._setPaused(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractTween.prototype, "currentLabel", {
            get: function () {
                return this._getCurrentLabel();
            },
            enumerable: true,
            configurable: true
        });
        AbstractTween.prototype._setPaused = function (value) {
            gg.Tween._register(this, value);
            return this;
        };
        ;
        AbstractTween.prototype._getPaused = function () {
            return this._paused;
        };
        ;
        AbstractTween.prototype._getCurrentLabel = function (pos) {
            var labels = this.getLabels();
            if (pos == null) {
                pos = this.position;
            }
            for (var i = 0, l = labels.length; i < l; i++) {
                if (pos < labels[i].position) {
                    break;
                }
            }
            return (i === 0) ? null : labels[i - 1].label;
        };
        ;
        AbstractTween.prototype.advance = function (delta, ignoreActions) {
            this.setPosition(this.rawPosition + delta * this.timeScale, ignoreActions);
        };
        ;
        AbstractTween.prototype.setPosition = function (rawPosition, ignoreActions, jump, callback) {
            var d = this.duration, loopCount = this.loop, prevRawPos = this.rawPosition;
            var loop = 0, t = 0, end = false;
            // normalize position:
            if (rawPosition < 0) {
                rawPosition = 0;
            }
            if (d === 0) {
                // deal with 0 length tweens.
                end = true;
                if (prevRawPos !== -1) {
                    return end;
                } // we can avoid doing anything else if we're already at 0.
            }
            else {
                loop = rawPosition / d | 0;
                t = rawPosition - loop * d;
                end = (loopCount !== -1 && rawPosition >= loopCount * d + d);
                if (end) {
                    rawPosition = (t = d) * (loop = loopCount) + d;
                }
                if (rawPosition === prevRawPos) {
                    return end;
                } // no need to update
                var rev = !this.reversed !== !(this.bounce && loop % 2); // current loop is reversed
                if (rev) {
                    t = d - t;
                }
            }
            // set this in advance in case an action modifies position:
            this.position = t;
            this.rawPosition = rawPosition;
            this._updatePosition(jump, end);
            if (end) {
                this.paused = true;
            }
            callback && callback(this);
            if (!ignoreActions) {
                this._runActions(prevRawPos, rawPosition, jump, !jump && prevRawPos === -1);
            }
            this.dispatchEvent("change");
            if (end) {
                this.dispatchEvent("complete");
            }
        };
        ;
        AbstractTween.prototype.calculatePosition = function (rawPosition) {
            // largely duplicated from setPosition, but necessary to avoid having to instantiate generic objects to pass values (end, loop, position) back.
            var d = this.duration, loopCount = this.loop, loop = 0, t = 0;
            if (d === 0) {
                return 0;
            }
            if (loopCount !== -1 && rawPosition >= loopCount * d + d) {
                t = d;
                loop = loopCount;
            } // end
            else if (rawPosition < 0) {
                t = 0;
            }
            else {
                loop = rawPosition / d | 0;
                t = rawPosition - loop * d;
            }
            var rev = !this.reversed !== !(this.bounce && loop % 2); // current loop is reversed
            return rev ? d - t : t;
        };
        ;
        AbstractTween.prototype.getLabels = function () {
            var list = this._labelList;
            if (!list) {
                list = this._labelList = [];
                var labels = this._labels;
                for (var n in labels) {
                    list.push({ label: n, position: labels[n] });
                }
                list.sort(function (a, b) { return a.position - b.position; });
            }
            return list;
        };
        ;
        AbstractTween.prototype.setLabels = function (labels) {
            this._labels = labels;
            this._labelList = null;
        };
        ;
        AbstractTween.prototype.addLabel = function (label, position) {
            if (!this._labels) {
                this._labels = {};
            }
            this._labels[label] = position;
            var list = this._labelList;
            if (list) {
                for (var i = 0, l = list.length; i < l; i++) {
                    if (position < list[i].position) {
                        break;
                    }
                }
                list.splice(i, 0, { label: label, position: position });
            }
        };
        ;
        AbstractTween.prototype.gotoAndPlay = function (positionOrLabel) {
            this.paused = false;
            this._goto(positionOrLabel);
        };
        ;
        AbstractTween.prototype.gotoAndStop = function (positionOrLabel) {
            this.paused = true;
            this._goto(positionOrLabel);
        };
        ;
        AbstractTween.prototype.resolve = function (positionOrLabel) {
            var pos = Number(positionOrLabel);
            if (isNaN(pos)) {
                pos = this._labels && this._labels[positionOrLabel];
            }
            return pos;
        };
        ;
        AbstractTween.prototype.toString = function () {
            return "[AbstractTween]";
        };
        ;
        AbstractTween.prototype.clone = function () {
            throw ("AbstractTween can not be cloned.");
        };
        ;
        AbstractTween.prototype._init = function (props) {
            if (!props || !props.paused) {
                this.paused = false;
            }
            if (props && (props.position != null)) {
                this.setPosition(props.position);
            }
        };
        ;
        AbstractTween.prototype._updatePosition = function (jump, end) {
            // abstract.
        };
        ;
        AbstractTween.prototype._goto = function (positionOrLabel) {
            var pos = this.resolve(positionOrLabel);
            if (pos != null) {
                this.setPosition(pos, false, true);
            }
        };
        ;
        AbstractTween.prototype._runActions = function (startRawPos, endRawPos, jump, includeStart) {
            // runs actions between startPos & endPos. Separated to support action deferral.
            //console.log(this.passive === false ? " > Tween" : "Timeline", "run", startRawPos, endRawPos, jump, includeStart);
            // if we don't have any actions, and we're not a Timeline, then return:
            // TODO: a cleaner way to handle this would be to override this method in Tween, but I'm not sure it's worth the overhead.
            if (!this._actionHead && !this.tweens) {
                return;
            }
            var d = this.duration, reversed = this.reversed, bounce = this.bounce, loopCount = this.loop;
            var loop0, loop1, t0, t1;
            if (d === 0) {
                // deal with 0 length tweens:
                loop0 = loop1 = t0 = t1 = 0;
                reversed = bounce = false;
            }
            else {
                loop0 = startRawPos / d | 0;
                loop1 = endRawPos / d | 0;
                t0 = startRawPos - loop0 * d;
                t1 = endRawPos - loop1 * d;
            }
            // catch positions that are past the end:
            if (loopCount !== -1) {
                if (loop1 > loopCount) {
                    t1 = d;
                    loop1 = loopCount;
                }
                if (loop0 > loopCount) {
                    t0 = d;
                    loop0 = loopCount;
                }
            }
            // special cases:
            if (jump) {
                return this._runActionsRange(t1, t1, jump, includeStart);
            } // jump.
            else if (loop0 === loop1 && t0 === t1 && !jump && !includeStart) {
                return;
            } // no actions if the position is identical and we aren't including the start
            else if (loop0 === -1) {
                loop0 = t0 = 0;
            } // correct the -1 value for first advance, important with useTicks.
            var dir = (startRawPos <= endRawPos), loop = loop0;
            do {
                var rev = !reversed !== !(bounce && loop % 2);
                var start = (loop === loop0) ? t0 : dir ? 0 : d;
                var end = (loop === loop1) ? t1 : dir ? d : 0;
                if (rev) {
                    start = d - start;
                    end = d - end;
                }
                if (bounce && loop !== loop0 && start === end) { }
                else if (this._runActionsRange(start, end, jump, includeStart || (loop !== loop0 && !bounce))) {
                    return true;
                }
                includeStart = false;
            } while ((dir && ++loop <= loop1) || (!dir && --loop >= loop1));
        };
        ;
        AbstractTween.prototype._runActionsRange = function (startPos, endPos, jump, includeStart) {
            // abstract
        };
        ;
        return AbstractTween;
    }(gg.EventDispatcher));
    gg.AbstractTween = AbstractTween;
})(gg || (gg = {}));
//# sourceMappingURL=AbstractTween.js.map