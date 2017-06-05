(function () {
  'use strict';

  var mktemp = require('mktemp');
  var fs = require('fs-extra');
  var path = require('path');
  var gulp = require('gulp');
  var Q = require('q');
  var _ = require('lodash');
  var conf = require('./bk-conf');
  var buildUtils = require('./bk-build-utils');

  var tempPath, tempSrcPath;
  var fsEnsureDirQ = Q.denodeify(fs.ensureDir);
  var fsRemoveQ = Q.denodeify(fs.remove);
  var fsCopyQ = Q.denodeify(fs.copy);

  var tempDir = 'temp-XXXX.build';

  module.exports.getGOPATH = function () {
    return tempPath;
  };

  module.exports.getSourcePath = function () {
    return tempSrcPath;
  };

  gulp.task('clean', function (done) {
    fsRemoveQ(conf.outputPath)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  gulp.task('create-temp', [], function (done) {
    mktemp.createDir(tempDir,
      function (err, path) {
        if (err) {
          throw err;
        }
        tempPath = path;
        done();
      });
  });

  gulp.task('copy-portal-proxy', ['create-temp'], function (done) {

    tempSrcPath = path.join(tempPath, conf.goPath, 'components');
    var plugins = require('../plugins.json');
    fs.ensureDir(tempSrcPath, function (err) {
      if (err) {
        throw err;
      }
      // Only copy the components that are enabled
      var promises = [];
      _.each(plugins.enabledPlugins, function (plugin) {
        promises.push(fsCopyQ(path.join('components', plugin, tempSrcPath, plugin)));
      });
      promises.push(fsCopyQ('components', 'core', tempSrcPath + 'core'));

      Q.all(promises)
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });

    });
  });

  gulp.task('set-build-info', ['clean'], function () {
    buildUtils.setBuildInformation();
  });

  gulp.task('create-outputs', ['clean', 'set-build-info'], function (done) {
    var outputPath = conf.outputPath;
    fsEnsureDirQ(outputPath)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  gulp.task('remove-temp', [], function (done) {
    fsRemoveQ(tempPath)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });
})();
