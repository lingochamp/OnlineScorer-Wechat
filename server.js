var express = require('express');
var app = express();
app.use(express.static(__dirname + '/dist'));

var server = app.listen(80, function() {
  var port = server.address().port;

  console.log("mock server started at http://localhost:" + port);
});
