/* eslint-disable no-process-env, no-sync */
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

  var tempPath, tempSrcPath, noGoInstall, buildTest;
  var fsEnsureDirQ = Q.denodeify(fs.ensureDir);
  var fsRemoveQ = Q.denodeify(fs.remove);
  var fsCopyQ = Q.denodeify(fs.copy);
  var fsSymLinkQ = Q.denodeify(fs.symlink);

  module.exports.getGOPATH = function () {
    return tempPath;
  };

  module.exports.getBuildTest = function () {
    return buildTest;
  };

  module.exports.setBuildTest = function (build) {
    buildTest = build;
  };

  module.exports.getNoGoInstall = function () {
    return noGoInstall;
  };

  module.exports.setNoGoInstall = function (goInstall) {
    noGoInstall = goInstall;
  };

  module.exports.getSourcePath = function () {
    return tempSrcPath;
  };

  function getPlugins() {
    var plugins = [];
    // Enumerate all folders in the src/backend folder
    var folders = fs.readdirSync(conf.pluginFolder);
    _.each(folders, function (plugin) {
      var fPath = path.join(conf.pluginFolder, plugin);
      var stat = fs.lstatSync(fPath);
      if (stat.isDirectory() && plugin !== 'app-core') {
        plugins.push(plugin);
      }
    });
    return plugins;
  }

  module.exports.getPlugins = getPlugins;

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

  gulp.task('create-temp', function (done) {
    // If STRATOS_TEMP is set, then a staged build is being carried out
    // see CF deployment script deploy/cloud-foundry/package.sh
    if (process.env.STRATOS_TEMP) {
      tempPath = process.env.STRATOS_TEMP;
      tempSrcPath = tempPath + path.sep + conf.goPath + path.sep;
      return done();
    } else {
      mktemp.createDir('/tmp/stratos-ui-XXXX.build',
        function (err, path_) {
          if (err) {
            throw err;
          }
          tempPath = path_;
          tempSrcPath = path.join(tempPath, conf.goPath);
          done();
        });
    }
  });

  gulp.task('delete-temp', function (done) {
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

  gulp.task('copy-portal-proxy', function (done) {

    var plugins = getPlugins();
    var symLinkFolder = path.dirname(tempSrcPath);
    fs.ensureDirSync(symLinkFolder);
    removeSymLinks(symLinkFolder);

    var appCore = '../src/backend/app-core';
    appCore = path.resolve(__dirname, appCore);
    var symLinkPath = path.join(symLinkFolder, 'stratos-ui')

    // Create the plugins folder if it does not exist
    var pluginsFolder = path.join(appCore, 'plugins');
    fs.ensureDirSync(pluginsFolder);
    removeSymLinks(pluginsFolder);

    // Create the symlink for the main source code
    fs.symlink(appCore, symLinkPath, function (err) {
      if (err) {
        throw err;
      }

      var promises = [];
      _.each(plugins, function (plugin) {
        var pluginSource = path.resolve(appCore, '..', plugin);
        var pluginDest = path.join(pluginsFolder, plugin);
        promises.push(fsSymLinkQ(pluginSource, pluginDest));
      });

      Q.all(promises)
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });

    });
  });

  function removeSymLinks(folder) {
    _.each(fs.readdirSync(folder), function (name) {
      var p = path.join(folder, name);
      fs.unlinkSync(p);
    });
  }

  gulp.task('create-outputs', gulp.series('clean-backend'), function (done) {
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
