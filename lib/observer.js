var events = require('events'),
    util = require('util'),
    _setImmediate = global.setImmediate,
    _setTimeout = global.setTimeout,
    _setInterval = global.setInterval,
    _nextTick = process.nextTick,

    tickTime_ms = 0,
    observersStarted = 0
    ;

function setImmediate(){
    var fn = arguments[0];

    function run () {
        var start = Date.now();

        fn.apply(this, arguments);

        tickTime_ms += Date.now() - start;
    }

    arguments[0] = run;

    return _setImmediate.apply(this, arguments);
}

function setTimeout() {
    var fn = arguments[0];

    function run () {
        var start = Date.now();

        fn.apply(this, arguments);

        tickTime_ms += Date.now() - start;
    }

    arguments[0] = run;

    return _setTimeout.apply(this, arguments);
}

function setInterval () {
    var fn = arguments[0];

    function run () {
        var start = Date.now();

        fn.apply(this, arguments);

        tickTime_ms += Date.now() - start;
    }

    arguments[0] = run;

    return _setInterval.apply(this, arguments);
}

function nextTick () {
    var fn = arguments[0];

    function run () {
        var start = Date.now();

        fn.apply(this, arguments);

        tickTime_ms += Date.now() - start;
    }

    arguments[0] = run;

    return _nextTick.apply(process, arguments);
}



function Observer (options) {

    events.EventEmitter.call(this);

    this._options = options || {};
    this.interval = {};
}

util.inherits(Observer, events.EventEmitter);

Observer.prototype._options = null;
Observer.prototype._timeoutId = null;

Observer.prototype.load_pct = 0;
Observer.prototype.state = null;

Observer.prototype.isStarted = false;

Observer.prototype.start = function(){
    if (this.isStarted) throw new Error('Observer not stopped');

    this.isStarted = true;

    observersStarted++;

    if (observersStarted == 1) {
        global.setImmediate = setImmediate;
        global.setTimeout = setTimeout;
        global.setInterval = setInterval;
        process.nextTick = nextTick;

        tickTime_ms = 0;
    }

    this.state = null;
    this._timeoutId = {};

    var self = this,
        upState_pct = Number.MAX_VALUE,
        downState_pct = 0,
        pct_state, pcts
        ;

    if (this._options.states_pct) {
        pct_state = {};
        pcts = [];

        function convert(state) {
            var pct = +self._options.states_pct[state];

            pcts.push(pct);

            pct_state[pct] = state;
        }

        Object.keys(this._options.states_pct).forEach(convert);

        function sorter(a, b) { return a - b; }

        pcts.sort(sorter);

        if (pcts.length) {
            upState_pct = pcts[0];
            downState_pct = Number.MAX_VALUE;
        }
    }

    var lastCheck = Date.now(),
        lastTime_ms = tickTime_ms;

    function check () {
        var now = Date.now(),
            time = now - lastCheck,
            load_pct = (tickTime_ms - lastTime_ms) / time * 100, i
        ;

        lastCheck = now;
        lastTime_ms = tickTime_ms;

        self.load_pct = load_pct;

        self.emit('load', load_pct);

        if (load_pct >= upState_pct || load_pct < downState_pct) {
            i = pcts.length;

            while (i--) {
                var pct = pcts[i];

                if (load_pct >= pct) {
                    var state = pct_state[pct];

                    if (self.state !== state) {
                        self.state = state;

                        upState_pct = pcts[i+1] || Number.MAX_VALUE;
                        downState_pct = pct;

                        self.emit('state', state);
                        self.emit('state:' + state);
                    }

                    break;
                }
            }
        }

        self._timeoutId.load = _setTimeout(check, 1000);
    }

    this._timeoutId.load = _setTimeout(check, 1000);

    if (this._options.intervals_s) {

        this.interval = {};

        function start (interval_s) {
            interval_s = +interval_s;

            var interval_ms = interval_s * 1000,
                lastTime_ms = tickTime_ms,
                lastCompute = Date.now(),
                pctName = 'pct_'+interval_s,
                stateName = 'state_'+interval_s,
                intervalName = 'interval:'+interval_s
            ;

            function compute () {
                var now = Date.now(),
                    time = now - lastCompute,
                    load_pct = (tickTime_ms - lastTime_ms) / time * 100,
                    state, i
                    ;

                lastCompute = now;
                lastTime_ms = tickTime_ms;

                self.interval[pctName] = load_pct;

                if (pct_state) {
                    i = pcts.length;

                    while (i--) {
                        var pct = pcts[i];

                        if (load_pct >= pct) {
                            state = self.interval[stateName] = pct_state[pct];

                            break;
                        }
                    }
                }

                self.emit('interval', interval_s, load_pct, state);
                self.emit(intervalName, load_pct, state);

                self._timeoutId[intervalName] = setTimeout(compute, interval_ms);
            }

            self._timeoutId[intervalName] = setTimeout(compute, interval_ms);
        }

        this._options.intervals_s.forEach(start)
    }
};


Observer.prototype.stop = function(){
    if (!this.isStarted) throw new Error('Observer not started');

    this.isStarted = false;
    this.state = null;
    this.load_pct = null;
    this.interval = {};

    observersStarted--;

    if (!observersStarted) {
        global.setImmediate = _setImmediate;
        global.setTimeout = _setTimeout;
        global.setInterval = _setInterval;
        process.nextTick = _nextTick;
    }

    var self = this;

    function stop(key){
        clearInterval(self._timeoutId[key]);
    }

    Object.keys(this._timeoutId).forEach(stop);

    this._timeoutId = null;
};

module.exports = Observer;
