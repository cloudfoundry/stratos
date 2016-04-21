(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.private-domain
   * @memberOf cloud-foundry.model
   * @description PrivateDomain model
   */
  angular
  .module('cloud-foundry.model')
  .run(registerPrivateDomainModel);

  registerPrivateDomainModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerPrivateDomainModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.private-domain', new PrivateDomain(apiManager));
  }

  /**
   * @namespace cloud-foundry.model.private-domain.PrivateDomain
   * @memberOf cloud-foundry.model.private-domain
   * @name cloud-foundry.model.domain.PrivateDomain
   * @param {app.api.apiManager} apiManager - the private-domain API manager
   * @property {app.api.apiManager} apiManager - the private-domain API manager
   * @property {app.api.privateDomainApi} applicationApi - the private-domain API proxy
   * @property {object} data - holding data.
   * @class
   */
  function PrivateDomain(apiManager) {
    this.apiManager = apiManager;
    this.privateDomainApi = this.apiManager.retrieve('cloud-foundry.api.PrivateDomains');
    this.data = {};
  }

  angular.extend(PrivateDomain.prototype, {
    /**
     * @function all
     * @memberOf cloud-foundry.model.private-domain
     * @param {object} params - Parameters used to filter the result set.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    all: function (params) {
      var that = this;
      return this.privateDomainApi.ListAllPrivateDomains(params)
        .then(function(response) {
          that.onAll(response);
        });
    },

    /**
     * @function filterByName
     * @memberOf cloud-foundry.model.private-domain
     * @param {object} params - Parameters used to filter the result set.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    filterByName: function (params) {
      var that = this;
      return this.privateDomainApi.FilterPrivateDomainsByName(params)
        .then(function(response) {
          that.onFiltered(response);
        });
    },

    /**
     * @function allSharedOrganizationsForPrivateDomain
     * @memberOf cloud-foundry.model.private-domain
     * @param {string} guid The guid of the domain
     * @param {object} params - Parameters used to filter the result set.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    allSharedOrganizationsForPrivateDomain: function (guid, params) {
      var that = this;
      return this.privateDomainApi.ListAllSharedOrganizationsForPrivateDomain(guid, params)
        .then(function(response) {
          that.onAllSharedOrg(response);
        });
    },

    /**
     * @function retrievePrivateDomain
     * @memberOf cloud-foundry.model.private-domain
     * @param {string} guid of the domain
     * @param {object} params - Parameters used to filter the result set.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    retrievePrivateDomain: function (guid, params) {
      var that = this;
      return this.privateDomainApi.RetrievePrivateDomain(guid, params)
        .then(function(response) {
          that.onOne(response);
        });
    },

    /**
     * @function onAll
     * @memberOf cloud-foundry.model.private-domain
     * @param {object} response - http response
     * @returns {void}
     * @private
     */
    onAll: function (response) {
      this.data.all = response.data;
    },

    /**
     * @function onOne
     * @memberOf cloud-foundry.model.private-domain
     * @param {object} response - http response
     * @returns {void}
     * @private
     */
    onOne: function (response) {
      this.data.one = response.data;
    },

    /**
     * @function onFiltered
     * @memberOf cloud-foundry.model.private-domain
     * @param {object} response - http response
     * @returns {void}
     * @private
     */
    onFiltered: function(response) {
      this.data.filtered = response.data;
    },

    /**
     * @function onAllSharedOrg
     * @memberOf cloud-foundry.model.private-domain
     * @param {object} response - http response
     * @returns {void}
     * @private
     */
    onAllSharedOrg: function(response) {
      this.data.allSharedOrg = response.data;
    }

  });

})();
