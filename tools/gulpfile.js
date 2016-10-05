'use strict';

var concat = require('gulp-concat-util'),
  del = require('delete'),
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
  gutil = require('gulp-util'),
  node_url = require('url'),
  utils = require('./gulp.utils'),
  request = require('request'),
  uglify = require('gulp-uglify'),
  sort = require('gulp-sort'),
  angularFilesort = require('gulp-angular-filesort'),
  gulpBowerFiles = require('bower-files'),
  templateCache = require('gulp-angular-templatecache'),
  wiredep = require('wiredep').stream;

var config = require('./gulp.config')();
var paths = config.paths,
  assetFiles = config.assetFiles,
  jsSourceFiles = config.jsSourceFiles,
  jsLibs = config.jsLibs,
  plugins = config.plugins,
  jsFiles = config.jsFiles,
  scssSourceFiles = config.scssSourceFiles,
  scssFiles = config.scssFiles,
  cssFiles = config.cssFiles,
  partials = config.partials;

var usePlumber = true;

var bowerFiles = gulpBowerFiles({
  overrides: config.bower.overrides
});

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

// Copy 'lib' folder to 'dist'
gulp.task('copy:lib', function (done) {
  utils.copyBowerFolder(paths.src + 'lib', paths.dist + 'lib');
  done();
});

// Copy JavaScript source files to 'dist'
gulp.task('copy:configjs', function () {
  return gulp
    .src(paths.src + 'config.js')
    .pipe(gutil.env.devMode ? gutil.noop() : uglify())
    .pipe(rename('stackato-config.js'))
    .pipe(gulp.dest(paths.dist));
});

// Copy JavaScript source files to 'dist'
gulp.task('copy:js', ['copy:configjs', 'copy:bowerjs'], function () {
  return gulp
    .src(jsSourceFiles, { base: paths.src })
    .pipe(sort())
    .pipe(angularFilesort())
    .pipe(gutil.env.devMode ? gutil.noop() : concat(config.jsFile))
    .pipe(gutil.env.devMode ? gutil.noop() : uglify())
    .pipe(gulp.dest(paths.dist));
});

gulp.task("copy:bowerjs", function () {
  return gulp.src(bowerFiles.ext('js').files)
    .pipe(gutil.env.devMode ? gutil.noop() : uglify())
    .pipe(gutil.env.devMode ? gutil.noop() : concat('stackato-libs.js'))
    .pipe(gutil.env.devMode ? gutil.noop() : gulp.dest(paths.dist + 'lib'));
});

gulp.task('copy:assets', function () {
  return gulp
    .src(assetFiles, { base: paths.src })
    .pipe(gulp.dest(paths.dist));
});

// Copy 'translations' folder to 'dist'
gulp.task('copy:translations', function () {
  return gulp
    .src(config.translate.json + '**/*')
    .pipe(gulp.dest(config.translate.dist));
});

// Compile SCSS to CSS
gulp.task('css', ['inject:scss'], function () {
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

gulp.task('template-cache', function () {
  return gulp.src(config.templatePaths)
    .pipe(templateCache(config.jsTemplatesFile, {
      module: 'stackato-templates',
      standalone: true
    }))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist));
});

// In dev we do not use the cached templates, so we beed ab empty angular module
// for the templates so the dependency is still met
gulp.task('dev-template-cache', function () {
  return gulp.src('./' + config.jsTemplatesFile)
    .pipe(gulp.dest(paths.dist));
});

// Inject JavaScript and SCSS source file references in index.html
gulp.task('inject:index', ['copy:index'], function () {
  var sources = gulp.src(
    jsLibs
    .concat(plugins)
    .concat(jsFiles)
    .concat(paths.dist + config.jsFile)
    .concat(paths.dist + config.jsTemplatesFile)
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
    .pipe(wiredep(config.bowerDev))
    .pipe(rename('index.scss'))
    .pipe(gulp.dest(paths.src));
});

// Run ESLint on 'src' folder
gulp.task('lint', function () {
  return gulp
    .src([
      paths.src + '**/*.js',
      '!' + paths.src + 'lib/**/*.js',
      '!' + paths.src + 'plugins/cloud-foundry/api/hcf/**/*.js'
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
  var middleware = [];
  try {
    // Need a JSON file named 'dev_config.json'
    var devOptions = require('./dev_config.json');
    var targetUrl = node_url.parse(devOptions.pp);
    var https = devOptions.https;
    if (https && https.cert && https.key) {
      gutil.log('Serving HTTPS with the following certificate:', gutil.colors.magenta(https.cert));
    } else {
      https = true;
      gutil.log('Serving HTTPS with the default BrowserSync certificate');
    }

    gutil.log('Proxying API requests to:', gutil.colors.magenta(devOptions.pp));
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    /* For web proxy support - set options in dev_config - e.g.
      "options": {
        "proxy": "http://proxy.sdc.hp.com:8080"
      }
    */

    devOptions.options = devOptions.options || {};
    // Do NOT follow redirects - return them back to the browser
    devOptions.options.followRedirect = false;
    var proxiedRequest = request.defaults(devOptions.options);
    var proxyMiddleware = {
      route: '/pp',
      handle: function (req, res) {
        var url = node_url.format(targetUrl) + req.url;
        var method = (req.method + '        ').substring(0, 8);
        gutil.log(method, req.url);
        req.pipe(proxiedRequest(url)).pipe(res);
      }
    };
    middleware.push(proxyMiddleware);
  } catch (e) {
    throw new gutil.PluginError('browsersync', 'dev_config.json file is required with portal-proxy(pp) endpoint' +
      'configuration');
  }

  browserSync.init({
    server: {
      baseDir: "../dist",
      middleware: middleware
    },
    ghostMode: false,
    open: false,
    port: 3100,
    https: https
  }, function () {
    callback();
  });
});

gulp.task('dev-default', function (next) {
  gutil.env.devMode = true;
  delete config.bower.exclude;
  usePlumber = false;
  runSequence(
    'clean:dist',
    'plugin',
    'translate:compile',
    'copy:js',
    'copy:lib',
    'css',
    'dev-template-cache',
    'copy:html',
    'copy:assets',
    'inject:index',
    next
  );
});


// Static server
gulp.task('dev', ['dev-default'], function () {
  runSequence('browsersync', 'watch');
});

gulp.task('run-default', ['default'], function () {
  runSequence('browsersync', 'watch');
});

gulp.task('default', function (next) {
  usePlumber = false;
  runSequence(
    'clean:dist',
    'plugin',
    'translate:compile',
    'copy:js',
    'copy:lib',
    'css',
    'template-cache',
    'copy:html',
    'copy:assets',
    'inject:index',
    next
  );
});
