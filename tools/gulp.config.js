'use strict';

/**
 * This stores all the configuration information for Gulp
 */
module.exports = function () {
  var paths = {
    dist: '../dist/',
    src: '../src/',
    translations: '../translations/'
  };

  var config = {
    bower: {
      bowerJson: require('./bower.json'),
      directory: '../src/lib/',
      ignorePath: '../src/',
  	  overrides: {
  	    "angular-link-header-parser": {
		  "main": [ "release/angular-link-header-parser.min.js" ]
        }
      }
	},

	bowerDev: {
      bowerJson: require('./bower.json'),
      directory: '../src/lib/',
      ignorePath: '../src/',
      devDependencies: false
	},

  assetFiles: [
    paths.src + 'plugins/**/assets/**/*'
  ],

    cssFiles: [
      paths.dist + 'index.css'
    ],

    jsFiles: [
      paths.dist + 'plugins/**/plugin.config.js',
      paths.dist + 'index.module.js',
      paths.dist + 'app/**/*.module.js',
      paths.dist + 'app/**/*.js',
      paths.dist + 'plugins/**/*.module.js',
      paths.dist + 'plugins/**/*.js',
      '!' + paths.dist + '**/*.mock.js',
      '!' + paths.dist + '**/*.spec.js'
    ],

    jsLibs: [
      paths.dist + 'lib/helion-ui-framework/src/**/*.module.js',
      paths.dist + 'lib/helion-ui-framework/src/**/*.js'
    ],

    jsSourceFiles: [
      paths.src + '*.js',
      paths.src + 'app/**/*.js',
      paths.src + 'plugins/**/*.js',
      '!' + paths.src + 'app/**/*.mock.js',
      '!' + paths.src + 'app/**/*.spec.js',
      '!' + paths.src + 'plugins/**/*.mock.js',
      '!' + paths.src + 'plugins/**/*.spec.js'
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

  return config;
};
