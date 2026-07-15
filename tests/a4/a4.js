const app = new App(100);

// testing time!
const content = new Content({
    app,
    query: ".content",
    content: {
        value: "Starting value.",
        calculate: function(){
            return app.curr_t;
        },
        publishers: app.o_now,
    },
});
