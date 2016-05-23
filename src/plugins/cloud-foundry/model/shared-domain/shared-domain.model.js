(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.shared-domain
   * @memberOf cloud-foundry.model
   * @description SharedDomain model
   */
  angular
  .module('cloud-foundry.model')
  .run(registerSharedDomainModel);

  registerSharedDomainModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerSharedDomainModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.shared-domain', new SharedDomain(apiManager));
  }

  /**
   * @namespace cloud-foundry.model.shared-domain.SharedDomain
   * @memberOf cloud-foundry.model.shared-domain
   * @name cloud-foundry.model.shared-domain.SharedDomain
   * @param {app.api.apiManager} apiManager - the shared-domain API manager
   * @property {app.api.apiManager} apiManager - the shared-domain API manager
   * @property {app.api.sharedDomainApi} applicationApi - the shared-domain API proxy
   * @property {object} data - holding data.
   * @class
   */
  function SharedDomain(apiManager) {
    this.apiManager = apiManager;
    this.sharedDomainApi = this.apiManager.retrieve('cloud-foundry.api.SharedDomains');
    this.data = {
      all: {},
      filtered: {},
      one: {}
    };
  }

  angular.extend(SharedDomain.prototype, {

    /**
     * @function all
     * @param {object} params - Parameters used to filter the result set.
     * @returns {promise} A resolved/rejected promise
     * @publics
     */
    all: function (params) {
      var that = this;
      return this.sharedDomainApi.ListAllSharedDomains(params)
        .then(function(response) {
          that.onAll(response);
        });
    },

    /**
     * @function filterByName
     * @param {object} params - Parameters used to filter the result set.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    filterByName: function (params) {
      var that = this;
      return this.sharedDomainApi.FilterSharedDomainsByName(params)
        .then(function(response) {
          that.onFilter(response);
        });
    },

    /**
     * @function filterByName
     * @param {string} guid - guid of the shared domain
     * @param {object} params - Parameters used to filter the result set.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    retrieveSharedDomain: function (guid, params) {
      var that = this;
      return this.sharedDomainApi.RetrieveSharedDomain(guid, params)
      .then(function(response) {
        that.onOne(response);
      });
    },

    /**
     * @function onAll
     * @param {object} response - http response
     * @returns {void}
     * @private
     */
    onAll: function(response) {
      this.data.all = response.data;
    },

    /**
     * @function onFiltered
     * @param {object} response - http response
     * @returns {void}
     * @private
     */
    onFilter: function(response) {
      this.data.filtered = response.data;
    },

    /**
     * @function onFiltered
     * @param {object} response - http response
     * @returns {void}
     * @private
     */
    onOne: function(response) {
      this.data.one = response.data;
    }

  });

})();
