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
    'app.api.apiManager'
  ];

  function registerServicePlan(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.service-plan', new ServicePlan(apiManager));
  }

  /**
   * @memberof cloud-foundry.model.service-plan
   * @name ServicePlan
   * @param {app.api.apiManager} apiManager - the service API manager
   * @property {app.api.apiManager} apiManager - the service API manager
   * @property {app.api.servicePlanApi} serviceApi - the service API proxy
   * @class
   */
  function ServicePlan(apiManager) {
    this.apiManager = apiManager;
    this.servicePlanApi = this.apiManager.retrieve('cloud-foundry.api.ServicePlans');

    var passThroughHeader = {
      'x-cnap-passthrough': 'true'
    };

    this.makeHttpConfig = function (cnsiGuid) {
      var headers = {'x-cnap-cnsi-list': cnsiGuid};
      angular.extend(headers, passThroughHeader);
      return {
        headers: headers
      };
    };
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
      return this.servicePlanApi.RetrieveServicePlan(guid, options, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }
  });

})();
