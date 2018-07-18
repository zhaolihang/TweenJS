namespace createjs {

	export type FreeFunType = (...args) => any;
	export type FreeType = { [key: string]: any };
	export type TargetType = { tweenjs_count?: number } & FreeType;

	export class TweenStep {
		next: TweenStep;
		prev: TweenStep;
		t: number;
		d: number;
		props: TweenProps;
		ease: EaseFun;
		passive: boolean;
		index: number;
		constructor(prev: TweenStep, t: number, d: number, props: TweenProps, ease: EaseFun, passive?: boolean) {
			this.next = null;
			this.prev = prev;
			this.t = t;
			this.d = d;
			this.props = props;
			this.ease = ease;
			this.passive = passive;
			this.index = prev ? prev.index + 1 : 0;
		}

	};

	export class TweenAction {
		scope: any;
		params: any[];
		funct: FreeFunType;
		next: TweenAction;
		prev: TweenAction;
		t: number;
		d: number;
		constructor(prev: TweenAction, t: number, scope: any, funct: FreeFunType, params: any[]) {
			this.next = null;
			this.prev = prev;
			this.t = t;
			this.d = 0;
			this.scope = scope;
			this.funct = funct;
			this.params = params;
		}
	};



	export class Action { // 基类

		next: Action = null;
		prev: Action = null;

		ease: EaseFun = null;

		protected inited = false;

		target: any;
		readonly startTime: number; // 时间线的时间
		readonly endTime: number; // 时间线的时间
		readonly duration: number;

		constructor(target: any, startTime: number, duration: number) {
			this.target = target;
			this.startTime = startTime;
			this.duration = duration;
			this.endTime = startTime + duration;
		}

		public setPosition(position: number, isReverse: boolean) { // 时间线的时间
			let ratio = this.duration === 0 ? 1 : (position - this.startTime) / this.duration;
			if (ratio < 0) {
				ratio = 0;
			} else if (ratio > 1) {
				ratio = 1;
			}
			if (this.ease) {
				ratio = this.ease(ratio);
			}
			if (!this.inited) {
				this.inited = true;
				this.init();
			}
			this.update(ratio, isReverse);
		}

		protected init() {
			// override me
		}

		protected update(ratio: number, isReverse: boolean) {
			// override me
		}
	};

	export interface KeyFrameData { t: number; dur: number; type: number; v: any; }
	export interface MyTweenOptions {
		loop?: number,
		useTicks?: boolean,
		reversed?: boolean,
		bounce?: boolean,
		timeScale?: number,
	}

	export class MyTween {
		loop: number;
		useTicks: boolean;
		reversed: boolean;
		bounce: boolean;
		timeScale: number;
		target: any;

		private actionHead: Action = null;
		private actionTail: Action = null;

		private prevTime = 0;
		private duration = 0;

		constructor(target: any, frames: KeyFrameData[], options?: MyTweenOptions) {
			this.target = target;

			this.loop = 0;
			this.useTicks = false;
			this.reversed = false;
			this.bounce = false;
			this.timeScale = 1;
			if (options) {
				this.loop = options.loop < 0 ? -1 : (options.loop || 0);
				this.useTicks = !!options.useTicks;
				this.reversed = !!options.reversed;
				this.bounce = !!options.bounce;
				this.timeScale = options.timeScale || 1;
			}

			this.initActions(frames);
		}

		private initActions(frames: KeyFrameData[]) {
			frames.sort((a, b) => {
				return a.t - b.t;
			});

			for (const frame of frames) {
				let action = new Action(this.target, frame.t, frame.dur);
				let actionTail = this.actionTail;
				if (!actionTail) {
					this.actionHead = this.actionTail = action;
				} else {
					this.actionTail = actionTail.next = action;
					action.prev = actionTail;
				}
				if (action.endTime > this.duration) {
					this.duration = action.endTime;
				}
			}

		}

		public setPosition(position: number) {
			const prevTime = this.prevTime;
			this.prevTime = position;
			if (prevTime === position) {
				return;
			}
			if (!this.actionHead) {
				return;
			}

			if (position > prevTime) {
				let action = this.actionHead;
				let next: Action;
				while (action) {
					next = action.next;
					if (action.endTime < prevTime || action.startTime > position) {
						action = next;
						continue;
					}
					action.setPosition(position, false);
					action = next;
				}
			} else {// reverse
				let action = this.actionTail;
				let prev: Action;
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
		}
	}


	export enum TweenState {
		/*
		* Status in tick list:
		* -1 = removed from list (or to be removed in this tick stack)
		* 0 = in list
		* 1 = added to list in the current tick stack
		*/
		Removed = -1,
		InList = 0,
		NewAdded = 1,
	}

	export interface TweenProps {
		useTicks?: boolean;
		loop?: boolean | number;
		reversed?: boolean;
		bounce?: boolean;
		timeScale?: number;
		pluginData?: any;
		paused?: boolean,
		position?: number,

		onChange?: (e: Event) => void,
		onComplete?: (e: Event) => void,
	}

	export class Tween extends EventDispatcher {
		public static readonly Change = 'change';
		public static readonly Complete = 'complete';

		static inited: boolean = false;

		static IGNORE = {};
		static plugins = null;
		static tweenHead: Tween = null;
		static tweenTail: Tween = null;
		static isInTick = 0;

		static tick(delta: number, paused: boolean) {
			var tween = Tween.tweenHead;
			var t = Tween.isInTick = Date.now();
			while (tween) {
				var next = tween.next, status = tween.status;
				tween.lastTick = t;

				if (status === TweenState.NewAdded) {
					tween.status = TweenState.InList; // new, ignore
				} else if (status === TweenState.Removed) {
					Tween.delist(tween);// removed, delist
				} else if (paused || tween._paused) {
					/* paused */
				} else {
					tween.advance(tween.useTicks ? 1 : delta);
				}

				tween = next;
			}
			Tween.isInTick = 0;
		};

		static handleEvent(event: Event & FreeType) {
			if (event.type === Ticker.TickName) {
				this.tick(event.delta, event.paused);
			}
		};

		static get(target: TargetType, props?: TweenProps) {
			return new Tween(target, props);
		};

		static register(tween: Tween, paused: boolean) {
			var target = tween.target;

			if (!paused && tween._paused) {// 添加

				// TODO: this approach might fail if a dev is using sealed objects
				if (target) {
					target.tweenjs_count = target.tweenjs_count ? target.tweenjs_count + 1 : 1;
				}
				var tail = Tween.tweenTail;
				if (!tail) {
					Tween.tweenHead = Tween.tweenTail = tween;
				} else {
					Tween.tweenTail = tail.next = tween;
					tween.prev = tail;
				}

				tween.status = Tween.isInTick ? TweenState.NewAdded : TweenState.InList;

				if (!Tween.inited) {
					if (Ticker) {
						Ticker.addEventListener(Ticker.TickName, Tween);
					}
					Tween.inited = true;
				}
			} else if (paused && !tween._paused) {// 移除
				if (target) {
					target.tweenjs_count--;
				}
				// tick handles delist if we're in a tick stack and the tween hasn't advanced yet:
				if (!Tween.isInTick || tween.lastTick === Tween.isInTick) { // 不在tick函数中或者已经执行完了,可以安全删除
					Tween.delist(tween);
				}
				tween.status = TweenState.Removed;
			}
			tween._paused = paused;
		};

		private static delist(tween: Tween) {
			var next = tween.next, prev = tween.prev;
			if (next) { next.prev = prev; }
			else { Tween.tweenTail = prev; } // was tail
			if (prev) { prev.next = next; }
			else { Tween.tweenHead = next; } // was head.
			tween.next = tween.prev = null;
		}

		static removeTweens(target: TargetType) {
			if (!target.tweenjs_count) { return; }
			var tween = Tween.tweenHead;
			while (tween) {
				var next = tween.next;
				if (tween.target === target) { Tween.register(tween, true); }
				tween = next;
			}
			target.tweenjs_count = 0;
		};

		static removeAllTweens() {
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

		static hasActiveTweens(target: TargetType) {
			if (target) { return !!target.tweenjs_count; }
			return !!Tween.tweenHead;
		};

		static installPlugin(plugin: any) {
			var priority = (plugin.priority = plugin.priority || 0), arr = (Tween.plugins = Tween.plugins || []);
			for (var i = 0, l = arr.length; i < l; i++) {
				if (priority < arr[i].priority) { break; }
			}
			arr.splice(i, 0, plugin);
		};

		// instance  member
		private next: Tween;
		private prev: Tween;

		public target: TargetType;
		private stepHead: TweenStep;
		private stepTail: TweenStep;

		private actionHead: TweenAction;
		private actionTail: TweenAction;

		private passive: boolean;

		loop: number;
		useTicks: boolean;
		reversed: boolean;
		bounce: boolean;
		timeScale: number;
		duration: number;
		position: number;
		rawPosition: number;

		status: TweenState;
		lastTick: number;

		private labels: { [lable: string]: number };
		private labelList?: { label: string, position: number }[];

		public pluginData: any;
		public plugins: any;
		public pluginIds: any;

		private _paused: boolean;
		set paused(value) {
			Tween.register(this, value);
		}
		get paused() {
			return this._paused;
		}

		get currentLabel() {
			return this.getCurrentLabel();
		}

		public getCurrentLabel(pos?: number) {
			var labels = this.getLabels();
			if (pos == null) { pos = this.position; }
			for (var i = 0, l = labels.length; i < l; i++) { if (pos < labels[i].position) { break; } }
			return (i === 0) ? null : labels[i - 1].label;
		};


		constructor(target: TargetType, props?: TweenProps) {
			super();

			this.loop = 0;
			this.useTicks = false;
			this.reversed = false;
			this.bounce = false;
			this.timeScale = 1;
			this.duration = 0;
			this.position = 0;
			this.rawPosition = 0;
			this._paused = true;
			this.labels = null;
			this.labelList = null;
			this.status = TweenState.Removed;
			this.lastTick = 0;

			if (props) {
				this.useTicks = !!props.useTicks;
				this.loop = props.loop === true ? -1 : (props.loop || 0);
				this.reversed = !!props.reversed;
				this.bounce = !!props.bounce;
				this.timeScale = props.timeScale || 1;
				props.onChange && this.addEventListener(Tween.Change, props.onChange);
				props.onComplete && this.addEventListener(Tween.Complete, props.onComplete);
			}

			this.target = target;

			this.next = null;
			this.prev = null;
			this.pluginData = null;
			this.passive = false;
			this.stepHead = new TweenStep(null, 0, 0, {}, null, true);
			this.stepTail = this.stepHead;
			this.actionHead = null;
			this.actionTail = null;
			this.plugins = null;
			this.pluginIds = null;

			if (props) {
				this.pluginData = props.pluginData;
			}

			if (!this.pluginData) {
				this.pluginData = {};
			}

			if (!props || !props.paused) {
				this.paused = false;
			}

			if (props && (props.position != null)) {
				this.setPosition(props.position, false, false);
			}
		}

		public wait(duration: number, passive: boolean) {
			if (duration > 0) { this.addStep(+duration, this.stepTail.props, null, passive); }
			return this;
		};

		public to(props: FreeType, duration: number, ease?: EaseFun) {
			if (duration == null || duration < 0) { duration = 0; }
			var step = this.addStep(+duration, null, ease);
			this.appendProps(props, step);
			return this;
		}

		public label(name: string) {
			this.addLabel(name, this.duration);
			return this;
		}

		public call(callback: (...params: any[]) => void, params?: any[], scope?: any): Tween {
			return this.addAction(scope || this.target, callback, params || [this]);
		};

		public set(props: any, target: TargetType) {
			return this.addAction(target || this.target, this._set, [props]);
		};

		public play(tween: Tween) {
			return this.addAction(tween || this, this._set, [{ paused: false }]);
		};

		public pause(tween: Tween) {
			return this.addAction(tween || this, this._set, [{ paused: true }]);
		};

		private _set(props: any) {
			for (var n in props) {
				this[n] = props[n];
			}
		};

		public addPlugin(plugin: any) {
			var ids = this.pluginIds || (this.pluginIds = {}), id = plugin.ID;
			if (!id || ids[id]) { return; } // already added

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

		protected updatePosition(end: boolean) {
			var step = this.stepHead.next, t = this.position, d = this.duration;
			if (this.target && step) {
				// find our new step index:
				var stepNext = step.next;
				while (stepNext && stepNext.t <= t) { step = step.next; stepNext = step.next; }
				var ratio = end ? d === 0 ? 1 : t / d : (t - step.t) / step.d; // TODO: revisit this.
				this.updateTargetProps(step, ratio, end);
			}
		};

		private updateTargetProps(step: TweenStep, ratio: number, end: boolean) {
			if (this.passive = !!step.passive) { return; } // don't update props.

			var v, v0, v1, ease: EaseFun;
			var p0 = step.prev.props;
			var p1 = step.props;
			if (ease = step.ease) { ratio = ease(ratio); }

			var plugins = this.plugins;
			proploop: for (var n in p0) {
				v0 = p0[n];
				v1 = p1[n];

				// values are different & it is numeric then interpolate:
				if (v0 !== v1 && (typeof (v0) === "number")) {// 数字值
					v = v0 + (v1 - v0) * ratio;
				} else {
					v = ratio >= 1 ? v1 : v0;// 瞬时值
				}

				if (plugins) {
					for (var i = 0, l = plugins.length; i < l; i++) {
						var value = plugins[i].change(this, step, n, v, ratio, end);
						if (value === Tween.IGNORE) { continue proploop; }
						if (value !== undefined) { v = value; }
					}
				}
				this.target[n] = v;
			}

		};

		protected runActionsRange(startPos: number, endPos: number, jump: boolean, includeStart: boolean) {
			var rev = startPos > endPos;
			var action = rev ? this.actionTail : this.actionHead;
			var ePos = endPos, sPos = startPos;
			if (rev) { ePos = startPos; sPos = endPos; }
			var t = this.position;
			while (action) {
				var pos = action.t;
				if (pos === endPos || (pos > sPos && pos < ePos) || (includeStart && pos === startPos)) {
					action.funct.apply(action.scope, action.params);
					if (t !== this.position) { return true; }
				}
				action = rev ? action.prev : action.next;
			}
		};

		private appendProps(props: any, step: TweenStep, stepPlugins?) {
			var initProps = this.stepHead.props, target = this.target, plugins = Tween.plugins;
			var n, i, value, initValue, inject;
			var oldStep = step.prev, oldProps = oldStep.props;
			var stepProps = step.props || (step.props = this.cloneProps(oldProps));
			var cleanProps = {}; // TODO: is there some way to avoid this additional object?

			for (n in props) {
				if (!props.hasOwnProperty(n)) { continue; }
				cleanProps[n] = stepProps[n] = props[n];

				if (initProps[n] !== undefined) { continue; }

				initValue = undefined; // accessing missing properties on DOMElements when using CSSPlugin is INSANELY expensive, so we let the plugin take a first swing at it.
				if (plugins) {
					for (i = plugins.length - 1; i >= 0; i--) {
						value = plugins[i].init(this, n, initValue);
						if (value !== undefined) { initValue = value; }
						if (initValue === Tween.IGNORE) {
							delete (stepProps[n]);
							delete (cleanProps[n]);
							break;
						}
					}
				}

				if (initValue !== Tween.IGNORE) {
					if (initValue === undefined) { initValue = target[n]; }
					oldProps[n] = (initValue === undefined) ? null : initValue;
				}
			}

			for (n in cleanProps) {
				value = props[n];

				// propagate old value to previous steps:
				var o, prev = oldStep;
				while ((o = prev) && (prev = o.prev)) {
					if (prev.props === o.props) { continue; } // wait step
					if (prev.props[n] !== undefined) { break; } // already has a value, we're done.
					prev.props[n] = oldProps[n];
				}
			}

			if (stepPlugins !== false && (plugins = this.plugins)) {
				for (i = plugins.length - 1; i >= 0; i--) {
					plugins[i].step(this, step, cleanProps);
				}
			}

		};

		private addStep(duration: number, props: any, ease: EaseFun, passive?: boolean) {
			var step = new TweenStep(this.stepTail, this.duration, duration, props, ease, passive || false);
			this.duration += duration;
			return this.stepTail = (this.stepTail.next = step);// 放到链表的最后
		};

		private addAction(scope: any, funct: FreeFunType, params: any) {
			var action = new TweenAction(this.actionTail, this.duration, scope, funct, params);
			if (this.actionTail) { this.actionTail.next = action; }
			else { this.actionHead = action; }
			this.actionTail = action;
			return this;
		};

		public advance(delta: number) {
			this.setPosition(this.rawPosition + delta * this.timeScale, false, false);
		};

		public setPosition(rawPosition: number, ignoreActions: boolean, jump: boolean): void {

			var d = this.duration, loopCount = this.loop, prevRawPos = this.rawPosition;
			var loop = 0, t = 0, end = false;


			if (d === 0) {
				// deal with 0 length tweens.
				end = true;
			} else {
				loop = rawPosition / d | 0;// 向下取整
				t = rawPosition - loop * d;

				end = (loopCount !== -1 && rawPosition >= loopCount * d + d);
				if (end) {
					rawPosition = (t = d) * (loop = loopCount) + d;
				}
				if (rawPosition === prevRawPos) {
					return;// no need to update
				}

				if (!this.reversed !== !(this.bounce && loop % 2)) {// current loop is reversed
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

		public calculatePosition(rawPosition: number) {
			// largely duplicated from setPosition, but necessary to avoid having to instantiate generic objects to pass values (end, loop, position) back.
			var d = this.duration, loopCount = this.loop, loop = 0, t = 0;

			if (d === 0) { return 0; }
			if (loopCount !== -1 && rawPosition >= loopCount * d + d) { t = d; loop = loopCount } // end
			else if (rawPosition < 0) { t = 0; }
			else { loop = rawPosition / d | 0; t = rawPosition - loop * d; }

			var rev = !this.reversed !== !(this.bounce && loop % 2); // current loop is reversed
			return rev ? d - t : t;
		};

		public getLabels() {
			var list = this.labelList;
			if (!list) {
				list = this.labelList = [];
				var labels = this.labels;
				for (var n in labels) {
					list.push({ label: n, position: labels[n] });
				}
				list.sort(function (a, b) { return a.position - b.position; });
			}
			return list;
		};

		public setLabels(labels: { [lable: string]: number }) {
			this.labels = labels;
			this.labelList = null;
		};

		public addLabel(label: string, position: number) {
			if (!this.labels) { this.labels = {}; }
			this.labels[label] = position;
			var list = this.labelList;
			if (list) {
				for (var i = 0, l = list.length; i < l; i++) { if (position < list[i].position) { break; } }
				list.splice(i, 0, { label: label, position: position });
			}
		};

		public gotoAndPlay(positionOrLabel: number | string) {
			this.paused = false;
			this.goto(positionOrLabel);
		};

		public gotoAndStop(positionOrLabel: number | string) {
			this.paused = true;
			this.goto(positionOrLabel);
		};

		public resolve(positionOrLabel: number | string) {
			var pos = Number(positionOrLabel);
			if (isNaN(pos)) { pos = this.labels && this.labels[positionOrLabel]; }
			return pos;
		};

		private goto(positionOrLabel: number | string) {
			var pos = this.resolve(positionOrLabel);
			if (pos != null) { this.setPosition(pos, false, true); }
		};

		public runActions(startRawPos: number, endRawPos: number, jump: boolean, includeStart: boolean) {
			// runs actions between startPos & endPos. Separated to support action deferral.

			//console.log(this.passive === false ? " > Tween" : "Timeline", "run", startRawPos, endRawPos, jump, includeStart);

			// if we don't have any actions, and we're not a Timeline, then return:
			// TODO: a cleaner way to handle this would be to override this method in Tween, but I'm not sure it's worth the overhead.
			if (!this.actionHead) {
				return;
			}

			var d = this.duration, reversed = this.reversed, bounce = this.bounce, loopCount = this.loop;
			var loop0: number, loop1: number, t0: number, t1: number;

			if (d === 0) {
				// deal with 0 length tweens:
				loop0 = loop1 = t0 = t1 = 0;
				reversed = bounce = false;
			} else {
				loop0 = startRawPos / d | 0;
				loop1 = endRawPos / d | 0;
				t0 = startRawPos - loop0 * d;
				t1 = endRawPos - loop1 * d;
			}

			// catch positions that are past the end:
			if (loopCount !== -1) {
				if (loop1 > loopCount) { t1 = d; loop1 = loopCount; }
				if (loop0 > loopCount) { t0 = d; loop0 = loopCount; }
			}

			// special cases:
			if (jump) { return this.runActionsRange(t1, t1, jump, includeStart); } // jump.
			else if (loop0 === loop1 && t0 === t1 && !jump && !includeStart) { return; } // no actions if the position is identical and we aren't including the start
			else if (loop0 === -1) { loop0 = t0 = 0; } // correct the -1 value for first advance, important with useTicks.

			var dir = (startRawPos <= endRawPos), loop = loop0;
			do {
				var rev = !reversed !== !(bounce && loop % 2);

				var start = (loop === loop0) ? t0 : dir ? 0 : d;
				var end = (loop === loop1) ? t1 : dir ? d : 0;

				if (rev) {
					start = d - start;
					end = d - end;
				}

				if (bounce && loop !== loop0 && start === end) { /* bounced onto the same time/frame, don't re-execute end actions */ }
				else if (this.runActionsRange(start, end, jump, includeStart || (loop !== loop0 && !bounce))) { return true; }

				includeStart = false;
			} while ((dir && ++loop <= loop1) || (!dir && --loop >= loop1));
		};

		private cloneProps(props) {
			var o = {};
			for (var n in props) { o[n] = props[n]; }
			return o;
		};


		public toString() {
			return "[Tween]";
		};

	}

}
