namespace gg {
	export class TweenGroup {
		_tweens: any[];
		__onComplete: any;
		_paused: boolean;
		_timeScale: any;
		constructor(paused: boolean, timeScale: number) {
			this._tweens = [];
			this.paused = paused;
			this.timeScale = timeScale;
			this.__onComplete = this._onComplete.bind(this);
		}

		_setPaused(value) {
			var tweens = this._tweens;
			this._paused = value = !!value;
			for (var i = tweens.length - 1; i >= 0; i--) {
				tweens[i].paused = value;
			}
		};

		_getPaused() {
			return this._paused;
		};

		_setTimeScale(value) {
			var tweens = this._tweens;
			this._timeScale = value = value || null;
			for (var i = tweens.length - 1; i >= 0; i--) {
				tweens[i].timeScale = value;
			}
		};

		_getTimeScale() {
			return this._timeScale;
		};


		set paused(value) {
			this._setPaused(value);
		}

		get paused() {
			return this._getPaused();
		}

		set timeScale(value) {
			this._setTimeScale(value);
		}

		get timeScale() {
			return this._getTimeScale();
		}

		get(target, props) {
			return this.add(gg.Tween.get(target, props));
		}

		add(tween) {
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


		remove(tween) {
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
		}

		reset(keepGroups?) {
			var tweens = this._tweens;
			for (var i = tweens.length - 1; i >= 0; i--) {
				var tween = tweens[i];
				if (tween instanceof TweenGroup) {
					tween.reset();
					if (keepGroups) { continue; }
				}
				tweens.splice(i, 1);
				tween.paused = true;
				tween.removeEventListener && tween.removeEventListener("complete", this.__onComplete);
			}
			return this;
		}

		_onComplete(evt) {
			this.remove(evt.target);
		}
	}
}
