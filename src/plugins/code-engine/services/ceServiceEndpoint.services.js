(function () {
  'use strict';

  angular
    .module('code-engine.service')
    .factory('ceEndpointService', endpointService)
    .constant('ceHideEndpoint', false)
    .run(register);

  /* eslint-disable no-unused-vars */
  // Ensure that an instance of ceEndpointService is created by injecting it here.
  function register(ceEndpointService) { }
  /* eslint-enable no-unused-vars */

  /**
   * @namespace code-engine.service
   * @memberOf code-engine.service
   * @name ceEndpointService
   * @description provide functionality to support code engine cnsi service instances (cnsisi..) in the endpoints
   * dashboard
   * @param {ceHideEndpoint} ceHideEndpoint - Config - Hide the endpoint from endpoint dashboard components
   * @param {object} $q - the Angular $q service
   * @param {object} $translate - the $translate service
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @param {ceVCSEndpointService} ceVCSEndpointService - service to support dashboard with vcs type endpoints
   * @param {app.view.endpoints.dashboard.appEndpointsDashboardService} appEndpointsDashboardService - service to support endpoints dashboard
   * @param {app.view.endpoints.dashboard.appEndpointsCnsiService} appEndpointsCnsiService - service to support dashboard with cnsi type endpoints
   * dashboard
   * @returns {object} the service instance service
   */
  function endpointService(ceHideEndpoint, $q, $translate, appUtilsService, ceVCSEndpointService, appEndpointsDashboardService,
                           appEndpointsCnsiService) {

    var service = {
      cnsi_type: 'hce',
      update: updateEndpoint,
      unregister: unregister,
      connect: connect,
      disconnect: disconnect,
      isHidden: isHidden,
      register: {
        html: {
          class: 'register-type-hce',
          type: {
            name: 'ce.registration.name',
            tagline: 'ce.registration.tagline',
            svg: 'svg/CodeEngine_Black.svg'
          },
          details: {
            title: 'ce.registration.title',
            p1: 'ce.registration.p1',
            p2: 'ce.registration.p2',
            p3: 'ce.registration.p3',
            urlHint: 'ce.registration.urlHint'
          },
          nameOfNameInput: 'hceName',
          nameOfUrlInput: 'hceUrl'
        }
      }
    };

    appEndpointsCnsiService.cnsiEndpointProviders[service.cnsi_type] = service;

    return service;

    /* eslint-disable no-unused-vars */
    // func params are standard across all <x>ServiceEndpoint providers. In this one some are not required or used

    function updateEndpoint(serviceInstance, isValid, serviceEndpoint) {
      serviceEndpoint.type = $translate.instant('code-engine');
    }

    function unregister(serviceInstance) {
      return appEndpointsDashboardService.refreshCodeEngineVcses().then(function () {
        ceVCSEndpointService.createEndpointEntries();
      });
    }

    function connect(serviceInstance) {
      $q.all([ceVCSEndpointService.updateInstances(), appEndpointsDashboardService.refreshCodeEngineVcses()])
        .then(function () {
          ceVCSEndpointService.createEndpointEntries();
        });
    }

    function disconnect(serviceInstance) {
      appEndpointsDashboardService.refreshCodeEngineVcses()
        .then(function () {
          // Note: we could optimize this with the createEndpointEntries above somehow
          ceVCSEndpointService.createEndpointEntries();
        });
    }

    function isHidden(isAdmin) {
      return ceHideEndpoint;
    }
    /* eslint-enable no-unused-vars */

  }

})();
