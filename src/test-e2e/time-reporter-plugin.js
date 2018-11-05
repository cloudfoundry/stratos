 /* eslint-disable angular/typecheck-function, angular/log, no-console */
 (function () {
   'use strict';

   var DisplayProcessor = require('jasmine-spec-reporter').DisplayProcessor;

   // Processor for Spec Reporter to add times to the test output
   let startTime;

   function TimeProcessor(configuration) {
     startTime = Date.now();
   }

   function getTime() {
     var now = new Date();
     var diff = now - startTime;
     var msec = now - startTime;;
     var hh = Math.floor(msec / 1000 / 60 / 60);
     msec -= hh * 1000 * 60 * 60;
     var mm = Math.floor(msec / 1000 / 60);
     msec -= mm * 1000 * 60;
     var ss = Math.floor(msec / 1000);
     msec -= ss * 1000;
     return formatTwoDigit(hh) + ':' + formatTwoDigit(mm) + ':' + formatTwoDigit(ss);
   }

   function formatTwoDigit(number) {
     return number < 10 ? '0' + number : number;
   }

   TimeProcessor.prototype = new DisplayProcessor();

   TimeProcessor.prototype.displaySuite = function (suite, log) {
     return getTime() + ' - ' + log;
   };

   TimeProcessor.prototype.displaySuccessfulSpec = function (spec, log) {
     return getTime() + ' - ' + log;
   };

   TimeProcessor.prototype.displayFailedSpec = function (spec, log) {
     return getTime() + ' - ' + log;
   };

   TimeProcessor.prototype.displayPendingSpec = function (spec, log) {
     return getTime() + ' - ' + log;
   };

   module.exports = TimeProcessor;

 })();
