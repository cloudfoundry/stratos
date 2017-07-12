/* eslint-disable no-process-env, no-sync */
(function () {
  'use strict';

  var childProcess = require('child_process');
  var process = require('process');
  var Q = require('q');
  var fs = require('fs-extra');
  var _ = require('lodash');
  var path = require('path');

  var prepareBuild = require('./bk-prepare-build');

  var env, devConfig;

  module.exports.init = function () {
    env = process.env;
    env.GOPATH = prepareBuild.getGOPATH();
    env.GOOS = 'linux';
    env.GOARCH = 'amd64';
  };

  module.exports.runGlideInstall = runGlideInstall;
  module.exports.build = build;
  module.exports.buildPlugin = buildPlugin;
  module.exports.test = test;
  module.exports.localDevSetup = localDevSetup;
  module.exports.isLocalDevBuild = isLocalDevBuild;

  function localDevSetup() {
    if (isLocalDevBuild()) {
      process.env.STRATOS_TEMP = path.resolve(__dirname, '../tmp');
      fs.mkdirpSync(process.env.STRATOS_TEMP);
      prepareBuild.localDevSetup = true;
    }
  }

  // Get dev config from the dev config file if it exists
  function getDevConfig() {
    if (!devConfig) {
      devConfig = {};
      var devConfigFile = path.join(__dirname, 'dev_config.json');
      if (fs.existsSync(devConfigFile)) {
        devConfig = require(devConfigFile);
      }
    }
    return devConfig;
  }

  function spawnProcess(processName, args, cwd, env) {
    var deferred = Q.defer();
    var task = childProcess.spawn(processName, args, {
      env: env,
      cwd: cwd,
      stdio: 'inherit'
    });

    task.on('exit', function (code) {
      if (code !== 0) {
        deferred.reject('Process failed with code: ' + code);
        return;
      }
      deferred.resolve();
    });
    task.on('error', function (err) {
      deferred.reject('Process failed with error: ' + err);
    });
    return deferred.promise;
  }

  function runGlideInstall(path) {
    var glideArgs = ['install'];
    if (!prepareBuild.getBuildTest()) {
      glideArgs.push('--skip-test');
    }
    return spawnProcess('glide', glideArgs, path, env);
  }

  function isLocalDevBuild() {
    return !!getDevConfig().localDevBuild;
  }

  function createArgsWithInstallFlag(command, args) {
    var newArgs = [command];
    if (!isLocalDevBuild()) {
      newArgs.push('-i');
    }
    return newArgs.concat(args);
  }

  function buildPlugin(pluginPath, pluginName) {

    var goFiles = _.filter(fs.readdirSync(pluginPath), function (file) {
      return path.extname(file) === '.go';
    });

    var args = createArgsWithInstallFlag('build', ['-buildmode=plugin', '-o', pluginName + '.so']);
    args = args.concat(goFiles);
    return spawnProcess('go', args, pluginPath, env);
  }

  function build(path, exeName) {
    var args = createArgsWithInstallFlag('build', ['-o', exeName]);
    return spawnProcess('go', args, path, env);
  }

  function test(path) {
    return spawnProcess('go', ['test', '-v'], path, env);
  }

})();
