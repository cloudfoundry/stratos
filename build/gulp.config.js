(function () {
  'use strict';

  // This stores all the configuration information for Gulp
  var paths = {
    dist: './dist/',
    ui: './ui'
  };

  // Now returned as an object so require always returns same object
  module.exports = {
    paths: paths
  };
})();
