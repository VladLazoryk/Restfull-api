const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const productsRouter = require("./routes/product");
const usersRouter = require("./routes/user");
require("dotenv").config();
const multer = require("multer");
const db = require('./core/db');

const {controllers} = require ('./routes')
const {productsValidation} = require('./utils/validations')

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


app.use("/user", usersRouter);
app.use("/product", productsRouter);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".jpg" || ext !== ".png") {
      return cb(res.status(400).end("only jpg, png are allowed"), false);
    }
    cb(null, true);
  },
});
const upload = multer({ storage }).single("file");

app.post("/uploadImage", async (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.json({ success: false, err });
    }
    return res.json({
      success: true,
      image: res.req.file.path,
      fileName: res.req.file.filename,
    });
  });
});


app.listen(6666, function(err) {
  if (err) {
    return console.log(err);
  }
  console.log('Server runned!');
});
