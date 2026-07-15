const app = new App(100);

// testing time!
const content = new Content({
    app,
    query: ".content",
    content: {
        name: "my_value",
        value: "Starting value.",
        calculate: function(){
            console.log("It works!");
            return app.curr_t;
        },
        publishers: app.o_now,
    },
});

app.start();
