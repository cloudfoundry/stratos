(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.service-plan
   * @memberOf cloud-foundry.model
   * @name service
   * @description Service model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerServicePlan);

  function registerServicePlan(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.service-plan', new ServicePlan(apiManager, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model.service-plan
   * @name ServicePlan
   * @param {app.api.apiManager} apiManager - the service API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @property {app.api.apiManager} apiManager - the service API manager
   * @property {app.api.servicePlanApi} serviceApi - the service API proxy
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @class
   */
  function ServicePlan(apiManager, modelUtils) {
    var servicePlanApi = apiManager.retrieve('cloud-foundry.api.ServicePlans');

    return {
      retrieveServicePlan: retrieveServicePlan
    };

    /**
     * @function retrieveServicePlan
     * @memberof cloud-foundry.model.service-plan
     * @description Retrieve a single service plan
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the service plan guid
     * @param {object} options - additional parameters for request
     * @returns {promise} A promise object
     * @public
     */
    function retrieveServicePlan(cnsiGuid, guid, options) {
      return servicePlanApi.RetrieveServicePlan(guid, options, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }
  }

})();
