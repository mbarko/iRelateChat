"use strict";

var _hook = require("../controllers/hook");

module.exports = api => {
  api.route("/hook").post(_hook.sendMail);
};