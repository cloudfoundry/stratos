/* eslint-disable angular/log,no-console,no-process-env,no-sync */
(function () {
  'use strict';

  // Gulp tasks for the End to End tests (running with coverage)

  var config = require('./gulp.config');
  var paths = config.paths;

  /**
   * Tasks to run the end-to-end (e2e) selenium/protractor tests
   **/

  var _ = require('lodash');
  var gulp = require('gulp');
  var del = require('delete');
  var fork = require('child_process').fork;
  var path = require('path');
  var runSequence = require('run-sequence');
  var ngAnnotate = require('gulp-ng-annotate');
  var e2eConfigFile = './build/coverage.conf.js';
  var glob = require('glob');
  var fs = require('fs');

  var components;
  gulp.task('prepare:e2e', function () {
    components = require('./components');
  });

  gulp.task('e2e:clean:dist', function (next) {
    del('../tmp', {force: true}, next);
  });

  gulp.task('coverage-combine', function (cb) {
    var coverageDir = path.resolve(__dirname, '..', 'out', 'coverage-report');
    var toCombine = path.join(coverageDir, '_json/*.json');

    // Remove 'frontend' from both key and path for all coverage reports. This makes the path invalid however now
    // keys align across both e2e tests (components don't show '/frontend') and unit (components show '/frontend' where
    // used). The html is fine except for the file paths drop '/frontend' in places. This behaviour matches the
    // standalone output of the e2e coverage reports.
    glob(toCombine, null, function (err, files) {
      if (err) {
        cb(err);
        return;
      }

      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var content = fs.readFileSync(file, 'utf8');
        content = content.replace(/(components\/[^\/]+)\/frontend(\/src\/)/g, '$1$2');
        fs.writeFileSync(file, content);
      }
    });

    var combine = require('istanbul-combine');
    var opts = {
      dir: path.join(coverageDir, 'combined'),
      pattern: toCombine,
      print: 'summary',
      reporters: {
        html: {}
      }
    };
    combine(opts, cb);
  });

  gulp.task('e2e:nocov', function () {
    e2eConfigFile = './build/protractor.conf.js';
    runSequence(
      'e2e:tests'
    );
  });

  gulp.task('e2e:tests', function (cb) {
    // Use the protractor in our node_modules folder
    var cmd = './node_modules/protractor/bin/protractor';
    var options = {};
    options.env = _.clone(process.env);
    options.env.NODE_ENV = 'development';
    options.env.env = 'development';

    var args = [e2eConfigFile];
    if (process.env.STRATOS_E2E_SUITE) {
      args.push('--suite');
      args.push(process.env.STRATOS_E2E_SUITE);
    }

    var c = fork(cmd, args, options);
    c.on('close', function () {
      cb();
    });
  });

  gulp.task('e2e:pre-instrument', function () {
    return gulp.src(paths.dist + '**/*.*')
      .pipe(gulp.dest(paths.instrumented));
  });

  gulp.task('e2e:instrument-source', ['prepare:e2e'], function () {
    var istanbul = require('gulp-istanbul');
    var sources = components.getGlobs([
      '**/*.js',
      '!api/**/*.js',
      '!**/*.spec.js',
      '!**/*.mock.js'
    ]);
    return gulp.src(sources.dist, {base: paths.dist})
      .pipe(ngAnnotate({
        single_quotes: true
      }))
      .pipe(istanbul(config.istanbul))
      .pipe(gulp.dest(paths.instrumented));
  });

  gulp.task('e2e:run', function () {
    paths.browserSyncDist = paths.instrumented;
    config.browserSyncPort = 4000;
    config.disableServerLogging = true;
    runSequence(
      'e2e:clean:dist',
      'dev-build',
      'e2e:pre-instrument',
      'e2e:instrument-source',
      'start-server',
      'e2e:tests',
      'stop-server',
      'e2e:clean:dist'
    );
  });

  gulp.task('e2e:run-on-target', function () {
    runSequence(
      'e2e:tests'
    );
  });

  gulp.task('e2e:runq', function () {
    paths.browserSyncDist = paths.instrumented;
    config.browserSyncPort = 4000;
    config.disableServerLogging = true;
    runSequence(
      'start-server',
      'e2e:tests',
      'stop-server'
    );
  });
})();
