/* eslint-disable no-sync */
(function () {
  'use strict';

  var fs = require('fs-extra');
  var path = require('path');
  var gulp = require('gulp');
  var _ = require('lodash');
  var mergeDirs = require('merge-dirs');
  var runSequence = require('run-sequence');
  var Q = require('q');

  var conf = require('./bk-conf');
  var buildUtils = require('./bk-build-utils');
  var prepareBuild = require('./bk-prepare-build');
  require('./deploy-in-cf');

  var enabledPlugins = [];

  var fsMoveQ = Q.denodeify(fs.move);
  var fsEnsureDirQ = Q.denodeify(fs.ensureDir);
  var fsWriteJsonQ = Q.denodeify(fs.writeJson);

  buildUtils.localDevSetup();

  gulp.task('get-plugins-data', [], function () {

    var plugins = require('../plugins.json');
    if (plugins.enabledPlugins.length === 0) {
      // nothing to do
      enabledPlugins = [];
    } else {

      _.each(plugins.enabledPlugins, function (plugin) {
        var pluginInfo = {};
        pluginInfo.libraryPath = plugin + '.so';
        pluginInfo.pluginPath = plugin;
        pluginInfo.pluginName = plugin;
        enabledPlugins.push(pluginInfo);
      });
    }
  });

  gulp.task('init-build', ['copy-portal-proxy', 'create-outputs'], function () {
    buildUtils.init();
  });

  gulp.task('prepare-deps', ['get-plugins-data'], function (done) {

    if (buildUtils.skipGlideInstall()) {
      return done();
    }

    var promise = Q.resolve();
    _.each(enabledPlugins, function (pluginInfo) {
      var fullPluginPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'backend');
      promise = promise
        .then(function () {
          return buildUtils.runGlideInstall(fullPluginPath);
        });

    });
    var fullCorePath = path.join(prepareBuild.getSourcePath(), 'app-core', 'backend');

    promise
      .then(function () {
        return buildUtils.runGlideInstall(fullCorePath);
      })
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });

  });

  // If plugins are using different version of the same dependency,
  // than we will end up overwriting one of them. Therefore, plugins should use
  // the same version of dependencies.
  gulp.task('dedup-vendor', ['prepare-deps'], function (done) {

    if (buildUtils.skipGlideInstall()) {
      return done();
    }

    var promise = Q.resolve();
    var promises = [];
    _.each(enabledPlugins, function (pluginInfo) {
      var pluginVendorPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'backend', 'vendor');
      var pluginCheckedInVendorPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'backend', '__vendor');
      // sequentially chain promise
      promise
        .then(function () {
          fs.removeSync(conf.getVendorPath(prepareBuild.getSourcePath()));
          return Q.resolve();
        })
        .then(function () {
          var goSrc = path.join(prepareBuild.getGOPATH(), 'src');
          mergeDirs.default(pluginVendorPath, goSrc);
          // If checked in vendors exist, merge does in as well
          if (fs.existsSync(pluginCheckedInVendorPath)) {
            mergeDirs.default(pluginCheckedInVendorPath, goSrc);
          }
          // Promise did not guarantee that the operation completed
          fs.removeSync(pluginVendorPath);
          return Q.resolve();
        })
        .catch(function (err) {
          done(err);
        });
      promises.push(promise);
    });
    Q.all(promises)
      .then(function () {
        var goSrc = path.join(prepareBuild.getGOPATH(), 'src');
        var coreVendorPath = path.join(prepareBuild.getSourcePath(), 'app-core', 'backend', 'vendor');
        var coreCheckedInVendorPath = path.join(prepareBuild.getSourcePath(), 'app-core', 'backend', '__vendor');
        mergeDirs.default(coreVendorPath, goSrc);
        if (fs.existsSync(coreCheckedInVendorPath)) {
          mergeDirs.default(coreCheckedInVendorPath, goSrc);
        }
        fs.removeSync(coreVendorPath);
        return Q.resolve();
      })
      .then(function () {
        done();
      })
      .catch(function (err) {

        done(err);
      });
  });

  gulp.task('build-all', [], function (done) {
    buildUtils.init();
    var promise = Q.resolve();
    // Build all plugins
    _.each(enabledPlugins, function (pluginInfo) {
      var fullPluginPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'backend');
      promise = promise.then(function () {
        return buildUtils.buildPlugin(fullPluginPath, pluginInfo.pluginName);
      });

    });
    var corePath = conf.getCorePath(prepareBuild.getSourcePath());
    promise
      .then(function () {
        // Build app-core
        return buildUtils.build(corePath, conf.coreName);
      })
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  gulp.task('run-tests', ['build-all'], function (done) {

    var corePath = conf.getCorePath(prepareBuild.getSourcePath());
    buildUtils.test(corePath)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });

  });

  gulp.task('copy-artefacts', ['build-all'], function (done) {
    var outputPath = conf.outputPath + path.sep;
    var promise = fsEnsureDirQ(outputPath);
    _.each(enabledPlugins, function (pluginInfo) {
      var compiledPluginPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'backend', pluginInfo.pluginName + '.so');
      var outputsPluginPath = path.join(outputPath, pluginInfo.pluginName + '.so');
      promise
        .then(function () {
          return fsMoveQ(compiledPluginPath, outputsPluginPath);
        });
    });

    // copy core artefact
    var corePath = path.join(conf.getCorePath(prepareBuild.getSourcePath(), conf.coreName));
    var outputCorePath = path.join(outputPath, conf.coreName);

    promise
      .then(function () {
        return fsMoveQ(corePath, outputCorePath);
      })
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });

  });

  gulp.task('write-plugins-yaml', ['copy-artefacts'], function () {

    var plugins = _.values(enabledPlugins);
    fsWriteJsonQ(path.join(conf.outputPath, 'plugins.json'), plugins)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  gulp.task('local-dev-build', function (done) {
    if (!buildUtils.isLocalDevBuild()) {
      return done();
    } else {
      // Copy SQLite script and prepared config to the outputs folder
      var scriptOutFolder = path.join(conf.outputPath, 'deploy/db');
      fs.ensureDirSync(scriptOutFolder);
      fs.copySync(path.resolve(__dirname, '../deploy/db/sqlite_schema.sql'), path.join(scriptOutFolder, 'sqlite_schema.sql'));
      // Copy config.properties if there is not one already
      fs.copySync(path.resolve(__dirname, '../deploy/cloud-foundry/config.properties'), path.join(conf.outputPath, 'config.properties'), {
        overwrite: false
      });

      // Copy the dev certs as well if they exist
      var devCerts = path.resolve(__dirname, '../dev-certs');
      var outDevCerts = path.resolve(conf.outputPath, 'dev-certs');
      if (fs.existsSync(devCerts)) {
        fs.copySync(devCerts, outDevCerts);
      } else {
        if (!fs.existsSync(outDevCerts)) {
          fs.mkdir(outDevCerts);
          var browserSyncCerts = path.resolve(__dirname, '../node_modules/browser-sync/lib/server/certs');
          fs.copySync(path.join(browserSyncCerts, 'server.crt'), path.join(outDevCerts, 'pproxy.crt'));
          fs.copySync(path.join(browserSyncCerts, 'server.key'), path.join(outDevCerts, 'pproxy.key'));
        }
      }

      return done();
    }
  });

  gulp.task('build-backend', function () {

    return runSequence(
      'init-build',
      'dedup-vendor',
      'write-plugins-yaml',
      'delete-temp',
      'local-dev-build'
    );
  });

  gulp.task('cf-build-backend', function () {

    return runSequence(
      'init-build',
      'get-plugins-data',
      'write-plugins-yaml',
      'delete-temp'
    );
  });
  gulp.task('cf-get-backend-deps', function () {
    return runSequence(
      'init-build',
      'dedup-vendor'
    );
  });

  gulp.task('test-backend', function () {

    prepareBuild.setBuildTest(true);

    return runSequence(
      'init-build',
      'dedup-vendor',
      'run-tests',
      'delete-temp'
    );
  });

})();
