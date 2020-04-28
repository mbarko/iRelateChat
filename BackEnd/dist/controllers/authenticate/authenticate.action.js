"use strict";

var _dotenv = _interopRequireDefault(require("dotenv"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_dotenv.default.config();

const crypto = require('crypto');

const CryptoJS = require("crypto-js");

const usersStorage = new Map();

const generateUserToken = () => crypto.randomBytes(32).toString('base64');

const pseudoEncodeToken = (sender, token) => usersStorage.set(token, sender);

const pseudoDecodeToken = token => usersStorage.get(token);

const pseudoVerifyToken = token => usersStorage.has(token);

exports.requireAuthHeader = (req, res, next) => {
  // 'Check if request is authorized with token from POST /authorize'
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.statusMessage = "No Authorization header";
    res.status(401).send('Unauthorized');
    return;
  }

  const userToken = req.headers.authorization.split('Bearer ')[1];
  if (!pseudoVerifyToken(userToken)) res.status(401).send('Unauthorized');

  if (!req.body || !req.body.data) {
    // send to virigile only user id to authenticate
    req.user = {
      sender: pseudoDecodeToken(userToken)
    };
  } else {
    // add to stream user his data from auth0 account
    req.user = {
      sender: pseudoDecodeToken(userToken),
      name: req.body.data.name,
      image: req.body.data.image,
      email: req.body.data.email
    }; // remove data from the body to prevent dublication

    req.body.data = {};
  }

  next();
};

exports.authenticate = async (req, res) => {
  try {
    if (!req.body || !req.body.sender) {
      res.statusMessage = 'You should specify sender in body';
      res.status(400).end();
      return;
    }

    const key = process.env.encryptionKey;
    var sender = CryptoJS.AES.decrypt(req.body.sender, key);
    sender = sender.toString(CryptoJS.enc.Utf8);
    const token = generateUserToken();
    pseudoEncodeToken(sender, token);
    res.json({
      authToken: token
    });
  } catch (err) {
    res.statusMessage = 'You should specify sender in body';
    res.status(400).end();
    return;
  }
};