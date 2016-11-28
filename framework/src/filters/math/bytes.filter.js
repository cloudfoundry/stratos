(function () {
  'use strict';
  /* eslint-disable */
  // TODO woodnt: This list needs to be translated once gettext works.
  /* eslint-enable */

  // Probably like var units = gettext('bytes kB MB GB TB PB'). split(' ');
  var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];

  // Private utility functions
  function getDefaultPrecision(precision) {
    if (_.isUndefined(precision)) {
      precision = 1;
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
  angular.module('helion.framework.filters')
    .filter('bytes', bytes);

  bytes.$inject = [];

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

  angular.module('helion.framework.filters')
    .filter('usageBytes', usageBytes);

  usageBytes.$inject = [];

  function usageBytes() {
    return function (usage, usedPrecision, totalPrecision) {
      var used = usage[0];
      var total = usage[1];

      if (isNaN(parseFloat(used)) || !isFinite(used) ||
        isNaN(parseFloat(total)) || !isFinite(total) ||
        total === 0) {
        return '-';
      }
      usedPrecision = getDefaultPrecision(usedPrecision);
      totalPrecision = _.isUndefined(totalPrecision) ? 0 : totalPrecision;
      var number = getNumber(total);
      var totalDisplay = getReducedValue(total, number, totalPrecision);
      var usedDisplay = getReducedValue(used, number, usedPrecision);
      return usedDisplay + ' / ' + totalDisplay + ' ' + units[number];
    };
  }
})();
