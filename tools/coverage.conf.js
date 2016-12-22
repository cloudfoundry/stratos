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
                results.push(coverageResults);
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
          gutil.log('Writing coverage report');
          _.each(results, function (r) {
            collector.add(r);
          });
          istanbul.Report.create('html', {dir: '../coverage-report/e2e-html'})
            .writeReport(collector, true);
          istanbul.Report.create('json', {dir: '../coverage-report/_json'})
            .writeReport(collector, true);
          fs.renameSync('../coverage-report/_json/coverage-final.json', '../coverage-report/_json/e2e-coverage.json');
          waitPlugin.resolve();
        });
      };
    });
  };
})();
