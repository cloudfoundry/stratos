/* eslint-disable angular/di,angular/document-service,no-sync, new-parens */
(function () {
  'use strict';

  var waitPlugin = require('./waitPlugin');
  var istanbul = require('istanbul');
  var _ = require('lodash');
  var collector = new istanbul.Collector();
  var protractor = require('protractor');
  var q = protractor.promise;
  var path = require('path');
  var fs = require('fs');
  var protractorConfig = require('./protractor.conf');
  var gutil = require('gulp-util');
  var components = require('./components');

  var basePath = path.resolve('.');
  var distPath = path.join(basePath, 'dist') + path.sep;

  exports.config = protractorConfig.config;
  var onPrepare = exports.config.onPrepare;
  exports.config.plugins = [{path: path.join(__dirname, 'waitPlugin.js')}];
  exports.config.params.port = 4000;

  exports.config.onPrepare = function () {
    onPrepare();

    jasmine.getEnv().addReporter(new function () {
      var deferred = [];
      var results = [];
/*
      this.specStarted = function (spec) {
        console.log('Spec Start   : ' + spec.id + ':: ' + spec.fullName);
      };
*/
      this.specDone = function (spec) {
        //console.log('Spec Finished: ' + spec.id + ':: ' + spec.fullName);
        if (spec.status !== 'failed' && spec.status !== 'disabled') {
          deferred.push(browser.driver
            .executeScript('if (typeof(__coverage__)!=="undefined") return __coverage__;')
            .then(function (coverageResults) {
              if (coverageResults) {
                var modCoverageResults = {};
                _.each(coverageResults, function (obj, filePath) {
                  if (filePath.startsWith(distPath)) {
                    var relPath = filePath.substring(distPath.length);
                    var newPath = path.join(basePath, 'components', components.reverseTransformPath(relPath));
                    modCoverageResults[newPath] = obj;
                  } else {
                    modCoverageResults[filePath] = obj;
                  }
                });
                results.push(modCoverageResults);
              } else {
                gutil.log('Could not retrieve code coverage metadata - code may not be instrumented');
              }
            })
          );
        }
      };
      this.jasmineDone = function () {
        gutil.log('Tests finished - collecting coverage metadata');
        q.all(deferred).then(function () {
          var coverageDir = path.resolve(__dirname, '..', 'out', 'coverage-report');
          gutil.log('Writing coverage report to ' + coverageDir);
          _.each(results, function (r) {
            collector.add(r);
          });
          istanbul.Report.create('html', {dir: path.join(coverageDir, 'e2e-html')})
            .writeReport(collector, true);
          istanbul.Report.create('json', {dir: path.join(coverageDir, '_json')})
            .writeReport(collector, true);
          fs.renameSync(path.join(coverageDir, '_json', 'coverage-final.json'), path.join(coverageDir, '_json', 'e2e-coverage.json'));
          waitPlugin.resolve();
        });
      };
    });
  };
})();
