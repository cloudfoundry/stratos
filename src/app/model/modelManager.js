(function () {
  'use strict';

  angular
    .module('app.model')
    .factory('app.model.modelManager', modelManagerFactory);

  modelManagerFactory.$inject = [];

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
