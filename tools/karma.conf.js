(function () {
  'use strict';

  var path = require('path');

  module.exports = function (config) {

    var reportPath = path.resolve(__dirname, '..', 'coverage-report');

    config.set({

      autoWatch: true,

      basePath: '../',

      browserDisconnectTimeout: 10000,

      browserNoActivityTimeout: 20000,

      browsers: ['PhantomJS'],

      coverageReporter: {
        dir: reportPath,
        reporters: [
          { type: 'html', subdir: 'unit' },
         { type: 'json', subdir: '_json', file: 'unit-coverage.json' }
        ]
      },

      files: [
        'src/lib/jquery/dist/jquery.js',
        'tools/node_modules/jasmine-jquery/lib/jasmine-jquery.js',
        'src/lib/angular-mocks/angular-mocks.js',
        'src/lib/angular-link-header-parser/release/angular-link-header-parser.min.js',
        'tools/stackato-templates.js',

        'src/config.js',
        'src/plugins/*/plugin.config.js',

        'tools/unit-test-helpers.js',

        'framework/**/*.html',
        'framework/theme/**/*.svg',
        {
          pattern: 'dist/i18n/*.json',
          watched: false,
          included: false,
          served: true,
          nocache: false
        },
        {
          pattern: 'framework/theme/images/*.png',
          watched: false,
          included: false,
          served: true,
          nocache: false
        },
        {
          pattern: 'oem/brands/hpe/images/*.png',
          watched: false,
          included: false,
          served: true,
          nocache: false
        },
        {
          pattern: 'src/plugins/cloud-foundry/view/assets/**/*.png',
          watched: false,
          included: false,
          served: true,
          nocache: false
        },

        'framework/src/**/*.module.js',
        'framework/src/**/!(*.mock|*.spec).js',
        // Ignore for now - suppresses warning when running tests as we don't have any mocks'
        //'framework/src/**/*.mock.js',
        'framework/src/**/*.spec.js',

        'src/index.module.js',
        'src/app/**/*.module.js',
        'src/app/**/!(*.mock|*.spec).js',
        'src/app/**/*.mock.js',
        'src/app/**/*.spec.js',
        'src/app/**/*.html',
        'src/plugins/**/*.module.js',
        'src/plugins/**/!(*.mock|*.spec).js',
        'src/plugins/**/*.mock.js',
        'src/plugins/**/*.spec.js',
        'src/plugins/**/*.html'
      ],

      frameworks: ['wiredep', 'jasmine'],

      ngHtml2JsPreprocessor: {
        moduleName: 'templates',

        cacheIdFromPath: function (filePath) {
          if (filePath.indexOf('src/') === 0) {
            return filePath.substr(4);
          } else if (filePath.indexOf('framework/src/') === 0) {
            return filePath.substr(14);
          } else if (filePath.indexOf('framework/theme/') === 0) {
            return filePath.substr(16);
          } else {
            return filePath;
          }
        }
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
        'framework/theme/**/*.svg': ['ng-html2js'],
        'framework/src/**/*.html': ['ng-html2js'],
        'framework/src/**/!(*.mock|*.spec).js': ['coverage'],
        'src/app/**/*.html': ['ng-html2js'],
        'src/app/**/!(*.mock|*.spec).js': ['coverage'],
        'src/plugins/**/*.html': ['ng-html2js'],
        'src/plugins/cloud-foundry/!(api)/**/!(*.mock|*.spec).js': ['coverage'],
        'src/plugins/cloud-foundry/api/vcs/*.js': ['coverage'],
        'src/plugins/github/**/!(*.mock|*.spec).js': ['coverage']
      },

      proxies: {
        '/images/': '/base/oem/brands/hpe/images/',
        '/svg/': '/base/framework/theme/svg/',
        '/plugins/cloud-foundry/view/assets/': '/base/src/plugins/cloud-foundry/view/assets/',
        '/app/view/assets/': '/base/app/view/assets/'
      },

      reporters: ['progress', 'coverage']
    });
  };
})();
