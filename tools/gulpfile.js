'use strict';

var concat = require('gulp-concat-util'),
  del = require('del'),
  eslint = require('gulp-eslint'),
  file = require('gulp-file'),
  gettext = require('gulp-angular-gettext'),
  gulp = require('gulp'),
  gulpif = require('gulp-if'),
  gulpinject = require('gulp-inject'),
  plumber = require('gulp-plumber'),
  rename = require('gulp-rename'),
  runSequence = require('run-sequence'),
  sass = require('gulp-sass'),
  sh = require('shelljs'),
  browserSync = require('browser-sync').create(),
  browserSyncProxy = require('proxy-middleware'),
  gutil = require('gulp-util'),
  node_url = require('url'),
  vfs = require('vinyl-fs'),
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

var usePlumber = true;

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
// Bote: gulp.src does not support symlinks, so use vinyl-fs.
// Even with vinyl-fs, when copying symlink dirs, it only copies 1 level deep of folder
// so, we copy explicitly our helion-* repos' dist folder - these are the repositories that you
// might be using 'bower link' with
gulp.task('copy:lib', function () {
  return vfs.src([
    paths.src + 'lib/**/*',
    paths.src + 'lib/helion-*/dist/**/*'
  ]).pipe(vfs.dest(paths.dist + 'lib'));
});

// Copy 'translations' folder to 'dist'
gulp.task('copy:translations', function () {
  return gulp
    .src(config.translate.json + '**/*')
    .pipe(gulp.dest(config.translate.dist));
});

// Compile SCSS to CSS
gulp.task('css', function () {
  return gulp
    .src(scssSourceFiles, { base: paths.src })
    .pipe(gulpif(usePlumber, plumber({
      errorHandler: function (err) {
        console.log(err);
        this.emit('end');
      }
    })))
    .pipe(sass())
    .pipe(gulp.dest(paths.dist));
});

// Inject JavaScript and SCSS source file references in index.html
gulp.task('inject:index', ['copy:index'], function () {
  var sources = gulp.src(
    jsLibs
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
gulp.task('plugin', function () {
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

// Generate the POT file to be translated
gulp.task('translate:extract', function () {
  var sources = config.partials
    .concat(config.jsSourceFiles);

  return gulp.src(sources)
    .pipe(gettext.extract(config.translate.pot))
    .pipe(gulp.dest(config.paths.translations));
});

// Convert translated PO files into JSON format
gulp.task('translate:compile', function () {
  return gulp.src(config.translate.po)
    .pipe(gettext.compile(config.translate.options))
    .pipe(gulp.dest(config.translate.js));
});

// Gulp watch JavaScript, SCSS and HTML source files
gulp.task('watch', function () {
  var callback = browserSync.active ? browserSync.reload : function () {};
  gulp.watch(jsSourceFiles, {interval: 1000, usePoll: true}, ['copy:js', callback]);
  gulp.watch(scssFiles, ['css', callback]);
  gulp.watch(partials, ['copy:html', callback]);
  gulp.watch(paths.src + 'index.html', ['inject:index', callback]);
});

gulp.task('browsersync', function (callback) {
  var proxyOptions = {};
  try {
    // Need a JSON file named 'dev_config.json'
    var devOptions = require('./dev_config.json');
    // Need key 'api' with the URL to the API server
    proxyOptions = node_url.parse(devOptions.api);
    proxyOptions.route = '/api';
    gutil.log('Proxying API requests to:', gutil.colors.magenta(devOptions.api));
  } catch (e) {
    throw new gutil.PluginError('browsersync', 'dev_config.json file is required with API endpoint configuration');
  }

  browserSync.init({
    server: {
      baseDir: "../dist",
      middleware: [browserSyncProxy(proxyOptions)]
    },
    ghostMode: false,
    open: false,
    port: 3100

  }, function () {
    callback();
  });
});

// Static server
gulp.task('dev', ['default'], function () {
  runSequence('browsersync', 'watch');
});

gulp.task('default', function (next) {
  usePlumber = false;
  runSequence(
    'plugin',
    'translate:compile',
    'copy:js',
    'copy:lib',
    'inject:scss',
    'css',
    'copy:html',
    'inject:index',
    next
  );
});
