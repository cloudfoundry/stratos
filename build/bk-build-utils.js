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

  var env;

  // This build mode will build the backend components in containers,
  // it should be used if building on a Mac or Windows
  var BUILD_MODE_CONTAINERS = 'containers';
  // This build mode will build locally,
  // this will only work on a Linux system with Go and Glide installed
  var BUILD_MODE_LOCAL = 'local';

  var buildContainerInfo = {
    dockerRegistry: 'docker.io',
    dockerOrg: 'susetest',
    image: 'stratos-backend-builder'
  };

  var buildMode = BUILD_MODE_LOCAL;

  module.exports.init = function () {
    env = process.env;
    env.GOPATH = prepareBuild.getGOPATH();
    env.GOOS = 'linux';
    env.GOARCH = 'amd64';
  };

  module.exports.setBuildInformation = setBuildInformation;
  module.exports.runGlideInstall = runGlideInstall;
  module.exports.build = build;
  module.exports.buildPlugin = buildPlugin;
  module.exports.test = test;

  var fsExistsQ = Q.denodeify(fs.pathExists);

  function setBuildInformation() {

    if (fsExistsQ('./dev_config.json')) {
      var devConfig = require('./dev_config.json');
      if (_.has(devConfig, 'backendBuildMode')) {
        buildMode = devConfig.backendBuildMode;
      }
      if (_.has(devConfig, 'buildContainer')) {
        buildContainerInfo = _.default({}, devConfig.buildContainer, buildContainerInfo);
      }
    }
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

  function run(executable, args, path, env) {
    var promise;
    if (buildMode === BUILD_MODE_LOCAL) {
      promise = spawnProcess(executable, args, path, env);
    } else {
      promise = Q.reject('Not yet implemented');
    }
    return promise;
  }

  function runGlideInstall(path) {
    return run('glide', ['--debug', 'install'], path, env);
  }

  function buildPlugin(pluginPath, pluginName) {

    var goFiles = _.filter(fs.readdirSync(pluginPath), function (file) {
      return path.extname(file) === '.go';
    });

    var args = ['build', '-buildmode=plugin', '-o', pluginName + '.so'];
    args = args.concat(goFiles);

    return run('go', args, pluginPath, env);
  }

  function build(path, exeName) {
    return run('go', ['build', '-o', exeName], path, env);
  }

  function test(path) {
    return run('go', ['test', '-v'], path, env);
  }

})();
