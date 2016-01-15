/**
 * This stores all the configuration information for Gulp
 */
module.exports = function () {
  var paths = {
    src: '../src/',
    dist: '../dist/'
  };

  var config = {
    paths: paths,

    jsSourceFiles: [
      paths.src + '**/*.js'
    ],

    jsLibs: [
      paths.dist + 'lib/jquery/dist/jquery.js',
      paths.dist + 'lib/bootstrap/dist/js/bootstrap.js',
      paths.dist + 'lib/angular/angular.js',
      paths.dist + 'lib/angular-gettext/dist/angular-gettext.js',
      paths.dist + 'lib/angular-sanitize/angular-sanitize.js',
      paths.dist + 'lib/angular-bootstrap/ui-bootstrap.js',
      paths.dist + 'lib/angular-bootstrap/ui-bootstrap-tpls.js',
      paths.dist + 'lib/angular-ui-router/release/angular-ui-router.js',
      paths.dist + 'lib/lodash/lodash.js',
      paths.dist + 'lib/helion-ui-framework/**/*.module.js',
      paths.dist + 'lib/helion-ui-framework/**/*.js'
    ],

    plugins: [],

    jsFiles: [
      paths.dist + 'index.module.js',
      paths.dist + 'app/**/*.module.js',
      paths.dist + 'app/**/*.js',
      paths.dist + 'plugins/**/*.module.js',
      paths.dist + 'plugins/**/*.js',
      '!' + paths.dist + '**/*.mock.js',
      '!' + paths.dist + '**/*.spec.js'
    ],

    scssSourceFiles: [
      paths.src + 'index.scss'
    ],

    scssFiles: [
      paths.src + '**/*.scss'
    ],

    cssFiles: [
      paths.dist + 'index.css'
    ],

    partials: [
      paths.src + 'app/**/*.html',
      paths.src + 'plugins/**/*.html'
    ]
  };

  return config;
};
