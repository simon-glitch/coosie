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
    },],
    observables: [
        {name: "cookies",},
        {name: "cookies_t", publishers: "cookies", calculate: function(){
            return Math.floor(this.cookies);
        }},
        {name: "dollars", publishers: "cookies", calculate: function(){
            return this.cookies * 2;
        }},
        {name: "dollars_t", publishers: "dollars", calculate: function(){
            return
            Math.floor(this.dollars) + "." +
            Math.floor((10 * this.dollars) % 10) +
            Math.floor((100 * this.dollars) % 10);
        }},
        {name: "grandmas",},
        {name: "cps_mul",},
        {name: "cps_on", publishers: "cps_mul", calculate: function(){
            return ["off", "on"][this.cps_mul];
        }},
        {name: "cps", publishers: ["grandmas", "cps_mul"], calculate: function(){
            return this.grandmas * this.cps_mul;
        }},
        {name: "time", next: {
            calculate: function(){
                this.time + 1 * 0.001
            },
            publishers: app.dt,
        },},
        {name: "seconds",},
        {name: "seconds_t",},
        {name: "time_m",},
        {name: "minutes",},
        {name: "hours",},
        {name: "o_b_gc",},
        {name: "o_b_gg",},
        {name: "o_b_t_cps",},
    ],
});


app.start();
