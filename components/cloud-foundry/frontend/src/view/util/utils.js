(function () {
  'use strict';

  angular
    .module('cloud-foundry.view')
    .factory('cfUtilsService', cfUtilsService);

  /**
   * @namespace cfUtilsService
   * @memberof cloud-foundry.view
   * @name cfUtilsService
   * @description Various utility functions
   * @param {object} $translate - i18n translation service
   * @returns {object} the utils service
   */
  function cfUtilsService($translate) {

    return {
      selectOptionMapping: selectOptionMapping,
      formatUptime: formatUptime,
      hasSshAccess: hasSshAccess
    };

    function hasSshAccess(userService) {
      return !!(userService && userService.info && userService.info.app_ssh_endpoint &&
      userService.info.app_ssh_host_key_fingerprint && userService.info.app_ssh_oauth_client);
    }

    /**
     * @function selectOptionMapping
     * @memberOf cloud-foundry.view
     * @description domain mapping function
     * @param {object} o - an object to map
     * @returns {object} select-option object
     */
    function selectOptionMapping(o) {
      return {
        label: o.entity.name,
        value: o
      };
    }

    /**
     * @function formatUptime
     * @description format an uptime in seconds into a days, hours, minutes, seconds string
     * @param {number} uptime in seconds
     * @returns {string} formatted uptime string
     */
    function formatUptime(uptime) {
      if (angular.isUndefined(uptime) || uptime === null) {
        return '-';
      }

      function getFormattedTime(isPlural, value, unit) {
        var formatString = isPlural ? 'dateTime.plural.format' : 'dateTime.singular.format';
        return $translate.instant(formatString, { value: value, unit: unit });
      }

      if (uptime === 0) {
        return getFormattedTime(false, '0', $translate.instant('dateTime.singular.second'));
      }
      var days = Math.floor(uptime / 86400);
      uptime = uptime % 86400;
      var hours = Math.floor(uptime / 3600);
      uptime = uptime % 3600;
      var minutes = Math.floor(uptime / 60);
      var seconds = uptime % 60;

      function formatPart(count, single, plural) {
        if (count === 0) {
          return '';
        } else if (count === 1) {
          return getFormattedTime(false, count, single) + ' ';
        } else {
          return getFormattedTime(true, count, plural) + ' ';
        }
      }

      return (
      formatPart(days, $translate.instant('dateTime.singular.day'), $translate.instant('dateTime.plural.days')) +
      formatPart(hours, $translate.instant('dateTime.singular.hour'), $translate.instant('dateTime.plural.hours')) +
      formatPart(minutes, $translate.instant('dateTime.singular.minute'), $translate.instant('dateTime.plural.minutes')) +
      formatPart(seconds, $translate.instant('dateTime.singular.second'), $translate.instant('dateTime.plural.seconds')))
        .trim();
    }
  }
})();
