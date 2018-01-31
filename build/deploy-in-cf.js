(function () {
  'use strict';

  var config = require('./gulp.config');
  var paths = config.paths;

  var gulp = require('gulp');

  gulp.task('move-backend', function () {
    return gulp.src(paths.backendOutput + '**/*')
      .pipe(gulp.dest('./'));
  });
  gulp.task('deploy:cf', gulp.series('move-backend', function () {
    return gulp.src(paths.dist + '**/*.*')
      .pipe(gulp.dest(paths.ui));
  }));

})();
