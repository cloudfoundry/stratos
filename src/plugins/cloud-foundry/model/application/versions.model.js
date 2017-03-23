(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.application.versions
   * @memberOf cloud-foundry.model.application
   * @name versions
   * @description Application Versions model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerApplicationVersionsModel);

  registerApplicationVersionsModel.$inject = [
    '$q',
    'modelManager',
    'apiManager',
    'modelUtils'
  ];

  function registerApplicationVersionsModel($q, modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.appVersions', new ApplicationVersions($q, apiManager, modelUtils));
  }

  /**
   * @memberOf cloud-foundry.model.application.versions
   * @name ApplicationVersions
   * @param {object} $q - the $q service for promise/deferred objects
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @property {object} $q - the $q service for promise/deferred objects
   * @property {object} versionsApi - the application versions API
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @class
   */
  function ApplicationVersions($q, apiManager, modelUtils) {
    this.versionsApi = apiManager.retrieve('cloud-foundry.api.Versions');
    this.$q = $q;
    this.modelUtils = modelUtils;

    this.versions = [];

    // We cache whether an HCF endpoint supports the version API to improve the user experience
    this.versionSupportCache = {};
    this.versionSupportCacheGuids = [];

  }

  angular.extend(ApplicationVersions.prototype, {

    /**
     * @function hasVersionSupport
     * @memberof cloud-foundry.model.application.versions
     * @description Returns whether the specified HCF Endpoint supports versionning
     * @param {string} cnsiGuid - HCF CNSI guid
     * @returns {promise} Whether or not Application versionning is supported
     * @public
     **/
    hasVersionSupport: function (cnsiGuid) {
      return this.versionSupportCache[cnsiGuid];
    },

    /**
     * @function list
     * @memberof cloud-foundry.model.application.versions
     * @description List all application versions
     * @param {string} cnsiGuid - HCF CNSI guid
     * @param {string} guid - Application guid
     * @returns {promise} A promise object
     * @public
     **/
    list: function (cnsiGuid, guid) {
      var that = this;
      var config = this.modelUtils.makeHttpConfig(cnsiGuid);
      var params = {
        per_page: 200,
        order_by: '-created_at'
      };
      return this.versionsApi.ListVersions(guid, params, config).then(function (response) {
        that.onListResponse(cnsiGuid, guid, response);
      }).catch(function () {
        that.setVersionSupport(cnsiGuid, false);
      });
    },

    /**
     * @function rollback
     * @memberof cloud-foundry.model.application.versions
     * @description Rollabck an application to a previous version
     * @param {string} cnsiGuid - HCF CNSI guid
     * @param {string} appGuid - Application guid
     * @param {string} guid - Version guid to rollback to
     * @returns {promise} A promise object
     * @public
     **/
    rollback: function (cnsiGuid, appGuid, guid) {
      var config = this.modelUtils.makeHttpConfig(cnsiGuid);
      var params = {
        droplet_guid: guid
      };
      return this.versionsApi.Rollback(appGuid, params, config);
    },

    onListResponse: function (cnsiGuid, guid, response) {
      // If we got back a valid response, record that this CNSI has version support
      var valid = response.data && response.data.pagination;
      this.setVersionSupport(cnsiGuid, valid);
      this.versions = valid ? response.data.resources : [];
    },

  /**
   * @function setVersionSupport
   * @memberof cloud-foundry.model.application.versions
   * @description Set versionning support status for the given HCF endpoint
   * @param {string} cnsiGuid - HCF CNSI guid
   * @param {boolean} supported - Version support status for the HCF endpoint
   * @private
   **/
    setVersionSupport: function (cnsiGuid, supported) {
      if (!_.has(this.versionSupportCache, cnsiGuid)) {
        this.versionSupportCacheGuids.push(cnsiGuid);
      }
      this.versionSupportCache[cnsiGuid] = supported;

      // Check that the cache isn't getting too big
      if (this.versionSupportCacheGuids.length > 50) {
        var guid = this.versionSupportCacheGuids.shift();
        delete this.versionSupportCache[guid];
      }
    }
  });
})();
