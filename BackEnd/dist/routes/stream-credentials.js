"use strict";

var _controllers = require("../utils/controllers");

var _authenticate = require("../controllers/authenticate/authenticate.action");

var _streamCredentials = require("../controllers/stream-credentials");

module.exports = api => {
  api.route("/stream-credentials").post(_authenticate.requireAuthHeader, (0, _controllers.wrapAsync)(_streamCredentials.streamCredentials));
};