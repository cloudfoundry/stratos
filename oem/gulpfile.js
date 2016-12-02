/* eslint-disable angular/log,no-console,no-process-env,angular/json-functions */
(function () {
  'use strict';

  var gulp = require('gulp');
  var gulpif = require('gulp-if');
  var plumber = require('gulp-plumber');
  var sass = require('gulp-sass');
  var autoprefixer = require('gulp-autoprefixer');
  var gulpreplace = require('gulp-replace');
  var _ = require('lodash');
  var usePlumber = true;
  var paths = {
    src: './tmp/',
    oem: './dist/',
    dist: './tmp/'
  };

  var oemConfig = require(paths.src + 'oem_config.json');
  var defaultConfig = require('./config-defaults.json');
  oemConfig = _.defaults(oemConfig, defaultConfig);
  var OEM_CONFIG = 'OEM_CONFIG:' + JSON.stringify(oemConfig);

  gulp.task('oem', ['oem:css', 'oem:config', 'oem:html'], function () {
  });

  gulp.task('oem:html', function () {
    return gulp
      .src(paths.oem + 'index.html')
      .pipe(gulpreplace('@@PRODUCT_NAME@@', oemConfig.PRODUCT_NAME))
      .pipe(gulp.dest(paths.dist));
  });

  gulp.task('oem:config', function () {
    return gulp
      .src(paths.oem + 'stackato-config.js')
      .pipe(gulpreplace('OEM_CONFIG:{}', OEM_CONFIG))
      .pipe(gulp.dest(paths.dist));
  });

  // Compile the CSS
  gulp.task('oem:css', function () {
    return gulp.src(paths.src + 'index.scss')
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
})();
