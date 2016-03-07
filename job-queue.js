var kue = require('kue');
var mongoClient = require('mongodb').MongoClient,
    mongoUrl = 'mongodb://127.0.0.1:27017/jobs',
    request = require('request'),
    async = require('async'),
    jobs = kue.createQueue(),
    Job = kue.Job,
    process = (function runJobs() {
                processJobs();
    })();

// Process the queue of jobs
function processJobs () {
    jobs.process('url_jobs', function(job, cb) {
        fetchHTMLAndStore(job.data.URL, job.id, function(fetchError, resp) {
            if(fetchError) return cb(new Error('Job with jobId' + job.id + ' could not be processed'));
            // Job is removed from the queue after it has been processed
            job.remove(function(err){
                if (err) console.log("Job was processed but could not be removed from the queue");
                console.log('Job removed ', job.id);
                return cb()
            });
        });
    });
}

// Insert the jobId and html content as an object into mongoDB
function insertContent(params, cb) {
    var database = params.db;
    database.collection('jobs').insertOne({
        "_id": params.id,
        "content": params.content
    },function(err, result) {
        if(err) {
            return cb(err);
        }
        cb(err, result);
    });
}

// Make a request to the url provided by the user and store content in mongoDB
function fetchHTMLAndStore (url, jobId, cb) {
    request('http://'+url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if(err) {
                    return cb(err);
                }
                insertContent({
                    content: body,
                    id: jobId,
                    db: db
                }, function(err, resp) {
                    db.close();
                    return cb(err, jobId);
                });
            });
        }
        cb(error);
    });
}

//create a new job and add to the queue
function createNewJob (url, cb) {
    var job_id
    var current_job = jobs.create('url_jobs', {
        URL: url
    }).save(function(err) {
        if(err) return cb(err);
        return cb(err, current_job.id);
    });
}

//Fetch the HTML content associated with a jobID
function fetchJobResult(jobId, cb) {
    mongoClient.connect(mongoUrl, function(mongoConnectError, db) {
        if(mongoConnectError) {
            return cb(mongoConnectError);
        }
        db.collection('jobs', function(collectionError, collection) {
            if(collectionError) {
                return cb(collectionError);
            }
            collection.findOne({"_id":jobId}, function(findError, document) {
                if(findError) {
                    console.log("Error while trying to retrieve document" + findError.message);
                    return cb(findError);
                }
                console.log('document', document);
                db.close();
                cb(null, document);
            });
        });
    });
}

//Get job status of a queued job and fetch the html content if it has already been processed
function getJobStatus(jobId, cb) {

    //First search Mongodb to check if the jobID has been processed and the html content exists
    fetchJobResult(jobId, function(fetchJobError, resp) {
        //If fetch from mongoDB failed, it must be in the job Queue waiting to be processed
        if(resp === null) {
            Job.get(jobId, function(err, job){
                if(job) {
                    return cb(null, "Still processing");
                }
            });
        }
        return cb(null, resp);
    });
}

module.exports = {
    create: createNewJob,
    getStatus: getJobStatus
};
