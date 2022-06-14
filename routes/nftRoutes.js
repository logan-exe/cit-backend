var express = require("express");
var router = express.Router();

const nftController = require("../controllers/Nft");

router.post("/upload", nftController.uploadImage);
router.post("/create_meta_data", nftController.createMetaData);

router.post("/save_new_nft", nftController.saveNewNft);

router.post("/get_nft_info", nftController.getTokenInfo);

router.post("/get_nft_activity", nftController.getTokenActivity);

router.post("/add_token_like", nftController.tokenLike);

router.post("/transfer_nft", nftController.transferToken);

router.post("/purchase_nft", nftController.purchaseToken);

router.post("/start_sale", nftController.startSale);

router.post("/stop_Sale", nftController.stopSale);

router.post("/get_nfts", nftController.getNfts);

module.exports = router;
