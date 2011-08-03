var ping = require('./ping');
var dash = require('./dash');

var connection = 'mongo://157.55.174.56:10000/anodejs';

// start the ping cycle.
ping.start(connection);

// start the dashboard web server
dash.listen(process.argv[3], connection);