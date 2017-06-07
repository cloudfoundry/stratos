(function () {
  'use strict';

  var mktemp = require('mktemp');
  var fs = require('fs-extra');
  var path = require('path');
  var gulp = require('gulp');
  var Q = require('q');
  var _ = require('lodash');
  var conf = require('./bk-conf');

  var tempPath, tempSrcPath;
  var fsEnsureDirQ = Q.denodeify(fs.ensureDir);
  var fsRemoveQ = Q.denodeify(fs.remove);
  var fsCopyQ = Q.denodeify(fs.copy);

  module.exports.getGOPATH = function () {
    return tempPath;
  };

  module.exports.getSourcePath = function () {
    return tempSrcPath;
  };

  gulp.task('clean-backend', function (done) {
    fsRemoveQ(conf.outputPath)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  gulp.task('create-temp', [], function (done) {
    mktemp.createDir('/tmp/temp-XXXX.build',
      function (err, path) {
        if (err) {
          throw err;
        }
        tempPath = path;
        done();
      });
  });

  gulp.task('copy-portal-proxy', ['create-temp'], function (done) {

    tempSrcPath = tempPath + path.sep + conf.goPath + path.sep + 'components';
    var plugins = require('./../plugins.json');
    fs.ensureDir(tempSrcPath, function (err) {
      if (err) {
        throw err;
      }

      // Only copy the components that are enabled
      var promises = [];
      _.each(plugins.enabledPlugins, function (plugin) {
        promises.push(fsCopyQ('./components/' + plugin, tempSrcPath + '/' + plugin));
      });
      promises.push(fsCopyQ('./components/app-core', tempSrcPath + '/app-core'));

      Q.all(promises)
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });

    });
  });

  gulp.task('create-outputs', ['clean-backend'], function (done) {
    var outputPath = conf.outputPath;
    fsEnsureDirQ(outputPath)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });
})();
