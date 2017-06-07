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
    components: './components/',
    backendOutput: './outputs/',
    ui: './ui'

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
//            'assets/stylesheets/_bootstrap.scss'
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

    cssFiles: [
      paths.dist + 'index.css'
    ],

    jsFile: 'console-console.js',

    jsLibsFile: 'console-libs.js',

    jsTemplatesFile: 'console-templates.js',

    // Files that should be run through the linter
    lintFiles: [
      paths.components + '**/*.js',
      '!' + paths.components + '**/*.mock.js',
      paths.build + '*.js',
      paths.e2e + '**/*.js'
    ],

    paths: paths
  };
})();
