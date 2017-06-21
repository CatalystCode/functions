var azure = require('azure-storage');
var fs = require('fs');
var csv = require('csv');
module.exports = function (context, jobDescription) {
    var model_group = jobDescription.model_query.model_group;
    var model_name = jobDescription.model_query.model_name;
    var blob_path = model_group + '/' + model_name;

    var interval = parseInt(jobDescription.model_query.interval);
    var meantemp = parseFloat(jobDescription.model_query.model_arguments.meantemp);
    var rainsum = parseFloat(jobDescription.model_query.model_arguments.rainsum);
    var blobSvc = azure.createBlobService();
    var outbreak_probability = 0.0;
    blobSvc.getBlobToText('models', blob_path, function (error, result, response) {
        if (!error) {
            csv.parse(result, function (err, output) {
                for (var index = 1; index < output.length; index++) {
                    var sample = output[index];
                    if (parseInt(sample[1]) === interval) {
                        var eT = Math.exp(parseFloat(sample[2]) + parseFloat(sample[3]) * meantemp + parseFloat(sample[4]) * rainsum);
                        outbreak_probability = eT / (1 + eT);
                        context.log('outbreak_prob' + outbreak_probability.toString());
                        context.bindings.tableBinding = [];
                        context.bindings.tableBinding.push({
                            PartitionKey: interval,
                            RowKey: model_group + '_' + model_name,
                            Arguments: { rainsum: rainsum, meantemp: meantemp },
                            Prediction: outbreak_probability
                        });
                        context.log("done");
                        context.done();
                    }
                }
            });
        } else {
            context.log(error);
            context.done();
        }
    });
};