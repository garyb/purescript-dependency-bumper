"use strict";

var Git = require("nodegit");

exports.checkout = function (url) {
  console.log("Cloning", url);
  var name = url.split("/").pop();
  if (name.substring(name.length - 4) === ".git") name = name.substring(0, name.length - 4);
  return Git.Clone(url, name);
};
