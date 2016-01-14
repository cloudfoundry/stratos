'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat-util');
var gulpinject = require('gulp-inject');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var eslint = require('gulp-eslint');
var del = require('del');
var sh = require('shelljs');
var file = require('gulp-file');


var paths = {
  src: '../src/',
  dist: '../dist/'
};


var jsSourceFiles = [
  paths.src + '**/*.js'
];


var jsLibs = [
  paths.dist + 'lib/angular/angular.js',
  paths.dist + 'lib/angular-gettext/dist/angular-gettext.js',
  paths.dist + 'lib/angular-sanitize/angular-sanitize.js',
  paths.dist + 'lib/angular-bootstrap/ui-bootstrap.js',
  paths.dist + 'lib/angular-bootstrap/ui-bootstrap-tpls.js',
  paths.dist + 'lib/angular-ui-router/release/angular-ui-router.js',
  paths.dist + 'lib/lodash/lodash.js',
  paths.dist + 'lib/helion-ui-framework/**/*.module.js',
  paths.dist + 'lib/helion-ui-framework/**/*.js'
];


var plugins = [
];


var jsFiles = [
  paths.dist + 'index.module.js',
  paths.dist + 'app/**/*.module.js',
  paths.dist + 'app/**/*.js',
  paths.dist + 'plugins/**/*.module.js',
  paths.dist + 'plugins/**/*.js',
  '!' + paths.dist + '**/*.mock.js',
  '!' + paths.dist + '**/*.spec.js'
];


var scssSourceFiles = [
  paths.src + 'index.scss'
];


var scssFiles = [
  paths.src + '**/*.scss'
];


var cssFiles = [
   paths.dist + 'index.css'
];


var partials = [
  paths.src + 'app/**/*.html',
  paths.src + 'plugins/**/*.html'
];


gulp.task('plugin', function() {
  var CMD = 'cd ../src/plugins && ls */*.scss';
  var pluginsScssFiles  = sh.exec(CMD, { silent: true })
    .output
    .trim()
    .split(/\s+/)
    .map(function (scss) {
      return '@import "' + scss + '";'
    });

  return file('.plugins.scss', pluginsScssFiles.join('\n'), { src: true })
    .pipe(gulp.dest(paths.src + 'plugins'));
});


gulp.task('js', function () {
  return gulp
    .src(jsSourceFiles, { base: paths.src })
    .pipe(gulp.dest(paths.dist));
});


gulp.task('css', function () {
  return gulp
    .src(scssSourceFiles, { base: paths.src })
    .pipe(sass())
    .pipe(gulp.dest(paths.dist));
});


gulp.task('html', function () {
  return gulp
    .src(partials, { base: paths.src })
    .pipe(gulp.dest(paths.dist));
});


gulp.task('lib', function () {
  return gulp
    .src(paths.src + 'lib/**')
    .pipe(gulp.dest(paths.dist + 'lib/'));
});


gulp.task('index:copy', function () {
  return gulp
    .src(paths.src + 'index.html')
    .pipe(gulp.dest(paths.dist));
});


gulp.task('index:inject', [ 'index:copy' ], function () {
  var sources = gulp.src(
    [ paths.dist + 'config.js' ]
    .concat(jsLibs)
    .concat(plugins)
    .concat(jsFiles)
    .concat(cssFiles), { read: false });

  return gulp
    .src(paths.dist + 'index.html')
    .pipe(gulpinject(sources, { relative: true }))
    .pipe(concat.header())
    .pipe(gulp.dest(paths.dist));
});


gulp.task('watch', function () {
  gulp.watch(jsSourceFiles, { interval: 1000, usePoll: true }, [ 'js' ]);
  gulp.watch(scssFiles, [ 'css' ]);
  gulp.watch(partials, { interval: 1000, usePoll: true }, [ 'html' ]);
  gulp.watch(paths.src + 'index.html', [ 'index:inject' ]);
});


gulp.task('lint', function () {
  return gulp
    .src([
      paths.src + '**/*.js',
      '!' + paths.src + 'lib/**/*.js'
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


gulp.task('clean', function (next) {
  del(paths.dist + '**/*', { force: true }, next);
});


gulp.task('default', function (next) {
  runSequence(
    'plugin',
    'lint',
    'js',
    'css',
    'html',
    'lib',
    'index:inject',
    next
  );
});
