var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var createjs;
(function (createjs) {
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
    createjs.TweenStep = TweenStep;
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
    createjs.TweenAction = TweenAction;
    ;
    var Tween = /** @class */ (function (_super) {
        __extends(Tween, _super);
        function Tween(target, props) {
            var _this = _super.call(this, props) || this;
            _this.next = null;
            _this.prev = null;
            _this.pluginData = null;
            _this.target = target;
            _this.passive = false;
            _this.stepHead = new TweenStep(null, 0, 0, {}, null, true);
            _this.stepTail = _this.stepHead;
            _this.stepPosition = 0;
            _this.actionHead = null;
            _this.actionTail = null;
            _this.plugins = null;
            _this.pluginIds = null;
            _this.injected = null;
            if (props) {
                _this.pluginData = props.pluginData;
                if (props.override) {
                    Tween.removeTweens(target);
                }
            }
            if (!_this.pluginData) {
                _this.pluginData = {};
            }
            _this.init(props);
            return _this;
        }
        Tween.get = function (target, props) {
            return new Tween(target, props);
        };
        ;
        Tween.tick = function (delta, paused) {
            var tween = Tween.tweenHead;
            var t = Tween.inTick = Date.now();
            while (tween) {
                var next = tween.next, status = tween.status;
                tween.lastTick = t;
                if (status === 1) {
                    tween.status = 0;
                } // new, ignore
                else if (status === -1) {
                    Tween.delist(tween);
                } // removed, delist
                else if ((paused && !tween.ignoreGlobalPause) || tween._paused) { }
                else {
                    tween.advance(tween.useTicks ? 1 : delta);
                }
                tween = next;
            }
            Tween.inTick = 0;
        };
        ;
        Tween.handleEvent = function (event) {
            if (event.type === createjs.Ticker.TickName) {
                this.tick(event.delta, event.paused);
            }
        };
        ;
        Tween.removeTweens = function (target) {
            if (!target.tweenjs_count) {
                return;
            }
            var tween = Tween.tweenHead;
            while (tween) {
                var next = tween.next;
                if (tween.target === target) {
                    Tween.register(tween, true);
                }
                tween = next;
            }
            target.tweenjs_count = 0;
        };
        ;
        Tween.removeAllTweens = function () {
            var tween = Tween.tweenHead;
            while (tween) {
                var next = tween.next;
                tween._paused = true;
                tween.target && (tween.target.tweenjs_count = 0);
                tween.next = tween.prev = null;
                tween = next;
            }
            Tween.tweenHead = Tween.tweenTail = null;
        };
        ;
        Tween.hasActiveTweens = function (target) {
            if (target) {
                return !!target.tweenjs_count;
            }
            return !!Tween.tweenHead;
        };
        ;
        Tween.installPlugin = function (plugin) {
            var priority = (plugin.priority = plugin.priority || 0), arr = (Tween.plugins = Tween.plugins || []);
            for (var i = 0, l = arr.length; i < l; i++) {
                if (priority < arr[i].priority) {
                    break;
                }
            }
            arr.splice(i, 0, plugin);
        };
        ;
        Tween.register = function (tween, paused) {
            var target = tween.target;
            if (!paused && tween._paused) {
                // TODO: this approach might fail if a dev is using sealed objects
                if (target) {
                    target.tweenjs_count = target.tweenjs_count ? target.tweenjs_count + 1 : 1;
                }
                var tail = Tween.tweenTail;
                if (!tail) {
                    Tween.tweenHead = Tween.tweenTail = tween;
                }
                else {
                    Tween.tweenTail = tail.next = tween;
                    tween.prev = tail;
                }
                tween.status = Tween.inTick ? 1 : 0;
                if (!Tween.inited && createjs.Ticker) {
                    createjs.Ticker.addEventListener(createjs.Ticker.TickName, Tween);
                    Tween.inited = true;
                }
            }
            else if (paused && !tween._paused) {
                if (target) {
                    target.tweenjs_count--;
                }
                // tick handles delist if we're in a tick stack and the tween hasn't advanced yet:
                if (!Tween.inTick || tween.lastTick === Tween.inTick) {
                    Tween.delist(tween);
                }
                tween.status = -1;
            }
            tween._paused = paused;
        };
        ;
        Tween.delist = function (tween) {
            var next = tween.next, prev = tween.prev;
            if (next) {
                next.prev = prev;
            }
            else {
                Tween.tweenTail = prev;
            } // was tail
            if (prev) {
                prev.next = next;
            }
            else {
                Tween.tweenHead = next;
            } // was head.
            tween.next = tween.prev = null;
        };
        Tween.prototype.wait = function (duration, passive) {
            if (duration > 0) {
                this.addStep(+duration, this.stepTail.props, null, passive);
            }
            return this;
        };
        ;
        Tween.prototype.to = function (props, duration, ease) {
            if (duration == null || duration < 0) {
                duration = 0;
            }
            var step = this.addStep(+duration, null, ease);
            this.appendProps(props, step);
            return this;
        };
        Tween.prototype.label = function (name) {
            this.addLabel(name, this.duration);
            return this;
        };
        Tween.prototype.call = function (callback, params, scope) {
            return this.addAction(scope || this.target, callback, params || [this]);
        };
        ;
        Tween.prototype.set = function (props, target) {
            return this.addAction(target || this.target, this._set, [props]);
        };
        ;
        Tween.prototype.play = function (tween) {
            return this.addAction(tween || this, this._set, [{ paused: false }]);
        };
        ;
        Tween.prototype.pause = function (tween) {
            return this.addAction(tween || this, this._set, [{ paused: true }]);
        };
        ;
        Tween.prototype._set = function (props) {
            for (var n in props) {
                this[n] = props[n];
            }
        };
        ;
        Tween.prototype.addPlugin = function (plugin) {
            var ids = this.pluginIds || (this.pluginIds = {}), id = plugin.ID;
            if (!id || ids[id]) {
                return;
            } // already added
            ids[id] = true;
            var plugins = this.plugins || (this.plugins = []), priority = plugin.priority || 0;
            for (var i = 0, l = plugins.length; i < l; i++) {
                if (priority < plugins[i].priority) {
                    plugins.splice(i, 0, plugin);
                    return;
                }
            }
            plugins.push(plugin);
        };
        ;
        Tween.prototype.updatePosition = function (jump, end) {
            var step = this.stepHead.next, t = this.position, d = this.duration;
            if (this.target && step) {
                // find our new step index:
                var stepNext = step.next;
                while (stepNext && stepNext.t <= t) {
                    step = step.next;
                    stepNext = step.next;
                }
                var ratio = end ? d === 0 ? 1 : t / d : (t - step.t) / step.d; // TODO: revisit this.
                this.updateTargetProps(step, ratio, end);
            }
            this.stepPosition = step ? t - step.t : 0;
        };
        ;
        Tween.prototype.updateTargetProps = function (step, ratio, end) {
            if (this.passive = !!step.passive) {
                return;
            } // don't update props.
            var v, v0, v1, ease;
            var p0 = step.prev.props;
            var p1 = step.props;
            if (ease = step.ease) {
                ratio = ease(ratio);
            }
            var plugins = this.plugins;
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
        Tween.prototype.runActionsRange = function (startPos, endPos, jump, includeStart) {
            var rev = startPos > endPos;
            var action = rev ? this.actionTail : this.actionHead;
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
        Tween.prototype.appendProps = function (props, step, stepPlugins) {
            var initProps = this.stepHead.props, target = this.target, plugins = Tween.plugins;
            var n, i, value, initValue, inject;
            var oldStep = step.prev, oldProps = oldStep.props;
            var stepProps = step.props || (step.props = this.cloneProps(oldProps));
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
            if (stepPlugins !== false && (plugins = this.plugins)) {
                for (i = plugins.length - 1; i >= 0; i--) {
                    plugins[i].step(this, step, cleanProps);
                }
            }
            if (inject = this.injected) {
                this.injected = null;
                this.appendProps(inject, step, false);
            }
        };
        ;
        Tween.prototype.injectProp = function (name, value) {
            var o = this.injected || (this.injected = {});
            o[name] = value;
        };
        ;
        Tween.prototype.addStep = function (duration, props, ease, passive) {
            var step = new TweenStep(this.stepTail, this.duration, duration, props, ease, passive || false);
            this.duration += duration;
            return this.stepTail = (this.stepTail.next = step); // 放到链表的最后
        };
        ;
        Tween.prototype.addAction = function (scope, funct, params) {
            var action = new TweenAction(this.actionTail, this.duration, scope, funct, params);
            if (this.actionTail) {
                this.actionTail.next = action;
            }
            else {
                this.actionHead = action;
            }
            this.actionTail = action;
            return this;
        };
        ;
        Tween.prototype.cloneProps = function (props) {
            var o = {};
            for (var n in props) {
                o[n] = props[n];
            }
            return o;
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
        Tween.IGNORE = {};
        Tween.tweens = [];
        Tween.plugins = null;
        Tween.tweenHead = null;
        Tween.tweenTail = null;
        Tween.inTick = 0;
        return Tween;
    }(createjs.AbstractTween));
    createjs.Tween = Tween;
    // tiny api (primarily for tool output):
    Tween.prototype.w = Tween.prototype.wait;
    Tween.prototype.t = Tween.prototype.to;
    Tween.prototype.c = Tween.prototype.call;
    Tween.prototype.s = Tween.prototype.set;
})(createjs || (createjs = {}));
//# sourceMappingURL=Tween.js.map