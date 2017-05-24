(function () {
  'use strict';

  // From: https://github.com/idanush/karma-ngannotate-preprocessor
  // Brought in here to ensure the latest ng-annoate is used

  var path = require('path');
  var ngAnnotate = require('ng-annotate');

  var createPreprocesor = function () {
    return function (content, file, done) {
      if (path.extname(file.originalPath) !== '.js') {
        return done(content);
      }

      var output;
      try {
        output = ngAnnotate(content, {
          add: true,
          single_quotes: true
        });
        done(output.src);
      } catch (e) {
        done(output.errors);
      }

    };
  };

  createPreprocesor.$inject = ['logger'];

  // PUBLISH DI MODULE
  module.exports = {
    'preprocessor:ngannotate': ['factory', createPreprocesor]
  };
})();
