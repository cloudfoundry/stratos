'use strict';

var concat = require('gulp-concat-util'),
  del = require('del'),
  eslint = require('gulp-eslint'),
  file = require('gulp-file'),
  gulp = require('gulp'),
  gulpinject = require('gulp-inject'),
  plumber = require('gulp-plumber'),
  rename = require('gulp-rename'),
  runSequence = require('run-sequence'),
  sass = require('gulp-sass'),
  sh = require('shelljs'),
  wiredep = require('wiredep').stream;

var config = require('./gulp.config')();
var paths = config.paths,
  jsSourceFiles = config.jsSourceFiles,
  jsLibs = config.jsLibs,
  plugins = config.plugins,
  jsFiles = config.jsFiles,
  scssSourceFiles = config.scssSourceFiles,
  scssFiles = config.scssFiles,
  cssFiles = config.cssFiles,
  partials = config.partials;

// Clear the 'dist' folder
gulp.task('clean:dist', function (next) {
  del(paths.dist + '**/*', { force: true }, next);
});

// Copy HTML files to 'dist'
gulp.task('copy:html', function () {
  return gulp
    .src(partials, { base: paths.src })
    .pipe(gulp.dest(paths.dist));
});

// Copy index.html to 'dist'
gulp.task('copy:index', function () {
  return gulp
    .src(paths.src + 'index.html')
    .pipe(gulp.dest(paths.dist));
});

// Copy JavaScript source files to 'dist'
gulp.task('copy:js', function () {
  return gulp
    .src(jsSourceFiles, { base: paths.src })
    .pipe(gulp.dest(paths.dist));
});

// Copy 'lib' folder to 'dist'
gulp.task('copy:lib', function () {
  return gulp
    .src(paths.src + 'lib/**')
    .pipe(gulp.dest(paths.dist + 'lib/'));
});

// Compile SCSS to CSS
gulp.task('css', function () {
  return gulp
    .src(scssSourceFiles, { base: paths.src })
    .pipe(plumber({
      errorHandler: function (err) {
        console.log(err);
        this.emit('end');
      }
    }))
    .pipe(sass())
    .pipe(gulp.dest(paths.dist));
});

// Inject JavaScript and SCSS source file references in index.html
gulp.task('inject:index', [ 'copy:index' ], function () {
  var sources = gulp.src(
    [ paths.dist + 'config.js' ]
    .concat(jsLibs)
    .concat(plugins)
    .concat(jsFiles)
    .concat(cssFiles), { read: false });

  return gulp
    .src(paths.dist + 'index.html')
    .pipe(wiredep(config.bower))
    .pipe(gulpinject(sources, { relative: true }))
    .pipe(concat.header())
    .pipe(gulp.dest(paths.dist));
});

// Automatically inject SCSS file imports from Bower packages
gulp.task('inject:scss', function () {
  return gulp
    .src(paths.src + 'index.tmpl.scss')
    .pipe(wiredep(config.bower))
    .pipe(rename('index.scss'))
    .pipe(gulp.dest(paths.src));
});

// Run ESLint on 'src' folder
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

// Generate .plugin.scss file and copy to 'dist'
gulp.task('plugin', function() {
  var CMD = 'cd ../src/plugins && ls */*.scss';
  var pluginsScssFiles = sh.exec(CMD, { silent: true })
    .output
    .trim()
    .split(/\s+/)
    .map(function (scss) {
      return '@import "' + scss + '";';
    });

  return file('.plugins.scss', pluginsScssFiles.join('\n'), { src: true })
    .pipe(gulp.dest(paths.src + 'plugins'));
});

// Gulp watch JavaScript, SCSS and HTML source files
gulp.task('watch', function () {
  gulp.watch(jsSourceFiles, { interval: 1000, usePoll: true }, [ 'js' ]);
  gulp.watch(scssFiles, [ 'css' ]);
  gulp.watch(partials, [ 'html' ]);
  gulp.watch(paths.src + 'index.html', [ 'index:inject' ]);
});

gulp.task('default', function (next) {
  runSequence(
    'plugin',
    'copy:js',
    'copy:lib',
    'inject:scss',
    'css',
    'copy:html',
    'inject:index',
    next
  );
});
