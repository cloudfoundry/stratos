(function () {
  'use strict';

  // This stores all the configuration information for Gulp
  module.exports = function () {
    var paths = {
      dist: '../dist/',
      src: '../src/',
      translations: '../translations/',
      tools: '../tools/',
      e2e: '../e2e/',
      instrumented: '../tmp/instrumented/',
      oem: '../oem/',
      theme: '../theme/',
      examples: './examples/',
      examplesScripts: './examples/scripts/',
      examplesDist: './examples/dist/',
      browserSyncDist: '../dist',
      i18n: '../i18n/',
      i18nDist: '../dist/i18n/'
    };

    return {
      bower: {
        bowerJson: require('./bower.json'),
        directory: '../src/lib/',
        ignorePath: '../src/',
        exclude: [/.js$/, 'jquery.js'],
        overrides: {
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

      bowerDev: {
        bowerJson: require('./bower.json'),
        directory: '../src/lib/',
        ignorePath: '../src/',
        devDependencies: false
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

      i18nFiles: [
        paths.i18n + '**/*.json'
      ],

      assetFiles: [
        paths.src + 'app/**/assets/**/*',
        paths.src + 'plugins/**/assets/**/*'
      ],

      themeFiles: [
        paths.theme + '**/*',
        '!' + paths.theme + '**/*.scss'
      ],

      cssFiles: [
        paths.dist + 'index.css'
      ],

      templatePaths: [
        paths.src + '**/app/**/*.html',
        paths.src + '**/plugins/**/*.html',
        paths.src + '**/framework/**/*.html'
      ],

      svgPaths: [
        paths.theme + '**/*.svg',
        '!' + paths.theme + 'fonts/**/*.svg'
      ],

      jsFiles: [
        paths.dist + 'lib/*.js',
        paths.dist + 'framework/**/*.module.js',
        paths.dist + 'framework/**/*.js',
        paths.dist + 'plugins/**/plugin.config.js',
        paths.dist + 'index.module.js',
        paths.dist + 'app/**/*.module.js',
        paths.dist + 'app/**/*.js',
        paths.dist + 'plugins/**/*.module.js',
        paths.dist + 'plugins/**/*.js'
        // ,
        // '!' + paths.dist + '**/*.mock.js',
        // '!' + paths.dist + '**/*.spec.js'
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
        // '!' + paths.src + 'app/**/*.mock.js',
        // '!' + paths.src + 'app/**/*.spec.js',
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
        '!' + paths.src + 'plugins/code-engine/api/hce/**/*.js',
        '!' + paths.src + 'plugins/code-engine/api/vcs/**/*.js',
        '!' + paths.src + 'plugins/cloud-foundry/api/**/*.js',
        '!' + paths.src + 'framework/**/*.spec.js',
        '!' + paths.src + 'framework/**/*.mock.js',
        '!' + paths.src + 'framework/utils/wheel-handler/*.js',
        '!' + paths.src + 'framework/widgets/ring-chart/*.js'
      ],

      // Sacrifice all inclusive with exclusions for explicit declaration of directories saves ~10s per run
      lintFiles: [
        paths.src + '*.js',
        paths.src + 'app/**/*.js',
        paths.src + 'plugins/**/*.js',
        '!' + paths.src + 'plugins/cloud-foundry/test/unit/api/*.mock.js',
        '!' + paths.src + 'plugins/cloud-foundry/api/**/*',
        paths.src + 'framework/**/*.js',
        paths.tools + '*.js',
        paths.tools + 'test-backend/*.js',
        paths.tools + 'test-backend/api/**/*.js',
        paths.tools + 'test-backend/config/**/*.js',
        paths.tools + 'test-backend/data/**/*.js',
        paths.e2e + '**/*.js'
      ],

      themeScssFiles: [
        paths.theme + '**/*.scss'
      ],

      scssFiles: [
        paths.src + '*.scss',
        paths.src + 'app/**/*.scss',
        paths.src + 'plugins/**/*.scss'
      ],

      scssSourceFiles: [
        paths.src + 'index.scss'
      ],

      paths: paths,

      plugins: [],

      translate: {
        dist: paths.dist + 'translations',
        js: paths.translations + 'js',
        options: {},
        po: paths.translations + 'po/**/*.po',
        pot: paths.translations + 'stratos.pot'
      }
    };
  };
})();
