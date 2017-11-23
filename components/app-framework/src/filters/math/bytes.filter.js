(function () {
  'use strict';

  var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];

  // Private utility functions
  function getDefaultPrecision(precision) {
    if (_.isUndefined(precision)) {
      precision = 0;
    }
    return precision;
  }

  function getNumber(value) {
    return Math.floor(Math.log(value) / Math.log(1024));
  }

  function getReducedValue(value, number, precision) {
    return (value / Math.pow(1024, Math.floor(number))).toFixed(precision);
  }

  // The filters
  angular.module('app.framework.filters')
    .filter('bytes', bytes);

  function bytes() {
    return function (bytes, precision) {
      if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
        return '-';
      }
      precision = getDefaultPrecision(precision);
      if (bytes === 0) {
        return (0).toFixed(precision) + ' bytes';
      }
      var number = getNumber(bytes);
      return getReducedValue(bytes, number, precision) + ' ' + units[number];
    };
  }

  angular.module('app.framework.filters')
    .filter('usageBytes', usageBytes);

  function usageBytes() {
    return function (usage, usedPrecision, totalPrecision) {
      var used = usage[0];
      var total = usage[1];

      if (isNaN(parseFloat(used)) || !isFinite(used) ||
        isNaN(parseFloat(total)) || !isFinite(total) ||
        total === 0) {
        return '-';
      }

      // Precision
      usedPrecision = getDefaultPrecision(usedPrecision);
      totalPrecision = getDefaultPrecision(totalPrecision);

      // Units
      var number = getNumber(total);
      var usedNumber = null;

      // Values to display
      var totalDisplay = getReducedValue(total, number, totalPrecision);
      var usedDisplay = getReducedValue(used, number, usedPrecision);

      // Is the used value too small to be accurate (for instance 20M consumed of 1GB would show as 0 of 1GB)?
      if (used !== 0 && usedPrecision === 0 && usedDisplay < 1) {
        // Use the units relative to the used value instead of total (20MB of 1GB instead of 0 of 1GB)
        usedNumber = getNumber(used);
        usedDisplay = getReducedValue(used, usedNumber, usedPrecision);
      }

      return usedDisplay + (usedNumber ? ' ' + units[usedNumber] : '') + ' / ' + totalDisplay + ' ' + units[number];
    };
  }
})();
