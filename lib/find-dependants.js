"use strict";

var _ = require("lodash");
var toposort = require("toposort");

var search = function (initial, edges) {
  /*jshint loopfunc: true */
  var pending = [initial];
  var done = [];
  var result = [];
  while (pending.length > 0) {
    var item = pending.pop();
    done.push(item);
    edges.forEach(function(edge) {
      if (edge.to === item) {
        if (result.indexOf(edge.from) === -1) {
          result.push(edge.from);
          pending.push(edge.from);
        }
      }
    });
  }
  return result;
};

var makeEdge = function (from) {
  return function (k) {
    return { from: from, to: k };
  };
};

var makeEdges = function (bowerEntries) {
  return _.flatten(bowerEntries.map(function (bf) {
    var deps = Object.keys(bf.json.dependencies || {});
    var devDeps = Object.keys(bf.json.devDependencies || {});
    return deps.concat(devDeps).map(makeEdge(bf.name));
  }));
};

module.exports = function (bowerEntries, input) {
  var edges = makeEdges(bowerEntries);
  var deps = search(input, edges);
  return toposort(_.flatten(deps.map(function (dep) {
    return _.unique(edges
      .filter(function (edge) { return edge.from === dep; })
      .map(function (edge) { return edge.to; })
      .filter(function (related) { return deps.indexOf(related) !== -1; }))
      .map(function (rel) { return [rel, dep]; });
  }), true));
};
