"use strict";

var Bluebird = require("bluebird");
var fs = Bluebird.promisifyAll(require("fs"));
var rimraf = Bluebird.promisify(require("rimraf"));
var fetchRepoList = require("./lib/fetch-repo-list");
var tryMkdir = require("./lib/try-mkdir");
var request = Bluebird.promisify(require("request"));
var findDependants = require("./lib/find-dependants");
var _ = require("lodash");
var bower = require("./lib/bower");
var git = require("./lib/git");

var input = "purescript-arrays";

var orgs = [
  "purescript",
  "purescript-contrib"
];

var excludes = [
  "purescript/purescript-in-purescript",
  "purescript-contrib/purescript-trampoline",
  "purescript-contrib/purescript-streams",
  "purescript-contrib/purescript-task",
  "purescript-contrib/purescript-yoneda",

  "purescript-contrib/purescript-machines",
  "purescript-contrib/purescript-argonaut",
  "purescript-contrib/purescript-strongcheck",
  "purescript-contrib/purescript-base",
  "purescript-contrib/purescript-angular",
  "purescript-contrib/purescript-channels"
];

var fetchBowerFile = function (name) {
  var shortName = name.substring(name.lastIndexOf("/") + 1);
  return fs.readFileAsync("cache/" + name + ".json")
    .then(JSON.parse)
    .catch(function () {
      console.log("Downloading bower file for " + name);
      return request("https://raw.github.com/" + name + "/master/bower.json", { json: true })
        .spread(function (res, body) {
          var json = JSON.stringify(body);
          return fs.writeFileAsync("cache/" + name + ".json", json).return(body);
        });
    })
    .then(function (data) {
      return { name: shortName, json: data };
    });
};

var getDependencies = function (bowerEntries, name) {
  var entry = _.findWhere(bowerEntries, { name: name });
  return Object.keys(entry.json.dependencies || {})
    .concat(Object.keys(entry.json.devDependencies || {}));
};

var checkout = function (name) {
  return bower.getPackageRepo(name)
    .then(git.checkout);
};

tryMkdir("cache")
  .then(function () {
    return Bluebird.all(orgs.map(function (org) {
      return tryMkdir("cache/" + org);
    }));
  })
  .then(function () { return rimraf("batch"); })
  .then(function () { return rimraf("bower_components"); })
  .delay(500)
  .then(function () { return tryMkdir("batch"); })
  .then(function () {
    return fetchRepoList(orgs.map(function (org) {
      return "https://api.github.com/orgs/" + org + "/repos";
    }));
  })
  .filter(function (repoName) {
    var offset = repoName.lastIndexOf("/") + 1;
    return repoName.indexOf("purescript-", offset) === offset &&
      excludes.indexOf(repoName) === -1;
  })
  .then(function (repoNames) {
    return Bluebird.all(repoNames.map(fetchBowerFile));
  })
  .filter(function (bowerEntry) {
    return bowerEntry.json !== "Not Found";
  })
  .each(function (bowerEntry) {
    if (bowerEntry.name !== bowerEntry.json.name) {
      console.log("WARNING: Bower file name doesn't match repo name", bowerEntry);
    }
  })
  .then(function (bowerEntries) {
    var dependants = findDependants(bowerEntries, input);
    if (dependants.length === 0) {
      throw new Error("Library has no dependants, aborting");
    }
    console.log("Dependants of " + input + ":");
    console.log("  " + dependants.join("\n  "));
    var bowerDependencies = _.chain(dependants)
      .map(_.partial(getDependencies, bowerEntries))
      .flatten().unique().value();
    console.log("Bower dependencies for dependants:");
    console.log("  " + bowerDependencies.join("\n  "));
    return bower.install(bowerDependencies)
        .return([dependants, bowerEntries]);
  })
  .spread(function (dependants, bowerEntries) {
    process.chdir("batch");
    return Bluebird.all(dependants.map(checkout));
    /*Bluebird.map(bowerDependencies, function (dep) {
      console.log("Installing " + dep + " with Bower...");
      return bower.install([dep]);
    }, { concurrency: 1 });*/
  })
  .catch(function (err) {
    if (err.code === "ECONFLICT") {
      err.picks.forEach(function (pick) {
        console.log("!!", pick.endpoint.name + pick.endpoint.target);
        pick.dependants.forEach(function (pick) {
            console.log("  << ", pick.endpoint.name + pick.endpoint.target);
        });
      });
    }
    return Bluebird.reject(err);
  });

