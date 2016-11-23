/* eslint-disable angular/log,no-console,no-process-env */
(function () {
  'use strict';

  var gulp = require('gulp');
  var gulpif = require('gulp-if');
  var plumber = require('gulp-plumber');
  var sass = require('gulp-sass');
  var usePlumber = true;
  var paths = {
    scss: './tmp/',
    dist: './tmp/'
  };

  // Compile the CSS
  gulp.task('oem', function () {
    return gulp.src(paths.scss + 'index.scss')
      .pipe(gulpif(usePlumber, plumber({
        errorHandler: function (err) {
          console.log(err);
          this.emit('end');
        }
      })))
      .pipe(sass())
      //.pipe(autoprefixer({browsers: ['last 2 versions'], cascade: false}))
      //.pipe(rename(config.projectName + '.css'))
      .pipe(gulp.dest(paths.dist));
  });
})();
