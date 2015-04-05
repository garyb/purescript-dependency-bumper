"use strict";

var Bluebird = require("bluebird");
var bower = require("bower");

exports.install = function (packageNames) {
  return new Bluebird(function (resolve, reject) {
    bower.commands
      .install(packageNames, { force: true })
      .on("end", function (result) { resolve(result); })
      .on("error", function (err) { reject(err); });
  });
};

exports.getPackageInfo = function (packageName) {
  return new Bluebird(function (resolve, reject) {
    bower.commands
      .info(packageName)
      .on("end", function (result) { resolve(result); })
      .on("error", function (err) { reject(err); });
  });
};

exports.getPackageRepo = function (packageName) {
  return new Bluebird(function (resolve, reject) {
    bower.commands
      .lookup(packageName)
      .on("end", function (result) { resolve(result.url); })
      .on("error", function (err) { reject(err); });
  });
};
