
const eh = new Elup();
/** @type {(obs: Observable) => any} */
const _ = (obs => obs.value);
const cookies = new Observable();
const dollars = new Observable(() => {
    return _(cookies) * 2;
});
dollars.subscribe([cookies]);

const btn = document.querySelector(".gain_cookie");
btn.onclick = function(){
    cookies.set(cookies.get() + 1);
}

eh.addq(".cookies", cookies);
eh.addq(".dollars", dollars);
eh.start();
