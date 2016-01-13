'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat-util');
var gulpinject = require('gulp-inject');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var eslint = require('gulp-eslint');
var del = require('del');


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
  '!' + paths.dist + '**/*.mock.js',
  '!' + paths.dist + '**/*.spec.js'
];


var scssSourceFiles = [
  paths.src + 'index.scss'
];


var scssFiles = [
  paths.src + '**/*.scss'
]


var cssFiles = [
   paths.dist + 'index.css'
];


var partials = [
  paths.src + 'app/**/*.html'
];


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


gulp.task('index:inject', function () {
  var sources = gulp.src(
    [paths.dist + 'config.js']
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
  gulp.watch(jsFiles, [ 'js' ]);
  gulp.watch(scssFiles, [ 'css' ]);
  gulp.watch(partials, [ 'html' ]);
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
  del(paths.dist, { force: true }, next);
});


gulp.task('default', function (next) {
  runSequence(
    'js',
    'css',
    'html',
    'lib',
    'index:copy',
    'index:inject',
    next
  );
});
