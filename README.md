# Job_Queue
A REST Api that allows users to add jobs and check status of the jobs.
The Job queue is implemented using the kue module.
Users can add a job (Fetch html of a url page). Once the job is created, Users are provided with a job ID.
The Jobs are processed and the results are stored in MongoDB and retrieved when the user requests for status of a jobID.
##Routes supported by the API:
### POST /jobs 
    $ curl -H "Content-Type: application/json" -X POST -d \
        '{
            "url": "www.google.com"
         }' http://localhost:3456/jobs
    
    {"YourJobId":<JobID>}
### GET /results/{jobID}
    $ curl -H "Content-Type: application/json" -X GET http://localhost:3456/results/{jobID}
    {<The HTML content you requested for>}

