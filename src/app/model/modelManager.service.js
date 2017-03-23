(function () {
  'use strict';

  angular
    .module('app.model')
    .factory('modelManager', modelManagerFactory);

  modelManagerFactory.$inject = [];

  /**
   * @namespace app.model.modelManager
   * @memberof app.model
   * @name app.model.modelManager
   * @description The manager that handles registration and retrieval of models
   * @returns {object} The model manager service
   */
  function modelManagerFactory() {
    var models = {};

    return {
      models: models,
      register: register,
      retrieve: retrieve
    };

    /**
     * @function register
     * @memberof app.model.modelManager
     * @param {string} name - the name of the model to register
     * @param {object} model - the model object to register
     */
    function register(name, model) {
      models[name] = model;
    }

    /**
     * @function retrieve
     * @memberof app.model.modelManager
     * @param {string} name - the name of the model to retrieve
     * @returns {object} the requested model
     */
    function retrieve(name) {
      return models[name];
    }
  }

})();
