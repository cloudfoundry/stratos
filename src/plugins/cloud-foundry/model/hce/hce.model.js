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
      buildContainers: [],
      notificationTargetTypes: []
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
      var hceApi = this.apiManager.retrieve('cloud-foundry.api.hce');
      return hceApi.buildContainers()
        .then(function (response) {
          that.onBuildContainers(response);
        });
    },

    /**
     * @function notificationTargetTypes
     * @memberof cloud-foundry.model.hce.HceModel
     * @description Get the set of notification target types
     * @returns {promise} A promise object
     * @public
     **/
    notificationTargetTypes: function () {
      var that = this;
      var hceApi = this.apiManager.retrieve('cloud-foundry.api.hce');
      return hceApi.notificationTargetTypes()
        .then(function (response) {
          that.onNotificationTargetTypes(response);
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
    },

    /**
     * @function onNotificationTargetTypes
     * @memberof cloud-foundry.model.hce.HceModel
     * @description onNotificationTargetTypes handler
     * @param {string} response - the JSON response from API call
     * @private
     */
    onNotificationTargetTypes: function (response) {
      this.data.notificationTargetTypes.length = 0;
      [].push.apply(this.data.notificationTargetTypes, response.data || []);
    }

  });

})();
