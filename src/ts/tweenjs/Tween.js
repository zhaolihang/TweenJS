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
    var Action = /** @class */ (function () {
        function Action(target, startTime, duration) {
            this.next = null;
            this.prev = null;
            this.ease = null;
            this.inited = false;
            this.target = target;
            this.startTime = startTime;
            this.duration = duration;
            this.endTime = startTime + duration;
        }
        Action.prototype.setPosition = function (position, isReverse) {
            var ratio = this.duration === 0 ? 1 : (position - this.startTime) / this.duration;
            if (ratio < 0) {
                ratio = 0;
            }
            else if (ratio > 1) {
                ratio = 1;
            }
            if (this.ease) {
                ratio = this.ease(ratio);
            }
            if (!this.inited) {
                this.inited = true;
                this.init(ratio, isReverse);
            }
            this.update(ratio, isReverse);
        };
        Action.prototype.init = function (ratio, isReverse) {
            // override me
        };
        Action.prototype.update = function (ratio, isReverse) {
            // override me
        };
        return Action;
    }());
    createjs.Action = Action;
    ;
    var MoveByX = /** @class */ (function (_super) {
        __extends(MoveByX, _super);
        function MoveByX(target, startTime, duration, deltaValue) {
            var _this = _super.call(this, target, startTime, duration) || this;
            _this.deltaValue = deltaValue;
            _this.lastDeltaValue = 0;
            return _this;
        }
        MoveByX.prototype.init = function (ratio, isReverse) {
        };
        MoveByX.prototype.update = function (ratio, isReverse) {
            var currDeltaValue = ratio * this.deltaValue;
            var delta = currDeltaValue - this.lastDeltaValue;
            this.lastDeltaValue = currDeltaValue;
            this.target.x += delta;
        };
        return MoveByX;
    }(Action));
    createjs.MoveByX = MoveByX;
    var KeyFrameType;
    (function (KeyFrameType) {
        KeyFrameType["MoveToX"] = "MoveToX";
        KeyFrameType["MoveToY"] = "MoveToY";
        KeyFrameType["ScaleToX"] = "ScaleToX";
        KeyFrameType["ScaleToY"] = "ScaleToY";
        KeyFrameType["OpacityTo"] = "OpacityTo";
        KeyFrameType["RotationTo"] = "RotationTo";
        KeyFrameType["MoveByX"] = "MoveByX";
        KeyFrameType["MoveByY"] = "MoveByY";
        KeyFrameType["ScaleByX"] = "ScaleByX";
        KeyFrameType["ScaleByY"] = "ScaleByY";
        KeyFrameType["OpacityBy"] = "OpacityBy";
        KeyFrameType["RotationBy"] = "RotationBy";
    })(KeyFrameType = createjs.KeyFrameType || (createjs.KeyFrameType = {}));
    createjs.ActionConstructorMap = (_a = {},
        // [KeyFrameType.MoveToX]: MoveToX,
        // [KeyFrameType.MoveToY]: MoveToY,
        // [KeyFrameType.ScaleToX]: ScaleToX,
        // [KeyFrameType.ScaleToY]: ScaleToY,
        // [KeyFrameType.OpacityTo]: OpacityTo,
        // [KeyFrameType.RotationTo]: RotationTo,
        _a[KeyFrameType.MoveByX] = MoveByX,
        _a);
    var MyTween = /** @class */ (function () {
        function MyTween(target, frames, options) {
            this.actionHead = null;
            this.actionTail = null;
            this.prevTime = 0;
            this.rawPosition = 0;
            this.lastTick = 0;
            this._paused = false;
            this.target = target;
            this.loop = 0;
            this.useTicks = false;
            this.bounce = false;
            this.timeScale = 1;
            this.rawPosition = 0;
            this.lastTick = 0;
            if (options) {
                this.loop = options.loop < 0 ? -1 : (options.loop || 0);
                this.useTicks = !!options.useTicks;
                this.bounce = !!options.bounce;
                this.timeScale = options.timeScale || 1;
            }
            if (!frames || frames.length === 0) {
                throw "frames 没有数据!!!";
            }
            this.duration = this.initActions(frames);
        }
        MyTween.tick = function (delta, paused, tween) {
            var t = MyTween.isInTick = Date.now();
            if (tween) {
                tween.lastTick = t;
                tween.advance(tween.useTicks ? 1 : delta);
            }
            MyTween.isInTick = 0;
        };
        ;
        Object.defineProperty(MyTween.prototype, "paused", {
            get: function () {
                return this._paused;
            },
            set: function (value) {
                this._paused = value;
            },
            enumerable: true,
            configurable: true
        });
        MyTween.prototype.initActions = function (frames) {
            frames.sort(function (a, b) {
                return a.t - b.t;
            });
            var duration = 0;
            for (var _i = 0, frames_1 = frames; _i < frames_1.length; _i++) {
                var frame = frames_1[_i];
                var ClassContr = createjs.ActionConstructorMap[frame.type];
                if (!ClassContr) {
                    continue;
                }
                var action = new ClassContr(this.target, frame.t, frame.dur, frame.v);
                action.ease = frame.ease;
                var actionTail = this.actionTail;
                if (!actionTail) {
                    this.actionHead = this.actionTail = action;
                }
                else {
                    this.actionTail = actionTail.next = action;
                    action.prev = actionTail;
                }
                if (action.endTime > duration) {
                    duration = action.endTime;
                }
            }
            return duration;
        };
        MyTween.prototype.advance = function (delta) {
            this.setPosition(this.rawPosition + delta * this.timeScale);
        };
        ;
        MyTween.prototype.setPosition = function (rawPosition) {
            var d = this.duration, loopCount = this.loop, prevRawPos = this.rawPosition;
            var loop = 0, position = 0, end = false;
            if (d === 0) {
                var action = this.actionHead;
                var next = void 0;
                while (action) {
                    next = action.next;
                    action.setPosition(position, false);
                    action = next;
                }
                this.paused = true;
                this.dispatchEvent(MyTween.Complete);
                return;
            }
            else {
                loop = rawPosition / d | 0; // 向下取整
                position = rawPosition - loop * d;
                end = (loopCount !== -1 && rawPosition >= loopCount * d + d);
                if (end) {
                    rawPosition = (position = d) * (loop = loopCount) + d;
                }
                if (rawPosition === prevRawPos) {
                    return; // no need to update
                }
                if (!!(this.bounce && loop % 2)) {
                    position = d - position;
                }
            }
            this.rawPosition = rawPosition;
            var prevTime = this.prevTime;
            this.prevTime = position;
            if (prevTime === position) {
                return;
            }
            if (position > prevTime) {
                var action = this.actionHead;
                var next = void 0;
                while (action) {
                    next = action.next;
                    if (action.endTime < prevTime || action.startTime > position) {
                        action = next;
                        continue;
                    }
                    action.setPosition(position, false);
                    action = next;
                }
            }
            else {
                var action = this.actionTail;
                var prev = void 0;
                while (action) {
                    prev = action.prev;
                    if (action.endTime < position || action.startTime > prevTime) {
                        action = prev;
                        continue;
                    }
                    action.setPosition(position, true);
                    action = prev;
                }
            }
            if (end) {
                this.paused = true;
                this.dispatchEvent(MyTween.Complete);
            }
        };
        MyTween.prototype.dispatchEvent = function (eventName) {
        };
        MyTween.Complete = 'complete';
        MyTween.isInTick = 0;
        return MyTween;
    }());
    createjs.MyTween = MyTween;
    var TweenState;
    (function (TweenState) {
        /*
        * Status in tick list:
        * -1 = removed from list (or to be removed in this tick stack)
        * 0 = in list
        * 1 = added to list in the current tick stack
        */
        TweenState[TweenState["Removed"] = -1] = "Removed";
        TweenState[TweenState["InList"] = 0] = "InList";
        TweenState[TweenState["NewAdd"] = 1] = "NewAdd";
    })(TweenState = createjs.TweenState || (createjs.TweenState = {}));
    var Tween = /** @class */ (function (_super) {
        __extends(Tween, _super);
        function Tween(target, props) {
            var _this = _super.call(this) || this;
            _this.loop = 0;
            _this.useTicks = false;
            _this.reversed = false;
            _this.bounce = false;
            _this.timeScale = 1;
            _this.duration = 0;
            _this.position = 0;
            _this.rawPosition = 0;
            _this._paused = true;
            _this.status = TweenState.Removed;
            _this.lastTick = 0;
            if (props) {
                _this.useTicks = !!props.useTicks;
                _this.loop = props.loop === true ? -1 : (props.loop || 0);
                _this.reversed = !!props.reversed;
                _this.bounce = !!props.bounce;
                _this.timeScale = props.timeScale || 1;
                props.onChange && _this.addEventListener(Tween.Change, props.onChange);
                props.onComplete && _this.addEventListener(Tween.Complete, props.onComplete);
            }
            _this.target = target;
            _this.next = null;
            _this.prev = null;
            _this.pluginData = null;
            _this.stepHead = new TweenStep(null, 0, 0, {}, null, true);
            _this.stepTail = _this.stepHead;
            _this.actionHead = null;
            _this.actionTail = null;
            _this.plugins = null;
            _this.pluginIds = null;
            if (props) {
                _this.pluginData = props.pluginData;
            }
            if (!_this.pluginData) {
                _this.pluginData = {};
            }
            if (!props || !props.paused) {
                _this.paused = false;
            }
            if (props && (props.position != null)) {
                _this.setPosition(props.position, false, false);
            }
            return _this;
        }
        Tween.tick = function (delta, paused) {
            var tween = Tween.tweenHead;
            var t = Tween.isInTick = Date.now();
            while (tween) {
                var next = tween.next, status = tween.status;
                tween.lastTick = t;
                if (status === TweenState.NewAdd) {
                    tween.status = TweenState.InList; // new, ignore
                }
                else if (status === TweenState.Removed) {
                    Tween.delist(tween); // removed, delist
                }
                else if (paused || tween._paused) {
                    /* paused */
                }
                else {
                    tween.advance(tween.useTicks ? 1 : delta);
                }
                tween = next;
            }
            Tween.isInTick = 0;
        };
        ;
        Tween.handleEvent = function (event) {
            if (event.type === createjs.Ticker.TickName) {
                this.tick(event.delta, event.paused);
            }
        };
        ;
        Tween.get = function (target, props) {
            return new Tween(target, props);
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
                tween.status = Tween.isInTick ? TweenState.NewAdd : TweenState.InList;
                if (!Tween.inited) {
                    if (createjs.Ticker) {
                        createjs.Ticker.addEventListener(createjs.Ticker.TickName, Tween);
                    }
                    Tween.inited = true;
                }
            }
            else if (paused && !tween._paused) {
                if (target) {
                    target.tweenjs_count--;
                }
                // tick handles delist if we're in a tick stack and the tween hasn't advanced yet:
                if (!Tween.isInTick || tween.lastTick === Tween.isInTick) {
                    Tween.delist(tween);
                }
                tween.status = TweenState.Removed;
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
        Object.defineProperty(Tween.prototype, "paused", {
            get: function () {
                return this._paused;
            },
            set: function (value) {
                Tween.register(this, value);
            },
            enumerable: true,
            configurable: true
        });
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
            var step = this.addStep(+duration, null, ease, false);
            this.appendProps(props, step);
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
        Tween.prototype.updatePosition = function (end) {
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
        };
        ;
        Tween.prototype.updateTargetProps = function (step, ratio, end) {
            if (!!step.passive) {
                return; // don't update props.
            }
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
            var n, i, value, initValue;
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
        Tween.prototype.advance = function (delta) {
            this.setPosition(this.rawPosition + delta * this.timeScale, false, false);
        };
        ;
        Tween.prototype.setPosition = function (rawPosition, ignoreActions, jump) {
            var d = this.duration, loopCount = this.loop, prevRawPos = this.rawPosition;
            var loop = 0, t = 0, end = false;
            if (d === 0) {
                // deal with 0 length tweens.
                end = true;
            }
            else {
                loop = rawPosition / d | 0; // 向下取整
                t = rawPosition - loop * d;
                end = (loopCount !== -1 && rawPosition >= loopCount * d + d);
                if (end) {
                    rawPosition = (t = d) * (loop = loopCount) + d;
                }
                if (rawPosition === prevRawPos) {
                    return; // no need to update
                }
                if (!this.reversed !== !(this.bounce && loop % 2)) {
                    t = d - t;
                }
            }
            // set this in advance in case an action modifies position:
            this.position = t;
            this.rawPosition = rawPosition;
            this.updatePosition(end);
            if (end) {
                this.paused = true;
            }
            if (!ignoreActions) {
                this.runActions(prevRawPos, rawPosition, jump, !jump);
            }
            // this.dispatchEvent(Tween.Change);
            if (end) {
                this.dispatchEvent(Tween.Complete);
            }
        };
        ;
        Tween.prototype.calculatePosition = function (rawPosition) {
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
        Tween.prototype.gotoAndPlay = function (position) {
            this.paused = false;
            this.goto(position);
        };
        ;
        Tween.prototype.gotoAndStop = function (position) {
            this.paused = true;
            this.goto(position);
        };
        ;
        Tween.prototype.goto = function (position) {
            this.setPosition(position, false, true);
        };
        ;
        Tween.prototype.runActions = function (startRawPos, endRawPos, jump, includeStart) {
            // runs actions between startPos & endPos. Separated to support action deferral.
            //console.log(this.passive === false ? " > Tween" : "Timeline", "run", startRawPos, endRawPos, jump, includeStart);
            // if we don't have any actions, and we're not a Timeline, then return:
            // TODO: a cleaner way to handle this would be to override this method in Tween, but I'm not sure it's worth the overhead.
            if (!this.actionHead) {
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
                return this.runActionsRange(t1, t1, jump, includeStart);
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
                else if (this.runActionsRange(start, end, jump, includeStart || (loop !== loop0 && !bounce))) {
                    return true;
                }
                includeStart = false;
            } while ((dir && ++loop <= loop1) || (!dir && --loop >= loop1));
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
        Tween.Change = 'change';
        Tween.Complete = 'complete';
        Tween.inited = false;
        Tween.IGNORE = {};
        Tween.plugins = null;
        Tween.tweenHead = null;
        Tween.tweenTail = null;
        Tween.isInTick = 0;
        return Tween;
    }(createjs.EventDispatcher));
    createjs.Tween = Tween;
    var _a;
})(createjs || (createjs = {}));
//# sourceMappingURL=Tween.js.map