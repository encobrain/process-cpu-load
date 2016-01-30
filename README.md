# process-cpu-load 

Cpu load of own process

    var Observer = require('process-cpu-usage').Observer;
    
    /**
     * Creating observer
     * {Object} options
     * <p>  @prop {Array} [intervals_s] Intrvals in second for avg load
     * <p>  @prop {Object} [states_pct] Named states in percent of cpu load
     */
    var observer = new Observer({
        intervals_s: [60, 180, 300],
        states_pct: {
            overload: 100,
            heavy: 90,
            load: 80,
            work: 30,
            idle: 1
        }
    });
    
    observer.isStarted; // started or not
    
    observer.state; // state name for last second
    observer.load_pct; // load in percent for last second
    
    observer.interval.pct_60;  // avg load in percent for last 60 sec
    observer.interval.pct_180; // avg load in percent for last 60 sec
    observer.interval.pct_300; // avg load in percent for last 60 sec
    
    observer.interval.state_60;  // state for last 60 second avg load (if states_pct exists in config)
    observer.interval.state_180; // state for last 180 second avg load (if states_pct exists in config)
    observer.interval.state_300; // state for last 300 second avg load (if states_pct exists in config)
    
    observer.on('interval', function(interval_s, load_pct, [state])); // emits every any interval
    observer.on('interval:60', function(load_pct, [state]){}); // emits every 60 sec
    observer.on('interval:180', function(load_pct, [state]){}); // emits every 180 sec
    observer.on('interval:300', function(load_pct, [state]){}); // emits every 300 sec
    
    observer.on('state', function(stateName){}); // emits every change state
    observer.on('state:idle', function(){});
    observer.on('state:work', function(){});
    observer.on('state:load', function(){});
    observer.on('state:heavy', function(){});
    observer.on('state:overload', function(){});
    
    observer.on('load', function(load_pct){});  // emits ~ every second
    
    observer.start();
    observer.stop();
    
    



