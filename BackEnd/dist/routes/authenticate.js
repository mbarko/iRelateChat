"use strict";

var _authenticate = require("../controllers/authenticate");

module.exports = api => {
  api.route("/authenticate").post(_authenticate.authenticate);
};