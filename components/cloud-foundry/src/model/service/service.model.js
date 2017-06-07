(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.service
   * @memberOf cloud-foundry.model
   * @name service
   * @description Service model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerServiceModel);

  function registerServiceModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.service', new Service(apiManager, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model.service
   * @name Service
   * @param {app.api.apiManager} apiManager - the service API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @property {app.api.apiManager} apiManager - the service API manager
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general cf model helpers
   * @property {app.api.servicePlanApi} serviceApi - the service API proxy
   * @class
   */
  function Service(apiManager, modelUtils) {
    var serviceApi = apiManager.retrieve('cloud-foundry.api.Services');

    var model = {
      data: {},
      all: all,
      allServicePlans: allServicePlans,
      retrieveService: retrieveService,
      onAll: onAll,
      onAllServicePlans: onAllServicePlans
    };

    return model;

    /**
     * @function all
     * @memberof  cloud-foundry.model.service
     * @description List all services at the model layer
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} options - options for url building
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A promise object
     * @public
     **/
    function all(cnsiGuid, options, paginate) {

      return serviceApi.ListAllServices(modelUtils.makeListParams(options),
        modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (all) {
          return onAll(all);
        });
    }

    /**
     * @function allServicePlans
     * @memberof cloud-foundry.model.service
     * @description LIst all service plans for service
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the service guid
     * @param {object=} options - additional parameters for request
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A promise object
     * @public
     */
    function allServicePlans(cnsiGuid, guid, options, paginate) {

      return serviceApi.ListAllServicePlansForService(guid, modelUtils.makeListParams(options),
        modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (all) {
          return onAllServicePlans(all);
        });
    }

    /**
     * @function retrieveService
     * @memberof cloud-foundry.model.service
     * @description Retrieve a sinble service
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the service guid
     * @param {object} options - additional parameters for request
     * @returns {promise} A promise object
     * @public
     */
    function retrieveService(cnsiGuid, guid, options) {
      return serviceApi.RetrieveService(guid, options, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }

    /**
     * @function onAll
     * @memberof cloud-foundry.model.service
     * @description onAll handler at model layer
     * @param {Array} all - the list returned from the api call
     * @returns {Array} The response
     * @private
     */
    function onAll(all) {
      model.data = all;
      return all;
    }

    /**
     * @function onAllServicePlans
     * @memberof cloud-foundry.model.service
     * @description onAllServicePlans handler at model layer
     * @param {Array} all - the list returned from the api call
     * @returns {Array} The response
     * @private
     */
    function onAllServicePlans(all) {
      model.data.servicePlans = all;
      return all;
    }
  }

})();
