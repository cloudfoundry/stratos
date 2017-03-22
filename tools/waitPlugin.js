(function () {
  'use strict';

  //see https://github.com/angular/protractor/issues/1938#issuecomment-119690252

  var protractor = require('protractor');
  var q = protractor.promise;

  var deferred = q.defer();

  exports.resolve = function () {
    deferred.fulfill.apply(deferred, arguments);
  };

  exports.teardown = function () {
    return deferred.promise;
  };
})();
