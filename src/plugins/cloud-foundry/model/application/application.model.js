(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.application
   * @memberOf cloud-foundry.model
   * @name application
   * @description Application model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerApplicationModel);

  registerApplicationModel.$inject = [
    'cloud-founder.model.modelManager',
    'app.api.apiManager'
  ];

  function registerApplicationModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.application', new Application(apiManager));
  }

  /**
   * @namespace cloud-founder.model.account.Account
   * @memberof cloud-founder.model.account
   * @name cloud-founder.model.account.Account
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {boolean} loggedIn - a flag indicating if user logged in
   * @class
   */
  function Application(apiManager) {
    this.apiManager = apiManager;
  }

  angular.extend(Account.prototype, {
   
    instances: function (guid, options) {
      var that = this;
      var applicationApi = this.apiManager.retrieve('cloud-foundry.api.application');
      return applicationApi.all(guid,options)
        .then(function () {
          that.onAll();
        });
    },

    usage: function (guid, options) {
      var that = this;
      var applicationApi = this.apiManager.retrieve('cloud-foundry.api.application');
      return applicationApi.usage(guid,options)
        .then(function () {
          that.onUsage();
        });
    },

    files: function (guid,instanceIndex, filepath, options) {
      var that = this;
      var applicationApi = this.apiManager.retrieve('cloud-foundry.api.application');
      return applicationApi.files(guid,instanceIndex, filepath, options)
        .then(function () {
          that.onFiles();
        });
    },

    onAll: function (response) {
      this.data = response.data;
    },

    onUsage: function (response) {
      this.data = response.data;
    },

    onFiles: function (response) {
      this.data = response.data;
    }



   
  });

})();
