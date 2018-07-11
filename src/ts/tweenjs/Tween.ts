namespace createjs {
	export type FreeFuncionType = (...args) => any;
	export type TargetType = { tweenjs_count?: number } & FreeType;
	export type FreeType = { [key: string]: any };

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
		funct: FreeFuncionType;
		next: TweenAction;
		prev: TweenAction;
		t: number;
		d: number;
		constructor(prev: TweenAction, t: number, scope: any, funct: FreeFuncionType, params: any[]) {
			this.next = null;
			this.prev = prev;
			this.t = t;
			this.d = 0;
			this.scope = scope;
			this.funct = funct;
			this.params = params;
		}
	};

	export interface TweenProps extends AbstractTweenProps {
		pluginData?: any;
		override?: boolean;
	}

	export class Tween extends AbstractTween {
		public pluginData: any;
		public target: TargetType;
		private stepHead: TweenStep;
		private stepTail: TweenStep;

		private next: Tween;
		private prev: Tween;
		private stepPosition: number;

		plugins: any;
		pluginIds: any;

		injected: any;
		passive: boolean;

		static inited: boolean;

		w: (duration: number, passive: boolean) => Tween;
		t: (props: FreeType, duration: number, ease?: EaseFun) => Tween;
		c: (callback: FreeFuncionType, params: any, scope: any) => Tween;
		s: (props: any, target: TargetType) => Tween;

		constructor(target: TargetType, props?: TweenProps) {
			super(props);
			this.next = null;
			this.prev = null;

			this.pluginData = null;
			this.target = target;
			this.passive = false;
			this.stepHead = new TweenStep(null, 0, 0, {}, null, true);
			this.stepTail = this.stepHead;
			this.stepPosition = 0;
			this.actionHead = null;
			this.actionTail = null;
			this.plugins = null;
			this.pluginIds = null;
			this.injected = null;
			if (props) {
				this.pluginData = props.pluginData;
				if (props.override) { Tween.removeTweens(target); }
			}
			if (!this.pluginData) { this.pluginData = {}; }
			this.init(props);
		}



		static IGNORE = {};
		static tweens = [];
		static plugins = null;
		static tweenHead: Tween = null;
		static tweenTail: Tween = null;
		static inTick = 0;

		static get(target: TargetType, props?: TweenProps) {
			return new Tween(target, props);
		};

		static tick(delta: number, paused?: boolean) {
			var tween = Tween.tweenHead;
			var t = Tween.inTick = Date.now();
			while (tween) {
				var next = tween.next, status = tween.status;
				tween.lastTick = t;
				if (status === 1) { tween.status = 0; } // new, ignore
				else if (status === -1) { Tween.delist(tween); } // removed, delist
				else if ((paused && !tween.ignoreGlobalPause) || tween._paused) { /* paused */ }
				else { tween.advance(tween.useTicks ? 1 : delta); }
				tween = next;
			}
			Tween.inTick = 0;
		};

		static handleEvent(event: Event & FreeType) {
			if (event.type === Ticker.TickName) {
				this.tick(event.delta, event.paused);
			}
		};

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

		static register(tween: Tween, paused: boolean) {
			var target = tween.target;
			if (!paused && tween._paused) {
				// TODO: this approach might fail if a dev is using sealed objects
				if (target) { target.tweenjs_count = target.tweenjs_count ? target.tweenjs_count + 1 : 1; }
				var tail = Tween.tweenTail;
				if (!tail) { Tween.tweenHead = Tween.tweenTail = tween; }
				else {
					Tween.tweenTail = tail.next = tween;
					tween.prev = tail;
				}
				tween.status = Tween.inTick ? 1 : 0;
				if (!Tween.inited && createjs.Ticker) { createjs.Ticker.addEventListener(Ticker.TickName, Tween); Tween.inited = true; }
			} else if (paused && !tween._paused) {
				if (target) { target.tweenjs_count--; }
				// tick handles delist if we're in a tick stack and the tween hasn't advanced yet:
				if (!Tween.inTick || tween.lastTick === Tween.inTick) { Tween.delist(tween); }
				tween.status = -1;
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

		protected updatePosition(jump: boolean, end: boolean) {
			var step = this.stepHead.next, t = this.position, d = this.duration;
			if (this.target && step) {
				// find our new step index:
				var stepNext = step.next;
				while (stepNext && stepNext.t <= t) { step = step.next; stepNext = step.next; }
				var ratio = end ? d === 0 ? 1 : t / d : (t - step.t) / step.d; // TODO: revisit this.
				this.updateTargetProps(step, ratio, end);
			}
			this.stepPosition = step ? t - step.t : 0;
		};

		private updateTargetProps(step: TweenStep, ratio: number, end: boolean) {
			if (this.passive = !!step.passive) { return; } // don't update props.

			var v, v0, v1, ease: EaseFun;
			var p0 = step.prev.props;
			var p1 = step.props;
			if (ease = step.ease) { ratio = (<any>ease)(ratio, 0, 1, 1); }

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

			if (inject = this.injected) {
				this.injected = null;
				this.appendProps(inject, step, false);
			}
		};


		public injectProp(name: string, value: any) {
			var o = this.injected || (this.injected = {});
			o[name] = value;
		};

		private addStep(duration: number, props: any, ease: EaseFun, passive?: boolean) {
			var step = new TweenStep(this.stepTail, this.duration, duration, props, ease, passive || false);
			this.duration += duration;
			return this.stepTail = (this.stepTail.next = step);// 放到链表的最后
		};


		private addAction(scope: any, funct: FreeFuncionType, params: any) {
			var action = new TweenAction(this.actionTail, this.duration, scope, funct, params);
			if (this.actionTail) { this.actionTail.next = action; }
			else { this.actionHead = action; }
			this.actionTail = action;
			return this;
		};

		private cloneProps(props) {
			var o = {};
			for (var n in props) { o[n] = props[n]; }
			return o;
		};

		public toString() {
			return "[Tween]";
		};

		public clone() {
			throw ("Tween can not be cloned.")
		};
	}


	// tiny api (primarily for tool output):
	Tween.prototype.w = Tween.prototype.wait;
	Tween.prototype.t = Tween.prototype.to;
	Tween.prototype.c = Tween.prototype.call;
	Tween.prototype.s = Tween.prototype.set;
}
