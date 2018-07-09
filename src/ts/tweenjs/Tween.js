var gg;
(function (gg) {
    var TweenStep = /** @class */ (function () {
        function TweenStep(prev, t, d, props, ease, passive) {
            this.next = null;
            this.prev = prev;
            this.t = t;
            this.d = d;
            this.props = props;
            this.ease = ease;
            this.passive = passive;
            this.index = prev ? prev.index + 1 : 0;
        }
        return TweenStep;
    }());
    gg.TweenStep = TweenStep;
    ;
    var TweenAction = /** @class */ (function () {
        function TweenAction(prev, t, scope, funct, params) {
            this.next = null;
            this.prev = prev;
            this.t = t;
            this.d = 0;
            this.scope = scope;
            this.funct = funct;
            this.params = params;
        }
        return TweenAction;
    }());
    gg.TweenAction = TweenAction;
    ;
    var Tween = /** @class */ (function (_super) {
        __extends(Tween, _super);
        function Tween(target, props) {
            var _this = _super.call(this, props) || this;
            _this._next = null;
            _this._prev = null;
            _this.pluginData = null;
            _this.target = target;
            _this.passive = false;
            _this._stepHead = new TweenStep(null, 0, 0, {}, null, true);
            _this._stepTail = _this._stepHead;
            _this._stepPosition = 0;
            _this._actionHead = null;
            _this._actionTail = null;
            _this._plugins = null;
            _this._pluginIds = null;
            _this._injected = null;
            if (props) {
                _this.pluginData = props.pluginData;
                if (props.override) {
                    Tween.removeTweens(target);
                }
            }
            if (!_this.pluginData) {
                _this.pluginData = {};
            }
            _this._init(props);
            return _this;
        }
        Tween.get = function (target, props) {
            return new Tween(target, props);
        };
        ;
        Tween.tick = function (delta, paused) {
            var tween = Tween._tweenHead;
            var t = Tween._inTick = Date.now();
            while (tween) {
                var next = tween._next, status = tween._status;
                tween._lastTick = t;
                if (status === 1) {
                    tween._status = 0;
                } // new, ignore
                else if (status === -1) {
                    Tween._delist(tween);
                } // removed, delist
                else if ((paused && !tween.ignoreGlobalPause) || tween._paused) { }
                else {
                    tween.advance(tween.useTicks ? 1 : delta);
                }
                tween = next;
            }
            Tween._inTick = 0;
        };
        ;
        Tween.handleEvent = function (event) {
            if (event.type === "tick") {
                this.tick(event.delta, event.paused);
            }
        };
        ;
        Tween.removeTweens = function (target) {
            if (!target.tweenjs_count) {
                return;
            }
            var tween = Tween._tweenHead;
            while (tween) {
                var next = tween._next;
                if (tween.target === target) {
                    Tween._register(tween, true);
                }
                tween = next;
            }
            target.tweenjs_count = 0;
        };
        ;
        Tween.removeAllTweens = function () {
            var tween = Tween._tweenHead;
            while (tween) {
                var next = tween._next;
                tween._paused = true;
                tween.target && (tween.target.tweenjs_count = 0);
                tween._next = tween._prev = null;
                tween = next;
            }
            Tween._tweenHead = Tween._tweenTail = null;
        };
        ;
        Tween.hasActiveTweens = function (target) {
            if (target) {
                return !!target.tweenjs_count;
            }
            return !!Tween._tweenHead;
        };
        ;
        Tween._installPlugin = function (plugin) {
            var priority = (plugin.priority = plugin.priority || 0), arr = (Tween._plugins = Tween._plugins || []);
            for (var i = 0, l = arr.length; i < l; i++) {
                if (priority < arr[i].priority) {
                    break;
                }
            }
            arr.splice(i, 0, plugin);
        };
        ;
        Tween._register = function (tween, paused) {
            var target = tween.target;
            if (!paused && tween._paused) {
                // TODO: this approach might fail if a dev is using sealed objects
                if (target) {
                    target.tweenjs_count = target.tweenjs_count ? target.tweenjs_count + 1 : 1;
                }
                var tail = Tween._tweenTail;
                if (!tail) {
                    Tween._tweenHead = Tween._tweenTail = tween;
                }
                else {
                    Tween._tweenTail = tail._next = tween;
                    tween._prev = tail;
                }
                tween._status = Tween._inTick ? 1 : 0;
                if (!Tween._inited && gg.Ticker) {
                    gg.Ticker.addEventListener("tick", Tween);
                    Tween._inited = true;
                }
            }
            else if (paused && !tween._paused) {
                if (target) {
                    target.tweenjs_count--;
                }
                // tick handles delist if we're in a tick stack and the tween hasn't advanced yet:
                if (!Tween._inTick || tween._lastTick === Tween._inTick) {
                    Tween._delist(tween);
                }
                tween._status = -1;
            }
            tween._paused = paused;
        };
        ;
        Tween._delist = function (tween) {
            var next = tween._next, prev = tween._prev;
            if (next) {
                next._prev = prev;
            }
            else {
                Tween._tweenTail = prev;
            } // was tail
            if (prev) {
                prev._next = next;
            }
            else {
                Tween._tweenHead = next;
            } // was head.
            tween._next = tween._prev = null;
        };
        Tween.prototype.wait = function (duration, passive) {
            if (duration > 0) {
                this._addStep(+duration, this._stepTail.props, null, passive);
            }
            return this;
        };
        ;
        Tween.prototype.to = function (props, duration, ease) {
            if (duration == null || duration < 0) {
                duration = 0;
            }
            var step = this._addStep(+duration, null, ease);
            this._appendProps(props, step);
            return this;
        };
        ;
        Tween.prototype.label = function (name) {
            this.addLabel(name, this.duration);
            return this;
        };
        ;
        Tween.prototype.call = function (callback, params, scope) {
            return this._addAction(scope || this.target, callback, params || [this]);
        };
        ;
        Tween.prototype.set = function (props, target) {
            return this._addAction(target || this.target, this._set, [props]);
        };
        ;
        Tween.prototype.play = function (tween) {
            return this._addAction(tween || this, this._set, [{ paused: false }]);
        };
        ;
        Tween.prototype.pause = function (tween) {
            return this._addAction(tween || this, this._set, [{ paused: true }]);
        };
        ;
        Tween.prototype.toString = function () {
            return "[Tween]";
        };
        ;
        Tween.prototype.clone = function () {
            throw ("Tween can not be cloned.");
        };
        ;
        Tween.prototype._addPlugin = function (plugin) {
            var ids = this._pluginIds || (this._pluginIds = {}), id = plugin.ID;
            if (!id || ids[id]) {
                return;
            } // already added
            ids[id] = true;
            var plugins = this._plugins || (this._plugins = []), priority = plugin.priority || 0;
            for (var i = 0, l = plugins.length; i < l; i++) {
                if (priority < plugins[i].priority) {
                    plugins.splice(i, 0, plugin);
                    return;
                }
            }
            plugins.push(plugin);
        };
        ;
        Tween.prototype._updatePosition = function (jump, end) {
            var step = this._stepHead.next, t = this.position, d = this.duration;
            if (this.target && step) {
                // find our new step index:
                var stepNext = step.next;
                while (stepNext && stepNext.t <= t) {
                    step = step.next;
                    stepNext = step.next;
                }
                var ratio = end ? d === 0 ? 1 : t / d : (t - step.t) / step.d; // TODO: revisit this.
                this._updateTargetProps(step, ratio, end);
            }
            this._stepPosition = step ? t - step.t : 0;
        };
        ;
        Tween.prototype._updateTargetProps = function (step, ratio, end) {
            if (this.passive = !!step.passive) {
                return;
            } // don't update props.
            var v, v0, v1, ease;
            var p0 = step.prev.props;
            var p1 = step.props;
            if (ease = step.ease) {
                ratio = ease(ratio, 0, 1, 1);
            }
            var plugins = this._plugins;
            proploop: for (var n in p0) {
                v0 = p0[n];
                v1 = p1[n];
                // values are different & it is numeric then interpolate:
                if (v0 !== v1 && (typeof (v0) === "number")) {
                    v = v0 + (v1 - v0) * ratio;
                }
                else {
                    v = ratio >= 1 ? v1 : v0; // 瞬时值
                }
                if (plugins) {
                    for (var i = 0, l = plugins.length; i < l; i++) {
                        var value = plugins[i].change(this, step, n, v, ratio, end);
                        if (value === Tween.IGNORE) {
                            continue proploop;
                        }
                        if (value !== undefined) {
                            v = value;
                        }
                    }
                }
                this.target[n] = v;
            }
        };
        ;
        Tween.prototype._runActionsRange = function (startPos, endPos, jump, includeStart) {
            var rev = startPos > endPos;
            var action = rev ? this._actionTail : this._actionHead;
            var ePos = endPos, sPos = startPos;
            if (rev) {
                ePos = startPos;
                sPos = endPos;
            }
            var t = this.position;
            while (action) {
                var pos = action.t;
                if (pos === endPos || (pos > sPos && pos < ePos) || (includeStart && pos === startPos)) {
                    action.funct.apply(action.scope, action.params);
                    if (t !== this.position) {
                        return true;
                    }
                }
                action = rev ? action.prev : action.next;
            }
        };
        ;
        Tween.prototype._appendProps = function (props, step, stepPlugins) {
            var initProps = this._stepHead.props, target = this.target, plugins = Tween._plugins;
            var n, i, value, initValue, inject;
            var oldStep = step.prev, oldProps = oldStep.props;
            var stepProps = step.props || (step.props = this._cloneProps(oldProps));
            var cleanProps = {}; // TODO: is there some way to avoid this additional object?
            for (n in props) {
                if (!props.hasOwnProperty(n)) {
                    continue;
                }
                cleanProps[n] = stepProps[n] = props[n];
                if (initProps[n] !== undefined) {
                    continue;
                }
                initValue = undefined; // accessing missing properties on DOMElements when using CSSPlugin is INSANELY expensive, so we let the plugin take a first swing at it.
                if (plugins) {
                    for (i = plugins.length - 1; i >= 0; i--) {
                        value = plugins[i].init(this, n, initValue);
                        if (value !== undefined) {
                            initValue = value;
                        }
                        if (initValue === Tween.IGNORE) {
                            delete (stepProps[n]);
                            delete (cleanProps[n]);
                            break;
                        }
                    }
                }
                if (initValue !== Tween.IGNORE) {
                    if (initValue === undefined) {
                        initValue = target[n];
                    }
                    oldProps[n] = (initValue === undefined) ? null : initValue;
                }
            }
            for (n in cleanProps) {
                value = props[n];
                // propagate old value to previous steps:
                var o, prev = oldStep;
                while ((o = prev) && (prev = o.prev)) {
                    if (prev.props === o.props) {
                        continue;
                    } // wait step
                    if (prev.props[n] !== undefined) {
                        break;
                    } // already has a value, we're done.
                    prev.props[n] = oldProps[n];
                }
            }
            if (stepPlugins !== false && (plugins = this._plugins)) {
                for (i = plugins.length - 1; i >= 0; i--) {
                    plugins[i].step(this, step, cleanProps);
                }
            }
            if (inject = this._injected) {
                this._injected = null;
                this._appendProps(inject, step, false);
            }
        };
        ;
        Tween.prototype._injectProp = function (name, value) {
            var o = this._injected || (this._injected = {});
            o[name] = value;
        };
        ;
        Tween.prototype._addStep = function (duration, props, ease, passive) {
            var step = new TweenStep(this._stepTail, this.duration, duration, props, ease, passive || false);
            this.duration += duration;
            return this._stepTail = (this._stepTail.next = step);
        };
        ;
        Tween.prototype._addAction = function (scope, funct, params) {
            var action = new TweenAction(this._actionTail, this.duration, scope, funct, params);
            if (this._actionTail) {
                this._actionTail.next = action;
            }
            else {
                this._actionHead = action;
            }
            this._actionTail = action;
            return this;
        };
        ;
        Tween.prototype._set = function (props) {
            for (var n in props) {
                this[n] = props[n];
            }
        };
        ;
        Tween.prototype._cloneProps = function (props) {
            var o = {};
            for (var n in props) {
                o[n] = props[n];
            }
            return o;
        };
        ;
        Tween.IGNORE = {};
        Tween._tweens = [];
        Tween._plugins = null;
        Tween._tweenHead = null;
        Tween._tweenTail = null;
        Tween._inTick = 0;
        return Tween;
    }(gg.AbstractTween));
    gg.Tween = Tween;
    // tiny api (primarily for tool output):
    Tween.prototype.w = Tween.prototype.wait;
    Tween.prototype.t = Tween.prototype.to;
    Tween.prototype.c = Tween.prototype.call;
    Tween.prototype.s = Tween.prototype.set;
})(gg || (gg = {}));
//# sourceMappingURL=Tween.js.map