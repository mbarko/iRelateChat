"use strict";

var _controllers = require("../utils/controllers");

var _authenticate = require("../controllers/authenticate/authenticate.action");

var _AuthManagement = require("../controllers/Auth-Management");

module.exports = api => {
  api.route("/Auth0Manager-action").post(_authenticate.requireAuthHeader, (0, _controllers.wrapAsync)(_AuthManagement.getUser));
};