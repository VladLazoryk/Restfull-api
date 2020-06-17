const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ message: "Request without authorization header" });
  else {
    try {
      const user = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (user.exp * 1000 < Date.now())
        return res.status(403).json({ error: "Token expired" });

      await User.findOneAndUpdate(
        { email: user.email },
        { lastLogin: Date.now() }
      );
      req.user = user;
      next();
    } catch (err) {
      const user = await jwt.decode(token);
      const refreshToken = await User.findOne({ email: user.email });
      if (refreshToken) {
        const dataToToken = {
          fullName: user.fullName,
          nickName: user.nickName,
          email: user.email,
          _id: user._id,
        };
        const accessToken = jwt.sign(
          dataToToken,
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "30min",
          }
        );
        req.headers["authorization"] = `Bearer ${accessToken}`;
        req.user = user;
        await User.findOneAndUpdate({ email }, { lastLogin: Date.now() });
        next();
      } else {
        console.error(err);
        return res.status(403).json(err);
      }
    }
  }
};