const mongoose = require('mongoose');

// Plug in global ES6 promise constructor
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Now connected to database.')
});


module.exports = {mongoose};