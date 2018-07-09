namespace gg {

	export type EaseFun = (t: number) => number;

	export class Ease {
		static bounceOut: (arg0: any) => any;
		static linear: (t: any) => any;
		static none: any;
		static get: (amount: any) => (t: any) => any;
		static getPowIn: (pow: any) => (t: any) => number;
		static getPowOut: (pow: any) => (t: any) => number;
		static getPowInOut: (pow: any) => (t: any) => number;
		static quadIn: any;
		static quadOut: any;
		static quadInOut: any;
		static cubicIn: any;
		static cubicOut: any;
		static cubicInOut: any;
		static quartIn: any;
		static quartOut: any;
		static quartInOut: any;
		static quintIn: any;
		static quintOut: any;
		static quintInOut: any;
		static sineIn: (t: any) => number;
		static sineOut: (t: any) => number;
		static sineInOut: (t: any) => number;
		static getBackIn: (amount: any) => (t: any) => number;
		static backIn: any;
		static getBackOut: (amount: any) => (t: any) => number;
		static backOut: any;
		static getBackInOut: (amount: any) => (t: any) => number;
		static backInOut: any;
		static circIn: (t: any) => number;
		static circOut: (t: any) => number;
		static circInOut: (t: any) => number;
		static bounceIn: (t: any) => number;
		static bounceInOut: (t: any) => number;
		static getElasticIn: (amplitude: any, period: any) => (t: any) => any;
		static elasticIn: any;
		static getElasticOut: (amplitude: any, period: any) => (t: any) => any;
		static elasticOut: any;
		static getElasticInOut: (amplitude: any, period: any) => (t: any) => number;
		static elasticInOut: any;
		constructor() {
			throw "Ease cannot be instantiated.";
		}

	}
	Ease.bounceOut = function (t) {
		if (t < 1 / 2.75) {
			return (7.5625 * t * t);
		} else if (t < 2 / 2.75) {
			return (7.5625 * (t -= 1.5 / 2.75) * t + 0.75);
		} else if (t < 2.5 / 2.75) {
			return (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375);
		} else {
			return (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375);
		}
	};
	Ease.linear = function (t) { return t; };

	Ease.none = Ease.linear;
	Ease.get = function (amount) {
		if (amount < -1) { amount = -1; }
		else if (amount > 1) { amount = 1; }
		return function (t) {
			if (amount == 0) { return t; }
			if (amount < 0) { return t * (t * -amount + 1 + amount); }
			return t * ((2 - t) * amount + (1 - amount));
		};
	};
	Ease.getPowIn = function (pow) {
		return function (t) {
			return Math.pow(t, pow);
		};
	};
	Ease.getPowOut = function (pow) {
		return function (t) {
			return 1 - Math.pow(1 - t, pow);
		};
	};
	Ease.getPowInOut = function (pow) {
		return function (t) {
			if ((t *= 2) < 1) return 0.5 * Math.pow(t, pow);
			return 1 - 0.5 * Math.abs(Math.pow(2 - t, pow));
		};
	};
	Ease.quadIn = Ease.getPowIn(2);
	Ease.quadOut = Ease.getPowOut(2);
	Ease.quadInOut = Ease.getPowInOut(2);
	Ease.cubicIn = Ease.getPowIn(3);
	Ease.cubicOut = Ease.getPowOut(3);
	Ease.cubicInOut = Ease.getPowInOut(3);
	Ease.quartIn = Ease.getPowIn(4);
	Ease.quartOut = Ease.getPowOut(4);
	Ease.quartInOut = Ease.getPowInOut(4);
	Ease.quintIn = Ease.getPowIn(5);
	Ease.quintOut = Ease.getPowOut(5);
	Ease.quintInOut = Ease.getPowInOut(5);
	Ease.sineIn = function (t) {
		return 1 - Math.cos(t * Math.PI / 2);
	};
	Ease.sineOut = function (t) {
		return Math.sin(t * Math.PI / 2);
	};
	Ease.sineInOut = function (t) {
		return -0.5 * (Math.cos(Math.PI * t) - 1);
	};
	Ease.getBackIn = function (amount) {
		return function (t) {
			return t * t * ((amount + 1) * t - amount);
		};
	};
	Ease.backIn = Ease.getBackIn(1.7);
	Ease.getBackOut = function (amount) {
		return function (t) {
			return (--t * t * ((amount + 1) * t + amount) + 1);
		};
	};
	Ease.backOut = Ease.getBackOut(1.7);
	Ease.getBackInOut = function (amount) {
		amount *= 1.525;
		return function (t) {
			if ((t *= 2) < 1) return 0.5 * (t * t * ((amount + 1) * t - amount));
			return 0.5 * ((t -= 2) * t * ((amount + 1) * t + amount) + 2);
		};
	};
	Ease.backInOut = Ease.getBackInOut(1.7);
	Ease.circIn = function (t) {
		return -(Math.sqrt(1 - t * t) - 1);
	};
	Ease.circOut = function (t) {
		return Math.sqrt(1 - (--t) * t);
	};
	Ease.circInOut = function (t) {
		if ((t *= 2) < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1);
		return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
	};
	Ease.bounceIn = function (t) {
		return 1 - Ease.bounceOut(1 - t);
	};

	Ease.bounceInOut = function (t) {
		if (t < 0.5) return Ease.bounceIn(t * 2) * .5;
		return Ease.bounceOut(t * 2 - 1) * 0.5 + 0.5;
	};
	Ease.getElasticIn = function (amplitude, period) {
		var pi2 = Math.PI * 2;
		return function (t) {
			if (t == 0 || t == 1) return t;
			var s = period / pi2 * Math.asin(1 / amplitude);
			return -(amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * pi2 / period));
		};
	};
	Ease.elasticIn = Ease.getElasticIn(1, 0.3);
	Ease.getElasticOut = function (amplitude, period) {
		var pi2 = Math.PI * 2;
		return function (t) {
			if (t == 0 || t == 1) return t;
			var s = period / pi2 * Math.asin(1 / amplitude);
			return (amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * pi2 / period) + 1);
		};
	};
	Ease.elasticOut = Ease.getElasticOut(1, 0.3);
	Ease.getElasticInOut = function (amplitude, period) {
		var pi2 = Math.PI * 2;
		return function (t) {
			var s = period / pi2 * Math.asin(1 / amplitude);
			if ((t *= 2) < 1) return -0.5 * (amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * pi2 / period));
			return amplitude * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * pi2 / period) * 0.5 + 1;
		};
	};
	Ease.elasticInOut = Ease.getElasticInOut(1, 0.3 * 1.5);
}
