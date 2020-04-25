"use strict";

var _authenticate = require("../controllers/authenticate/authenticate.action");

var _controllers = require("../utils/controllers");

var _virgilCredentials = require("../controllers/virgil-credentials");

module.exports = api => {
  api.route("/virgil-credentials").post(_authenticate.requireAuthHeader, (0, _controllers.wrapAsync)(_virgilCredentials.virgilCredentials));
};