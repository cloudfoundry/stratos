(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.service
   * @memberOf cloud-foundry.model
   */
  angular
    .module('cloud-foundry.model')
    .factory('cloud-foundry.model.service.serviceUtils', serviceUtilsServiceFactory);

  serviceUtilsServiceFactory.$inject = [];

  /**
   * @function serviceUtilsServiceFactory
   * @memberof cloud-foundry.model.service
   * @description Service to provide utils for CF services - e.g. determine if route or app bindable.,
   * @returns {object} The Application State Service
   */
  function serviceUtilsServiceFactory() {

    return {
      enhance: enhance
    };

    /**
     * @function serviceRequires
     * @memberof cloud-foundry.model.service.serviceUtils
     * @description Check the service's 'requires' metadata to see if it needs the specified requirment
     * @param {object} service - service metadata to check
     * @param {string} requires - requirement to check for
     * @returns {boolean} indicating if the service includes the specified requirement
     */
    function serviceRequires(service, requires) {
      if (!service.entity.requires || service.entity.requires.length === 0) {
        return false;
      } else {
        return _.includes(service.entity.requires, requires);
      }
    }

    /**
     * @function enhanceService
     * @memberof cloud-foundry.model.service.serviceUtils
     * @description Enhance the supplied service by extending the metadata
     * @param {object} service - service metadata to enhance
     * @returns {object} the service passed in (properties are added to the service object)
     */
    function enhanceService(service) {
      if (service && service.entity && service.entity.bindable) {
        service._bindTarget = 'APP';
        if (serviceRequires(service, 'route_forwarding')) {
          service._bindTarget = 'ROUTE';
        }
      }
      return service;
    }

    /**
     * @function enhance
     * @memberof cloud-foundry.model.service.serviceUtils
     * @description Enhance the supplied service or array of services by extending the metadata
     * @param {object} serviceOrList - service metadata or array of service metadatas to enhance
     * @returns {object} the service or service array passed in (properties are added to the service object/s)
     */
    function enhance(serviceOrList) {
      if (angular.isArray(serviceOrList)) {
        _.each(serviceOrList, function (service) {
          enhanceService(service);
        });
      } else {
        enhanceService(serviceOrList);
      }
      return serviceOrList;
    }

  }
})();
