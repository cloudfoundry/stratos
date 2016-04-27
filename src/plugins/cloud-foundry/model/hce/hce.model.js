(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.hce
   * @memberOf cloud-foundry.model
   * @name hce
   * @description Helion Code Engine model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerHceModel);

  registerHceModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerHceModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.hce', new HceModel(apiManager));
  }

  /**
   * @memberof cloud-foundry.model.hce
   * @name HceModel
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {object} data - the Helion Code Engine data
   * @class
   */
  function HceModel(apiManager) {
    this.apiManager = apiManager;
    this.data = {
      buildContainers: []
    };
  }

  angular.extend(HceModel.prototype, {

    /**
     * @function buildContainers
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get registered build container instances
     * @returns {promise} A promise object
     * @public
     **/
    buildContainers: function () {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.HceContainerApi')
        .getBuildContainers()
        .then(function (response) {
          that.onBuildContainers(response);
        });
    },

    /**
     * @function onBuildContainers
     * @memberof cloud-foundry.model.hce.HceModel
     * @description onBuildContainers handler
     * @param {string} response - the JSON response from API call
     * @private
     */
    onBuildContainers: function (response) {
      this.data.buildContainers.length = 0;
      [].push.apply(this.data.buildContainers, response.data || []);
    }

  });

})();
