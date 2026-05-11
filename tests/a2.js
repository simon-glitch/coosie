/** @import {  } from "../src/Observable.js" */

const eh = new Elup();
/** @type {(obs: Observable) => any} */
const _ = (obs => obs.value);
const cookies = new Observable();
const cookies_t = new Observable(() => {
    return Math.floor(_(cookies));
});
const dollars = new Observable(() => {
    return _(cookies) * 2;
});
const dollars_t = new Observable(() => {
    return (
        Math.floor(_(dollars)) + "." +
        Math.floor((10 * _(dollars)) % 10) +
        Math.floor((100 * _(dollars)) % 10)
    );
});
const grandmas = new Observable();
const cps_mul = new Observable();
const cps_on = new Observable(() => {
    return ["off", "on"][_(cps_mul)];
});
const cps = new Observable(() => {
    return _(grandmas) * _(cps_mul);
});
const prev_time = new Observable();
const curr_time = new Observable();
const time = new Observable();
const dt = new Observable(() => {
    return _(curr_time) - _(prev_time);
});
const seconds = new Observable(() => {
    return _(time) % 60;
});
const seconds_t = new Observable(() => {
    return Math.floor(_(seconds));
});
const time_m = new Observable(() => {
    return (_(time) - _(seconds)) / 60;
});
const minutes = new Observable(() => {
    return _(time_m) % 60;
});
const hours = new Observable(() => {
    return (_(time_m) - _(minutes)) / 60;
});
dollars.subscribe([cookies]);
cookies_t.subscribe([cookies]);
dollars_t.subscribe([dollars]);
seconds.subscribe([time]);
time_m.subscribe([time, seconds]);
minutes.subscribe([time_m]);
hours.subscribe([time_m, minutes]);
seconds_t.subscribe([seconds]);
dt.subscribe([prev_time, curr_time]);
cps_on.subscribe([cps_mul]);
cps.subscribe([grandmas, cps_mul]);

const optimizer = new Optimizer([
    cookies,
    dollars,
    grandmas,
    cps,
    cps_on,
    time,
    hours,
    minutes,
    seconds,
]);

const b_gc = document.querySelector(".gain_cookie");
b_gc.onclick = function(){
    cookies.set(cookies.get() + 1);
}
const b_gg = document.querySelector(".gain_grandma");
b_gg.onclick = function(){
    grandmas.set(grandmas.get() + 1);
}
const b_t_cps = document.querySelector(".toggle_cps");
b_t_cps.onclick = function(){
    cps_mul.set(1 - _(cps_mul));
}

eh.addq(".cookies", cookies);
eh.addq(".dollars", dollars);
eh.addq(".grandmas", grandmas);
eh.addq(".cps_mul", cps_mul);
eh.addq(".cps_on", cps_on);
eh.addq(".cps", cps);
eh.addq(".prev_time", prev_time);
eh.addq(".curr_time", curr_time);
eh.addq(".dt", dt);
eh.addq(".time", time);
eh.addq(".seconds", seconds);
eh.addq(".time_m", time_m);
eh.addq(".minutes", minutes);
eh.addq(".hours", hours);
eh.addq(".cookies_t", cookies_t);
eh.addq(".dollars_t", dollars_t);
eh.addq(".seconds_t", seconds_t);

// cps
eh.onframe = function(){
    // this function makes the system look kinda complicated
    // but forunately, you don't need to do much more
    // time is just inherently complicated
    prev_time.set(_(curr_time));
    curr_time.set(performance.now());
    dt.get();
    time.set(_(time) + _(dt) * 0.001);
    cookies.set(_(cookies) + _(cps) * _(dt) * 0.001);
};

// debugging observers;
/** @type {[string, Observable, Observable][]} */
const mode_n = [
    ["cookies", cookies],
    ["dollars", dollars],
    ["grandmas", grandmas],
    ["cps_mul", cps_mul],
    ["cps_on", cps_on],
    ["cps", cps],
    ["prev_time", prev_time],
    ["curr_time", curr_time],
    ["dt", dt],
    ["time", time],
    ["seconds", seconds],
    ["time_m", time_m],
    ["minutes", minutes],
    ["hours", hours],
    ["cookies_t", cookies_t],
    ["dollars_t", dollars_t],
    ["seconds_t", seconds_t],
];
for(const m of mode_n){
    const o_mode = new Observable();
    const o_mode_t = new Observable(() => {
        return ["subscribing", "publishing"][_(o_mode)];
    });
    m.push(o_mode);
    const modes = document.querySelector(".modes");
    const li = document.createElement("li");
    modes.appendChild(li);
    li.innerHTML = m[0] + ': <span class="' + m[0] + '_mode"></span>';
    eh.addq("." + m[0] + "_mode", o_mode_t);
}
optimizer.oncycle = function(){
    for(const m of mode_n){
        m[2].set(m[1].mode);
    }
};

eh.start();
optimizer.start();


