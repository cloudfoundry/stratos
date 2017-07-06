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

  function buildPlugin(pluginPath, pluginName) {

    var goFiles = _.filter(fs.readdirSync(pluginPath), function (file) {
      return path.extname(file) === '.go';
    });

    var args = ['build', '-i', '-buildmode=plugin', '-o', pluginName + '.so'];
    args = args.concat(goFiles);
    return spawnProcess('go', args, pluginPath, env);
  }

  function build(path, exeName) {
    return spawnProcess('go', ['build', '-i', '-o', exeName], path, env);
  }

  function test(path) {
    return spawnProcess('go', ['test', '-v'], path, env);
  }

})();
