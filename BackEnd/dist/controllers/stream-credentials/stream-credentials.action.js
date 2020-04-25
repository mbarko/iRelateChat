"use strict";

var _dotenv = _interopRequireDefault(require("dotenv"));

var _streamChat = require("stream-chat");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_dotenv.default.config();

exports.streamCredentials = async (req, res) => {
  try {
    const data = req.body;
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;
    const client = new _streamChat.StreamChat(apiKey, apiSecret);
    const user = Object.assign({}, data, {
      id: req.user.sender,
      role: 'admin',
      image: req.user.image,
      name: req.user.name,
      email: req.user.email
    });
    const token = client.createToken(user.id);
    await client.updateUsers([user]);
    res.status(200).json({
      user,
      token,
      apiKey
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message
    });
  }
};