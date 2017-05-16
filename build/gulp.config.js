(function () {
  'use strict';

  // This stores all the configuration information for Gulp
  var paths = {
    dist: './dist/',
    src: './src/',
    lib: './bower_components',
    translations: './translations/',
    tools: './tools/',
    build: './build/',
    e2e: './test/e2e/',
    instrumented: './tmp/instrumented/',
    oem: './oem/',
    theme: './theme/',
    examples: './tools/examples/',
    examplesScripts: './tools/examples/scripts/',
    examplesDist: './tools/examples/dist/',
    browserSyncDist: './dist',
    i18nDist: './dist/i18n/',
    components: './components/'
  };

  // Now returned as an object so require always returns same object
  module.exports = {
    bower: {
      bowerJson: require('../bower.json'),
      directory: './bower_components/',
      ignorePath: './src/',
      exclude: [/.js$/],
      overrides: {
        angular: {
          dependencies: {
            jquery: '*'
          }
        },
        'angular-link-header-parser': {
          main: ['release/angular-link-header-parser.min.js']
        },
        'angular-toastr': {
          main: [
            './dist/angular-toastr.tpls.js'
          ]
        },
        lodash: {
          main: [
            './lodash.js'
          ]
        },
        'bootstrap-sass': {
          main: [
            'assets/stylesheets/_bootstrap.scss'
          ]
        }
      }
    },

    browserSyncPort: 3100,

    istanbul: {
      instrumentation: {
        'include-all-sources': true,
        variable: '__coverage__'
      },
      includeUntested: true,
      coverageVariable: '__coverage__'
    },

    assetFiles: [
      paths.src + 'app/**/assets/**/*',
      paths.src + 'plugins/**/assets/**/*'
    ],

    cssFiles: [
      paths.dist + 'index.css'
    ],

    jsFiles: [
      paths.dist + 'framework/**/*.module.js',
      paths.dist + 'framework/**/*.js',
      paths.dist + 'plugins/**/plugin.config.js',
      paths.dist + 'index.module.js',
      paths.dist + 'app/**/*.module.js',
      paths.dist + 'app/**/*.js',
      paths.dist + 'plugins/**/*.module.js',
      paths.dist + 'plugins/**/*.js',
      '!' + paths.dist + '**/*.mock.js',
      '!' + paths.dist + '**/*.spec.js'
    ],

    jsFile: 'console-console.js',

    jsLibsFile: 'console-libs.js',

    jsTemplatesFile: 'console-templates.js',

    jsSourceFiles: [
      paths.src + '*.js',
      paths.src + 'app/**/*.js',
      paths.src + 'plugins/**/*.js',
      paths.src + 'framework/**/*.js',
      '!' + paths.src + 'config.js',
      '!' + paths.src + 'plugins/**/*.mock.js',
      '!' + paths.src + 'plugins/**/*.spec.js',
      '!' + paths.src + 'framework/**/*.mock.js',
      '!' + paths.src + 'framework/**/*.spec.js'
    ],

    sourceFilesToInstrument: [
      paths.src + '*.js',
      paths.src + 'app/**/*.js',
      paths.src + 'plugins/**/*.js',
      paths.src + 'framework/**/*.js',
      '!' + paths.src + 'config.js',
      '!' + paths.src + 'app/**/*.mock.js',
      '!' + paths.src + 'app/**/*.spec.js',
      '!' + paths.src + 'plugins/**/*.mock.js',
      '!' + paths.src + 'plugins/**/*.spec.js',
      '!' + paths.src + 'plugins/*/api/**/*.js',
      '!' + paths.src + 'framework/**/*.spec.js',
      '!' + paths.src + 'framework/**/*.mock.js',
      '!' + paths.src + 'framework/utils/wheel-handler/*.js',
      '!' + paths.src + 'framework/widgets/ring-chart/*.js'
    ],

    // Files that should be run through the linter
    lintFiles: [
      paths.components + '**/*.js',
      '!' + paths.components + '**/*.mock.js',
      // paths.src + 'app/**/*.js',
      // paths.src + 'plugins/**/!(*.mock).js',
      // '!' + paths.src + 'plugins/*/api/**/*.js',
      // paths.src + 'framework/**/*.js',
      paths.build + '*.js',
      paths.build + 'test-backend/*.js',
      paths.build + 'test-backend/api/**/*.js',
      paths.build + 'test-backend/config/**/*.js',
      paths.build + 'test-backend/data/**/*.js',
      paths.e2e + '**/*.js'
    ],

    scssSourceFiles: [
      paths.src + 'index.scss'
    ],

    paths: paths

  };
})();
