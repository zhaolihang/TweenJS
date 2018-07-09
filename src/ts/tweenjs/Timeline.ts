namespace gg {
	export class Timeline extends AbstractTween {
		constructor(props?: {
			tweens?: any;
			labels?: any;
		}) {
			var tweens, labels;
			if (props) {
				tweens = props.tweens;
				labels = props.labels;
			}
			super(props);
			this.tweens = [];
			if (tweens) { this.addTween.apply(this, tweens); }
			this.setLabels(labels);
			this._init(props);
		}


		addTween(tween) {
			if (tween._parent) { tween._parent.removeTween(tween); }

			var l = arguments.length;
			if (l > 1) {
				for (var i = 0; i < l; i++) { this.addTween(arguments[i]); }
				return arguments[l - 1];
			} else if (l === 0) { return null; }

			this.tweens.push(tween);
			tween._parent = this;
			tween.paused = true;
			var d = tween.duration;
			if (tween.loop > 0) { d *= tween.loop + 1; }
			if (d > this.duration) { this.duration = d; }

			if (this.rawPosition >= 0) { tween.setPosition(this.rawPosition); }
			return tween;
		};

		/**
		 * Removes one or more tweens from this timeline.
		 * @method removeTween
		 * @param {Tween} ...tween The tween(s) to remove. Accepts multiple arguments.
		 * @return Boolean Returns `true` if all of the tweens were successfully removed.
		 **/
		removeTween(tween) {
			var l = arguments.length;
			if (l > 1) {
				var good = true;
				for (let i = 0; i < l; i++) { good = good && this.removeTween(arguments[i]); }
				return good;
			} else if (l === 0) { return true; }

			var tweens = this.tweens;
			let i = tweens.length;
			while (i--) {
				if (tweens[i] === tween) {
					tweens.splice(i, 1);
					tween._parent = null;
					if (tween.duration >= this.duration) { this.updateDuration(); }
					return true;
				}
			}
			return false;
		};

		/**
		 * Recalculates the duration of the timeline. The duration is automatically updated when tweens are added or removed,
		 * but this method is useful if you modify a tween after it was added to the timeline.
		 * @method updateDuration
		 **/
		updateDuration() {
			this.duration = 0;
			for (var i = 0, l = this.tweens.length; i < l; i++) {
				var tween = this.tweens[i];
				var d = tween.duration;
				if (tween.loop > 0) { d *= tween.loop + 1; }
				if (d > this.duration) { this.duration = d; }
			}
		};

		/**
		* Returns a string representation of this object.
		* @method toString
		* @return {String} a string representation of the instance.
		**/
		toString() {
			return "[Timeline]";
		};

		/**
		 * @method clone
		 * @protected
		 **/
		clone() {
			throw ("Timeline can not be cloned.")
		};

		// private methods:

		// Docced in AbstractTween
		_updatePosition(jump, end) {
			var t = this.position;
			for (var i = 0, l = this.tweens.length; i < l; i++) {
				this.tweens[i].setPosition(t, true, jump); // actions will run after all the tweens update.
			}
		};

		// Docced in AbstractTween
		_runActionsRange(startPos, endPos, jump, includeStart) {
			//console.log("	range", startPos, endPos, jump, includeStart);
			var t = this.position;
			for (var i = 0, l = this.tweens.length; i < l; i++) {
				this.tweens[i]._runActions(startPos, endPos, jump, includeStart);
				if (t !== this.position) { return true; } // an action changed this timeline's position.
			}
		};

	}
}
