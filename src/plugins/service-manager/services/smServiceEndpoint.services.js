(function () {
  'use strict';

  angular
    .module('service-manager.service')
    .factory('smEndpointService', endpointService)
    .constant('smHideEndpoint', false)
    .run(register);

  /* eslint-disable no-unused-vars */
  // Ensure that an instance of smEndpointService is created by injecting it here.
  function register(smEndpointService) { }
  /* eslint-enable no-unused-vars */

  /**
   * @namespace service-manager.service
   * @memberOf service-manager.service
   * @name smEndpointService
   * @description provide functionality to support cloud foundry cnsi service instances (cnsisi..) in the endpoints
   * dashboard
   * @param {cfHideEndpoint} smHideEndpoint - Config - Hide the endpoint from endpoint dashboard components
   * @param {object} $state - the Angular $state service
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @param {app.view.endpoints.dashboard.appEndpointsCnsiService} appEndpointsCnsiService - service to support dashboard with cnsi type endpoints
   * dashboard
   * @returns {object} the service instance service
   */
  function endpointService(smHideEndpoint, $q, $state, appUtilsService, apiManager, appEndpointsCnsiService) {

    var service = {
      cnsi_type: 'hsm',
      refreshToken: refreshToken,
      updateEndpoint: updateEndpoint,
      isHidden: isHidden,
      register: {
        html: {
          class: 'register-type-hsm',
          type: {
            name: 'sm.registration.name',
            tagline: 'sm.registration.tagline',
            svg: 'svg/Service_manager.svg'
          },
          details: {
            title: 'sm.registration.title',
            p1: 'sm.registration.p1',
            p2: 'sm.registration.p2',
            p3: 'sm.registration.p3',
            urlHint: 'sm.registration.urlHint'
          },
          nameOfNameInput: 'hsmName',
          nameOfUrlInput: 'hsmUrl'
        }
      }
    };

    appEndpointsCnsiService.cnsiEndpointProviders[service.cnsi_type] = service;

    return service;

    function refreshToken(allServiceInstances) {
      var hsmApi = apiManager.retrieve('service-manager.api.HsmApi');
      var hsmGuids = _.map(_.filter(allServiceInstances, {cnsi_type: service.cnsi_type}) || [], 'guid') || [];
      if (hsmGuids.length > 0) {
        return hsmApi.info(hsmGuids.join(','));
      }
      return $q.resolve();
    }

    function updateEndpoint(serviceInstance, isValid, serviceEndpoint) {
      serviceEndpoint.type = appUtilsService.getOemConfiguration().SERVICE_MANAGER;
      if (isValid) {
        serviceEndpoint.visit = function () {
          return $state.href('sm.endpoint.detail.instances', {guid: serviceInstance.guid});
        };
      }
    }

    function isHidden(isAdmin) {
      return smHideEndpoint || !isAdmin;
    }

  }

})();
