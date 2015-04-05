"use strict";

var Bluebird = require("bluebird");
var fs = Bluebird.promisifyAll(require("fs"));

var predDirExists = function (err) {
  return err.code === "EEXIST";
};

module.exports = function (dir) {
  return fs.mkdirAsync(dir)
    .catch(predDirExists, function () { return dir; })
    .return(dir);
};
