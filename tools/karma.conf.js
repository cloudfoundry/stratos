'use strict';

module.exports = function (config) {

  config.set({

    autoWatch: true,

    basePath: '../src/',

    browsers: ['PhantomJS'],

    coverageReporter: {
      type: 'html',
      dir: '../tools/.coverage-karma/'
    },

    files: [
      'config.js',

      'lib/angular/angular.min.js',
      'lib/helion-ui-framework/**/*.module.js',
      'lib/helion-ui-framework/**/!(*.mock|*.spec).js',
      'lib/helion-ui-framework/**/!(*.mock).html',

      'index.module.js',
      'app/**/*.module.js',
      'app/**/!(*.mock|*.spec).js',
      'app/**/*.mock.js',
      'app/**/*.spec.js',
      'app/**/*.html'
    ],

    frameworks: ['jasmine'],

    ngHtml2JsPreprocessor: {
      moduleName: 'templates'
    },

    phantomjsLauncher: {
      // Have phantomjs exit if a ResourceError is encountered
      // (useful if karma exits without killing phantom)
      exitOnResourceError: true
    },

    plugins: [
      'karma-phantomjs-launcher',
      'karma-jasmine',
      'karma-ng-html2js-preprocessor',
      'karma-coverage'
    ],

    preprocessors: {
      'app/**/*.html': ['ng-html2js'],
      'app/**/!(*.mock|*.spec).js': ['coverage']
    },

    reporters: ['progress', 'coverage']
  });
};
