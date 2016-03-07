var hapi = require('hapi');
var job_queue = require('./job-queue');
var boom = require('boom');

var server = new hapi.Server();
server.connection({port: 3456});

server.route({
  method: 'POST',
  path: '/jobs',
  handler: function(req, reply) {
      job_queue.create(req.payload.url, function(err, resp) {
          reply({"YourJobId": resp});
      });
  }
});

server.route({
  method: 'GET',
  path: '/results/{job_id}',
  handler: function(req, reply) {
      job_queue.getStatus(req.params.job_id, function(err, resp) {
          if(resp === null) {
              return reply(boom.badRequest("The Job ID was never created"));
          } else if(err) {
              return reply(boom.badRequest(err));
          }
          reply(null, resp.content);
      });
  }
});

server.start();
