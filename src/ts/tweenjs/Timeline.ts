namespace gg {


	export interface TimelineProps extends AbstractTweenProps {
		tweens?: AbstractTween[];
		labels?: { [lable: string]: number };
	}

	export class Timeline extends AbstractTween {
		constructor(props?: TimelineProps) {
			var tweens: AbstractTween[], labels: { [lable: string]: number };
			if (props) {
				tweens = props.tweens;
				labels = props.labels;
			}
			super(props);
			this.tweens = [];
			if (tweens) { this.addTween.apply(this, tweens); }
			this.setLabels(labels);
			this.init(props);
		}

		addTween(...tweens: AbstractTween[]): AbstractTween;
		addTween(tween: AbstractTween): AbstractTween {
			if (tween.timeline) { tween.timeline.removeTween(tween); }

			var l = arguments.length;
			if (l > 1) {
				for (var i = 0; i < l; i++) { this.addTween(arguments[i]); }
				return arguments[l - 1];
			} else if (l === 0) { return null; }

			this.tweens.push(tween);
			tween.timeline = this;
			tween.paused = true;
			var d = tween.duration;
			if (tween.loop > 0) { d *= tween.loop + 1; }
			if (d > this.duration) { this.duration = d; }

			if (this.rawPosition >= 0) { tween.setPosition(this.rawPosition); }
			return tween;
		};

		removeTween(...tweens: AbstractTween[]): boolean;
		removeTween(tween: AbstractTween): boolean {
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
					tween.timeline = null;
					if (tween.duration >= this.duration) { this.updateDuration(); }
					return true;
				}
			}
			return false;
		};

		updateDuration() {
			this.duration = 0;
			for (var i = 0, l = this.tweens.length; i < l; i++) {
				var tween = this.tweens[i];
				var d = tween.duration;
				if (tween.loop > 0) { d *= tween.loop + 1; }
				if (d > this.duration) { this.duration = d; }
			}
		};

		toString() {
			return "[Timeline]";
		};

		clone() {
			throw ("Timeline can not be cloned.")
		};

		// private methods:

		// Docced in AbstractTween
		protected updatePosition(jump: boolean, end: boolean) {
			var t = this.position;
			for (var i = 0, l = this.tweens.length; i < l; i++) {
				this.tweens[i].setPosition(t, true, jump); // actions will run after all the tweens update.
			}
		};

		// Docced in AbstractTween
		protected runActionsRange(startPos: number, endPos: number, jump: boolean, includeStart: boolean) {
			//console.log("	range", startPos, endPos, jump, includeStart);
			var t = this.position;
			for (var i = 0, l = this.tweens.length; i < l; i++) {
				this.tweens[i].runActions(startPos, endPos, jump, includeStart);
				if (t !== this.position) { return true; } // an action changed this timeline's position.
			}
		};

	}
}
