(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.vcs
   * @memberOf cloud-foundry.model
   * @name vcs
   * @description VCS model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerVcsModel);

  registerVcsModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerVcsModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.vcs', new VcsModel(apiManager));
  }

  /**
   * @memberof cloud-foundry.model.hce
   * @name VcsModel
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @class
   */
  function VcsModel(apiManager) {
    this.apiManager = apiManager;
  }

  angular.extend(VcsModel.prototype, {
    /**
     * @function listVcsClients
     * @memberof cloud-foundry.model.vcs.VcsModel
     * @description Get the list of valid VCS clients
     * @returns {promise} A promise object
     * @public
     */
    listVcsClients: function () {
      return this.apiManager.retrieve('cloud-foundry.api.Vcs')
        .listVcsClients();
    }
  });

})();
