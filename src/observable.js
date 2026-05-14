/**
 * This library uses the GNU General Public License, version 3 (link: https://www.gnu.org/licenses/gpl-3.0.html).
 * Library written by Simanelix.
 * This is version 1.
 */

const __ = undefined;

/**
 * This is a type for `{ Look ma, I'm a UUID! }`, the empty object.
 * @typedef {Record<string, never>} Empty;
 */

/**
 * @typedef {Object} Observable_Options
 * @property {string} [name] - custom name for this observable;
 * @property {symbol} [symbol] - override for the symbol this observable should use; keep in mind, the constructor can generate a generic symbol automatially; the symbol is important and is used to recognize the observable;
 * @property {string} [value] - the starting value for this observable;
 * @property {(publisher_args: Map | Array | undefined) => any} calculate the function used to calculate the value of this observable;
 * @property {symbol} [calculate_args] - indicates which arguments should be passed to observable.calculate; see `Observable.NONE` (`static NONE` in the code) and the symbols following it;
 * @property {0 | 1} [mode] - the starting `mode` of this observable;
 * @property {Observable[]} [publishers] - a list of publishers this observable should immediately subscribe to;
 * @property {Observable[]} [subscribers] - a list of subscribers this observable should immediately accept;
 * @property {(curr: any, next: any) => bool} [equals] the function used to compare the current value to the next value on publishing observables; if it returns true, the observable will not recursively publish to publishing observables that are subscribed to it; for observables with too few subscribers, this method can actually be bad for performance;
 */

/**
 * This class implements a type of "subscriber model".
 * - Used for variables that are dependent on other variables. So a given observable should be a function of other variables, or it should be a "root" variable, meaning it does not depend on variables. Root observables / variables have setters that make sense.
 * - You can think of an observable / variable as being a subscriber to the variables it depends on.
 * - However, this system is different than other systems. Typically, the term "subscriber" implies a pull-based system, where in order to get the value of a subscriber, you must recursively calculate the values of the observables / variables it is subscribed to, and then calculate the value of this subscriber too. What makes this system different is that it is actually a hybrid of a push-based system and a pull-based system.
 * - See the constructor for more info.
 * - "This cycle" refers to the time between update horizon optimizations. See `Optimizer` for more info.
 * - By the way, make sure to use subscribe and accept. **Do not** modify the subscribers and members of this class directly. The only member you can modfy safely is `observable.calculate`.
 * - Observables are sometimes called nodes, since they are intended to compose functional DAGs.
 */
class Observable{
    /** The string / display name of this observable. */
    name = "";
    /** The number of times this observable has been updated during this cycle. */
    update_count = 0;
    /** The cumulated amount of time spent running the calculate method of this observable during this cycle. */
    time_taken = 0;
    /** Only used in `observable`. */
    effective_cost = 0;
    /** The "mode" of this observable. `0` indicates subscribing mode (updates are pulled). `1` indicates publishing mode (updates are pushed). @type {0 | 1} */
    mode = 0;
    /** The unique symbol assigned to this observable. Used for checking for this observable in the subscriber / publisher lists of other observables. If you overwrite this, an infinite loop might happen. Don't worry though, you can't overwrite this. You're welcome. */
    symbol = Symbol("observable.prototype.symbol");
    /** A reference to an empty object. This acts as a UUID to prevent `observable.update` and `observable.publish` from updating the same observable twice in one calculation. @type {Empty} */
    lastID = {};
    /** The cached value of this observable, as returned by `observable.calculate`. @type {any} */
    value = 0;
    /** The observables that this observable is subscribed to. @type {Observable[]} */
    publishers = [];
    /** The observables that are subscribed to this observable. @type {Observable[]} */
    subscribers = [];
    /** Symbol map for the observables that this observable is subscribed to. @type {Map<Symbol, Observable>} */
    s_publishers = new Map();
    /** Symbol map for the observables that are subscribed to this observable. @type {Map<Symbol, Observable>} */
    s_subscribers = new Map();
    /** Indicates no arg should be passed to `observable.calculate`. */
    static NONE = Symbol("Observable.NONE");
    /** Indicates a Map, mapping symbols to their observables, should be passed to `observable.calculate`. */
    static MSO = Symbol("Observable.MSO");
    /** Indicates a Map, mapping string names to their observables, should be passed to `observable.calculate`. */
    static MNO = Symbol("Observable.MNO");
    /** Indicates a Map, mapping symbols to the values of their respective observables, should be passed to `observable.calculate`. */
    static MSV = Symbol("Observable.MSV");
    /** Indicates a Map, mapping string names to the values of their respective observables, should be passed to `observable.calculate`. */
    static MNV = Symbol("Observable.MNV");
    /** Indicates an array, of observables, should be passed to `observable.calculate`. */
    static AO = Symbol("Observable.AO");
    /** Indicates an array, of the values of observable, should be passed to `observable.calculate`. */
    static AV = Symbol("Observable.AV");
    static VALID = new Set([
        Observable.NONE,
        Observable.MSO,
        Observable.MNO,
        Observable.MSV,
        Observable.MNV,
        Observable.AO,
        Observable.AV,
    ]);
    /** What kinds of `publisher_args` to construct for `observable.calculate`. @type {Symbol} @default Observable.NONE */
    calculate_args = Observable.NONE;
    /**
     * This constructor has many options.
     * @param {Observable_Options} [options] See `Observable_Options` for more info.
     */
    constructor(options){
        /** @type {Observable_Options} */
        const o = options ?? {};
        /**
         * @type {undefined | (publisher_args: Map | Array | undefined) => any} The function used to calculate the value of this observable. 
         * - Feel free to modify this with external code if you want to.
         * - The values in `publisher_args` are the direct values of those publishers, not the actual publishers.
         * - `publisher_args` will only be given if `observable.fancy_calculate`
         * - Note that `this` will be this observable, unless you bind the function or use an arrow function.
         */
        this.calculate = (typeof o.calculate === "function") ? o.calculate : this.calculate;
        this.name = String(o.name ?? this.name);
        this.mode = Number(Boolean(o.mode ?? this.mode));
        this.value = o.value ?? this.value;
        this.publishers = [];
        this.subscribers = [];
        this.s_publishers = new Map();
        this.s_subscribers = new Map();
        /**
         * @type {(curr: any, next: any) => bool} the function used to compare the current value to the next value on publishing observables; if it returns true, the observable will not recursively publish to publishing observables that are subscribed to it; for observables with too few subscribers, this method can actually be bad for performance;
         */
        this.equals = o.equals;
        // You're welcome.
        const symbol = o.symbol ?? Symbol("observable.instance.symbol");
        Object.defineProperty(this, "symbol", {
            get(){return symbol;},
            configurable: false,
        });
        this.calculate_args = Observable.VALID.has(
            o.calculate_args
        ) ? o.calculate_args : Observable.NONE;
        this.initialize();
        if(o.publishers){
            this.subscribe(publishers);
        }
        if(o.subscribers){
            this.accept(subscribers);
        }
    }
    initialize(){
        this.subscribers = [];
        this.publishers = [];
        for(const s of this.s_subscribers.values()){
            this.subscribers.push(s);
        }
        for(const s of this.s_publishers.values()){
            this.publishers.push(s);
        }
        if(this.calculate_args === Observable.NONE){
            this.proxy_calculate = this.calculate;
        }
        else if(Observable.VALID.has(this.calculate_args)){
            this.proxy_calculate = this[this.calculate_args];
        }
    }
    /**
     * Subscribe to the list of publishers. This also causes those publishers to accept this observable as a subscriber. Note: a publishing-mode observable cannot subscribe to a subscribing-mode observable.
     * @param {Observable[]} publishers
     */
    subscribe(publishers){
        for(const p of publishers){
            if(p.check_subscribe(this.symbol, {/* Look ma, I'm a UUID! */})){
                throw new ReferenceError("This observable cannot subscribe to itself.", {cause: this});
            }
        }
        for(const p of publishers){
            if(!this.s_publishers.has(p.symbol)){
                this.s_publishers.set(p.symbol, p);
                this.publishers.push(p);
                if(!p.s_subscribers.has(this.symbol)){
                    p.s_subscribers.set(this.symbol, this);
                    p.subscribers.push(this);
                }
            }
        }
    }
    /**
     * Accept the list of subscribers. This also causes those subscribers to subscribe to this observable. Note: a subscribing-mode observable cannot accept a publishing-mode observable as a subscriber.
     * - Yes, calling this "accept" is a bit confusing, but I blame the English language for that.
     * @param {Observable[]} subscribers
     */
    accept(subscribers){
        for(const p of subscribers){
            if(this.check_accept(this.symbol, {/* Look ma, I'm a UUID! */})){
                throw new ReferenceError("This observable cannot subscribe to itself.", {cause: this});
            }
        }
        for(const p of subscribers){
            if(!this.s_subscribers.has(p.symbol)){
                this.s_subscribers.set(p.symbol, p);
                this.subscribers.push(p);
                if(!p.s_publishers.has(this.symbol)){
                    p.s_publishers.set(this.symbol, this);
                    p.publishers.push(this);
                }
            }
        }
    }
    /**
     * Unsubscribe from the list of publishers. This also causes those publishers to unaccept this observable as a subscriber.
     * - After calling this function, you need to call observable.initialize() to update the list of subscribers / publishers.
     * @param {Observable[]} publishers
     */
    unsubscribe(publishers){
        for(const p of publishers){
            this.s_publishers.delete(p.symbol);
            p.s_subscribers.delete(this.symbol);
            // delete checks for has anyways;
            // if(this.s_publishers.has(p.symbol)){
            //     if(p.s_subscribers.has(this.symbol)){
            //     }
            // }
        }
    }
    /**
     * Unaccept the list of subscribers. This also causes those subscribers to unsubscribe to this observable.
     * - After calling this function, you need to call observable.initialize() to update the list of subscribers / publishers.
     * @param {Observable[]} subscribers
     */
    unaccept(subscribers){
        for(const p of subscribers){
            this.s_subscribers.delete(p.symbol);
            p.s_publishers.delete(this.symbol);
            // delete checks for has anyways;
            // if(this.s_subscribers.has(p.symbol)){
                // if(p.s_publishers.has(this.symbol)){
                // }
            // }
        }
    }
    /**
     * Internal method for `observable.subscribe`, to check to make sure an observable does not subscribe to itself, since that would **definitely** cause an infinite loop.
     * @param {symbol} s the unique symbol of the observable that is being checked;
     * @param {Empty} checkID the UUID used for checking;
     * @returns {bool} `false` means there would be no infinite loop, and `true` means there would be an infinite loop;
     */
    check_subscribe(s, checkID){
        for(const p of this.publishers){
            // prevent over-checking, since there are simple cases where you might over-check exponentially when only a linear number of nodes need checked;
            if(p.lastID === checkID) continue;
            if(p.s_publishers.has(s)) return true;
            if(p.check_subscribe(s, checkID)) return true;
            p.lastID = checkID;
        }
        return false;
    }
    /**
     * Internal method for `observable.accept`, to check to make sure an observable does not subscribe to itself, since that would **definitely** cause an infinite loop.
     * @param {symbol} s the unique symbol of the observable that is being checked;
     * @param {Empty} checkID the UUID used for checking;
     * @returns {bool} `false` means there would be no infinite loop, and `true` means there would be an infinite loop;
     */
    check_accept(s, checkID){
        for(const p of this.subscribers){
            // prevent over-checking, since there are simple cases where you might over-check exponentially when only a linear number of nodes need checked;
            if(p.lastID === checkID) continue;
            if(p.s_subscribers.has(s)) return true;
            if(p.check_accept(s, checkID)) return true;
            p.lastID = checkID;
        }
        return false;
    }
    /**
     * Update the value of this observable. This method should only be called for observables that are in subscribing mode.
     * @param {Empty} updateID the UUID used to prevent the same observable from being updated twice;
     */
    update(updateID){
        // recusrive pull
        this.update_count++;
        this.lastID = updateID;
        if(!this.calculate) return;
        for(const p of this.publishers){
            if(p.mode === 0 && p.lastID !== updateID){
                p.update(updateID);
            }
        }
        // then update
        /** on my machine performance.now runs at 10 kHz */
        const t0 = performance.now();
        this.value = this.proxy_calculate();
        this.time_taken += performance.now() - t0;
    }
    /**
     * Publish the value of this observable to its subscribers. This method should only be called for observables that are in publishing mode.
     * @param {Empty} updateID the UUID used to prevent the same observable from being updated twice;
     */
    publish(updateID){
        // update
        if(this.calculate){
            /** on my machine performance.now runs at 10 kHz */
            const t0 = performance.now();
            const next = this.proxy_calculate();
            const changed = !(this.equals ? this.equals(this.value, next) : this.value === next);
            this.time_taken += performance.now() - t0;
            // then recursive push
            this.update_count++;
            if(changed){
                this.value = next;
                this.lastID = updateID;
                for(const p of this.subscribers){
                    if(p.mode === 1 && p.lastID !== updateID){
                        p.publish(updateID);
                    }
                }
            }
        }
        // logic for root nodes to publish;
        else{
            this.update_count++;
            this.lastID = updateID;
            for(const p of this.subscribers){
                if(p.mode === 1 && p.lastID !== updateID){
                    p.publish(updateID);
                }
            }
        }
    }
    /**
     * Used for external connections, like for getting the value of output variables. This causes a subscribing observable to update its value.
     * @param {Empty} [updateID] the UUID used to prevent the same observable from being updated twice;
     */
    get(updateID){
        if(this.mode === 0){
            this.update(updateID ?? {/* Look ma, I'm a UUID! */});
        }
        return this.value;
    }
    /**
     * Used for external connections, like for updating the base variables of the system. This causes a publishing observable to publish its value.
     * @param {*} value the value to set for the observable;
     * @param {Empty} [updateID] the UUID used to prevent the same observable from being updated twice;
     */
    set(value, updateID){
        if(this.calculate){
            throw new TypeError("Cannot set the value of an observable that has a calculate method, since that implies that this observable is not a root observable.");
        }
        if(this.equals ? this.equals(this.value, value) : this.value === value) return;
        this.value = value;
        if(this.mode === 1){
            this.publish(updateID ?? {/* Look ma, I'm a UUID! */});
        }
    }
    /** This gets overwritten by observable.initialize. This function is used as a proxy to set up publisher_args before passing it so calculate. When observable.calculate_args = Observable.NONE, this method gets overwritten to be whatever calculate is. @type {(publisher_args: Map | Array | undefined) => any} */
    proxy_calculate(){/* Placeholder. */}
    [Observable.MSO](){
        /** @type {Map<Symbol, Observable>} */
        const o = new Map();
        for(const [s, p] of this.s_publishers){
            o.set(s, p);
        }
        return this.calculate(o);
    }
    [Observable.MNO](){
        /** @type {Map<string, Observable>} */
        const o = new Map();
        for(const p of this.s_publishers.values()){
            o.set(p.name, p);
        }
        return this.calculate(o);
    }
    [Observable.MSV](){
        /** @type {Map<Symbol, any>} */
        const o = new Map();
        for(const [s, p] of this.s_publishers){
            o.set(s, p.value);
        }
        return this.calculate(o);
    }
    [Observable.MNV](){
        /** @type {Map<string, any>} */
        const o = new Map();
        for(const p of this.s_publishers.values()){
            o.set(p.name, p.value);
        }
        return this.calculate(o);
    }
    [Observable.AO](){
        /** @type {Observable[]} */
        const o = [];
        for(const p of this.s_publishers.values()){
            o.push(p);
        }
        return this.calculate(o);
    }
    [Observable.AV](){
        /** @type {any[]} */
        const o = [];
        for(const p of this.s_publishers.values()){
            o.push(p.value);
        }
        return this.calculate(o);
    }
}

/**
 * Class to optimize a graph / list of observables. The observables don't even all need to be connected. Isn't that cool? Yeah, it is really cool.
 */
class Optimizer{
    /**
     * @param {Observable[] | Set<Observable>} [nodes] the observables this to be optimized;
     * @param {number} [raw_updates_per_ms] a heuristic for how many nodes with simple functions can be updated in 1 ms; this value can be fine-tuned based on your specific project;
     * @param {number} [mspf] the amount of ms between cycles;
     */
    constructor(nodes, raw_updates_per_ms = 50000, mspf = 200){
        /** @type {Set<Observable>} */
        this.nodes = new Set(nodes ?? []);
        /** @type {number} */
        this.raw_updates_per_ms = raw_updates_per_ms;
        /** @type {number} */
        this.mspf = mspf;
        /** Function to run every cycle / every time the graph is optimized. @type {Function | undefined} */
        this.oncycle = undefined;
    }
    /**
     * Used to end the current cycle, and optimize the observable graph.
     */
    cycle(){
        /** Handle any removed subscribers / publishers. My idea is handling them here is more efficient that splicing lists every time. */
        for(const node of this.nodes){
            node.initialize();
        }
        // aggregrate time values towards the horizon;
        /** @type {Set<Observable>} */
        const done = new Set();
        /** @type {Set<Observable>} */
        const queue = new Set();
        do{
            for(const node of this.nodes){
                // node.mode === 0 should be redundant;
                if(node.mode === 0 && node.subscribers.reduce((a,b) => a && done.has(b), true)){
                    done.add(node);
                    for(const p of node.publishers){
                        p.time_taken += node.time_taken;
                        queue.add(p);
                    }
                }
                // node.mode === 1 should be redundant;
                if(node.mode === 1 && node.publishers.reduce((a,b) => a && done.has(b), true)){
                    done.add(node);
                    for(const p of node.subscribers){
                        p.time_taken += node.time_taken;
                        queue.add(p);
                    }
                }
            }
        } while(queue.size > 0);
        for(const node of this.nodes){
            node.effective_cost = node.update_count + (node.time_taken * this.raw_updates_per_ms);
        }
        // sort the nodes in descending order;
        // we do this because a publishing node can't subscribe to a subscribing node;
        // if we have a publishing node that we want to turn into a subscribing node, we need to turn any subscribers (that are also publishing nodes) that it has into subscribing nodes as well first;
        // now what's convenient, is those subscribers SHOULD already have higher effective costs; so going from the highest cost nodes to the lowest cost nodes means we should automatically resolve these isues;
        // however, just in case, we double check to make sure they actually are;
        // in some cases, running this function a few times in a row might give more optimal results; however, I think funning it once every "frame" is fine;
        const sorted = [...this.nodes].sort(
            (a,b) => b.effective_cost - a.effective_cost
        );
        for(const node of sorted){
            // unfortunately, this library is simple and only has one way of optimizing the graph, and that is changing the modes of observable nodes; forunately, this is a very useful optimization;
            // if subscribing node: is pull pressure > cost of upstream pushes? -> promote to publishing node;
            if(node.mode === 0 && node.effective_cost > node.publishers.reduce((a,b) => a + b.effective_cost, 0) && node.publishers.reduce((a,b) => a && b.mode === 1, true)){
                node.mode = 1;
            }
            // if publishing node: is push pressure > cost of downstream pulls? -> demote to subscribing node;
            if(node.mode === 1 && node.effective_cost > node.subscribers.reduce((a,b) => a + b.effective_cost, 0) && node.subscribers.reduce((a,b) => a && b.mode === 0, true)){
                node.mode = 0;
            }
            // imagine if everything in life was this simple; I think that's what heaven is like; oh wait, I almost forgot, most things in life almost are this simple!
            
            // reset for next cycle
            node.update_count = 0;
            node.time_taken = 0;
        }
        this?.oncycle();
    }
    /** Interval ID for the optimizer. Don't touch. */
    frame_id = -1;
    /** Start / resume optimizing. */
    start(){
        this.frame_id = setInterval(this.cycle.bind(this), this.mspf);
    }
    /** Stop / pause optimizing. */
    stop(){
        clearInterval(this.frame_id);
        this.frame_id = -1;
    }
}

/**
 * Specialized class for debugging the mode of an observable.
 */
class Debug_Observable{
    /** The observable to debug. @type {Observable} */
    o = new Observable();
    /** The previous mode of the observable. @type {0 | 1} */
    prev = 0;
    /** The element where the debug info is listed. @type {HTMLLIElement | undefined} */
    el = document.createElement("li");
    getHTML(){
        return `${this.o.name ?? "[Un-named]"} mode: ${["subscribing","publishing"][this.o.mode]}`;
    }
    update(){
        if(this.prev !== this.o.mode){
            this.prev = this.o.mode;
            this.el.innerHTML = getHTML();
        }
    }
    /**
     * Setup debugging for an observable - step 1.
     * @param {Observable} o the observable;
     */
    constructor(o){
        this.o = o;
        this.el = undefined;
    }
    /**
     * Setup debugging for an observable - step 2. Used to start debugging.
     * @param {HTMLUListElement} u the list element to place the debug element in;
     */
    initialize(u){
        this.el = document.createElement("li");
        u.appendChild(this.el);
        this.prev = 1 - this.o.mode;
        this.update();
    }
    /**
     * Used to stop debugging, undoing step 2 of the setup.
     */
    clear(){
        this.el.remove();
        this.el = undefined;
    }
}

/**
 * Specialized class for linking a current observable to a next observable. The constructor automatially creates the next observable.
 */
class Next_Observable{
    /**
     * Create a next observable and link it to a current observable.
     * @param {Observable} curr the current observable to use;
     * @param {App} app the app the next observable is going in; this is needed for debugging;
     * @param {Function} [calculate] the function to calculate the next value of the observable (i.e. the value of the next observable); this can use the value of the current observable, but it should not use the value of the next observable; also, make sure to read `.value` directly, instead of using `.get()`; `.get()` is only supposed to be called by `App.frame` directly;
     * @param {Observable[]} [publishers] a list of observables that the next observable should be subscribed to; list anything here that you will need to use in the `calculate` function;
     */
    constructor(curr, app, calculate, publishers){
        /** The app this next observable is part of. @type {App} */
        this.app = app;
        /** The current observable. @type {Observable} */
        this.curr = curr;
        // this line of code looks particularly magical;
        publishers = [...(publishers ?? []), curr];
        /** The next observable. The name could be confused with the name of this class, but this observable is only used internally. @type {Observable} */
        this.next = App.O("next_" + curr.name, calculate, publishers);
    }
    /**
     * Delete this next observable. That means removing it and both its observables.
     */
    remove(){
        this.app.next.delete(this.curr.symbol);
        this.app.remove(this.curr);
        this.app.remove(this.next);
    }
}

/**
 * Every type of input should be a class that inherits from this class.
 */
class Input{
    /**
     * Setup a listener for an input on an element, so the input is automatially put in an observable.
     * - Because this is the base class, it does not actually set an event listener.
     * @param {Observable} o sets `input.o`;
     * @param {Element} el sets `input.el`;
     * @param {App} app sets `input.app`;
     */
    constructor(o, el, app){
        /** The observable to input into. @type {Observable} */
        this.o = o;
        /** Which element to put an event listener on. @type {Element} */
        this.el = el;
        /** Which app manages this input. @type {App} */
        this.app = app;
    }
    /**
     * Prepare this input for the next frame. This varies for each type of input and should be overridden by classes than inherit from `Input`. This method will get run at the end of `App.frame`.
     * @abstract
     */
    cleanup(){}
    /**
     * Delete this input. That means removing it, its observable, and its element.
     */
    remove(){
        this.app.inputs.delete(this);
        this.app.remove(this.o);
        this.el.remove();
    }
}

class Click_Input extends Input{
    /** The number of times the user has clicked this frame. */
    clicked = 0;
    /**
     * @param {Observable} o sets `input.o`;
     * @param {Element} el sets `input.el`;
     * @param {App} app sets `input.app`;
     */
    constructor(o, el, app){
        super(o, el, app);
        el.addEventListener("click", function(e){
            this.clicked++;
        }.bind(this));
    }
    cleanup(){
        this.clicked = 0;
    }
}

/**
 * This is similar to `Input`, but there is no need to create a superclass for both of them.
 * - Also, this class does not to be extended.
 */
class Output{
    /**
     * Setup an observable to automatically output to an element.
     * @param {Observable} o sets `output.o`;
     * @param {Element} el sets `output.el`;
     * @param {App} app sets `output.app`;
     */
    constructor(o, el, app){
        /** Which observable this output reads from. @type {Observable} */
        this.o = o;
        /** Which element this output outputs to. @type {Element} */
        this.el = el;
        /** Which app manages this output. @type {App} */
        this.app = app;
    }
    /**
     * Update function to run every frame. You could override this if you wanted to handle things without any complicated tricks.
     * @param {Empty} [updateID] the UUID used to prevent the same observable from being updated twice; everyone's favorite parameter, right?
     */
    update(updateID){
        this.el.innerHTML = this.o.get(updateID);
    }
    /**
     * Delete this output. That means removing it, its observable, and its element.
     */
    remove(){
        this.app.inputs.delete(this);
        this.app.remove(this.o);
        this.el.remove();
    }
}

/**
 * Setup HTML elements so they are connected to observables. Each instance of this class is a "handler", which can use a set interval, and can be paused and resumed.
 */
class App{
    /** Whether debugging needs to be initialized this frame. */
    debug_init = true;
    /** Whether we are debugging this frame. */
    debug = true;
    constructor(mspf = 16){
        /** Time of last frame (using `performance.now`). @type {number} */
        this.last_t_p = performance.now();
        /** Time of current frame (using `performance.now`). @type {number} */
        this.curr_t_p = performance.now();
        /** Time of last frame (using `Date`). @type {Date} */
        this.last_t = new Date();
        /** Time of current frame (using `Date`). @type {Date} */
        this.curr_t = new Date();
        /** Time difference between frames. @type {number} */
        this.dt_n = this.curr_t_p - this.last_t_p;
        /** Observable for the current time. @type {Observable} */
        this.now = this.O("now", __, __, this.curr_t);
        /** Observable for the time difference between frames. @type {Observable} */
        this.dt = this.O("dt", __, __, this.dt_n);
        /** List of inputs, as a set. @type {Map<Symbol, Input>} */
        this.inputs = new Set();
        /** List of outputs, as a set. @type {Map<Symbol, Output>} */
        this.outputs = new Set();
        /** Map of observable names to symbols. Duplicate names are not allowed. @type {Map<String, Symbol>} */
        this.o_symbols = new Map();
        /** List of observables being managed by this app, as a map. The keys are the symbols of the managed observables. @type {Map<Symbol, Debug_Observable>} */
        this.os = new Map();
        /** List of next observables being managed by this app, as a map. The keys are the symbols of the current observables. `Next_Observable` is a wrapper with the observable for the current value, and the observable for the next value. @type {Map<Symbol, Next_Observable>} */
        this.next = new Map();
        /** The number of milliseconds between frames. Elements and next observables are updated every frame. @type {number} */
        this.mspf = mspf;
        /** List of functions to run every at the end of the current frame. These get cleared every frame. This is intended to be a place where you can put callbacks. These are for modifying the app's structure. So you could use a callback to open a menu, or close a menu, or reset a board. @type {Function | undefined} */
        this.todo = undefined;
        /** The optimizer for this app. @type {Optimizer} */
        this.optimizer = new Optimizer();
    }
    /**
     * Create a new observable and add it to this app's list of observables.
     * @param {string} name the name of the observable (required);
     * @param {Function} [calculate] the function to calculate the value of the observable;
     * @param {Observable[]} [publishers] the publishers that the observable will have; you can list these by name, by symbol, or by reference;
     * @param {any} [value] the starting value of the observable;
     */
    O(name, calculate, publishers, value){
        name = String(name);
        if(!name) throw new TypeError("App.O requires a name for the observable.");
        if(this.o_symbols.has(name)) throw new ReferenceError(`The name "${name}" is already in use.`);
        const s = Symbol(`observable.${name}`);
        this.o_symbols.set(name, s);
        publishers = (publishers ?? []).map(p => (
            p instanceof Observable ?
            p :
            this.os.get(
                typeof p === "string" ?
                this.o_symbols.get(p) :
                p
            )
        )).filter(p instanceof Observable);
        const o = new Observable({
            name, symbol: s,
            calculate, publishers, value,
        });
        this.o_symbols.set(name, s);
        this.os.set(s, new Debug_Observable(o));
        this.optimizer.nodes.add(o);
        return o;
    }
    /**
     * Add a new input to this app.
     * @param {Element} el the element that will update the input;
     * @param {Observable} obs the observer that will be updated by the input;
     * @param {typeof Input} type the class to use to construct the input; this should be a subclass of `Input`;
     */
    Input(el, obs, type){
        const o = new type(obs, el, this);
        this.inputs.add(o);
        return o;
    }
    /**
     * Link an element to an observable, and add it to the list of outputs managed by this app.
     * @param {Element} el the element;
     * @param {Observable} obs the observable;
     */
    Output(el, obs){
        const o = new Output(obs, el, this);
        this.outputs.add(o);
        return o;
    }
    /**
     * Link every element matching a query to an observable, and add each of them to the list of outputs managed by this app.
     * @param {string} q the query, which must be a CSS selector;
     * @param {Observable} obs the observable;
     */
    Output_Q(q, obs){
        const os = [];
        const els = document.querySelectorAll(q);
        if(!els) return [];
        for(const el of els){
            os.push(this.Output(el, obs));
        }
        return os;
    }
    /**
     * Remove an observable from this app.
     * @param {Observable} o the observable to remove/delete;
     * @param {bool} others whether to remove any Input, Output, or Next_Observable assosciated with the observable;
     */
    remove(o, others){
        this.os.delete(o.symbol);
        this.optimizer.nodes.delete(o);
        o.unsubscribe(o.publishers);
        o.unaccept(o.subscribers);
        if(others){
            this.inputs .get(o.symbol)?.remove?.();
            this.outputs.get(o.symbol)?.remove?.();
            this.next   .get(o.symbol)?.remove?.();
        }
    }
    /** Where all the magic happens. */
    frame(){
        // first, figure out time;
        this.last_t_p = this.curr_t_p;
        this.last_t = this.curr_t;
        this.curr_t_p = performance.now();
        this.curr_t = new Date();
        this.dt_n = this.curr_t_p - this.last_t_p;
        this.now.set(this.curr_t);
        this.dt.set(this.dt_n);
        const nextID = {/* Look ma, I'm a UUID! */};
        // second, calculate the next state;
        for(const n of this.next.values()){
            n.next.get(nextID);
        }
        const currID = {/* Look ma, I'm a UUID! */};
        // third, set the current state to the next state; this loop must be separate;
        for(const n of this.next.values()){
            n.curr.set(n.next.value, currID);
        }
        // fourth, update the UI;
        for(const o of this.outputs.values()){
            o.update(currID);
        }
        // fifth, reset/cleanup the inputs;
        for(const o of this.inputs.values()){
            o.cleanup();
        }
        // sixth, handle debugging;
        if(this.debug_init){
            const ul = document.querySelector(".debug");
            for(const o of this.os.values()){
                o.initialize(ul);
            }
        }
        if(this.debug){
            for(const o of this.os.values()){
                o.update();
            }
        }
        
        // last step, run callbacks;
        try{for(const f of this.todo){
            f();
        }}
        catch(e){}
        this.todo = [];
    }
    /** Interval ID for the handler. Don't touch. */
    frame_id = -1;
    /** Start / resume `app.frame` inverval. */
    start(){
        this.frame_id = setInterval(this.frame.bind(this), this.mspf);
    }
    /** Stop / pause `app.frame` inverval. */
    stop(){
        clearInterval(this.frame_id);
        this.frame_id = -1;
    }
    start_debug(){
        if(this.debug) return;
        this.debug_init = true;
        this.debug = true;
    }
    stop_debug(){
        if(!this.debug) return;
        for(const o of this.os.values()){
            o.clear();
        }
        this.debug_init = false;
        this.debug = false;
    }
}


