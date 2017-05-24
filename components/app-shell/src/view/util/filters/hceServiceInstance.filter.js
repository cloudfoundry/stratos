(function () {
  'use strict';

  angular
    .module('app.view')
    .filter('removeHceServiceInstance', removeHceServiceInstance);

  /**
   * @namespace app.view.removeHceServiceInstance
   * @memberof app.view
   * @name removeHceServiceInstance
   * @description A service filter that removes the stackato 'hce-' service
   * @returns {function} The filter function
   */
  function removeHceServiceInstance() {
    return function (services, appGuid) {
      // Look at the services for one named 'hce-<APP_GUID>'
      var hceServiceLink = 'hce-' + appGuid;
      return _.filter(services, function (svc) {
        if (appGuid) {
          return svc.name !== hceServiceLink;
        } else {
          var appIds = [];
          _.forEach(svc.entity.service_bindings, function (binding) {
            appIds.push('hce-' + binding.entity.app_guid);
          });
          return _.indexOf(appIds, svc.entity.name) < 0;
        }
      });
    };
  }

})();
