/* eslint-disable no-sync */
(function () {
  'use strict';

  var fs = require('fs-extra');
  var path = require('path');
  var gulp = require('gulp');
  var _ = require('lodash');
  var mergeDirs = require('stratos-merge-dirs');
  var runSequence = require('run-sequence');
  var Q = require('q');

  var conf = require('./bk-conf');
  var buildUtils = require('./bk-build-utils');
  var prepareBuild = require('./bk-prepare-build');
  require('./deploy-in-cf');

  var enabledPlugins = [];

  var fsMoveQ = Q.denodeify(fs.move);
  var fsEnsureDirQ = Q.denodeify(fs.ensureDir);

  buildUtils.localDevSetup();

  // Get the list of plugins - look for folders with a PLUGIN.md file
  gulp.task('get-plugins-data', [], function () {
    var folders = fs.readdirSync(conf.srcPath);
    _.each(folders, function (file) {
      var stats = fs.lstatSync(path.join(conf.srcPath,file));
      if (stats.isDirectory()) {
        var pluginMarkerFile = path.join(conf.srcPath, file, 'PLUGIN.md');
        if (fs.existsSync(pluginMarkerFile)) {
          var pluginInfo = {};
          pluginInfo.pluginPath = file;
          pluginInfo.pluginName = file;
          enabledPlugins.push(pluginInfo);
        }
      }
    });
  });

  gulp.task('init-build', ['copy-portal-proxy', 'copy-dbmigrator', 'create-outputs'], function () {
    buildUtils.init();
  });

  gulp.task('init-build-migrator', ['copy-dbmigrator', 'create-outputs'], function () {
    buildUtils.init();
  });

  gulp.task('prepare-deps', ['get-plugins-data'], function (done) {
    if (buildUtils.skipGlideInstall()) {
      return done();
    }

    // Run glide install in all plugin folders
    var promise = Q.resolve();
    _.each(enabledPlugins, function (pluginInfo) {
      var fullPluginPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath);
      if (fs.existsSync(fullPluginPath)) {
        promise = promise
          .then(function () {
            return buildUtils.runGlideInstall(fullPluginPath);
          });
      }
    });

    // DB Migrator dependencies
    if (fs.existsSync(prepareBuild.getDbMigratorSourcePath())) {
      promise = promise
        .then(function () {
          return buildUtils.runGlideInstall(prepareBuild.getDbMigratorSourcePath());
        });
    }

    var fullCorePath = path.join(prepareBuild.getSourcePath());
    if (fs.existsSync(path.join(fullCorePath, 'portal_proxy.go'))) {
      promise = promise.then(function () {
        return buildUtils.runGlideInstall(fullCorePath);
      });
    } else {
      // Not building core, so ignore plugins as well
      enabledPlugins = [];
    }

    promise
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

    // Plugins
    var promise = Q.resolve();
    var promises = [];
    _.each(enabledPlugins, function (pluginInfo) {
      var pluginVendorPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'vendor');
      var pluginCheckedInVendorPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, '__vendor');
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

    // DB Migrator
    promise
      .then(function () {
        var goSrc = path.join(prepareBuild.getGOPATH(), 'src');
        var dbMigratorVendorPath = path.join(prepareBuild.getDbMigratorSourcePath(), 'vendor');
        var dbMigratorCheckedInVendorPath = path.join(prepareBuild.getDbMigratorSourcePath(), '__vendor');
        mergeDirs.default(dbMigratorVendorPath, goSrc);
        if (fs.existsSync(dbMigratorCheckedInVendorPath)) {
          mergeDirs.default(dbMigratorCheckedInVendorPath, goSrc);
        }
        fs.removeSync(dbMigratorVendorPath);
        return Q.resolve();
      })
      .catch(function (err) {
        done(err);
      });

    // App Core
    var coreVendorPath = path.join(prepareBuild.getSourcePath(), 'vendor');
    if (fs.existsSync(coreVendorPath)) {
      promise = promise.then(function () {
        var goSrc = path.join(prepareBuild.getGOPATH(), 'src');
        var coreVendorPath = path.join(prepareBuild.getSourcePath(), 'vendor');
        var coreCheckedInVendorPath = path.join(prepareBuild.getSourcePath(), '__vendor');
        mergeDirs.default(coreVendorPath, goSrc);
        if (fs.existsSync(coreCheckedInVendorPath)) {
          mergeDirs.default(coreCheckedInVendorPath, goSrc);
        }
        fs.removeSync(coreVendorPath);
        return Q.resolve();
      });
    }

    Q.all(promises)
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

    var corePath = conf.getCorePath(prepareBuild.getSourcePath());
    if (fs.existsSync(corePath)) {
      promise = promise.then(function () {
        // Build app-core
        return buildUtils.build(corePath, conf.coreName, enabledPlugins);
      });
    }
    promise
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  gulp.task('build-dbmigrator', [], function (done) {
    buildUtils.init();
    var dbMigratorPath = prepareBuild.getDbMigratorSourcePath();
    buildUtils.build(dbMigratorPath, conf.dbMigratorName, [])
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

  gulp.task('copy-artefacts', ['build-all', 'build-dbmigrator'], function (done) {
    var outputPath = conf.outputPath + path.sep;
    var promise = fsEnsureDirQ(outputPath);

    // copy db migrator artefact
    var dbMigratorPath = path.join(prepareBuild.getDbMigratorSourcePath(), conf.dbMigratorName);
    var outputDbMigratorPath = path.join(outputPath, conf.dbMigratorName);

    promise
      .then(function () {
        return fsMoveQ(dbMigratorPath, outputDbMigratorPath);
      });

    // copy core artefact
    var corePath = path.join(conf.getCorePath(prepareBuild.getSourcePath(), conf.coreName));
    var outputCorePath = path.join(outputPath, conf.coreName);

    if (fs.existsSync(corePath)) {
      promise = promise
        .then(function () {
          return fsMoveQ(corePath, outputCorePath);
        });
    }

    promise
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
      'copy-artefacts',
      'delete-temp',
      'local-dev-build'
    );
  });

  gulp.task('build-migrator', function () {

    return runSequence(
      'init-build-migrator',
      'dedup-vendor',
      'copy-artefacts',
      'delete-temp',
      'local-dev-build'
    );
  });

  gulp.task('bosh-build-backend', function () {
    // Doesn't perform a `go build -i` buiild
    prepareBuild.setNoGoInstall(true);
    return runSequence(
      'build-backend'
    );
  });

  gulp.task('cf-build-backend', function () {

    return runSequence(
      'init-build',
      'get-plugins-data',
      'copy-artefacts',
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
