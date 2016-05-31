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

  registerServiceInstanceModel.$inject = [
    'app.api.apiManager',
    'app.model.modelManager'
  ];

  function registerServiceInstanceModel(apiManager, modelManager) {
    modelManager.register('app.model.serviceInstance', new ServiceInstance(apiManager));
  }

  /**
   * @namespace app.model.serviceInstance.ServiceInstance
   * @memberof app.model.serviceInstance
   * @name app.model.serviceInstance.ServiceInstance
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {array} serviceInstances - the service instances available to user
   * @class
   */
  function ServiceInstance(apiManager) {
    this.apiManager = apiManager;
    this.serviceInstances = [];
  }

  angular.extend(ServiceInstance.prototype, {
    /**
     * @function create
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Create a service instance
     * @param {string} url - the service instance API endpoint
     * @param {string} name - the service instance friendly name
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    create: function (url, name) {
      var that = this;
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance');
      return serviceInstanceApi.create(url, name)
        .then(function (response) {
          that.serviceInstances.push(response.data);
        });
    },

    /**
     * @function disconnect
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Remove service instance
     * @param {app.model.serviceInstance} serviceInstance - the service instance to remove
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    remove: function (serviceInstance) {
      var that = this;

      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance');
      return serviceInstanceApi.remove(serviceInstance.id)
        .then(function () {
          _.pull(that.serviceInstances, serviceInstance);
        });
    },

    /**
     * @function list
     * @memberof app.model.serviceInstance.ServiceInstance
     * @description Returns a list of service instances (master list)
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    list: function () {
      var that = this;
      var serviceInstanceApi = this.apiManager.retrieve('app.api.serviceInstance');
      return serviceInstanceApi.list()
        .then(function (response) {
          var items = response.data || [];
          that.serviceInstances.length = 0;
          [].push.apply(that.serviceInstances, _.sortBy(items, 'name'));

          var hcfOnly = _.filter(that.serviceInstances, { cnsi_type: 'hcf' }) || [];

          return {
            numAvailable: hcfOnly.length
          };
        });
    }
  });

})();
