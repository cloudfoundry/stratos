(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.buildPacks
   * @memberof cloud-foundry.model
   * @name service
   * @description Build Packs model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerServiceModel);

  function registerServiceModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.events', new Events(apiManager, modelUtils));
  }

  /**
   * @name BuildPacks
   * @description Fetches buildpack metadata for a CF
   * @param {object} apiManager - Api Manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @returns {object}
   */
  function Events(apiManager, modelUtils) {

    var eventsApi = apiManager.retrieve('cloud-foundry.api.Events');

    var model = {
      fetch: fetch
    };

    return model;

    /**
     * @name fetch
     * @description fetch buildpack metadata
     * @param {Object} cnsiGuid - Cluster Guid
     * @param {string} actee - Guid fo the actee to return the events for
     * @param {int} page - Page number to return (first page is 1)
     * @param {int} pageSize - Max number of results to return
     * @returns {*}
     */
    function fetch(cnsiGuid, actee, page, pageSize) {
      var params = {};
      if (actee) {
        params.q = 'actee:' + actee;
      }
      params.page = page || 1;
      params['results-per-page'] = pageSize || 10;
      params['order-direction'] = 'desc';
      return eventsApi.ListAllEvents(params, modelUtils.makeHttpConfig(cnsiGuid));
    }
  }

})();
