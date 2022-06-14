const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const mongoConnect = (callback) => {
  mongoose
    .connect(
      process.env.MONGODB_URL || "",

      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then((res) => {
      callback(res);
    })
    .catch((err) => {
      console.log(err, "error this is incommming");
    });
};

module.exports = mongoConnect;
