/** @import {  } from "../../archive/observable_1_beta.js" */

const app = new App();
/** @type {(obs: Observable) => any} */
const _ = (obs => obs.value);
const cookies = app.O("cookies");
const cookies_t = app.O("cookies_t", () => (
    Math.floor(_(cookies))
), [cookies]);
const dollars = app.O("dollars", () => (
    _(cookies) * 2
), [cookies]);
const dollars_t = app.O("dollars_t", () => (
    Math.floor(_(dollars)) + "." +
    Math.floor((10 * _(dollars)) % 10) +
    Math.floor((100 * _(dollars)) % 10)
), [dollars]);
const grandmas = app.O("grandmas");
const cps_mul = app.O("cps_mul");
const cps_on = app.O("cps_on", () => (
    ["off", "on"][_(cps_mul)]
), [cps_mul]);
const cps = app.O("cps", () => (
    _(grandmas) * _(cps_mul)
), [grandmas, cps_mul]);
const time = app.O("time");
app.Next(time, () => (
    _(time) + _(app.dt) * 0.001
), [time, app.dt]);
const seconds = app.O("seconds", () => (
    _(time) % 60
), [time]);
const seconds_t = app.O("seconds_t", () => (
    Math.floor(_(seconds))
), [seconds]);
const time_m = app.O("time_m", () => (
    (_(time) - _(seconds)) / 60
), [time, seconds]);
const minutes = app.O("minutes", () => (
    _(time_m) % 60
), [time_m]);
const hours = app.O("hours", () => (
    (_(time_m) - _(minutes)) / 60
), [time_m, minutes]);

const o_b_gc = app.O("o_b_gc");
const o_b_gg = app.O("o_b_gg");
const o_b_t_cps = app.O("o_b_t_cps");
const b_gc = app.Input(document.querySelector(".gain_cookie"), o_b_gc, Click_Input);
const b_gg = app.Input(document.querySelector(".gain_grandma"), o_b_gg, Click_Input);
app.Next(grandmas, () => (
    _(grandmas) + _(o_b_gg)
), [o_b_gg]);
const b_t_cps = app.Input(document.querySelector(".toggle_cps"), o_b_t_cps, Click_Input);

// toggle cps
app.Next(cps_mul, () => (
    _(cps_mul) ^ Boolean(_(o_b_t_cps))
), [cps_mul, o_b_t_cps]);
// cookie gain
app.Next(cookies, () => (
    _(cookies) +
    // from cps
    _(cps) * _(app.dt) * 0.001 +
    // from clicks
    _(o_b_gc)
), [cookies, cps, app.dt, o_b_gc]);

for(const el of document.querySelectorAll("*")){
    // ignore elements with more or less than 1 class;
    if(!el.className || el.className.includes(" ")) continue;
    const s = app.o_symbols.get(el.className);
    // make sure the observable exists;
    if(!s) continue;
    // automatially setup the output;
    app.Output(el, app.os.get(s).o);
}

const app_message = document.querySelector(".app_message");
const toggle_app = function(){
    if(app.frame_id === -1){
        app.start();
        // app.optimizer.start();
        app_message.innerHTML = "App is currently running."
    }
    else{
        app.stop();
        // app.optimizer.stop();
        app_message.innerHTML = "App is not running."
    }
}
toggle_app();
toggle_app();
onkeydown = function(e){
    if(e.key !== "t") return;
    toggle_app();
}


