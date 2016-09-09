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

  registerServicePlan.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'cloud-foundry.model.modelUtils'
  ];

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
    this.apiManager = apiManager;
    this.servicePlanApi = this.apiManager.retrieve('cloud-foundry.api.ServicePlans');
    this.modelUtils = modelUtils;
  }

  angular.extend(ServicePlan.prototype, {

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
    retrieveServicePlan: function (cnsiGuid, guid, options) {
      return this.servicePlanApi.RetrieveServicePlan(guid, options, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }
  });

})();
