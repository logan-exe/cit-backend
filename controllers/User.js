const dotenv = require("dotenv");
const { rawListeners } = require("../models/User");
dotenv.config();
const User = require("../models/User");
const mongoose = require("mongoose");
const Nft = require("../models/Nft");
const Activity = require("../models/Activity");

exports.checkUser = async (req, res, next) => {
  console.log(req.body, "insiide 1");
  const userExist = await User.find({
    wallet_address: `${req.body.walletAddress.toLowerCase()}`,
  });

  const newDate = new Date();
  if (userExist.length !== 0) {
    if (userExist[0].is_blocked) {
      res.json({
        message: "blocked",
      });
    } else {
      res.status(200).json({
        message: "success",
        walletAddress: userExist[0].wallet_address,
        profile_image: userExist[0].profile_image,
        username:
          userExist[0].user_name !== "" ? userExist[0].user_name : "unnamed",
      });
      return;
    }
  } else {
    let newUser = {
      _id: new mongoose.Types.ObjectId(),
      wallet_address: req.body.walletAddress.toLowerCase(),
      blockchain: "MATIC MAINNET",
      profile_name: "",
      bio: "",
      instagram: "",
      email: "",
      facebook: "",
      twitter: "",
      telegram: "",
      profile_image: "",
      following: [],
      followers: [],
      user_name: "",
      is_verified: false,
      profile_image: "",
      is_verified: false,
    };

    const createdUser = new User(newUser);
    const savedUser = await createdUser.save();

    res.status(201).json({
      message: "success",
      walletAddress: savedUser.wallet_address,
      profile_image: savedUser.profile_image,
      username: "unnamed",
    });

    return;
  }
};

exports.getUserData = async (req, res, next) => {
  console.log(req.body, "this is req body");

  const userExist = await User.find({
    wallet_address: `${req.body.walletAddress.toLowerCase()}`,
  })
    .populate("followers.follower_info", "wallet_address")
    .populate("following.following_info", "wallet_address")
    .exec()
    .then(async (myUser) => {
      if (!myUser) {
        res.status(200).json({
          message: "noinfo",
        });
      } else {
        const nftsOwned = await Nft.find({ created_by: myUser[0]._id })
          .populate(
            "owned_by",
            "wallet_address user_name profile_image is_verified"
          )
          .exec()
          .then(async (createdNfts) => {
            res.status(200).json({
              message: "success",
              user: myUser[0],
              nftsCreated: createdNfts,
            });
          });
      }
    });
};

exports.getOwnedNfts = async (req, res, next) => {
  console.log(req.body, "this is owned NFT");
  const OwnedNfts = Nft.find({ owned_by: req.body.userId })
    .populate("owned_by", "wallet_address user_name profile_image is_verified")
    .exec()
    .then(async (ownedNfts) => {
      res.status(200).json({
        message: "success",
        nftsOwned: ownedNfts,
      });
    })
    .catch((err) => {
      res.status(500).json({ message: "internal error" });
    });
};

exports.updateProfileImage = async (req, res, next) => {
  const oldUser = await User.find({
    wallet_address: `${req.body.walletAddress.toLowerCase()}`,
  });

  const updatedUser = await User.findOneAndUpdate(
    {
      wallet_address: `${req.body.walletAddress.toLowerCase()}`,
    },
    {
      profile_image: req.body.profileImage,
    },
    { new: false, useFindAndModify: false }
  );

  const newUser = await User.find({
    wallet_address: `${req.body.walletAddress.toLowerCase()}`,
  });
  res
    .status(200)
    .json({ message: "success", profile_image: newUser[0].profile_image });
};

exports.updateCoverImage = async (req, res, next) => {
  console.log(req.body);

  const oldUser = await User.find({
    wallet_address: `${req.body.walletAddress.toLowerCase()}`,
  });

  const updatedUser = await User.findOneAndUpdate(
    {
      wallet_address: `${req.body.walletAddress.toLowerCase()}`,
    },
    {
      cover_image: req.body.coverImage,
    },
    { new: false, useFindAndModify: false }
  );

  const newUser = await User.find({
    wallet_address: `${req.body.walletAddress.toLowerCase()}`,
  });
  res
    .status(200)
    .json({ message: "success", cover_image: newUser[0].cover_image });
};

exports.updateUserInfo = async (req, res, next) => {
  console.log(req.body, "this is req body");

  const oldUser = await User.find({
    wallet_address: `${req.body.walletAddress.toLowerCase()}`,
  });

  const checkUserName = await User.find({
    user_name: `${req.body.userName}`,
  });

  if (oldUser.length > 0 && oldUser[0].user_name !== req.body.userName) {
    if (checkUserName.length !== 0) {
      res.json({
        message: "username taken",
      });
      return;
    }
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      wallet_address: `${req.body.walletAddress.toLowerCase()}`,
    },
    {
      full_name: req.body.fullName,
      bio: req.body.bio,
      email: req.body.email,
      instagram: req.body.instagram,
      facebook: req.body.facebook,
      telegram: req.body.telegram,
      twitter: req.body.twitter,
      user_name: req.body.userName,
      phone: req.body.phone,
    },
    { new: false, useFindAndModify: false }
  );

  const newUser = await User.find({
    wallet_address: `${req.body.walletAddress.toLowerCase()}`,
  });

  res.status(200).json(newUser);
};

exports.createFollower = async (req, res, next) => {
  let newfollower = {
    follower_info: req.body.followerId,
  };

  let newFollowing = {
    following_info: req.body.followingId,
  };

  // const followerExist = await User.find({
  //   _id: req.body.followerId,
  //   "followers.followerInfo": req.body.followerId,
  // });

  // console.log(followerExist.followers.length, "this is follower Exist");

  // const followingExist = await User.find({
  //   _id: req.body.followerId,
  //   "following.followingInfo": req.body.followingId,
  // });
  // console.log("this is following Exist", followingExist);

  // if (followerExist.length !== 0 && followingExist.length !== 0) {
  //   res.status(500).json({
  //     message: "already exist",
  //   });

  //   return;
  // }

  const updatedFollower = await User.findOneAndUpdate(
    {
      _id: req.body.followingId,
    },
    {
      $push: { followers: newfollower },
    }
  );

  const updateFollowing = await User.findOneAndUpdate(
    {
      _id: req.body.followerId,
    },
    {
      $push: {
        following: newFollowing,
      },
    }
  );

  res.json({
    message: "success",
    data: updatedFollower,
  });
};

exports.getUserActivity = async (req, res) => {
  console.log("inside, user Activity", req.body);
  const fromActivity = await Activity.find({
    from: `${req.body.userId}`,
  });

  const toActivity = await Activity.find({ to: `${req.body.userId}` });

  res.json({
    message: "success",
    from: fromActivity,
    to: toActivity,
  });
};

exports.removeFollower = async (req, res) => {
  console.log(req.body);
  const followerRemove = await User.updateOne(
    {
      _id: req.body.followingId,
    },
    {
      $pull: {
        followers: {
          follower_info: req.body.followerId,
        },
      },
    },
    { new: false, useFindAndModify: false }
  );

  const followingRemove = await User.updateOne(
    { _id: req.body.followerId },
    {
      $pull: {
        following: {
          following_info: req.body.followingId,
        },
      },
    },
    { new: false, useFindAndModify: false }
  );

  res.json({
    message: "success",
  });
};
