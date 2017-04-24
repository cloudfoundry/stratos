/* eslint-disable no-sync */
(function () {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var _ = require('lodash');
  var fsx = require('fs-extra');
  var minimatch = require('minimatch');
  var config = require('./gulp.config')();

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

  var filePathsToExclude;
  function updateWithPlugins(srcArray) {
    // All config (srcArray) collections will contain the file glops for ALL plugins. Here we eliminate those that
    // aren't required
    if (!filePathsToExclude) {
      filePathsToExclude = [];
      var pluginsDirs = getDirs(path.join(config.paths.src, 'plugins'));
      var pluginsToExclude = _.difference(pluginsDirs, config.plugins);
      _.forEach(pluginsToExclude, function (plugin) {
        filePathsToExclude.push('!./' + path.join(config.paths.dist, 'plugins', plugin, '**', '*'));
        filePathsToExclude.push('!./' + path.join(config.paths.src, 'plugins', plugin, '**', '*'));
      });
    }
    return srcArray.concat(filePathsToExclude);
  }

  function getDirs(srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
      return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
  }

  module.exports.copyBowerFolder = copyBowerFolder;
  module.exports.updateWithPlugins = updateWithPlugins;
  module.exports.getDirs = getDirs;
})();
