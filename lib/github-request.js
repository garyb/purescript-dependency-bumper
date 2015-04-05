"use strict";

var Bluebird = require("bluebird");
var request = Bluebird.promisify(require("request"));

module.exports = function (url, accessToken) {
  return request({
    url: url,
    qs: { "access_token": accessToken },
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "PureScript dependency graph builder"
    },
    json: true
  });
};
