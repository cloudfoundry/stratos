(function () {
  'use strict';

  angular
    .module('app-setup.model')
    .run(registerSetupModel);

  function registerSetupModel(modelManager, apiManager, modelUtils) {
    modelManager.register('app-setup.model.setup', new Setup(apiManager, modelUtils));
  }

  /**
   * @namespace app-setup.model
   * @memberOf app-setup.model
   * @name Setup
   * @description
   * @param {apiManager} apiManager - Api Manager
   * @returns {object} the service instance
   */
  function Setup(apiManager) {

    return {
      setup: setup,
      update: update
    };

    function setup(setupData) {
      return apiManager.retrieve('app-setup.api.setup').setup(setupData, {}, {});
    }

    function update(updateData) {
      return apiManager.retrieve('app-setup.api.setup').updateSetup(updateData, {}, {});
    }
  }

})();
