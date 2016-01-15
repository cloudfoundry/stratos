'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat-util');
var gulpinject = require('gulp-inject');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var eslint = require('gulp-eslint');
var del = require('del');

// Paths are stored in gulp.config.js
var config = require('./gulp.config')();


gulp.task('js', function () {
  return gulp
    .src(config.jsSourceFiles, { base: config.paths.src })
    .pipe(gulp.dest(config.paths.dist));
});


gulp.task('css', function () {
  return gulp
    .src(config.scssSourceFiles, { base: config.paths.src })
    .pipe(sass())
    .pipe(gulp.dest(config.paths.dist));
});


gulp.task('html', function () {
  return gulp
    .src(config.partials, { base: config.paths.src })
    .pipe(gulp.dest(config.paths.dist));
});


gulp.task('lib', function () {
  return gulp
    .src(config.paths.src + 'lib/**')
    .pipe(gulp.dest(config.paths.dist + 'lib/'));
});


gulp.task('index:copy', function () {
  return gulp
    .src(config.paths.src + 'index.html')
    .pipe(gulp.dest(config.paths.dist));
});


gulp.task('index:inject', [ 'index:copy' ], function () {
  var sources = gulp.src(
    [ config.paths.dist + 'config.js' ]
    .concat(config.jsLibs)
    .concat(config.plugins)
    .concat(config.jsFiles)
    .concat(config.cssFiles), { read: false });

  return gulp
    .src(config.paths.dist + 'index.html')
    .pipe(gulpinject(sources, { relative: true }))
    .pipe(concat.header())
    .pipe(gulp.dest(config.paths.dist));
});


gulp.task('watch', function () {
  gulp.watch(config.jsSourceFiles, { interval: 1000, usePoll: true }, [ 'js' ]);
  gulp.watch(config.scssFiles, [ 'css' ]);
  gulp.watch(config.partials, { interval: 1000, usePoll: true }, [ 'html' ]);
  gulp.watch(config.paths.src + 'index.html', [ 'index:inject' ]);
});


gulp.task('lint', function () {
  return gulp
    .src([
      config.paths.src + '**/*.js',
      '!' + config.paths.src + 'lib/**/*.js'
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


gulp.task('clean', function (next) {
  del(config.paths.dist + '**/*', { force: true }, next);
});


gulp.task('default', function (next) {
  runSequence(
    'lint',
    'js',
    'css',
    'html',
    'lib',
    'index:inject',
    next
  );
});
