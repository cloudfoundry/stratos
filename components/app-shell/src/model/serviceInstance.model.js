(function () {
  'use strict';

  /**
   * @namespace app.model.serviceInstance
   * @memberOf app.model
   * @name serviceInstance
   * @description Service instance model
   */
  angular
    .module('app.model')
    .run(registerServiceInstanceModel);

  function registerServiceInstanceModel(apiManager, modelManager) {
    modelManager.register('app.model.serviceInstance', new ServiceInstance(apiManager));
  }

  /**
   * @namespace app.model.serviceInstance.ServiceInstance
   * @memberof app.model.serviceInstance
   * @name app.model.serviceInstance.ServiceInstance
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {array} serviceInstances - the service instances available to user
   * @class
   */
  function ServiceInstance(apiManager) {
    var serviceInstances = [];

    return {
      serviceInstances: serviceInstances,
      create: create,
      remove: remove,
      list: list
    };

    /**
     * @function create
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Create a service instance
     * @param {string} type - the service instance API endpoint
     * @param {string} url - the service instance API endpoint
     * @param {string} name - the service instance friendly name
     * @param {boolean} skipSslValidation - whether to skip SSL validation for this endpoint
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function create(type, url, name, skipSslValidation) {
      var serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
      type = type || 'hcf';

      var promise = serviceInstanceApi.create(url, name, !!skipSslValidation, type);
      return promise.then(function (response) {
        serviceInstances.push(response.data);
        return response.data;
      });
    }

    /**
     * @function disconnect
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Remove service instance
     * @param {app.model.serviceInstance} serviceInstance - the service instance to remove
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function remove(serviceInstance) {
      var serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
      return serviceInstanceApi.remove(serviceInstance.guid)
        .then(function () {
          list();
        });
    }

    /**
     * @function list
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Returns a list of service instances (master list)
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function list() {
      var serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
      return serviceInstanceApi.list()
        .then(function (response) {
          var items = response.data || [];
          serviceInstances.length = 0;
          [].push.apply(serviceInstances, _.sortBy(items, 'name'));

          var hcfOnly = _.filter(serviceInstances, { cnsi_type: 'hcf' }) || [];

          return {
            numAvailable: hcfOnly.length
          };
        });
    }
  }

})();
