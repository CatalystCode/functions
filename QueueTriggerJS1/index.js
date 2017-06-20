module.exports = function (context, jobDescription) {

    var Client = require('node-rest-client').Client;
    var client = new Client();
    var args = {
        parameters: { modelurl: {} }
    };
    args.parameters['modelurl'] = jobDescription.model_url
    client.get("http://13.93.204.0:5000/", args, function (data, response) {
        context.log(response.statusCode);
        context.log(data.toString());
        context.bindings.runResult = JSON.stringify({ 
            id: "12345",
            prediction: 71.82
        });
    });

    context.done();
};