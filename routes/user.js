const router = require("express").Router();
const User = require("../models/user.model");
const Product = require("../models/product.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middleware/auth");

// LOGIN
router.route("/login").post(async (req, res) => {
  const { email, password, remember } = req.body;
  try {
    const userWithSameEmail = await User.findOne({ email });
    if (!userWithSameEmail)
      return res
        .status(404)
        .json({ general: "User with that email does not exist" });
    const auth = await bcrypt.compare(password, userWithSameEmail.password);
    if (!auth) return res.status(404).json({ general: "Wrong credentials" });

    const dataToToken = {
      fullName: userWithSameEmail.fullName,
      nickName: userWithSameEmail.nickName,
      email: userWithSameEmail.email,
      _id: userWithSameEmail._id,
    };

    const refreshToken = jwt.sign(dataToToken, process.env.ACCESS_TOKEN_SECRET);

    if (remember) {
      await User.findOneAndUpdate({ email }, { refreshToken });
      dataToToken.refreshToken = refreshToken;
    } else await User.findOneAndUpdate({ email }, { refreshToken: null });

    const accessToken = jwt.sign(dataToToken, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30min",
    });

    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// SIGN UP
router.route("/signup").post(async (req, res) => {
  const { fullName, nickName, email, location, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      fullName,
      nickName,
      email,
      location,
      password: hashedPassword,
    };
    const newUser = new User(userData);
    const addedUser = await newUser.save();
    return res.status(201).json(addedUser);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const keyPattern = Object.keys(err.keyPattern)[0];
      return res
        .status(400)
        .json({ general: `Provided ${keyPattern} is taken` });
    }
    return res.status(500).json(err);
  }
});

// LOGOUT
router.route("/logout").post(async (req, res) => {
  const { email } = req.body.email;
  try {
    await User.findOneAndUpdate({ email }, { refreshToken: null });
    return res.status(200).json({ message: "Refresh token deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET LOGGED USER DATA
router.route("/").get(authenticateToken, async (req, res) => {
  const { email } = req.user;
  try {
    const user = await User.findOne(
      { email },
      {
        fullName: 1,
        nickName: 1,
        email: 1,
        location: 1,
        likesProducts: 1,
        products: 1,
        comments: 1,
        avatar: 1,
        lastLogin: 1,
        unreadMessages: 1,
        following: 1,
        followers: 1,
      }
    );
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// CREATE REFRESH TOKEN
router.route("/token").post(async (req, res) => {
  const decodedToken = req.body.decodedToken;
  const email = decodedToken.email;
  const refreshTokenLocalStorage = decodedToken.refreshToken;
  try {
    const userWithThatEmail = await User.findOne({ email });
    if (refreshTokenLocalStorage === userWithThatEmail.refreshToken) {
      // create new token
      const newToken = jwt.sign(
        {
          fullName: decodedToken.fullName,
          email: decodedToken.email,
          nickName: decodedToken.nickName,
          refreshToken: decodedToken.refreshToken,
          _id: decodedToken._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "30min",
        }
      );
      return res.status(200).json({ newToken });
    } else {

      
      // LOGOUT
      await User.findOneAndUpdate({ email }, { refreshToken: null });
      return res.status(401).json({ error: "It is not your token,logout" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET USER DATA
router.route("/:nickName").get(async (req, res) => {
  const { nickName } = req.params;
  try {
    const userData = await User.findOne(
      { nickName },
      {
        fullName: 1,
        nickName: 1,
        email: 1,
        location: 1,
        likesProducts: 1,
        products: 1,
        avatar: 1,
        lastLogin: 1,
        createdAt: 1,
      }
    );
    return res.status(200).json(userData);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// SEARCH USERS NICKNAME
router.route("/search/:nickName").get(async (req, res) => {
  const { nickName } = req.params;
  try {
    const nickNameList = await User.find(
      { nickName: { $regex: ".*" + nickName + ".*" } },
      { nickName: 1 }
    ).limit(10);
    return res.status(200).json(nickNameList);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// UPDATE USER INFO
router.route("/update_info").post(authenticateToken, async (req, res) => {
  const data = req.body;
  const { email } = req.user;
  try {
    const user = await User.findOneAndUpdate({ email }, data);
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// CHANGE PASSWORD
router.route("/password").post(authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { email } = req.user;
  try {
    const { password: presentPassword } = await User.findOne({ email });
    const auth = await bcrypt.compare(oldPassword, presentPassword);
    if (auth) {
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findOneAndUpdate({ email }, { password: newHashedPassword });
      return res
        .status(200)
        .json({ password: "Password changed successfully" });
    } else {
      return res.status(403).json({ password: "Old password does not match" });
    }
  } catch (err) {
    console.error(err);
  }
});



// GET LOGGED USER FOLLOWERS
router.route("/followers").post(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  try {
    const { followers: followersIds } = await User.findById(_id);
    const followers = await User.find(
      { _id: followersIds },
      { nickName: 1, avatar: 1, fullName: 1 }
    );
    return res.status(200).json(followers);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET LOGGED USER FOLLOWING
router.route("/following").post(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  try {
    const { following: followingIds } = await User.findById(_id);
    const following = await User.find(
      { _id: followingIds },
      { avatar: 1, nickName: 1, fullName: 1 }
    );
    return res.status(200).json(following);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// BLOCK USER
router.route("/:user_id/block").put(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  const { user_id: userToBlock_id } = req.params;
  try {
    const { followers, blockedUsers, following } = await User.findById(_id);
    const refreshFollowers = followers.filter(
      (follower) => follower != userToBlock_id.toString()
    );
    const refreshBlockedUsers = [userToBlock_id, ...blockedUsers];
    const refreshFollowing = following.filter(
      (follow) => follow != userToBlock_id.toString()
    );
    await User.findByIdAndUpdate(_id, {
      followers: refreshFollowers,
      blockedUsers: refreshBlockedUsers,
      following: refreshFollowing,
    });
    //
    const {
      following: blockedFollowing,
      blockedBy,
      followers: blockedFollowers,
    } = await User.findById(userToBlock_id);
    const refreshBlockedFollowing = blockedFollowing.filter(
      (following) => following != _id.toString()
    );
    const refreshBlockedBy = [_id, ...blockedBy];
    const refreshBlockedFollowers = blockedFollowers.filter(
      (follower) => follower != _id.toString()
    );
    await User.findByIdAndUpdate(userToBlock_id, {
      following: refreshBlockedFollowing,
      blockedBy: refreshBlockedBy,
      followers: refreshBlockedFollowers,
    });
    return res.status(200).json({ refreshFollowers, refreshFollowing });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
// GET BLOCKED USER
router.route("/blockedUsers").post(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  try {
    const { blockedUsers: blockedUsersIds } = await User.findById(_id);
    const blockedUsers = await User.find(
      { _id: blockedUsersIds },
      { nickName: 1, avatar: 1, fullName: 1 }
    );
    return res.status(200).json(blockedUsers);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
// UNBLOCK USER
router.route("/:user_id/unblock").put(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  const { user_id: userToUnblock_id } = req.params;
  try {
    const { blockedUsers } = await User.findById(_id);
    const refreshBlockedUsers = blockedUsers.filter(
      (blockedUser) => blockedUser != userToUnblock_id.toString()
    );
    const { blockedBy } = await User.findById(userToUnblock_id);
    const refreshBlockedBy = blockedBy.filter((user) => user != _id.toString());
    await User.findByIdAndUpdate(_id, { blockedUsers: refreshBlockedUsers });
    await User.findByIdAndUpdate(userToUnblock_id, {
      blockedBy: refreshBlockedBy,
    });
    return res.status(200).json(userToUnblock_id);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;