var gg;
(function (gg) {
    var Event = /** @class */ (function () {
        function Event(type, bubbles, cancelable) {
            this.type = type;
            this.target = null;
            this.currentTarget = null;
            this.eventPhase = 0;
            this.bubbles = !!bubbles;
            this.cancelable = !!cancelable;
            this.timeStamp = (new Date()).getTime();
            this.defaultPrevented = false;
            this.propagationStopped = false;
            this.immediatePropagationStopped = false;
            this.removed = false;
        }
        Event.prototype.preventDefault = function () {
            this.defaultPrevented = this.cancelable && true;
        };
        ;
        Event.prototype.stopPropagation = function () {
            this.propagationStopped = true;
        };
        ;
        Event.prototype.stopImmediatePropagation = function () {
            this.immediatePropagationStopped = this.propagationStopped = true;
        };
        ;
        Event.prototype.remove = function () {
            this.removed = true;
        };
        ;
        Event.prototype.clone = function () {
            return new Event(this.type, this.bubbles, this.cancelable);
        };
        ;
        Event.prototype.set = function (props) {
            for (var n in props) {
                this[n] = props[n];
            }
            return this;
        };
        ;
        Event.prototype.toString = function () {
            return "[Event (type=" + this.type + ")]";
        };
        ;
        return Event;
    }());
    gg.Event = Event;
})(gg || (gg = {}));
//# sourceMappingURL=Event.js.map