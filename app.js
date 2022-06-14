const dotenv = require("dotenv");
dotenv.config();
var express = require("express");
const app = express();
const bodyParser = require("body-parser");
var uniqid = require("uniqid");
var cors = require("cors");
const path = require("path");
const multer = require("multer");
const restrictMiddleWare = require("./middlewares/check-auth");

const userRoutes = require("./routes/userRoutes");
const nftRoutes = require("./routes/nftRoutes");
const testRoutes = require("./routes/testRoutes");

const mongoConnect = require("./util/database");
const User = require("./models/User");
const Nft = require("./models/Nft");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//sdf
// var whitelist = ["https://brute-nft.web.app/", "http://localhost:3000"];
// var corsOptions = {
//   origin: function (origin, callback) {
//     /////////********** Production - (whitelist.indexOf(origin) !== -1 && origin)**************////////
//     if (whitelist.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
// };

// app.use(cors(corsOptions));

app.use(cors());

app.use(userRoutes);
// app.use(restrictMiddleWare);
app.use(nftRoutes);
app.use(testRoutes);

app.get("/", (req, res) => {
  res.send("Hello world! Welcome to CIT");
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoConnect((res) => {
  console.log("connection successfull!!!");
  app.listen(process.env.PORT || 5000);
});
