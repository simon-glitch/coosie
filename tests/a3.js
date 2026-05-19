/** @import {  } from "../src/observable.js" */

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

const b_gc = app.Input(document.querySelector(".gain_cookie"));
const b_gg = app.Input(document.querySelector(".gain_grandma"));
app.Next(grandmas, () => (
    _(grandmas) + _(b_gg.o)
), [b_gg.o]);
const b_t_cps = app.Input(document.querySelector(".toggle_cps"));

// toggle cps
app.Next(cps_mul, () => (
    _(cps_mul) ^ _(b_t_cps.o)
), [cps_mul, b_t_cps.o]);
// cookie gain
app.Next(cookies, () => (
    _(cookies) +
    // from cps
    _(cps) * _(app.dt) * 0.001 +
    // from clicks
    _(b_gc.o)
), [cookies, cps, app.dt, b_gc.o]);

app.start();
app.optimizer.start();


