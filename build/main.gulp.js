/* eslint-disable angular/log,no-console,no-process-env,angular/json-functions,no-sync */
(function () {
  'use strict';

  var _ = require('lodash');
  var angularFilesort = require('gulp-angular-filesort');
  var autoprefixer = require('gulp-autoprefixer');
  var concat = require('gulp-concat-util');
  var del = require('delete');
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
  var plumber = require('gulp-plumber');
  var rename = require('gulp-rename');
  var runSequence = require('run-sequence');
  var sass = require('gulp-sass');
  var sort = require('gulp-sort');
  var templateCache = require('gulp-angular-templatecache');
  var uglify = require('gulp-uglify');
  var utils = require('./utils');
  var wiredep = require('wiredep').stream;
  var i18n = require('./i18n.gulp');
  var cleanCSS = require('gulp-clean-css');
  var config = require('./gulp.config');
  // Pull in the gulp tasks for e2e tests
  require('./e2e.gulp');

  var paths = config.paths;
  var localComponents, assetFiles, i18nFiles, jsSourceFiles, pluginFiles,
    templateFiles, scssFiles, server, usePlumber, mainBowerFile, bowerFiles, components, browserSync;
  var packageJson = require('../package.json');

  function initialize() {
    // bower install won't update our local path components files, do this ourselves as a full install takes a while
    // this will also remove any components that are no longer referenced in the bower.json
    components = require('./components');
    components.syncLocalPathComponents();
    components.initialize();

    localComponents = components.getGlobs('**/*.*');
    i18nFiles = components.getGlobs('i18n/**/*.json');
    assetFiles = components.getGlobs('assets/**/*');
    pluginFiles = components.getGlobs('src/plugin.config.js');
    jsSourceFiles = components.getGlobs(['src/**/*.module.js', 'src/**/*.js', '!src/**/*.spec.js']);
    templateFiles = components.getGlobs(['src/**/*.html']);
    scssFiles = components.getGlobs(['src/**/*.scss']);
  }

  gulp.task('prepare-frontend', function (next) {
    initialize();

    usePlumber = true;

    var bowerConfig = components.getWiredep();
    delete bowerConfig.exclude;
    bowerFiles = require('wiredep')(bowerConfig);
    mainBowerFile = path.resolve('./bower.json');
    next();
  });

  // Clean dist dir
  gulp.task('clean', function (next) {
    del(paths.dist + '**/*', {force: true}, next);
  });

  // Legacy task name
  gulp.task('clean:dist', ['clean']);

  // Copy HTML files to 'dist'
  // This is only used for development builds
  gulp.task('copy:html', function () {
    return gulp.src(templateFiles.bowerFull)
      .pipe(rename(components.transformDirname))
      .pipe(gulp.dest(paths.dist));
  });

  // Copy JavaScript source files to 'dist'
  gulp.task('copy:js', ['copy:configjs', 'copy:bowerjs'], function () {
    return gulp.src(jsSourceFiles.bowerFull)
      .pipe(sort())
      .pipe(angularFilesort())
      .pipe(ngAnnotate({
        single_quotes: true
      }))
      .pipe(gutil.env.devMode ? gutil.noop() : concat(config.jsFile))
      .pipe(!gutil.env.devMode ? gutil.noop() : rename(components.transformDirname))
      .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gulp.dest(paths.dist));
  });

  // Copy 'bower_components' folder to 'dist'
  // This is only used for development builds
  gulp.task('copy:lib', function (done) {
    utils.copyBowerFolder(paths.lib, paths.dist + 'bower_components');
    done();
  });

  // Copy JavaScript config file to 'dist'
  gulp.task('copy:configjs', function () {
    var buildConfig = components.getBuildConfig();
    var configFiles = _.concat([paths.build + 'config.js'], pluginFiles.bower);
    return gulp
      .src(configFiles)
      .pipe(concat('console-config.js'))
      .pipe(gulpreplace('@@MAIN_PLUGIN@@', buildConfig.main || ''))
      .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gulp.dest(paths.dist));
  });

  // Combine all of the bower js dependencies into a single lib file that we can include
  // This is only used for production builds
  gulp.task('copy:bowerjs', function () {
    return gulp.src(bowerFiles.js)
      .pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gutil.env.devMode ? gutil.noop() : concat(config.jsLibsFile))
      .pipe(gutil.env.devMode ? gutil.noop() : gulp.dest(paths.dist));
  });

  gulp.task('copy:assets', function () {
    return gulp
      .src(assetFiles.bower)
      .pipe(gulp.dest(paths.dist));
  });

  // Compile SCSS to CSS
  gulp.task('css:generate', function () {
    var scssFile = './bower_components/index.scss';
    utils.generateScssFile('./bower_components/index.scss', components.findMainFile('**/*.scss'), components.getBowerFolder());
    return gulp
      .src(scssFile)
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
    var cssFiles = bowerFiles.css;
    cssFiles.push(path.join(paths.dist, 'index.css'));
    return gulp.src(cssFiles)
      .pipe(concat('index.css'))
      .pipe(cleanCSS({}))
      .pipe(gulp.dest(paths.dist));
  });

  // Put all of the html templates into an angular module that preloads them when the app loads
  gulp.task('template-cache', function () {
    return gulp.src(templateFiles.bowerFull)
      .pipe(sort())
      .pipe(templateCache(config.jsTemplatesFile, {
        module: 'console-templates',
        standalone: true,
        transformUrl: components.transformPath
      }))
      .pipe(uglify())
      .pipe(gulp.dest(paths.dist));
  });

  // In dev we do not use the cached templates, so we need an empty angular module
  // for the templates so the dependency is still met
  // This is only used for development builds
  gulp.task('dev-template-cache', function () {
    return gulp.src('./build/' + config.jsTemplatesFile)
      .pipe(gulp.dest(paths.dist));
  });

  // Copy index.html to 'dist'
  gulp.task('copy:index', function () {
    return gulp
      .src(components.findMainFile('**/index.html'))
      .pipe(gulp.dest(paths.dist));
  });

  // Inject JavaScript and SCSS source file references in index.html
  gulp.task('inject:index', ['i18n', 'copy:index'], function () {
    var distPath = path.resolve(__dirname, '..', paths.dist);
    var enStrings = require(path.join(distPath, 'i18n', 'locale-en_US.json'));
    var jsDevFiles = [];
    if (gutil.env.devMode) {
      jsDevFiles = components.getGlobs([
        'plugin.config.js',
        '**/*.module.js',
        '**/*.js',
        '!**/*.spec.js'
      ]).dist;
    }

    var sources = gulp.src(
      jsDevFiles
        .concat(paths.dist + config.jsLibsFile)
        .concat(paths.dist + config.jsFile)
        .concat(paths.dist + config.jsTemplatesFile)
        .concat(config.cssFiles), {read: false});

    return gulp
      .src(path.join(distPath, 'index.html'))
      .pipe(wiredep(components.getWiredep()))
      .pipe(gulpinject(sources, {relative: true}))
      .pipe(concat.header())
      .pipe(gulpreplace('@@PRODUCT_NAME@@', enStrings.product.name))
      .pipe(gulp.dest(paths.dist));
  });

  // Run ESLint on all source in the components folder as well as the build files and e2e tests
  gulp.task('lint', function () {
    var eslint = require('gulp-eslint');
    var lintFiles = config.lintFiles;
    return gulp
      .src(lintFiles)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
  });

  // Prepare required artifacts for the unit tests
  gulp.task('unit:prepare', function (next) {
    runSequence(
      'prepare-frontend',
      'i18n',
      'template-cache',
      'copy:assets',
      next
    );
  });

  // By default running the unit tests only tests those components included in bower.json
  // This task re-writes bower.json to include all components in the components folder
  gulp.task('unit:update-bower', function (done) {
    var local = components.findLocalPathComponentFolders();
    var bower = components.getBowerConfig();
    _.assign(bower.dependencies, local);
    fs.writeFileSync('./bower.json', JSON.stringify(bower, null, 2), 'utf-8');
    done();
  });

  gulp.task('i18n', function () {
    var productVersion = {product: {version: utils.getMajorMinor(packageJson.version)}};
    return gulp.src(i18nFiles.bower)
      .pipe(i18n(gutil.env.devMode, productVersion))
      //.pipe(gutil.env.devMode ? gutil.noop() : uglify())
      .pipe(gulp.dest(paths.i18nDist));
  });

  // Gulp watch JavaScript, SCSS and HTML source files
  // Task is used by dev task. Don't use externally.
  gulp.task('watch', function () {

    var callback = browserSync.active ? browserSync.reload : function () {
    };

    // Watch the local components folders and copy only the changed file to the corresponding location in bower_components
    // The other watches are then watching for changes to those files
    gulp.watch(localComponents.local, function (vfs) {
      if (vfs.type === 'changed') {
        var destPath = path.sep === '/' ? vfs.path.replace('/components/', '/bower_components/') : vfs.path.replace('\\components\\', '\\bower_components\\');
        fsx.copySync(vfs.path, destPath);
      }
    });

    gulp.watch(jsSourceFiles.bower, {interval: 1000, usePoll: true, verbose: true}, ['copy:js', callback]);
    gulp.watch(scssFiles.bower, ['css', callback]);
    gulp.watch(i18nFiles.bower, ['i18n', callback]);
    gulp.watch(assetFiles.bower, ['copy:assets', callback]);
    gulp.watch(templateFiles.bower, ['copy:html', callback]);
    gulp.watch(components.findMainFile('index.html'), ['inject:index', callback]);
    // Watch main bower file for changes
    gulp.watch(mainBowerFile, ['build-config', callback]);
  });

  gulp.task('build-config', function (next) {
    usePlumber = false;
    runSequence(
      'dev-build',
      next
    );
  });

  gulp.task('browsersync', function (callback) {
    browserSync = require('browser-sync').create();
    var request = require('request');
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
          var p = proxiedRequest(url);
          p.on('error', function (e) {
            gutil.log(e);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.write(e.toString());
            res.end();
          });
          req.pipe(p).pipe(res);
        }
      };
      middleware.push(proxyMiddleware);
    } catch (e) {
      throw new gutil.PluginError('browsersync', 'dev_config.json file is required with portal-proxy(pp) endpoint' +
        'configuration');
    }

    browserSync.init({
      server: {
        // baseDir: '.',
        // routes: {
        //   '/bower_components': 'bower_components',
        //   '/': 'dist'
        // },
        baseDir: ['./bower_components', paths.browserSyncDist],
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

  gulp.task('start-server', function (cb) {
    var options = {};
    options.env = _.clone(process.env);
    options.env.NODE_ENV = 'development';
    options.env.client_folder = paths.browserSyncDist;
    options.env.client_port = config.browserSyncPort;
    options.env.client_logging = config.disableServerLogging || false;

    server = fork(path.join(__dirname, 'server.js'), [], options);
    cb();
  });

  gulp.task('stop-server', function () {
    if (server) {
      server.kill();
      server = undefined;
    }
  });

  // Development build
  gulp.task('dev-build', function (next) {
    gutil.env.devMode = true;
    delete config.bower.exclude;
    usePlumber = false;
    runSequence(
      'clean',
      'prepare-frontend',
      'copy:js',
      'copy:lib',
      'css',
      'i18n',
      'dev-template-cache',
      'copy:html',
      'copy:assets',
      'inject:index',
      next
    );
  });

  // Create a development build and run in browsersync for development
  gulp.task('dev', ['dev-build'], function () {
    runSequence('browsersync', 'watch');
  });

  // Create a production build and run in a static server
  gulp.task('run', ['build'], function () {
    runSequence('start-server');
  });

  // Default task is to build for production
  gulp.task('default', ['build']);

  // Production build
  gulp.task('build', function (next) {
    usePlumber = false;
    runSequence(
      'clean',
      'prepare-frontend',
      'copy:js',
      'css',
      'i18n',
      'template-cache',
      'copy:assets',
      'inject:index',
      next
    );
  });
})();
