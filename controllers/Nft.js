const dotenv = require("dotenv");
dotenv.config();
const multer = require("multer");
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_KEY;
const Web3 = require("web3");
const fs = require("fs");
const ciqlJson = require("ciql-json");
const Nft = require("../models/Nft");
const User = require("../models/User");
const Activity = require("../models/Activity");
const FormData = require("form-data");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");

const web3 = new Web3(
  process.env.RPC_NODE ||
    "https://speedy-nodes-nyc.moralis.io/18c1510ef0713f1d42fffbb8/polygon/mainnet"
);

const HttpError = require("../models/http-error");
const { exec } = require("child_process");
const { log } = require("console");

/////////////////////////////////// FILE UPLOADER //////////////////////////////////

const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    cb(null, "IMAGE-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000000000000 },
}).single("myImage");

exports.uploadImage = async (req, res, err) => {
  let myPath;
  console.log("inside upload image");
  try {
    upload(req, res, (err) => {
      console.log("Request file ---", req.file);
      myPath = `./public/uploads/${req.file.filename}`;

      res.status(201).json(myPath);
    });
  } catch (err) {
    const error = new HttpError("Upload Rejected", 500);
    return next(error);
  }
};
/////////////////////////////////// FILE UPLOADER //////////////////////////////////

/*
TO PIN FILE TO IPFS AND GET FILE HASH
*/

const pinFileToIPFS = async (myFilePath) => {
  console.log("inside pine file to IPFS");
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  let data = new FormData();
  data.append("file", fs.createReadStream(myFilePath));
  const res = await axios
    .post(url, data, {
      maxContentLength: "Infinity",
      maxBodyLength: "Infinity",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })
    .catch((err) => console.log(err, "this is error"));

  return res.data.IpfsHash;
};

/*
TO PIN METADATA TO IPFS  AND GET FILE HASH
*/

const pinDataToIPFS = async () => {
  console.log("iniside Pine data to IPFS here DAta");
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  let data = new FormData();
  data.append("file", fs.createReadStream("./data.json"));
  const res = await axios.post(url, data, {
    maxContentLength: "Infinity",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
  });

  return res.data.IpfsHash;
};

exports.createMetaData = async (req, res, next) => {
  const imagePath = req.body.imagePath;
  const imageHash = await pinFileToIPFS(imagePath);

  console.log("inside create MetaData");

  ciqlJson
    .open("./data.json")
    .set("image", `https://ipfs.io/ipfs/${imageHash}`)
    .set("name", req.body.name)
    .set("by", req.body.creator)
    .set("description", req.body.description)
    .set("hash", imageHash)
    .set("cover", req.body.cover)
    .set("type", req.body.type)
    .save();

  const metaDataHash = await pinDataToIPFS();

  const metaDataURI = `https://ipfs.io/ipfs/${metaDataHash}`;

  fs.unlink(imagePath, (err) => {
    if (err) {
      console.log(err, "error");
      return;
    }
  });

  res.status(201).json({
    metaDataURI: metaDataURI,
    imageHash: imageHash,
  });
};

exports.saveNewNft = async (req, res, next) => {
  console.log(req.body);
  let creatorAddr = req.body.ownedBy;
  let currentDate = new Date();

  const newNft = {
    _id: new mongoose.Types.ObjectId(),
    token_id: req.body.tokenId,
    tx_hash: req.body.txHash,
    created_by: req.body.createdById,
    owned_by: req.body.ownedById,
    contract_address: req.body.contractAddress,
    trending: false,
    on_auction: req.body.onAuction,
    on_sale: req.body.onSale,
    initial_price: req.body.initialPrice,
    cover_image: req.body.coverImage,
    image_url: req.body.imageUrl,
    title: req.body.title,
    music: req.body.music,
    royalty: req.body.royalty,
    description: req.body.description,
    image_ipfs: req.body.imageIpfs,
    metadata_ipfs: req.body.metadaIpfs,
    date: currentDate.toString(),
    instant_sale: req.body.instantSale,
  };

  const nftExist = await Nft.find({
    token_id: `${req.body.tokenId}`,
  });

  if (nftExist.length !== 0) {
    res.json("user already exists!");
    return;
  }

  const createdNft = new Nft(newNft);
  const savedNft = await createdNft.save();

  console.log(savedNft, "this si saved nft");

  const newActivity = {
    _id: new mongoose.Types.ObjectId(),
    tx_type: "Minting Token",
    date: currentDate.toString(),
    from: req.body.ownedById,
    to: req.body.ownedById,
    amount: "nil",
    tx_hash: req.body.txHash,
    contract_address: req.body.contractAddress,
    token_id: savedNft._id,
  };

  const createdActivity = new Activity(newActivity);
  const savedActivity = await createdActivity.save();

  res.json({
    message: "success",
    tokenId: savedNft.token_id,
  });
};

exports.getTokenActivity = async (req, res, next) => {
  const nftActivity = await Activity.find({
    token_id: `${req.body.tokenId.toString()}`,
  })
    .populate("from", "wallet_address user_name profile_image is_verified")
    .populate("to", "wallet_address user_name profile_image is_verified")
    .exec()
    .then((nftActivity) => {
      res.json({
        message: "success",
        nftActivity: nftActivity,
      });
    })
    .catch((Err) => {
      const error = new HttpError("NFT Not found", 404);
      return next(error);
    });
};

exports.tokenLike = async (req, res, next) => {
  console.log(req.body);
  const user = await User.find({
    wallet_address: `${req.body.walletAddress.toLowerCase()}`,
  });

  const userId = user[0]._id;

  if (!req.body.like) {
    console.log("iniside here");
    const addLike = await Nft.findOneAndUpdate(
      {
        token_id: `${req.body.tokenId.toString()}`,
      },

      {
        $pull: { likes: { liked_user: userId } },
      }
    );
  } else {
    console.log("iniside here 1");
    const addLike = await Nft.findOneAndUpdate(
      {
        token_id: `${req.body.tokenId.toString()}`,
      },

      {
        $push: { likes: { liked_user: userId } },
      }
    );
  }

  res.json({ message: "success" });
};

exports.getTokenInfo = async (req, res, next) => {
  console.log(req.body, " hello hi");
  const nftExist = await Nft.find({
    token_id: `${req.body.tokenId.toString()}`,
  })
    .populate(
      "created_by",
      "wallet_address user_name profile_image is_verified"
    )
    .populate("owned_by", "wallet_address user_name profile_image is_verified")
    .populate("likes.liked_user", "wallet_address")
    .exec()
    .then((nft) => {
      if (!nft) {
        const error = new HttpError("NFT Not found", 404);
        return next(error);
      } else {
        res.status(200).json({
          message: "success",
          nftInfo: nft,
        });
      }
    });
};

exports.getNfts = async (req, res) => {
  console.log(req.body);
  const Nfts = await Nft.find().sort({ _id: -1 }).limit(8);

  res.status(200).json({
    message: "success",
    data: Nfts,
  });
};

exports.transferToken = async (req, res) => {
  console.log(req.body);
  const fromUser = await User.find({
    wallet_address: `${req.body.from.toLowerCase()}`,
  });

  const toUser = await User.find({
    wallet_address: `${req.body.to.toLowerCase()}`,
  });

  let currentDate = new Date();

  const newActivity = {
    _id: new mongoose.Types.ObjectId(),
    tx_type: "Token Transfer",
    date: currentDate.toString(),
    from: fromUser[0]._id,
    to: toUser[0]._id,
    amount: "nil",
    token_id: req.body.tokenObjectId,
    contract_address: req.body.contractAddress,
    tx_hash: req.body.txHash,
  };

  const createdActivity = new Activity(newActivity);
  const savedActivity = await createdActivity.save();

  const updateNft = await Nft.findOneAndUpdate(
    {
      token_id: `${req.body.tokenId}`,
    },
    {
      owned_by: toUser[0]._id,
      on_sale: false,
      on_auction: false,
      initial_price: "",
    },
    { new: false, useFindAndModify: false }
  );

  res.status(200).json({
    message: "success",
  });
};

exports.purchaseToken = async (req, res, next) => {
  console.log(req.body);
  const fromUser = await User.find({
    wallet_address: `${req.body.from.toLowerCase()}`,
  });

  const toUser = await User.find({
    wallet_address: `${req.body.to.toLowerCase()}`,
  });

  let currentDate = new Date();

  const newActivity = {
    _id: new mongoose.Types.ObjectId(),
    tx_type: "Token Purchase",
    date: currentDate.toString(),
    from: fromUser[0]._id,
    to: toUser[0]._id,
    amount: req.body.amount,
    token_id: req.body.tokenObjectId,
    contract_address: req.body.contractAddress,
    tx_hash: req.body.txHash,
  };

  const createdActivity = new Activity(newActivity);
  const savedActivity = await createdActivity.save();

  const updateNft = await Nft.findOneAndUpdate(
    {
      token_id: `${req.body.tokenId}`,
    },
    {
      owned_by: toUser[0]._id,
      on_sale: false,
      on_auction: false,
      initial_price: "",
    },
    { new: false, useFindAndModify: false }
  );

  res.status(200).json({
    message: "success",
  });
};

exports.startSale = async (req, res, next) => {
  console.log(req.body, " hello hi");
  const nftExist = await Nft.find({
    token_id: `${req.body.tokenId.toString()}`,
  });

  if (nftExist.length !== 0) {
    const updateSale = await Nft.findOneAndUpdate(
      {
        token_id: `${req.body.tokenId.toString()}`,
      },

      {
        on_sale: req.body.onSale,
        initial_price: req.body.initialPrice,
        instant_sale: req.body.instantSale,
      }
    );
  }

  res.json({
    message: "success",
  });
};

exports.stopSale = async (req, res, next) => {
  console.log(req.body, " hello hi");
  const nftExist = await Nft.find({
    token_id: `${req.body.tokenId.toString()}`,
  });

  if (nftExist.length !== 0) {
    const updateSale = await Nft.findOneAndUpdate(
      {
        token_id: `${req.body.tokenId.toString()}`,
      },

      {
        on_sale: false,
        initial_price: "",
        instant_sale: false,
      }
    );
  }

  res.json({
    message: "success",
  });
};
