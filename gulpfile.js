"use strict";

var gulp = require("gulp");
var plumber = require("gulp-plumber");
var purescript = require("gulp-purescript");

gulp.task("make", function() {
  return gulp.src(["batch/*/src/**/*.purs", "bower_components/purescript-*/src/**/*.purs"])
    .pipe(plumber())
    .pipe(purescript.pscMake());
});

gulp.task("default", ["make"]);
