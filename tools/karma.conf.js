(function () {
  'use strict';

  var path = require('path');

  module.exports = function (config) {

    var reportPath = path.resolve(__dirname, '..', 'out/coverage-report');

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
        'tools/console-templates.js',

        'src/config.js',
        'src/plugins/*/plugin.config.js',

        'theme/**/*.svg',
        'tools/unit-test-helpers.js',

        {
          pattern: 'dist/i18n/*.json',
          watched: false,
          included: false,
          served: true,
          nocache: false
        },
        {
          pattern: 'theme/images/*.png',
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

        // Ignore for now - suppresses warning when running tests as we don't have any mocks'
        'src/framework/**/*.module.js',
        'src/framework/**/!(*.mock|*.spec).js',
        'src/framework/**/*.spec.js',
        'src/framework/**/*.html',
        //'framework/src/**/*.mock.js',

        'src/index.module.js',

        'src/app/**/*.module.js',
        'src/app/**/*.js',
        'src/app/**/*.html',

        'src/plugins/**/*.module.js',
        'src/plugins/**/!(*.mock|*.spec).js',
        'src/plugins/**/*.mock.js',
        'src/plugins/**/*.spec.js',
        'src/plugins/**/*.html',

        'test/unit/**/*.mock.js',
        'test/unit/**/*.spec.js'
      ],

      frameworks: ['wiredep', 'jasmine'],

      ngHtml2JsPreprocessor: {
        moduleName: 'templates',

        cacheIdFromPath: function (filePath) {
          if (filePath.indexOf('src/') === 0) {
            return filePath.substr(4);
          } else if (filePath.indexOf('theme/') === 0) {
            return filePath.substr(6);
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
        'karma-wiredep',
        require('./karma-ngannotate')
      ],

      preprocessors: {
        'theme/**/*.svg': ['ng-html2js'],
        'src/framework/**/*.html': ['ng-html2js'],
        'src/framework/**/!(*.mock|*.spec).js': ['ngannotate', 'coverage'],
        'src/app/**/*.html': ['ng-html2js'],
        'src/app/**/!(*.mock|*.spec).js': ['ngannotate', 'coverage'],
        'src/plugins/**/*.html': ['ng-html2js'],
        'src/plugins/cloud-foundry/!(api)/**/!(*.mock|*.spec).js': ['ngannotate', 'coverage'],
        'src/plugins/cloud-foundry/api/vcs/*.js': ['ngannotate', 'coverage'],
        'src/plugins/github/**/!(*.mock|*.spec).js': ['ngannotate', 'coverage'],
        'src/plugins/service-manager/!(api)/**/!(*.mock|*.spec).js': ['coverage'],
        'src/plugins/code-engine/!(api)/**/!(*.mock|*.spec).js': ['coverage']
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
