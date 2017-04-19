(function () {
  'use strict';

  angular
    .module('cloud-foundry.service')
    .factory('cfEndpointService', endpointService)
    .constant('cfHideEndpoint', false)
    .run(register);

  /* eslint-disable no-unused-vars */
  // Ensure that an instance of cfEndpointService is created by injecting it here.
  function register(cfEndpointService) { }
  /* eslint-enable no-unused-vars */

  /**
   * @namespace cloud-foundry.service
   * @memberOf cloud-foundry.service
   * @name cfEndpointService
   * @description provide functionality to support cloud foundry cnsi service instances (cnsisi..) in the endpoints
   * dashboard
   * @param {cfHideEndpoint} cfHideEndpoint - Config - Hide the endpoint from endpoint dashboard components
   * @param {object} $state - the Angular $state service
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.view.endpoints.dashboard.appEndpointsCnsiService} appEndpointsCnsiService - service to support dashboard with cnsi type endpoints
   * dashboard
   * @returns {object} the service instance service
   */
  function endpointService(cfHideEndpoint, $state, appUtilsService, modelManager, appEndpointsCnsiService) {

    var service = {
      cnsi_type: 'hcf',
      update: updateEndpoint,
      unregister: unregister,
      connect: connect,
      disconnect: disconnect,
      isHidden: isHidden,
      register: {
        html: {
          class: '',
          type: {
            name: 'cf.registration.name',
            tagline: 'cf.registration.tagline',
            img: '/images/cloudfoundry_small.png'
          },
          details: {
            title: 'cf.registration.title',
            p1: 'cf.registration.p1',
            p2: 'cf.registration.p2',
            p3: 'cf.registration.p3',
            urlHint: 'cf.registration.urlHint'
          }
        },
        nameOfNameInput: 'hcfName',
        nameOfUrlInput: 'hcfUrl'
      }
    };

    appEndpointsCnsiService.cnsiEndpointProviders[service.cnsi_type] = service;

    return service;

    function updateEndpoint(serviceInstance, isValid, serviceEndpoint) {
      serviceEndpoint.type = appUtilsService.getOemConfiguration().CLOUD_FOUNDRY;
      if (isValid) {
        serviceEndpoint.visit = function () {
          return $state.href('endpoint.clusters.cluster.detail.organizations', {guid: serviceInstance.guid});
        };
      }
    }

    function unregister(serviceInstance) {
      return modelManager.retrieve('cloud-foundry.model.auth').remove(serviceInstance.guid);
    }

    function connect(serviceInstance) {
      // Initialise AuthModel for service
      return modelManager.retrieve('cloud-foundry.model.auth').initializeForEndpoint(serviceInstance.guid);
    }

    function disconnect(serviceInstance) {
      return modelManager.retrieve('cloud-foundry.model.auth').remove(serviceInstance.guid);
    }

    /* eslint-disable no-unused-vars */
    // func params are standard across all <x>ServiceEndpoint providers. In this one isAdmin is not required
    function isHidden(isAdmin) {
      return cfHideEndpoint;
    }
    /* eslint-enable no-unused-vars */
  }

})();
