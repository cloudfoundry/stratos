(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.application.versions
   * @memberOf cloud-foundry.model.application
   * @name versions
   * @description Application Versions model
   */
  angular
    .module('cf-versions.model', [])
    .run(registerApplicationVersionsModel);

  function registerApplicationVersionsModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.appVersions', new ApplicationVersions(apiManager, modelUtils));
  }

  /**
   * @memberOf cloud-foundry.model.application.versions
   * @name ApplicationVersions
   * @param {app.api.apiManager} apiManager - the application API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @property {object} $q - the $q service for promise/deferred objects
   * @property {object} versionsApi - the application versions API
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general cf model helpers
   * @class
   */
  function ApplicationVersions(apiManager, modelUtils) {
    var versionsApi = apiManager.retrieve('cloud-foundry.api.Versions');

    var model = {
      versions: [],
      // We cache whether an CF endpoint supports the version API to improve the user experience
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
     * @memberof cloud-foundry.model.application.versions
     * @description Returns whether the specified CF Endpoint supports versionning
     * @param {string} cnsiGuid - CF CNSI guid
     * @returns {object} Whether or not Application versioning is supported
     * @public
     **/
    function hasVersionSupport(cnsiGuid) {
      return model.versionSupportCache[cnsiGuid];
    }

    /**
     * @function list
     * @memberof cloud-foundry.model.application.versions
     * @description List all application versions
     * @param {string} cnsiGuid - CF CNSI guid
     * @param {string} guid - Application guid
     * @returns {object} A promise object
     * @public
     **/
    function list(cnsiGuid, guid) {
      var config = modelUtils.makeHttpConfig(cnsiGuid);
      var params = {
        per_page: 200,
        order_by: '-created_at'
      };
      return versionsApi.ListVersions(guid, params, config).then(function (response) {
        onListResponse(cnsiGuid, guid, response);
      }).catch(function () {
        setVersionSupport(cnsiGuid, false);
      });
    }

    /**
     * @function rollback
     * @memberof cloud-foundry.model.application.versions
     * @description Rollabck an application to a previous version
     * @param {string} cnsiGuid - CF CNSI guid
     * @param {string} appGuid - Application guid
     * @param {string} guid - Version guid to rollback to
     * @returns {object} A promise object
     * @public
     **/
    function rollback(cnsiGuid, appGuid, guid) {
      var config = modelUtils.makeHttpConfig(cnsiGuid);
      var params = {
        droplet_guid: guid
      };
      return versionsApi.Rollback(appGuid, params, config);
    }

    function onListResponse(cnsiGuid, guid, response) {
      // If we got back a valid response, record that this CNSI has version support
      var valid = response.data && response.data.pagination;
      setVersionSupport(cnsiGuid, valid);
      model.versions = valid ? response.data.resources : [];
    }

  /**
   * @function setVersionSupport
   * @memberof cloud-foundry.model.application.versions
   * @description Set versionning support status for the given CF endpoint
   * @param {string} cnsiGuid - CF CNSI guid
   * @param {boolean} supported - Version support status for the CF endpoint
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
