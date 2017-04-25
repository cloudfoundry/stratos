/* eslint-disable angular/log,no-console,no-process-env,angular/json-functions */
(function () {
  'use strict';

  var _ = require('lodash');
  var angularFilesort = require('gulp-angular-filesort');
  var autoprefixer = require('gulp-autoprefixer');
  var browserSync = require('browser-sync').create();
  var concat = require('gulp-concat-util');
  var del = require('delete');
  var eslint = require('gulp-eslint');
  var file = require('gulp-file');
  var fork = require('child_process').fork;
  var gulp = require('gulp');
  var gulpBowerFiles = require('bower-files');
  var gulpif = require('gulp-if');
  var gulpinject = require('gulp-inject');
  var gulpreplace = require('gulp-replace');
  var gutil = require('gulp-util');
  var ngAnnotate = require('gulp-ng-annotate');
  var nodeUrl = require('url');
  var path = require('path');
  var plumber = require('gulp-plumber');
  var rename = require('gulp-rename');
  var request = require('request');
  var runSequence = require('run-sequence');
  var sass = require('gulp-sass');
  var sh = require('shelljs');
  var sort = require('gulp-sort');
  var templateCache = require('gulp-angular-templatecache');
  var uglify = require('gulp-uglify');
  var utils = require('./gulp.utils');
  var wiredep = require('wiredep').stream;
  var i18n = require('./i18n.gulp');
  var cleanCSS = require('gulp-clean-css');
  var config = require('./gulp.config')();
  var buildConfig = require('./build_config.json');

  var paths = config.paths;
  var assetFiles = utils.updateWithPlugins(config.assetFiles);
  var themeFiles = config.themeFiles;
  var jsSourceFiles = utils.updateWithPlugins(config.jsSourceFiles);
  var scssFiles = utils.updateWithPlugins(config.scssFiles);
  var templateFiles = utils.updateWithPlugins(config.templatePaths);
  var packageJson = require('../package.json');
  var jsFiles = utils.updateWithPlugins(config.jsFiles);
  var lintFiles = utils.updateWithPlugins(config.lintFiles);
  var i18nFiles = utils.updateWithPlugins(config.i18nFiles);

  // Default OEM Config
  var DEFAULT_BRAND = 'suse';

  var brand = process.env.BRAND || DEFAULT_BRAND;
  var defaultBrandFolder = '../oem/brands/' + brand + '/';
  defaultBrandFolder = path.resolve(__dirname, defaultBrandFolder);
  var defaultBrandI18nFolder = path.join(defaultBrandFolder, 'i18n');
  defaultBrandI18nFolder = path.resolve(__dirname, defaultBrandI18nFolder);
  i18nFiles.unshift(defaultBrandI18nFolder + '/**/*.json');

  var usePlumber = true;
  var server;

  var bowerFiles = gulpBowerFiles({
    overrides: config.bower.overrides
  });

  // gulp taaks should be run from the top-level folder
  if (process.cwd() === __dirname) {
    throw new gutil.PluginError('gulp', 'gulp tasks should be run from the top-level folder');
  }

  // Pull in the gulp tasks for the ui framework examples
  var examples = require('./examples.gulp');
  examples(config);

  // Pull in the gulp tasks for e2e tests
  var e2e = require('./e2e.gulp.js');
  e2e(config);

  // Clean dist
  gulp.task('clean', function (next) {
    del(paths.dist + '**/*', {force: true}, next);
  });

  // Legacy
  gulp.task('clean:dist', ['clean']);

  // Copy HTML files to 'dist'
  gulp.task('copy:html', function () {
    return gulp
      .src(templateFiles, {base: paths.src})
      .pipe(gulp.dest(paths.dist));
  });

  gulp.task('copy:svg', function () {
    return gulp
      .src(config.svgPaths, {base: paths.theme})
      .pipe(gulp.dest(paths.dist));
  });

  // Copy index.html to 'dist'
  gulp.task('copy:index', function () {
    return gulp
      .src(paths.src + 'index.html')
      .pipe(gulp.dest(paths.dist));
  });

  // Copy JavaScript source files to 'dist'
  gulp.task('copy:js', ['copy:configjs', 'copy:bowerjs'], function () {
    var sourceFiles = jsSourceFiles;
    var sources = gulp.src(sourceFiles, {base: paths.src});
    return sources
      .pipe(sort())
      .pipe(angularFilesort())
      .pipe(ngAnnotate({
        single_quotes: true
      }))
      .pipe(gutil.env.devMode ? gutil.noop() : concat(config.jsFile))
      .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gulp.dest(paths.dist));
  });

  // Copy 'bower_components' folder to 'dist'
  // This is only used for development builds
  gulp.task('copy:lib', function (done) {
    utils.copyBowerFolder(paths.lib, paths.dist + 'bower_components');
    done();
  });

  // Copy JavaScript config file to 'dist'- patch in the default OEM configuration
  gulp.task('copy:configjs', ['copy:configjs:oem'], function () {
    return gulp
      .src(paths.src + 'config.js')
      .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(rename('console-config.js'))
      .pipe(gulp.dest(paths.dist));
  });

  // Copy JavaScript config file to the OEM 'dist' folder so it can be patched during OEM process
  gulp.task('copy:configjs:oem', function () {
    return gulp
      .src(paths.src + 'config.js')
      .pipe(uglify())
      .pipe(rename('console-config.js'))
      .pipe(gulp.dest(paths.oem + 'dist'));
  });

  // Combine all of the bower js dependencies into a single lib file that we can include
  // Only used for a production build
  gulp.task('copy:bowerjs', function () {
    return gulp.src(bowerFiles.ext('js').files)
      .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gutil.env.devMode ? gutil.noop() : concat(config.jsLibsFile))
      .pipe(gutil.env.devMode ? gutil.noop() : gulp.dest(paths.dist));
  });

  gulp.task('copy:assets', ['copy:default-brand'], function () {
    return gulp
      .src(assetFiles, {base: paths.src})
      .pipe(gulp.dest(paths.dist));
  });

  // Copy the default brand's images and logo to the dist folder
  gulp.task('copy:default-brand', ['copy:default-brand:favicon'], function () {
    return gulp
      .src([
        path.join(defaultBrandFolder, 'images/*')
      ], {base: defaultBrandFolder})
      .pipe(gulp.dest(paths.dist));
  });

  // Copy the default brand's images and logo to the dist folder
  gulp.task('copy:default-brand:favicon', function () {
    return gulp
      .src(path.join(defaultBrandFolder, 'favicon.ico'), {base: defaultBrandFolder})
      .pipe(gulp.dest(paths.dist + 'images'));
  });

  gulp.task('copy:theme', function () {
    return gulp
      .src(themeFiles, {base: paths.theme})
      .pipe(gulp.dest(paths.dist));
  });

  // Compile SCSS to CSS
  gulp.task('css:generate', ['inject:scss', 'scss:set-brand'], function () {
    return gulp
      .src(config.scssSourceFiles, {base: paths.src})
      .pipe(gulpif(usePlumber, plumber({
        errorHandler: function (err) {
          console.log(err);
          this.emit('end');
        }
      })))
      .pipe(sass())
      .pipe(autoprefixer({browsers: ['last 2 versions'], cascade: false}))
      .pipe(gulp.dest(paths.dist));
  });

  gulp.task('css', ['css:generate'], function () {
    var cssFiles = bowerFiles.ext('css').files;
    cssFiles.push(path.join(paths.dist, 'index.css'));
    return gulp.src(cssFiles)
    .pipe(concat('index.css'))
    .pipe(cleanCSS({}))
    .pipe(gulp.dest(paths.dist));
  });

  // Put all of the html templates into an anagule module that preloads them when the app loads
  gulp.task('template-cache', function () {
    return gulp.src(templateFiles)
      .pipe(templateCache(config.jsTemplatesFile, {
        module: 'console-templates',
        standalone: true
      }))
      .pipe(uglify())
      .pipe(gulp.dest(paths.dist));
  });

  // In dev we do not use the cached templates, so we need an empty angular module
  // for the templates so the dependency is still met
  gulp.task('dev-template-cache', function () {
    return gulp.src('./tools/' + config.jsTemplatesFile)
      .pipe(gulp.dest(paths.dist));
  });

  // Inject JavaScript and SCSS source file references in index.html
  gulp.task('inject:index', ['copy:index'], function () {
    var distPath = path.resolve(__dirname, '..', paths.dist);
    var enStrings = require(path.join(distPath, 'i18n', 'locale-en.json'));
    var sources = gulp.src(
        jsFiles
        .concat(paths.dist + config.jsLibsFile)
        .concat(paths.dist + config.jsFile)
        .concat(paths.dist + config.jsTemplatesFile)
        .concat(config.cssFiles), {read: false});

    return gulp
      .src(paths.dist + 'index.html')
      .pipe(wiredep(config.bower))
      .pipe(gulpinject(sources, {relative: true}))
      .pipe(concat.header())
      .pipe(gulpreplace('@@PRODUCT_NAME@@', enStrings.product.name))
      .pipe(gulp.dest(paths.dist));
  });

  // Automatically inject SCSS file imports from Bower packages
  gulp.task('inject:scss', function () {
    return gulp
      .src(paths.src + 'framework.tmpl.scss')
      .pipe(wiredep(config.bowerDev))
      .pipe(rename('framework.scss'))
      .pipe(gulp.dest(paths.src));
  });

  gulp.task('scss:set-brand', function () {
    return gulp
      .src(paths.src + 'index.tmpl.scss')
      .pipe(gulpreplace('@@BRAND@@', DEFAULT_BRAND))
      .pipe(wiredep(config.bowerDev))
      .pipe(rename('index.scss'))
      .pipe(gulp.dest(paths.src));
  });

  // Run ESLint on 'src' folder
  gulp.task('lint', function () {
    return gulp
      .src(lintFiles)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
  });

  function getMajorMinor(version) {
    var regex = /^(\d+\.)?(\d)/i;
    return version.match(regex)[0];
  }

  gulp.task('i18n', function () {
    var i18nSource = i18nFiles;
    var productVersion = { product: { version: getMajorMinor(packageJson.version) } };
    i18nSource.unshift(path.join(defaultBrandI18nFolder, '**', '*.json'));
    return gulp.src(i18nSource)
      .pipe(i18n(gutil.env.devMode, productVersion))
      //.pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gulp.dest(paths.i18nDist));
  });

  // Generate .plugin.scss file and copy to 'dist'
  gulp.task('plugin', function () {
    var CMD = 'cd ./src/plugins && ls */*.scss';
    var plugins = sh.exec(CMD, {silent: true})
      .output
      .trim()
      .split(/\s+/);

    // Find all of the plugin folders that are included by the configuration
    plugins = _.reject(plugins, function (filePath) {
      var plugin = path.dirname(filePath);
      return _.indexOf(buildConfig.plugins, plugin) === -1;
    });

    var pluginsScssFiles = plugins
      .map(function (scss) {
        return '@import "' + scss + '";';
      });

    return file('.plugins.scss', pluginsScssFiles.join('\n'), {src: true})
      .pipe(gulp.dest(paths.src + 'plugins'));
  });

  // Gulp watch JavaScript, SCSS and HTML source files
  gulp.task('watch', function () {
    var callback = browserSync.active ? browserSync.reload : function () {
    };

    gulp.watch(jsSourceFiles, {interval: 1000, usePoll: true, verbose: true}, ['copy:js', callback]);
    gulp.watch([scssFiles, config.themeScssFiles, defaultBrandFolder + '/**/*'], ['css', callback]);
    gulp.watch(templateFiles, ['copy:html', callback]);
    gulp.watch(config.svgPaths, ['copy:svg', callback]);
    gulp.watch(paths.src + 'index.html', ['inject:index', callback]);
    gulp.watch(config.i18nFiles, ['i18n', callback]);
  });

  gulp.task('browsersync', function (callback) {
    var middleware = [];
    var https;
    try {
      // Need a JSON file named 'dev_config.json'
      var devOptions = require('./dev_config.json');
      var targetUrl = nodeUrl.parse(devOptions.pp);
      https = devOptions.https;
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
       "proxy": "http://[PROXY_HOST]:[PROXY_PORT]"
       }
       */

      // If talking to a local proxy directly, need to avoid double '/'
      var target = nodeUrl.format(targetUrl);
      if (_.endsWith(target, '/')) {
        target = target.substr(0, target.length - 1);
      }

      devOptions.options = devOptions.options || {};
      // Do NOT follow redirects - return them back to the browser
      devOptions.options.followRedirect = false;
      var proxiedRequest = request.defaults(devOptions.options);
      var proxyMiddleware = {
        route: '/pp',
        handle: function (req, res) {
          var url = target + req.url;
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
        baseDir: paths.browserSyncDist,
        middleware: middleware
      },
      notify: false,
      ghostMode: false,
      open: false,
      port: config.browserSyncPort,
      https: https
    }, function () {
      callback();
    });
  });

  gulp.task('browsersync:stop', function (cb) {
    browserSync.exit();
    cb();
  });

  gulp.task('start-server', function () {
    var options = {};
    options.env = _.clone(process.env);
    options.env.NODE_ENV = 'development';
    options.env.client_folder = paths.browserSyncDist;
    options.env.client_port = config.browserSyncPort;
    options.env.client_logging = config.disableServerLogging || false;

    server = fork(path.join(__dirname, 'server.js'), [], options);
  });

  gulp.task('stop-server', function () {
    if (server) {
      server.kill();
      server = undefined;
    }
  });

  gulp.task('dev-default', function (next) {
    gutil.env.devMode = true;
    delete config.bower.exclude;
    usePlumber = false;
    runSequence(
      'clean',
      'plugin',
      'copy:js',
      'copy:lib',
      'css',
      'i18n',
      'dev-template-cache',
      'copy:html',
      'copy:svg',
      'copy:assets',
      'copy:theme',
      'inject:index',
      next
    );
  });

  // Static server
  gulp.task('dev', ['dev-default'], function () {
    runSequence('browsersync', 'watch');
  });

  gulp.task('run-default', ['default'], function () {
    runSequence('start-server');
  });

  gulp.task('default', function (next) {
    usePlumber = false;
    runSequence(
      'clean',
      'plugin',
      'copy:js',
      'css',
      'i18n',
      'template-cache',
      'copy:svg',
      'copy:assets',
      'copy:theme',
      'inject:index',
      next
    );
  });
})();
