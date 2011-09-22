var ping = require('./ping');
var api = require('./api');


var connection = 'mongo://157.55.174.56:10000/anodejs';

// start the ping cycle.
//the mongo connection is no longer valid so we are stopping ping
//ping.start(connection);

// start the dashboard web server
api.listen(process.argv[3], connection);