namespace createjs {
	export class TweenGroup {
		_tweens: (Tween | TweenGroup)[];
		__onComplete: FreeFuncionType;
		_paused: boolean;
		_timeScale: number;
		constructor(paused: boolean, timeScale: number) {
			this._tweens = [];
			this.paused = paused;
			this.timeScale = timeScale;
			this.__onComplete = this._onComplete.bind(this);
		}

		_setTimeScale(value: number) {
			var tweens = this._tweens;
			this._timeScale = value = value || null;
			for (var i = tweens.length - 1; i >= 0; i--) {
				tweens[i].timeScale = value;
			}
		};

		_getTimeScale() {
			return this._timeScale;
		};


		set paused(value: boolean) {
			var tweens = this._tweens;
			this._paused = value = !!value;
			for (var i = tweens.length - 1; i >= 0; i--) {
				tweens[i].paused = value;
			}
		}

		get paused() {
			return this._paused;
		}

		set timeScale(value: number) {
			this._setTimeScale(value);
		}

		get timeScale() {
			return this._getTimeScale();
		}

		get(target: TargetType, props: any) {
			return this.add(createjs.Tween.get(target, props));
		}

		add(...tweens: (Tween | TweenGroup)[]): (Tween | TweenGroup);
		add(tween: Tween) {
			var l = arguments.length, tweens = this._tweens;
			for (var i = 0, l = arguments.length; i < l; i++) {
				tween = arguments[i];
				tween.paused = this._paused;
				if (this._timeScale !== null) { tween.timeScale = this._timeScale; }
				tweens.push(tween);
				tween.addEventListener && tween.addEventListener("complete", this.__onComplete);
			}
			return arguments[l - 1];
		}

		remove(...tweens: (Tween | TweenGroup)[]): void;
		remove(tween: (Tween | TweenGroup)) {
			var l = arguments.length, tweens = this._tweens;
			for (var i = 0; i < l; i++) {
				tween = arguments[i];
				for (var j = tweens.length - 1; j >= 0; j--) {
					if (tweens[j] === tween) {
						tweens.splice(j, 1);
						(tween as Tween).removeEventListener && (tween as Tween).removeEventListener("complete", this.__onComplete);
					}
				}
			}
		}

		reset(keepGroups?: boolean) {
			var tweens = this._tweens;
			for (var i = tweens.length - 1; i >= 0; i--) {
				var tween = tweens[i];
				if (tween instanceof TweenGroup) {
					tween.reset();
					if (keepGroups) { continue; }
				}
				tweens.splice(i, 1);
				tween.paused = true;
				(tween as Tween).removeEventListener && (tween as Tween).removeEventListener("complete", this.__onComplete);
			}
			return this;
		}

		_onComplete(evt: Event) {
			this.remove(evt.target);
		}
	}
}
