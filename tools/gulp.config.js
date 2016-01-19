/**
 * This stores all the configuration information for Gulp
 */
module.exports = function () {
  var paths = {
    src: '../src/',
    dist: '../dist/'
  };

  var config = {
    bower: {
      bowerJson: require('./bower.json'),
      directory: '../src/lib/',
      ignorePath: '../src/'
    },

    cssFiles: [
      paths.dist + 'index.css'
    ],

    jsFiles: [
      paths.dist + 'index.module.js',
      paths.dist + 'app/**/*.module.js',
      paths.dist + 'app/**/*.js',
      paths.dist + 'plugins/**/*.module.js',
      paths.dist + 'plugins/**/*.js',
      '!' + paths.dist + '**/*.mock.js',
      '!' + paths.dist + '**/*.spec.js'
    ],

    jsLibs: [
      paths.dist + 'lib/helion-ui-framework/**/*.module.js',
      paths.dist + 'lib/helion-ui-framework/**/*.js'
    ],

    jsSourceFiles: [
      paths.src + '**/*.js'
    ],

    scssFiles: [
      paths.src + '**/*.scss'
    ],

    scssSourceFiles: [
      paths.src + 'index.scss'
    ],

    partials: [
      paths.src + 'app/**/*.html',
      paths.src + 'plugins/**/*.html'
    ],

    paths: paths,

    plugins: []
  };

  return config;
};
