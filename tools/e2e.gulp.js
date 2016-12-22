/* eslint-disable angular/log,no-console,no-process-env,no-sync */
(function () {
  'use strict';

  // Gulp tasks for the End to End tests (running with coverage)

  var config, paths;

  module.exports = function (c) {
    config = c;
    paths = config.paths;
  };

  /**
   * Tasks to run the end-to-end (e2e) selenium/protractor tests
   **/

  var _ = require('lodash');
  var gulp = require('gulp');
  var del = require('delete');
  var fork = require('child_process').fork;
  var runSequence = require('run-sequence');
  var combine = require('istanbul-combine');

  gulp.task('e2e:clean:dist', function (next) {
    del('./tmp', {force: true}, next);
  });

  gulp.task('coverage-combine', function () {
    var opts = {
      dir: '../coverage-report/combined',
      pattern: '../coverage-report/_json/*.json',
      print: 'summary',
      reporters: {
        html: {}
      }
    };
    combine.sync(opts);
  });

  gulp.task('e2e:tests', function (cb) {
    // Use the protractor in our node_modules folder
    var cmd = './node_modules/protractor/bin/protractor';
    var options = {};
    options.env = _.clone(process.env);
    options.env.NODE_ENV = 'development';
    options.env.env = 'development';
    var c = fork(cmd,
      // You can add a spec file if you just want to run one set of test specs
      //['./protractor.conf.js', '--specs=./e2e/section_network_grps.spec.js'],
      //['./protractor.conf.js', '--specs=./e2e/section_identify_servers.spec.js'],
      ['./coverage.conf.js'],
      options);
    c.on('close', function () {
      cb();
    });
  });

  function updateDist(list, oldDist, newDist) {
    var newList = [];
    _.each(list, function (item) {
      if (item.indexOf(oldDist) === 0) {
        newList.push(newDist + item.substr(oldDist.length));
      } else {
        newList.push(item);
      }
    });
    return newList;
  }

  gulp.task('e2e:run', ['e2e:clean:dist'], function () {
    config.instrumentCode = true;
    var e2eDist = '../tmp/dist-e2e/';
    config.cssFiles = updateDist(config.cssFiles, paths.dist, e2eDist);
    config.jsFiles = updateDist(config.jsFiles, paths.dist, e2eDist);
    paths.dist = e2eDist;
    paths.browserSyncDist = '../tmp/dist-e2e';
    paths.frameworkDist = paths.dist + 'framework/';
    config.browserSyncPort = 4000;
    runSequence(
      'dev-default',
      'browsersync',
      'e2e:tests',
      'browsersync:stop',
      'e2e:clean:dist'
    );
  });
})();
