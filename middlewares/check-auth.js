const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
var Web3 = require("web3");
var web3 = new Web3();
const Ethers = require("ethers");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  console.log(req.body, "this is req body");
  try {
    const token = req.headers.authorization.split(" ")[1]; //Authorization: "Bearer Token"
    if (!token) {
      const error = new HttpError("Authentication failed!", 401);
      return next(error);
    }

    const decodedToken = Ethers.utils.verifyMessage(
      "Hello signing message",
      token
    );

    if (!(decodedToken.toLocaleLowerCase() === req.body.walletAddress)) {
      const error = new HttpError("Authentication failed!", 401);
      return next(error);
    }

    // console.log(decodedToken, "decodedToken");
    next();
  } catch (err) {
    const error = new HttpError("Authentication failed!", 401);
    return next(error);
  }
};
