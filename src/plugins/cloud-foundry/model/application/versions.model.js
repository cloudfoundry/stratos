(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.versions
   * @memberOf cloud-foundry.model
   * @name versions
   * @description Application Versions model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerApplicationVersionsModel);

  function registerApplicationVersionsModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.appVersions', new ApplicationVersions(apiManager, modelUtils));
  }

  /**
   * @memberOf cloud-foundry.model.versions
   * @name ApplicationVersions
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @class
   */
  function ApplicationVersions(apiManager, modelUtils) {
    var versionsApi = apiManager.retrieve('cloud-foundry.api.Versions');

    var model = {
      versions: [],
      // We cache whether an HCF endpoint supports the version API to improve the user experience
      versionSupportCache: {},
      versionSupportCacheGuids: [],
      hasVersionSupport: hasVersionSupport,
      list: list,
      rollback: rollback,
      setVersionSupport: setVersionSupport
    };

    return model;

    /**
     * @function hasVersionSupport
     * @memberof cloud-foundry.model.versions
     * @description Returns whether the specified HCF Endpoint supports versionning
     * @param {string} cnsiGuid - HCF CNSI guid
     * @returns {promise} Whether or not Application versionning is supported
     * @public
     **/
    function hasVersionSupport(cnsiGuid) {
      return model.versionSupportCache[cnsiGuid];
    }

    /**
     * @function list
     * @memberof cloud-foundry.model.versions
     * @description List all application versions
     * @param {string} cnsiGuid - HCF CNSI guid
     * @param {string} guid - Application guid
     * @returns {promise} A promise object
     * @public
     **/
    function list(cnsiGuid, guid) {
      var config = modelUtils.makeHttpConfig(cnsiGuid);
      var params = {
        per_page: 200,
        order_by: '-created_at'
      };
      return model.versionsApi.ListVersions(guid, params, config).then(function (response) {
        _onListResponse(cnsiGuid, guid, response);
      }).catch(function () {
        setVersionSupport(cnsiGuid, false);
      });
    }

    /**
     * @function rollback
     * @memberof cloud-foundry.model.versions
     * @description Rollabck an application to a previous version
     * @param {string} cnsiGuid - HCF CNSI guid
     * @param {string} appGuid - Application guid
     * @param {string} guid - Version guid to rollback to
     * @returns {promise} A promise object
     * @public
     **/
    function rollback(cnsiGuid, appGuid, guid) {
      var config = modelUtils.makeHttpConfig(cnsiGuid);
      var params = {
        droplet_guid: guid
      };
      return versionsApi.Rollback(appGuid, params, config);
    }

    function _onListResponse(cnsiGuid, guid, response) {
      // If we got back a valid response, record that this CNSI has version support
      var valid = response.data && response.data.pagination;
      setVersionSupport(cnsiGuid, valid);
      model.versions = valid ? response.data.resources : [];
    }

    /**
     * @function setVersionSupport
     * @memberof cloud-foundry.model.versions
     * @description Set versioning support status for the given HCF endpoint
     * @param {string} cnsiGuid - HCF CNSI guid
     * @param {boolean} supported - Version support status for the HCF endpoint
     * @private
     **/
    function setVersionSupport(cnsiGuid, supported) {
      if (!_.has(model.versionSupportCache, cnsiGuid)) {
        model.versionSupportCacheGuids.push(cnsiGuid);
      }
      model.versionSupportCache[cnsiGuid] = supported;

      // Check that the cache isn't getting too big
      if (model.versionSupportCacheGuids.length > 50) {
        var guid = model.versionSupportCacheGuids.shift();
        delete model.versionSupportCache[guid];
      }
    }
  }
})();
