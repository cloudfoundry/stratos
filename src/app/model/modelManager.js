(function () {
  'use strict';

  angular
    .module('app.model')
    .factory('app.model.modelManager', modelManagerFactory);

  modelManagerFactory.$inject = [];

  /**
   * @memberof app.model
   * @name modelManager
   * @description The model layer of the UI platform that contains
   * the business data objects and methods to retrieve/update the
   * data
   */
  function modelManagerFactory() {
    var models = {};

    return {
      models: models,
      register: register,
      retrieve: retrieve
    };

    function register(name, model) {
      models[name] = model;
    }

    function retrieve(name) {
      return models[name];
    }
  }

})();
