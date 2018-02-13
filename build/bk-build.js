/* eslint-disable no-sync */
(function() {
  'use strict';

  var fs = require('fs-extra');
  var path = require('path');
  var gulp = require('gulp');
  var _ = require('lodash');
  var mergeDirs = require('stratos-merge-dirs');
  var Q = require('q');

  var conf = require('./bk-conf');
  var buildUtils = require('./bk-build-utils');
  var prepareBuild = require('./bk-prepare-build');
  require('./deploy-in-cf');

  var enabledPlugins = [];

  var fsMoveQ = Q.denodeify(fs.move);
  var fsEnsureDirQ = Q.denodeify(fs.ensureDir);

  buildUtils.localDevSetup();

  gulp.task('get-plugins-data', function (done) {
    var plugins = prepareBuild.getPlugins();
    _.each(plugins, function(plugin) {
      var pluginInfo = {};
      pluginInfo.pluginPath = plugin;
      pluginInfo.pluginName = plugin;
      enabledPlugins.push(pluginInfo);
    });
    return done();
  });

  gulp.task('init-build', gulp.series('create-temp', 'copy-portal-proxy', 'create-outputs', function (done) {
    buildUtils.init();
    done();
  }));

  gulp.task('prepare-deps', gulp.series('get-plugins-data', function (done) {
    if (buildUtils.skipGlideInstall()) {
      return done();
    }

    var promise = Q.resolve();
    _.each(enabledPlugins, function(pluginInfo) {
      var fullPluginPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath);
      if (fs.existsSync(fullPluginPath)) {
        promise = promise
          .then(function() {
            return buildUtils.runGlideInstall(fullPluginPath);
          });
      }
    });

    var fullCorePath = path.join(prepareBuild.getSourcePath(), 'app-core');

    if (fs.existsSync(fullCorePath)) {
      promise = promise.then(function() {
        return buildUtils.runGlideInstall(fullCorePath);
      });
    } else {
      // Not building core, so ignore plugins as well
      enabledPlugins = [];
    }

    promise.then(function () {
      done();
    }).catch(function (err) {
      done(err);
    });
  }));

  // If plugins are using different version of the same dependency,
  // than we will end up overwriting one of them. Therefore, plugins should use
  // the same version of dependencies.
  gulp.task('dedup-vendor', gulp.series('prepare-deps', function (done) {

    if (buildUtils.skipGlideInstall()) {
      return done();
    }

    // Plugins
    var promise = Q.resolve();
    var promises = [];
    _.each(enabledPlugins, function(pluginInfo) {
      var pluginVendorPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'vendor');
      var pluginCheckedInVendorPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, '__vendor');
      // sequentially chain promise
      promise
        .then(function() {
          fs.removeSync(conf.getVendorPath(prepareBuild.getSourcePath()));
          return Q.resolve();
        })
        .then(function() {
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
        .catch(function(err) {
          done(err);
        });
      promises.push(promise);
    });

    // App Core
    var coreVendorPath = path.join(prepareBuild.getSourcePath(), 'app-core', 'vendor');
    if (fs.existsSync(coreVendorPath)) {
      promise = promise.then(function() {
        var goSrc = path.join(prepareBuild.getGOPATH(), 'src');
        var coreVendorPath = path.join(prepareBuild.getSourcePath(), 'app-core', 'vendor');
        var coreCheckedInVendorPath = path.join(prepareBuild.getSourcePath(), 'app-core', '__vendor');
        mergeDirs.default(coreVendorPath, goSrc);
        if (fs.existsSync(coreCheckedInVendorPath)) {
          mergeDirs.default(coreCheckedInVendorPath, goSrc);
        }
        fs.removeSync(coreVendorPath);
        return Q.resolve();
      });
    }

    Q.all(promises)
      .then(function() {
        done();
      })
      .catch(function(err) {
        done(err);
      });
  }));

  gulp.task('build-all', function (done) {
    buildUtils.init();
    var promise = Q.resolve();
    // Build all plugins
    _.each(enabledPlugins, function(pluginInfo) {
      var fullPluginPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath);
      promise = promise.then(function() {
        return buildUtils.buildPlugin(fullPluginPath, pluginInfo.pluginName);
      });

    });
    var corePath = conf.getCorePath(prepareBuild.getSourcePath());
    if (fs.existsSync(corePath)) {
      promise = promise.then(function() {
        // Build app-core
        return buildUtils.build(corePath, conf.coreName);
      });
    }
    promise
      .then(function() {
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  gulp.task('run-tests', gulp.series('build-all', function (done) {
    var corePath = conf.getCorePath(prepareBuild.getSourcePath());
    buildUtils.test(corePath)
      .then(function() {
        done();
      })
      .catch(function(err) {
        done(err);
      });
    }));

  gulp.task('copy-artefacts', gulp.series('build-all', function (done) {
    var outputPath = conf.outputPath + path.sep;
    var promise = fsEnsureDirQ(outputPath);
    _.each(enabledPlugins, function(pluginInfo) {
      var compiledPluginPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, pluginInfo.pluginName + '.so');
      var outputsPluginPath = path.join(outputPath, pluginInfo.pluginName + '.so');
      promise
        .then(function() {
          return fsMoveQ(compiledPluginPath, outputsPluginPath);
        });
    });

    // copy core artefact
    var corePath = path.join(conf.getCorePath(prepareBuild.getSourcePath(), conf.coreName));
    var outputCorePath = path.join(outputPath, conf.coreName);

    if (fs.existsSync(corePath)) {
      promise = promise
        .then(function() {
          return fsMoveQ(corePath, outputCorePath);
        });
    }

    promise
      .then(function() {
        done();
      })
      .catch(function(err) {
        done(err);
      });
  }));

  gulp.task('local-dev-build', function(done) {
    if (!buildUtils.isLocalDevBuild()) {
      return done();
    } else {
      // Copy SQLite script and prepared config to the outputs folder
      var scriptOutFolder = path.join(conf.outputPath, 'deploy/db');
      fs.ensureDirSync(scriptOutFolder);
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
          var devCerts = path.resolve(__dirname, '../dev-ssl');
          fs.copySync(path.join(devCerts, 'server.crt'), path.join(outDevCerts, 'pproxy.crt'));
          fs.copySync(path.join(devCerts, 'server.key'), path.join(outDevCerts, 'pproxy.key'));
        }
      }

      return done();
    }
  });

  gulp.task('build-backend', gulp.series(
    'init-build',
    'dedup-vendor',
    'copy-artefacts',
    'delete-temp',
    'local-dev-build'
  ));

  gulp.task('set-no-glide-install', function (done) {
    prepareBuild.setNoGoInstall(true);
    return done();
  });

  // Doesn't perform a `go build -i` buiild
  gulp.task('bosh-build-backend', gulp.series(
    'set-no-glide-install',
    'build-backend'
  ));

  gulp.task('cf-build-backend', gulp.series(
    'init-build',
    'get-plugins-data',
    'copy-artefacts',
    'delete-temp'
  ));

  gulp.task('cf-get-backend-deps', gulp.series(
    'init-build',
    'dedup-vendor'
  ));

  gulp.task('set-build-test', function (done) {
    prepareBuild.setBuildTest(true);
    return done();
  });

  gulp.task('test-backend', gulp.series(
    'set-build-test',
    'init-build',
    'dedup-vendor',
    'run-tests',
    'delete-temp'
  ));

})();
