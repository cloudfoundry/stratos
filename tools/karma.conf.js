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
      'lib/jquery/dist/jquery.js',
      'lib/angular-mocks/angular-mocks.js',

      'config.js',
      'plugins/*/plugin.config.js',

      'lib/helion-ui-framework/dist/**/*.html', {
        pattern: 'lib/helion-ui-theme/dist/images/*.png',
        watched: false,
        included: false,
        served: true,
        nocache: false
      },

      'index.module.js',
      'app/**/*.module.js',
      'app/**/!(*.mock|*.spec).js',
      'app/**/*.mock.js',
      'app/**/*.spec.js',
      'app/**/*.html',
      'plugins/**/*.module.js',
      'plugins/**/!(*.mock|*.spec).js',
      'plugins/**/*.mock.js',
      'plugins/**/*.spec.js',
      'plugins/**/*.html'
    ],

    frameworks: ['wiredep', 'jasmine'],

    ngHtml2JsPreprocessor: {
      stripPrefix: 'lib/helion-ui-framework/dist/',
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
      'karma-coverage',
      'karma-wiredep'
    ],

    preprocessors: {
      'lib/helion-ui-framework/dist/**/*.html': ['ng-html2js'],
      'app/**/*.html': ['ng-html2js'],
      'app/**/!(*.mock|*.spec).js': ['coverage'],
      'plugins/**/*.html': ['ng-html2js'],
      'plugins/**/!(*.mock|*.spec).js': ['coverage']
    },

    proxies: {
      '/lib/helion-ui-theme/dist/images/': '/base/lib/helion-ui-theme/dist/images/'
    },

    reporters: ['progress', 'coverage']
  });
};
