(function () {
  'use strict';

  var gutil = require('gulp-util');

  var deps = {};

  module.exports = {
    get: function (string) {
      if (gutil.env.devMode && !deps[string]) {
        deps[string] = require(string);
      }
      return deps[string];
    }
  };

})();
