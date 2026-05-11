
const eh = new Elup();
/** @type {(obs: Observable) => any} */
const _ = (obs => obs.value);
const cookies = new Observable();
const dollars = new Observable(() => {
    return _(cookies) * 2;
});
dollars.subscribe([cookies]);
const cookies_mode = new Observable();
const dollars_mode = new Observable();
const cookies_mode_t = new Observable(() => {
    // sneaky side effect
    cookies.mode = _(cookies_mode);
    return ["subscribing", "publishing"][_(cookies_mode)];
});
const dollars_mode_t = new Observable(() => {
    // sneaky side effect
    dollars.mode = _(dollars_mode);
    return ["subscribing", "publishing"][_(dollars_mode)];
});

const b_gc = document.querySelector(".gain_cookie");
b_gc.onclick = function(){
    cookies.set(cookies.get() + 1);
}
const b_cm = document.querySelector(".flip_cookies_mode");
b_cm.onclick = function(){
    cookies_mode.set(1 - _(cookies_mode));
}
const b_dm = document.querySelector(".flip_dollars_mode");
b_dm.onclick = function(){
    dollars_mode.set(1 - _(dollars_mode));
}

eh.addq(".cookies", cookies);
eh.addq(".dollars", dollars);
eh.addq(".cookies_mode", cookies_mode_t);
eh.addq(".dollars_mode", dollars_mode_t);
eh.start();
