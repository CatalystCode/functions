var azure = require('azure-storage');
var fs = require('fs');
var csv = require('csv');
module.exports = function (context, jobDescription) {
    try {
        var model_group = jobDescription.model_query.model_group;
        var model_name = jobDescription.model_query.model_name;
        var blob_path = model_group + '/' + model_name;
        context.log("target model: " + blob_path);

        var interval = parseInt(jobDescription.model_query.model_interval);
        var meantemp = parseFloat(jobDescription.model_query.model_arguments.meantemp);
        var rainsum = parseFloat(jobDescription.model_query.model_arguments.rainsum);
        context.log("arguments: " + interval + ", " + meantemp + ", " + rainsum);    

        var blobSvc = azure.createBlobService();
        var outbreak_probability = 0.0;
        blobSvc.getBlobToText('models', blob_path, function (error, result, response) {
            if (!error) {
                context.log("parse csv file");
                csv.parse(result, function (err, output) {
                    if (!err) {
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
                        var errMsg = "couldn't find interval " + interval;
                        context.log.error(errMsg);
                        context.done(errMsg);
                    }
                    else {
                        context.log.error(err);
                        context.done(err);
                    }
                });
            } else {
                context.log.error(error);
                context.done(error);
            }
        });
    }
    catch (ex) {
        context.log.error(ex.message);
        context.done(ex.message);       
    }
};