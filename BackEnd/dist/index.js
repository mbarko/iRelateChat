"use strict";

var dotenv = _interopRequireWildcard(require("dotenv"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _cors = _interopRequireDefault(require("cors"));

var _helmet = _interopRequireDefault(require("helmet"));

var _compression = _interopRequireDefault(require("compression"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

dotenv.config();
const api = (0, _express.default)();
api.use((0, _cors.default)());
api.use((0, _compression.default)());
api.use((0, _helmet.default)());
api.use(_bodyParser.default.urlencoded({
  extended: true
}));
api.use(_bodyParser.default.json());
api.listen(process.env.PORT, error => {
  if (error) {
    console.warn(error);
    process.exit(1);
  } // eslint-disable-next-line array-callback-return


  _fs.default.readdirSync(_path.default.join(__dirname, 'routes')).map(file => {
    require('./routes/' + file)(api);
  });

  console.info(`Running on port ${process.env.PORT} in ${process.env.NODE_ENV} mode. 🚀`);
});
module.exports = api;