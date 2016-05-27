(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Space model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerSpaceModel);

  registerSpaceModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerSpaceModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.space', new Space(apiManager));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Space
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @class
   */
  function Space(apiManager) {
    this.apiManager = apiManager;
  }

  angular.extend(Space.prototype, {
   /**
    * @function listAllSpaces
    * @memberof cloud-foundry.model.space
    * @description lists all spaces
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllSpaces: function (params) {
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllSpaces(params)
        .then(function (response) {
          return response.data.resources;
        });
    }
  });

})();
