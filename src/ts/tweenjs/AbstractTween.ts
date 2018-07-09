namespace gg {
	export type FreeFuncionType = (...args) => any;

	export interface AbstractTweenProps {
		useTicks?: boolean;
		ignoreGlobalPause?: boolean;
		loop?: boolean | number;
		reversed?: boolean;
		bounce?: boolean;
		timeScale?: number;
		onChange?: FreeFuncionType;
		onComplete?: FreeFuncionType;
	}

	export abstract class AbstractTween extends gg.EventDispatcher {
		ignoreGlobalPause: boolean;
		loop: number;
		useTicks: boolean;
		reversed: boolean;
		bounce: boolean;
		timeScale: number;
		duration: number;
		position: number;
		rawPosition: number;
		_paused: boolean;

		_parent: Timeline;
		_labels: { [lable: string]: number };
		_labelList?: { label: string, position: number }[];

		/*
		* Status in tick list:
		* 0 = in list
		* 1 = added to list in the current tick stack
		* -1 = remvoed from list (or to be removed in this tick stack)
		*/
		_status: number;
		_lastTick: number;

		_actionHead: TweenAction;
		_actionTail: TweenAction;

		tweens: AbstractTween[];
		constructor(props?: AbstractTweenProps) {
			super();

			this.ignoreGlobalPause = false;
			this.loop = 0;
			this.useTicks = false;
			this.reversed = false;
			this.bounce = false;
			this.timeScale = 1;
			this.duration = 0;
			this.position = 0;
			this.rawPosition = -1;
			this._paused = true;
			this._parent = null;
			this._labels = null;
			this._labelList = null;
			this._status = -1;
			this._lastTick = 0;

			if (props) {
				this.useTicks = !!props.useTicks;
				this.ignoreGlobalPause = !!props.ignoreGlobalPause;
				this.loop = props.loop === true ? -1 : (props.loop || 0);
				this.reversed = !!props.reversed;
				this.bounce = !!props.bounce;
				this.timeScale = props.timeScale || 1;
				props.onChange && this.addEventListener("change", props.onChange);
				props.onComplete && this.addEventListener("complete", props.onComplete);
			}
		}


		set paused(value) {
			this._setPaused(value);
		}
		get paused() {
			return this._getPaused();
		}

		get currentLabel() {
			return this._getCurrentLabel();
		}

		_setPaused(value: boolean) {
			Tween._register(<any>this, value);
			return this;
		};

		_getPaused() {
			return this._paused;
		};

		_getCurrentLabel(pos?) {
			var labels = this.getLabels();
			if (pos == null) { pos = this.position; }
			for (var i = 0, l = labels.length; i < l; i++) { if (pos < labels[i].position) { break; } }
			return (i === 0) ? null : labels[i - 1].label;
		};

		advance(delta: number, ignoreActions?: boolean) {
			this.setPosition(this.rawPosition + delta * this.timeScale, ignoreActions);
		};

		setPosition(rawPosition: number, ignoreActions?: boolean, jump?: boolean, callback?) {
			var d = this.duration, loopCount = this.loop, prevRawPos = this.rawPosition;
			var loop = 0, t = 0, end = false;

			// normalize position:
			if (rawPosition < 0) { rawPosition = 0; }

			if (d === 0) {
				// deal with 0 length tweens.
				end = true;
				if (prevRawPos !== -1) { return end; } // we can avoid doing anything else if we're already at 0.
			} else {
				loop = rawPosition / d | 0;// 向下取整
				t = rawPosition - loop * d;

				end = (loopCount !== -1 && rawPosition >= loopCount * d + d);
				if (end) { rawPosition = (t = d) * (loop = loopCount) + d; }
				if (rawPosition === prevRawPos) { return end; } // no need to update

				var rev = !this.reversed !== !(this.bounce && loop % 2); // current loop is reversed
				if (rev) { t = d - t; }
			}

			// set this in advance in case an action modifies position:
			this.position = t;
			this.rawPosition = rawPosition;

			this._updatePosition(jump, end);
			if (end) { this.paused = true; }

			callback && callback(this);

			if (!ignoreActions) { this._runActions(prevRawPos, rawPosition, jump, !jump && prevRawPos === -1); }

			this.dispatchEvent("change");
			if (end) { this.dispatchEvent("complete"); }
		};

		calculatePosition(rawPosition: number) {
			// largely duplicated from setPosition, but necessary to avoid having to instantiate generic objects to pass values (end, loop, position) back.
			var d = this.duration, loopCount = this.loop, loop = 0, t = 0;

			if (d === 0) { return 0; }
			if (loopCount !== -1 && rawPosition >= loopCount * d + d) { t = d; loop = loopCount } // end
			else if (rawPosition < 0) { t = 0; }
			else { loop = rawPosition / d | 0; t = rawPosition - loop * d; }

			var rev = !this.reversed !== !(this.bounce && loop % 2); // current loop is reversed
			return rev ? d - t : t;
		};

		getLabels() {
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

		setLabels(labels: { [lable: string]: number }) {
			this._labels = labels;
			this._labelList = null;
		};

		addLabel(label: string, position: number) {
			if (!this._labels) { this._labels = {}; }
			this._labels[label] = position;
			var list = this._labelList;
			if (list) {
				for (var i = 0, l = list.length; i < l; i++) { if (position < list[i].position) { break; } }
				list.splice(i, 0, { label: label, position: position });
			}
		};

		gotoAndPlay(positionOrLabel: number | string) {
			this.paused = false;
			this._goto(positionOrLabel);
		};

		gotoAndStop(positionOrLabel: number | string) {
			this.paused = true;
			this._goto(positionOrLabel);
		};

		resolve(positionOrLabel: number | string) {
			var pos = Number(positionOrLabel);
			if (isNaN(pos)) { pos = this._labels && this._labels[positionOrLabel]; }
			return pos;
		};

		toString() {
			return "[AbstractTween]";
		};

		clone() {
			throw ("AbstractTween can not be cloned.")
		};

		_init(props) {
			if (!props || !props.paused) { this.paused = false; }
			if (props && (props.position != null)) { this.setPosition(props.position); }
		};

		_updatePosition(jump: boolean, end: boolean) {
			// abstract.
		};
		_goto(positionOrLabel: number | string) {
			var pos = this.resolve(positionOrLabel);
			if (pos != null) { this.setPosition(pos, false, true); }
		};
		_runActions(startRawPos: number, endRawPos: number, jump?: boolean, includeStart?: boolean) {
			// runs actions between startPos & endPos. Separated to support action deferral.

			//console.log(this.passive === false ? " > Tween" : "Timeline", "run", startRawPos, endRawPos, jump, includeStart);

			// if we don't have any actions, and we're not a Timeline, then return:
			// TODO: a cleaner way to handle this would be to override this method in Tween, but I'm not sure it's worth the overhead.
			if (!this._actionHead && !this.tweens) { return; }

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
			if (jump) { return this._runActionsRange(t1, t1, jump, includeStart); } // jump.
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
				else if (this._runActionsRange(start, end, jump, includeStart || (loop !== loop0 && !bounce))) { return true; }

				includeStart = false;
			} while ((dir && ++loop <= loop1) || (!dir && --loop >= loop1));
		};

		_runActionsRange(startPos: number, endPos: number, jump: boolean, includeStart: boolean) {
			// abstract
		};
	}
}
