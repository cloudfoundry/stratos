(function () {
  'use strict';

  angular
    .module('app.view')
    .filter('filterServiceInstance', filterServiceInstance);

  /**
   * @namespace app.view.filterServiceInstance
   * @memberof app.view
   * @name filterServiceInstance
   * @description A service filter that removes any with name <PREFIX><APP_GUID>
   * @returns {function} The filter function
   */
  function filterServiceInstance() {
    return function (services, prefix, appGuid) {
      // Look at the services for one named '<PREFIX><APP_GUID>'
      var hceServiceLink = prefix + appGuid;
      return _.filter(services, function (svc) {
        if (appGuid) {
          return svc.name !== hceServiceLink;
        } else {
          var appIds = [];
          _.forEach(svc.entity.service_bindings, function (binding) {
            appIds.push(prefix + binding.entity.app_guid);
          });
          return _.indexOf(appIds, svc.entity.name) < 0;
        }
      });
    };
  }

})();
