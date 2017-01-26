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
      theme: '../framework/theme/',
      framework: '../framework/',
      k8sDashboard: '../dashboard/',
      frameworkDist: '../dist/framework/',
      examples: '../framework/examples/',
      examplesScripts: '../framework/examples/scripts/',
      examplesDist: '../framework/examples/dist/',
      browserSyncDist: '../dist',
      nodeModules: './node_modules/',
      bowerComponents: '../src/lib/',
      frontendSrc: '../dashboard/src/app/frontend/',
      k8sComponentDistPath: '../dist/common/components/',
      frontendExterns: '../dashboard/src/app/externs/'
    }

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
        paths.src + '../framework/src/**/*.html',
        paths.src + '../framework/theme/**/*.svg'
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
        paths.dist + 'plugins/**/*.js',
        '!' + paths.dist + '**/*.mock.js',
        '!' + paths.dist + '**/*.spec.js'
      ],

      jsFile: 'stackato-console.js',

      jsTemplatesFile: 'stackato-templates.js',

      jsFrameworkFile: 'stackato-framework.js',

      jsLibs: [
        paths.framework + 'src/**/*.module.js',
        paths.framework + 'src/**/*.js',
        '!' + paths.framework + 'src/**/*.spec.js',
        '!' + paths.framework + 'src/**/*.mock.js'
      ],

      jsComponentLibs: [
        paths.k8sDashboard + 'src/app/frontend/**/*.js',
        paths.bowerComponents + 'google-closure-library/closure/goog/base.js'
      ],

      jsSourceFiles: [
        paths.src + '*.js',
        paths.src + 'app/**/*.js',
        paths.src + 'plugins/**/*.js',
        '!' + paths.src + 'config.js',
        '!' + paths.src + 'app/**/*.mock.js',
        '!' + paths.src + 'app/**/*.spec.js',
        '!' + paths.src + 'plugins/**/*.mock.js',
        '!' + paths.src + 'plugins/**/*.spec.js'
      ],

      sourceFilesToInstrument: [
        paths.src + '*.js',
        paths.src + 'app/**/*.js',
        paths.src + 'plugins/**/*.js',
        '!' + paths.src + 'config.js',
        '!' + paths.src + 'app/**/*.mock.js',
        '!' + paths.src + 'app/**/*.spec.js',
        '!' + paths.src + 'plugins/**/*.mock.js',
        '!' + paths.src + 'plugins/**/*.spec.js',
        '!' + paths.src + 'plugins/cloud-foundry/api/hce/**/*.js',
        '!' + paths.src + 'plugins/cloud-foundry/api/hcf/**/*.js'
      ],

      frameworkFilesToInstrument: [
        paths.framework + 'src/**/*.module.js',
        paths.framework + 'src/**/*.js',
        '!' + paths.framework + 'src/**/*.spec.js',
        '!' + paths.framework + 'src/**/*.mock.js',
        '!' + paths.framework + 'src/utils/wheel-handler/*.js',
        '!' + paths.framework + 'src/widgets/ring-chart/*.js'
      ],

      // Sacrifice all inclusive with exclusions for explicit declaration of directories saves ~10s per run
      lintFiles: [
        paths.src + '*.js',
        paths.src + 'app/**/*.js',
        paths.src + 'plugins/**/*.js',
        '!' + paths.src + 'plugins/cloud-foundry/api/hcf/**/*',
        paths.tools + '*.js',
        paths.tools + 'test-backend/*.js',
        paths.tools + 'test-backend/api/**/*.js',
        paths.tools + 'test-backend/config/**/*.js',
        paths.tools + 'test-backend/data/**/*.js',
        paths.e2e + '**/*.js',
        paths.framework + 'src/**/*.js'
      ],

      frameworkFiles: [
        paths.framework + 'theme/**/*',
        paths.examples + 'scripts/**/*'
      ],

      frameworkTemplates: [
        paths.framework + 'src/**/*.html'
      ],
      k8sCommonComponentsTemplates: [
        paths.frontendSrc + 'common/components/**/*.html'
      ],

      frameworkScssFiles: [
        paths.framework + '**/*.scss'
      ],

      scssFiles: [
        paths.src + '*.scss',
        paths.src + 'app/**/*.scss',
        paths.src + 'plugins/**/*.scss'
      ],

      scssSourceFiles: [
        paths.src + 'index.scss'
      ],

      partials: [
        paths.src + 'app/**/*.html',
        paths.src + 'plugins/**/*.html'
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
