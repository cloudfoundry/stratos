/* eslint-disable angular/log,no-console,no-process-env,angular/json-functions */
(function () {
  'use strict';

  var _ = require('lodash');
  var concat = require('gulp-concat-util');
  var del = require('delete');
  var eslint = require('gulp-eslint');
  var file = require('gulp-file');
  var gettext = require('gulp-angular-gettext');
  var gulp = require('gulp');
  var gulpif = require('gulp-if');
  var gulpinject = require('gulp-inject');
  var gulpreplace = require('gulp-replace');
  var plumber = require('gulp-plumber');
  var rename = require('gulp-rename');
  var runSequence = require('run-sequence');
  var autoprefixer = require('gulp-autoprefixer');
  var sass = require('gulp-sass');
  var sh = require('shelljs');
  var browserSync = require('browser-sync').create();
  var gutil = require('gulp-util');
  var nodeUrl = require('url');
  var utils = require('./gulp.utils');
  var request = require('request');
  var uglify = require('gulp-uglify');
  var sort = require('gulp-sort');
  var angularFilesort = require('gulp-angular-filesort');
  var gulpBowerFiles = require('bower-files');
  var templateCache = require('gulp-angular-templatecache');
  var wiredep = require('wiredep').stream;
  var path = require('path');
  var fork = require('child_process').fork;
  var closureCompiler = require('gulp-closure-compiler');

  var config = require('./gulp.config')();
  var paths = config.paths;
  var assetFiles = config.assetFiles;
  var themeFiles = config.themeFiles;
  var jsSourceFiles = config.jsSourceFiles;
  var plugins = config.plugins;
  var scssFiles = config.scssFiles;
  var partials = config.partials;

  // Default OEM Config
  var defaultBrandFolder = '../oem/brands/hpe/';
  var oemConfig = require(path.join(defaultBrandFolder, 'oem_config.json'));
  var defaultConfig = require('../oem/config-defaults.json');
  oemConfig = _.defaults(oemConfig, defaultConfig);
  var OEM_CONFIG = 'OEM_CONFIG:' + JSON.stringify(oemConfig);

  var usePlumber = true;
  var server;

  var bowerFiles = gulpBowerFiles({
    overrides: config.bower.overrides
  });

  // Pull in the gulp tasks for the ui framework examples
  var examples = require('./examples.gulp');
  examples(config);

  // Pull in the gulp tasks for oem support
  var oem = require('./oem.gulp.js');
  oem(config);

  // Pull in the gulp tasks for oem support
  var e2e = require('./e2e.gulp.js');
  e2e(config);

  // Clear the 'dist' folder
  gulp.task('clean:dist', function (next) {
    del(paths.dist + '**/*', {force: true}, next);
  });

  // Copy HTML files to 'dist'
  gulp.task('copy:html', function () {
    return gulp
      .src(partials, {base: paths.src})
      .pipe(gulp.dest(paths.dist));
  });

  // Copy index.html to 'dist'
  gulp.task('copy:index', function () {
    return gulp
      .src(paths.src + 'index.html')
      .pipe(gulp.dest(paths.dist));
  });

  gulp.task('copy:framework:templates', function () {
    return gulp.src(config.frameworkTemplates)
      .pipe(gulp.dest(paths.dist));
  });

  gulp.task('copy:k8sComponents:templates', function () {
    return gulp.src(config.k8sCommonComponentsTemplates)
      .pipe(gulp.dest(paths.k8sComponentDistPath));
  });

  gulp.task('js:combine', ['copy:js'], function () {
    return gulp.src([
      paths.frameworkDist + config.jsFrameworkFile,
      paths.dist + config.jsFile
    ], {base: paths.dist})
      .pipe(concat(config.jsFile))
      .pipe(gulp.dest(paths.dist));
  });

  gulp.task('postbuild', function (next) {
    if (gutil.env.devMode) {
      del(paths.frameworkDist + config.jsFrameworkFile, {force: true}, next);
    } else {
      del(paths.frameworkDist, {force: true}, function () {
        del(paths.dist + 'scss', {force: true}, next);
      });
    }
  });

  // Copy JavaScript source files to 'dist'
  gulp.task('copy:js', ['copy:configjs', 'copy:bowerjs', 'copy:framework-components:js', 'copy:framework:js'], function () {
    var sourceFiles = jsSourceFiles;
    if (!gutil.env.devMode) {
      sourceFiles = jsSourceFiles.concat(config.jsLibs);
    }
    var sources = gulp.src(sourceFiles, {base: paths.src});
    return sources
      .pipe(sort())
      .pipe(angularFilesort())
      .pipe(gutil.env.devMode ? gutil.noop() : concat(config.jsFile))
      .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gulp.dest(paths.dist));
  });

  // Copy 'lib' folder to 'dist'
  gulp.task('copy:lib', function (done) {
    utils.copyBowerFolder(paths.src + 'lib', paths.dist + 'lib');
    done();
  });

  // Copy JavScript config file to 'dist'- patch in the default OEM configuration
  gulp.task('copy:configjs', ['copy:configjs:oem'], function () {
    return gulp
      .src(paths.src + 'config.js')
      .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gulpreplace('OEM_CONFIG:{}', OEM_CONFIG))
      .pipe(rename('stackato-config.js'))
      .pipe(gulp.dest(paths.dist));
  });

  // Copy JavaScript config file to the OEM 'dist' folder so it can be patched during OEM process
  gulp.task('copy:configjs:oem', function () {
    return gulp
      .src(paths.src + 'config.js')
      .pipe(uglify())
      .pipe(rename('stackato-config.js'))
      .pipe(gulp.dest(paths.oem + 'dist'));
  });

  gulp.task('copy:framework-components:js', function () {
    return gulp.src(config.jsComponentLibs)
      .pipe(sort())
      .pipe(closureCompiler({
        compilerFlags: {

          angular_pass: null,
          entry_point: 'index_module',
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          export_local_property_definitions: null,
          externs: [
            path.join(config.paths.nodeModules, 'google-closure-compiler/contrib/externs/angular-1.5.js'),
            path.join(
              config.paths.nodeModules,
              'google-closure-compiler/contrib/externs/angular-1.5-http-promise_templated.js'),
            path.join(
              config.paths.nodeModules,
              'google-closure-compiler/contrib/externs/angular-1.5-q_templated.js'),
            path.join(
              config.paths.nodeModules, 'google-closure-compiler/contrib/externs/angular-material.js'),
            path.join(
              config.paths.nodeModules, 'google-closure-compiler/contrib/externs/angular_ui_router.js'),
            path.join(
              config.paths.nodeModules,
              'google-closure-compiler/contrib/externs/angular-1.4-resource.js'),
            path.join(
              config.paths.bowerComponents,
              'cljsjs-packages-externs/d3/resources/cljsjs/d3/common/d3.ext.js'),
            path.join(
              config.paths.bowerComponents,
              'cljsjs-packages-externs/nvd3/resources/cljsjs/nvd3/common/nvd3.ext.js'),
            path.join(config.paths.frontendExterns, '**/*.js')
          ],
          generate_exports: null,
          js_module_root: path.relative('./', config.paths.frontendSrc),
          // Enable all compiler checks by default and make them errors.
          jscomp_error: '*',
          // Disable checks that are not applicable to the project.
          jscomp_off: [
            // Let ESLint handle all lint checks.
            'lintChecks',
            // This checks aren't working with current google-closure-library version. Will be deleted
            // once it's fixed there.
            'unnecessaryCasts',
            'analyzerChecks'
          ],
          language_in: 'ECMASCRIPT6_STRICT',
          language_out: 'ECMASCRIPT3',
          dependency_mode: 'LOOSE',
          use_types_for_optimization: null
        },
        compilerPath: path.join(config.paths.nodeModules, 'google-closure-compiler/compiler.jar'),
        // This makes the compiler faster. Requires Java 7+.
        tieredCompilation: true,
        fileName: 'dashboard.js'
      }))
      .pipe(angularFilesort())
      .pipe(gutil.env.devMode ? gutil.noop() : concat(config.jsFrameworkFile))
      // .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gulp.dest(paths.frameworkDist));
  });

  gulp.task('copy:framework:js', function () {
    return gulp.src(config.jsLibs)
      .pipe(sort())
      .pipe(angularFilesort())
      .pipe(gutil.env.devMode ? gutil.noop() : concat(config.jsFrameworkFile))
      .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gulp.dest(paths.frameworkDist));
  });

  gulp.task('copy:bowerjs', function () {
    return gulp.src(bowerFiles.ext('js').files)
      .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gutil.env.devMode ? gutil.noop() : concat('stackato-libs.js'))
      .pipe(gutil.env.devMode ? gutil.noop() : gulp.dest(paths.dist + 'lib'));
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
        defaultBrandFolder + 'images/*'
      ], {base: defaultBrandFolder})
      .pipe(gulp.dest(paths.dist));
  });

  // Copy the default brand's images and logo to the dist folder
  gulp.task('copy:default-brand:favicon', function () {
    return gulp
      .src(defaultBrandFolder + 'favicon.ico', {base: defaultBrandFolder})
      .pipe(gulp.dest(paths.dist + 'images'));
  });

  gulp.task('copy:theme', function () {
    return gulp
      .src(themeFiles, {base: paths.theme})
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
  gulp.task('inject:index', ['inject:index:oem'], function () {
    return gulp
      .src(paths.oem + 'dist/index.html')
      .pipe(gulpreplace('@@PRODUCT_NAME@@', oemConfig.PRODUCT_NAME))
      .pipe(gulp.dest(paths.dist));
  });

  // Inject JavaScript and SCSS source file references in index.html
  gulp.task('inject:index:oem', ['copy:index'], function () {
    var sources = gulp.src(
        plugins
        .concat(config.jsFiles)
        .concat(paths.dist + config.jsFile)
        .concat(paths.dist + config.jsTemplatesFile)
        .concat(config.cssFiles), {read: false});

    return gulp
      .src(paths.dist + 'index.html')
      .pipe(wiredep(config.bower))
      .pipe(gulpinject(sources, {relative: true}))
      .pipe(concat.header())
      .pipe(gulp.dest(paths.oem + 'dist'));
  });

  // Automatically inject SCSS file imports from Bower packages
  gulp.task('inject:scss', function () {
    return gulp
      .src(paths.src + 'framework.tmpl.scss')
      .pipe(wiredep(config.bowerDev))
      .pipe(rename('framework.scss'))
      .pipe(gulp.dest(paths.src));
  });

  // Run ESLint on 'src' folder
  gulp.task('lint', function () {
    return gulp
      .src(config.lintFiles)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
  });

  // Generate .plugin.scss file and copy to 'dist'
  gulp.task('plugin', function () {
    var CMD = 'cd ../src/plugins && ls */*.scss';
    var pluginsScssFiles = sh.exec(CMD, {silent: true})
      .output
      .trim()
      .split(/\s+/)
      .map(function (scss) {
        return '@import "' + scss + '";';
      });

    return file('.plugins.scss', pluginsScssFiles.join('\n'), {src: true})
      .pipe(gulp.dest(paths.src + 'plugins'));
  });

  // Generate the POT file to be translated
  gulp.task('translate:extract', function () {
    /* eslint-disable no-warning-comments */
    //TODO: Need to include framework templates + js
    /* eslint-enable  no-warning-comments */
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
    var callback = browserSync.active ? browserSync.reload : function () {
    };

    gulp.watch(jsSourceFiles, {interval: 1000, usePoll: true, verbose: true}, ['copy:js', callback]);
    gulp.watch([scssFiles, config.frameworkScssFiles], ['css', callback]);
    gulp.watch(partials, ['copy:html', callback]);
    gulp.watch(config.frameworkTemplates, ['copy:framework:templates', callback]);
    gulp.watch(paths.src + 'index.html', ['inject:index', callback]);
    gulp.watch(config.jsLibs, {interval: 1000, usePoll: true}, ['copy:framework:js', callback]);

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
          var url = nodeUrl.format(targetUrl) + req.url;
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

    server = fork('./server.js', [], options);
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
      'clean:dist',
      'plugin',
      'translate:compile',
      'copy:framework:templates',
      'copy:k8sComponents:templates',
      'copy:js',
      'copy:lib',
      'css',
      'dev-template-cache',
      'copy:html',
      'copy:assets',
      'copy:theme',
      'postbuild',
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
      'clean:dist',
      'plugin',
      'translate:compile',
      'copy:framework:templates',
      'copy:k8sComponents:templates',
      'js:combine',
      'copy:lib',
      'css',
      'template-cache',
      'copy:html',
      'copy:assets',
      'copy:theme',
      'postbuild',
      'inject:index',
      'oem',
      next
    );
  });
})();
