/**
 * Gulp build file for Angular 2 Front End UI Code
 */
/* eslint-disable angular/log,no-console,no-process-env,angular/json-functions,no-sync */
(function () {
  'use strict';

  var gulp = require('gulp');
  var _ = require('lodash');
  var del = require('delete');
  var spawn = require('child_process').spawn;
  var path = require('path');
  var os = require('os');

  var runSequence = require('run-sequence');
  var config = require('./gulp.config');
  var paths = config.paths;

/*
  var angularFilesort = require('gulp-angular-filesort');
  var autoprefixer = require('gulp-autoprefixer');
  var concat = require('gulp-concat-util');

  var fork = require('child_process').fork;
  var fs = require('fs');
  var fsx = require('fs-extra');
  var gulp = require('gulp');
  var gulpif = require('gulp-if');
  var gulpinject = require('gulp-inject');
  var gulpreplace = require('gulp-replace');
  var gutil = require('gulp-util');
  var ngAnnotate = require('gulp-ng-annotate');
  var nodeUrl = require('url');
  var path = require('path');
  var rename = require('gulp-rename');
  var sass = require('gulp-sass');
  var sort = require('gulp-sort');
  var templateCache = require('gulp-angular-templatecache');
  var uglify = require('gulp-uglify');
  var utils = require('./utils');
  var wiredep = require('wiredep').stream;
  var i18n = require('./i18n.gulp');
  var cleanCSS = require('gulp-clean-css');
  var config = require('./gulp.config');
  var devDeps = require('./dev-dependencies');
*/

  // Clean dist dir
  gulp.task('clean', function (next) {
    del(paths.dist + '**/*', {force: true}, next);
  });

  // Legacy task name
  gulp.task('clean:dist', ['clean']);

  // Default task is to build for production
  gulp.task('default', ['build']);

  gulp.task('ng-build', function (cb) {
    var rootFolder = path.resolve(__dirname, '..');
    var cmd = 'npm'
    var windowsEnvironment = os.platform().startsWith('win');
    if (windowsEnvironment) {
      cmd = 'npm.cmd'
    }
    var child = spawn(cmd, ['run', 'build'], { cwd: rootFolder });
    child.stdout.on('data', function(data) {
      console.log(data.toString());
    });
    child.stderr.on('data', function(data) {
      console.log(data.toString());
    });
    child.on('error', function(err) {
      console.log(err);
      cb(err);
    });
    child.on('close', function(code) {
      var err = code === 0 ? undefined : 'Build exited with code: ' + code;
      cb(err);
    });
  })  

  // Production build
  gulp.task('build', function (next) {
    runSequence(
      'clean',
      'ng-build',
      next
    );
  });
})();
