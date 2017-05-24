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
        fsx.copySync(srcPath, destPath);
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

  function copySingleBowerFolder(srcPath, destDir) {
    fsx.ensureDirSync(destDir);
    var name = path.basename(srcPath);
    var destPath = path.join(destDir, name);
    srcPath = fs.realpathSync(srcPath);
    var meta = fs.lstatSync(srcPath);
    if (meta.isDirectory()) {
      fsx.ensureDirSync(destPath);
      handleBower(srcPath, destPath);
    }
  }

  function generateScssFile(outFile, filePaths, relativeTo) {
    fs.writeFileSync(outFile, '// Auto-generated file\n');
    _.each(filePaths, function (filePath) {
      if (relativeTo) {
        filePath = path.relative(relativeTo, filePath);
        filePath = filePath.replace(/\\/g, '/');
      }
      fs.appendFileSync(outFile, '@import "' + filePath + '";\n');
    });
  }

  function getMajorMinor(version) {
    var regex = /^(\d+\.)?(\d)/i;
    return version.match(regex)[0];
  }

  module.exports.getMajorMinor = getMajorMinor;
  module.exports.copyBowerFolder = copyBowerFolder;
  module.exports.copySingleBowerFolder = copySingleBowerFolder;
  module.exports.generateScssFile = generateScssFile;
})();
