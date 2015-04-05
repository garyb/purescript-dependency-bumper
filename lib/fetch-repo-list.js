"use strict";

var _ = require("lodash");
var Bluebird = require("bluebird");
var fs = Bluebird.promisifyAll(require("fs"));
var makeGithubRequest = require("./github-request");

var fetchRepoNames = function (url) {

  var handleResponse = function (accum, res, body) {
    var result = accum.concat(body);
    if (!res.headers.link) return result;

    var nextLink = res.headers.link.split(",")
      .map(function (link) { return link.split("; "); })
      .filter(function (link) { return link[1] === "rel=\"next\""; })
      .map(function (link) { return link[0]; })[0];

    if (nextLink) {
      var url = nextLink.slice(1, nextLink.length - 1);
      return makeGithubRequest(url).spread(handleResponse.bind(this, result));
    }

    return result;
  };

  return makeGithubRequest(url)
    .spread(handleResponse.bind(this, []))
    .map(function (item) { return item["full_name"]; });
};

module.exports = function (endpoints) {
  return fs.readFileAsync("cache/index.json")
    .then(JSON.parse)
    .catch(function () {
      console.log("Reading from cache failed, fetching repo list from GitHub...");
      return Bluebird.all(endpoints.map(fetchRepoNames)).then(_.flatten);
    })
    .then(function (allRepoNames) {
      return fs.writeFileAsync("cache/index.json", JSON.stringify(allRepoNames))
        .return(allRepoNames);
    });
};
