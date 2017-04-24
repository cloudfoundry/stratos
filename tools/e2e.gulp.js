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
  var path = require('path');
  var runSequence = require('run-sequence');
  var combine = require('istanbul-combine');
  var istanbul = require('gulp-istanbul');
  var ngAnnotate = require('gulp-ng-annotate');

  gulp.task('e2e:clean:dist', function (next) {
    del('../tmp', {force: true}, next);
  });

  gulp.task('coverage-combine', function (cb) {
    var coverageDir = path.resolve(__dirname, '..', 'out', 'coverage-report');
    var opts = {
      dir: path.join(coverageDir, 'combined'),
      pattern: path.join(coverageDir, '_json/*.json'),
      print: 'summary',
      reporters: {
        html: {}
      }
    };
    combine(opts, cb);
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
      ['./tools/coverage.conf.js'],
      options);
    c.on('close', function () {
      cb();
    });
  });

  gulp.task('e2e:pre-instrument', function () {
    return gulp.src(paths.dist + '**/*.*')
      .pipe(gulp.dest(paths.instrumented));
  });

  gulp.task('e2e:instrument-source', function () {
    var sources = gulp.src(utils.updateWithPlugins(config.sourceFilesToInstrument), {base: paths.src});
    return sources
      .pipe(ngAnnotate({
        single_quotes: true
      }))
      .pipe(istanbul(config.istanbul))
      .pipe(gulp.dest(paths.instrumented));
  });

  gulp.task('e2e:run', ['e2e:clean:dist'], function () {
    paths.browserSyncDist = paths.instrumented;
    config.browserSyncPort = 4000;
    config.disableServerLogging = true;
    runSequence(
      'dev-default',
      'e2e:pre-instrument',
      'e2e:instrument-source',
      'start-server',
      'e2e:tests',
      'stop-server',
      'e2e:clean:dist'
    );
  });
})();
