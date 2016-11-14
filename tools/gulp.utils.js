/* eslint-disable no-sync */
(function () {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var _ = require('lodash');
  var fsx = require('fs-extra');
  var minimatch = require('minimatch');

  function handleBower(srcDir, destDir) {
    var bowerFile = path.join(srcDir, 'bower.json');
    var ignore = [];
    if (fs.existsSync(bowerFile)) {
      var bowerJson = require(bowerFile);
      _.each(bowerJson.ignore, function (s) {
        ignore.push('!' + s);
      });
    }
    var files = fs.readdirSync(srcDir);
    _.each(files, function (f) {
      var srcPath = path.join(srcDir, f);
      var destPath = path.join(destDir, f);

      var shouldCopy = true;
      _.each(ignore, function (ignoreGlob) {
        shouldCopy = shouldCopy && minimatch(f, ignoreGlob);
      });
      if (shouldCopy) {
        fsx.copy(srcPath, destPath);
      }
    });
  }

  function copyBowerFolder(srcDir, destDir) {
    fsx.ensureDirSync(destDir);
    var files = fs.readdirSync(srcDir);
    _.each(files, function (f) {
      var srcPath = path.join(srcDir, f);
      var destPath = path.join(destDir, f);
      srcPath = fs.realpathSync(srcPath);
      var meta = fs.lstatSync(srcPath);
      if (meta.isDirectory()) {
        fsx.ensureDirSync(destPath);
        handleBower(srcPath, destPath);
      }
    });
  }

  module.exports.copyBowerFolder = copyBowerFolder;
})();
