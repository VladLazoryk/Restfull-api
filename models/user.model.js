const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    nickName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    location: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    likesProducts: {
      type: Array,
      default: [],
    },
    products: {
      type: Array,
      default: [],
    },
    comments: {
      type: Array,
      default: [],
    },
    avatar: {
      type: String,
      default: null,
    },
    unreadMessages: {
      type: Array,
      default: [],
    },
    notifications: {
      type: Array,
      default: [],
    },
    unreadNotificationsNumber: {
      type: Number,
      default: 0,
    },
    payments: {
      type: Array,
      default: [],
    },
    followers: {
      type: Array,
      default: [],
    },
    blockedUsers: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;