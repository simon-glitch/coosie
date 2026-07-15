const app = new App(100);

// testing time!
const content = new Content({
    app,
    query: ".content",
    children: [{
        tag: "p",
        content: {
            name: "my_value",
            value: "Starting value.",
            calculate: function(){
                return app.curr_t;
            },
            publishers: app.o_now,
        },
    },{
        tag: "p",
        content: "cookies_t",
    },{
        tag: "p",
        content: "dollars_t",
    },],
    observables: [
        {name: "cookies", value: 0,},
        {name: "cookies_t", publishers: "cookies", calculate: function(){
            return Math.floor(this.cookies.value);
        }},
        {name: "dollars", publishers: "cookies", calculate: function(){
            return this.cookies.value * 2;
        }},
        {name: "dollars_t", publishers: "dollars", calculate: function(){
            return Math.floor(this.dollars.value) + "." +
            Math.floor((10 * this.dollars.value) % 10) +
            Math.floor((100 * this.dollars.value) % 10);
        }},
        {name: "grandmas",},
        {name: "cps_mul",},
        {name: "cps_on", publishers: "cps_mul", calculate: function(){
            return ["off", "on"][this.cps_mul.value];
        }},
        {name: "cps", publishers: ["grandmas", "cps_mul"], calculate: function(){
            return this.grandmas.value * this.cps_mul.value;
        }},
        {name: "time", next: {
            calculate: function(){
                this.time.value + this.dt.value * 0.001
            },
            publishers: app.o_dt,
        },},
        {name: "seconds", publishers: "time", calculate: function(){
            return this.time.value % 60;
        }},
        {name: "seconds_t", publishers: "seconds", calculate: function(){
            return Math.floor(this.seconds.value);
        }},
        {name: "time_m", publishers: ["time", "seconds"], calculate: function(){
            return (this.time.value - this.seconds.value) / 60;
        }},
        {name: "minutes", publishers: "time_m", calculate: function(){
            return this.time_m.value % 60;
        }},
        {name: "hours", publishers: ["time_m", "minutes"], calculate: function(){
            return (this.time_m.value - this.minutes.value) / 60;
        }},
        {name: "o_b_gc",},
        {name: "o_b_gg",},
        {name: "o_b_t_cps",},
    ],
});


app.start();
