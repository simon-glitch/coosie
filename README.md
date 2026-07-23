# Coosie
Coosie (pronounced a certain way) is a framework created by Simanelix (that's me). The purpose of this framework is to provide a simple, low friction way for developers to make dynamic web apps.

This framework is very different from other frameworks, so if you (the app developer) want to use it, throw everything you know out the door.

# Installing
The frontend is just a library, so you can just install it. It is at [`coosie/src/frontend.js`](./src/frontend.js).

The backend, when it is eventually written, will not be too complex to install, but it will require **NodeJS**.

# Variables are all you need!
The core idea of this framework is to solve problems using basic features of variables. This idea seems to be alien to modern frameworks, which use proxies, life cycles, event loops, and engines. This library has some stuff going on it, but not all of that crazy stuff.

Variables are abstracted with a simple class called observable. There are two types of variables you learn about in high school Algebra: dependent and independent variables. Those exist here too. A dependent observable is an observable that has the `calculate` property, which defines the formula to be used for that observable. A root observable (i.e. an independent observable) is an observable that does not have a formula. You can call the `set` method of a root observable, and other observables will update. You can call the `get` method of any observable to get its value, however this is not required inside a `calculate` function. Inside a `calculate` function, the observables it depends on will update their values first. This makes using observables simple. Observables technically use a push-pull hybrid system, but this is not relevant to you.

**So what's so great about variables?**

Well first off, keep in mind many things are variables in disguise. Parameters, properties, map items, array items, and even `this` are all secretly variables. But here is how simple variables can be:

```js
const cookies = new Observable({name: "cookies", value: 0,});
const dollars = new Observable({name: "dollars", publishers: [cookies], calculate: function(){
    return cookies.value * 2;
},});
```

Now, you might notice some friction points in here, like that cookies is being referenced lexically, and the fact that this code can't be turned into a "template". And that's true. But it's easy to solve this issue with a framework, so that's what I did. I simplified it to this:
```js
[
{name: "cookies", value: 0,},
{name: "dollars", publishers: "cookies", calculate: function(){
    return this.cookies.value * 2;
}},
]
```

This is then fed into `new Content`. Once you're familiar with the system it's really simple.

# Features
Features (as I call them):
* Many of these classes are constructed using an `options` object, which is JSON like; this improves readability, since there are a lot of parameters, and there are also sneaky internal parameters used to hack in certain features; that's jank?! well I'm not going to fix it;
* `Observable` - represents a variable or a piece of data; read the class definition for more info; it's very readable;
* (WIP) `List_Observable` - manages a list of observavbles, which is pretty complex;
* `Optimizer` - automatically switches observables between push and pull mode based on performance; this is its ONLY job; it also technically optimizes outputs and next observables (see below);
* `App` - the core of the framework
* `Content` - the user friendly tool to add a content to an app; each content object has one HTML element, and manages everything inside that element; this is recursive, since HTML elements are recursive;
    * you can literally make your entire app with just `new App()`, and then content objects;
    * (WIP) `content.list === ` {list observable options} makes it so a list observable helps manage the content's children;
* `Output` - a handler to update the text of an HTML object with no children based on an observable;
    * (WIP) output has push and pull mode like observable does:
        * push mode makes it so this observable will only be checked if its value has actually changed (the diff is pushed);
        * pull mode makes it so `app.frame` will always check the value of this observable;
* `Input` - a handler to convert inputs from a type of input into an observable; this could handle mouse inputs, keyboard inputs, radio inputs, and any other kind of input from the UI;
* `Next_Observable` a tool to define how an observable should change every frame;
    * this involves two observables, A and B; the value of B (from `B.get()`) defines the value A should have next frame (`A.set(B.get())`);
    * (WIP) next observable has push and pull mode like observable does:
        * push mode makes it so the A is only set if B changed its value (pushing the diff);
        * pull mode makes it so `app.frame` will always check the value of B and update A;
* `app.frame` - I suppose this is the lifecycle of the framework, but it's very simple; read the function to see the order in which updates happen;
* (WIP) `Template` - a helper function that adds a template to `App` globally; `content.template` makes a piece of content use the template by name or reference, no extra steps! it is a config object where put the `name` or `ref` for the template, and then all of the template parameters;
* (TODO) `Dynamic` allows a piece of content to use a dynamically chosen template; useful for when you need to, I don't know, switch to a completely different page or something; `content.dynamic` specifies the config options for a `Dynamic` object and connects it to the template;
* (WIP) add a JavaScript parser for some of the other items on here, since it is required for properly detecting issues; it just needs to give the AST; and then I need to figure out how to use that;
    * the parsed result will be attached to the function directly bc duh;
* (WIP) `content.compile` - a neat trick that "compiles" the methods on observables; has two modes;
    * complex mode: use direct lexical variables rather than things like `this.value`, `this.x.value`, and `this.publish`; affected methods: literally all of them; `.value` still works using proxies; `$x` is compiled into the same direct reference to the observable value that other methods use; i.e. if A is publishing to B, `A.publish` and `B.calculate` will both look at the same lexical reference, if both are in complex mode; this mode is good when there are a few observables that are really hurting performance;
    * simple mode: `$x` needs to be compiled into `this.x.value`; this mode is good when there are a so many observables that the complex compile would take too long because it would involve an enormous `eval` statement; also, this mode is strictly required for content that is created with dynamically chosen templates;
    * the two modes can be mixed together; it will probably only be slightly janky;
* (WIP) custom error classes for my custom errors;
* (PLANNED) GC system, so hidden content is actually deleted and can then by dynamically readded when unhidden, to save memory and performance;
* (TODO) once GC system is added, make it so if a content object has a `condition` property, root observables can only be placed inside if `content.keep === true` or `content.drop === true`;
* (TODO) recursion error for making one piece of content a descendant of another;
* (TODO) reference error for using lexically bound scope variables in `calcullate` functions unless they are existing global variables; loose references would be fine if compiling in simple mode, but they don't work at all with complex mode, and more importantly, they would just be bad code anyways;
* (TODO) syntax error for using an arrow function in observables that are in this mode; this error needs to be thrown by `Observable`; arrows are okay for purely lexical setups, but not with `Observable.THIS`; if you try to bind an arrow function in JavaScript, it quietly ignores it;

