const mongoose = require('mongoose');
const mongoURI = 'mongodb://localhost:27017/inotebook?readPreference=primary&appname=MongoDB%20Compass&ssl=false';

const connectToMongo = async () => {
  mongoose.connect(mongoURI, (err) => {
    console.log('Connected to Mongo Successfully');
    if (err) {
      console.log(err);
      process.exit(1);
    }
  });
};

module.exports = connectToMongo;
