/* eslint-disable no-process-env */
(function () {
  'use strict';

  var mktemp = require('mktemp');
  var fs = require('fs-extra');
  var path = require('path');
  var gulp = require('gulp');
  var Q = require('q');
  var _ = require('lodash');
  var conf = require('./bk-conf');
  var glob = require('glob');

  var tempPath, tempSrcPath, buildTest;
  var fsEnsureDirQ = Q.denodeify(fs.ensureDir);
  var fsRemoveQ = Q.denodeify(fs.remove);
  var fsCopyQ = Q.denodeify(fs.copy);

  module.exports.getGOPATH = function () {
    return tempPath;
  };

  module.exports.getBuildTest = function () {
    return buildTest;
  };

  module.exports.setBuildTest = function (build) {
    buildTest = build;
  };

  module.exports.getSourcePath = function () {
    return tempSrcPath;
  };

  gulp.task('clean-backend', function (done) {
    // Local dev build - only remove plugins and main binary
    if (module.exports.localDevSetup) {
      var files = glob.sync('+(portal-proxy|*.so|plugins.json)', { cwd: conf.outputPath});
      _.each(files, function (file) {
        /* eslint-disable no-sync */
        fs.removeSync(path.join(conf.outputPath, file));
        /* eslint-enable no-sync */
      });
      return done();
    } else {
      // Remove folder in 'normal' build
      fsRemoveQ(conf.outputPath)
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    }
  });

  gulp.task('create-temp', [], function (done) {
    // If STRATOS_TEMP is set, then a staged build is being carried out
    // see CF deployment script deploy/cloud-foundry/package.sh
    if (process.env.STRATOS_TEMP) {
      tempPath = process.env.STRATOS_TEMP;
      tempSrcPath = tempPath + path.sep + conf.goPath + path.sep + 'components';
      return done();
    } else {
      mktemp.createDir('/tmp/stratos-ui-XXXX.build',
        function (err, path_) {
          if (err) {
            throw err;
          }
          tempPath = path_;
          tempSrcPath = path.join(tempPath, conf.goPath, 'components');
          done();
        });
    }

  });

  gulp.task('delete-temp', [], function (done) {
    if (module.exports.localDevSetup) {
      return done();
    } else {
      fsRemoveQ(tempPath)
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    }
  });

  gulp.task('copy-portal-proxy', ['create-temp'], function (done) {

    var plugins = require('./../plugins.json');
    fs.ensureDir(tempSrcPath, function (err) {
      if (err) {
        throw err;
      }

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
