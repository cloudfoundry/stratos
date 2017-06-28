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

  gulp.task('prepare-plugins', ['get-plugins-data'], function (done) {

    var promise = Q.resolve();
    _.each(enabledPlugins, function (pluginInfo) {
      var fullPluginPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'backend');
      promise = promise
        .then(function () {
          return buildUtils.runGlideInstall(fullPluginPath);
        });

    });
    promise
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });

  });

  gulp.task('prepare-core', ['prepare-plugins'], function (done) {
    var fullCorePath = path.join(prepareBuild.getSourcePath(), 'app-core', 'backend');
    buildUtils.runGlideInstall(fullCorePath)
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
  gulp.task('dedup-vendor', ['prepare-core'], function (done) {

    var promise = Q.resolve();
    var promises = [];
    _.each(enabledPlugins, function (pluginInfo) {
      var pluginVendorPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'backend', 'vendor');
      // sequentially chain promise
      promise
        .then(function () {
          fs.removeSync(conf.getVendorPath(prepareBuild.getSourcePath()));
          return Q.resolve();
        })
        .then(function () {
          var cfCliFixtures = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'backend', 'vendor', 'code.cloudfoundry.org', 'cli', 'fixtures');
          fs.removeSync(cfCliFixtures);
          return Q.resolve();
        })
        .then(function () {
          var goSrc = path.join(prepareBuild.getGOPATH(), 'src');
          mergeDirs.default(pluginVendorPath, goSrc);
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
        mergeDirs.default(coreVendorPath, goSrc);
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

  gulp.task('build-plugins', ['dedup-vendor'], function (done) {

    var promises = [];
    _.each(enabledPlugins, function (pluginInfo) {
      var fullPluginPath = path.join(prepareBuild.getSourcePath(), pluginInfo.pluginPath, 'backend');
      var promise = buildUtils.buildPlugin(fullPluginPath, pluginInfo.pluginName);
      promises.push(promise);

    });
    Q.all(promises)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  gulp.task('run-tests', ['build-plugins'], function (done) {

    var corePath = conf.getCorePath(prepareBuild.getSourcePath());
    buildUtils.test(corePath)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });

  });

  gulp.task('build-core', ['dedup-vendor'], function (done) {

    var corePath = conf.getCorePath(prepareBuild.getSourcePath());
    buildUtils.build(corePath, conf.coreName)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      });

  });

  gulp.task('copy-artefacts', ['build-core', 'build-plugins'], function (done) {
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

  gulp.task('build-backend', function () {

    return runSequence(
      'init-build',
      'write-plugins-yaml'
    );
  });

  gulp.task('test-backend', function () {

    return runSequence(
      'init-build',
      'run-tests'
    );
  });

})();
