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
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerApplicationModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.application', new Application(apiManager));
  }

  /**
   * @namespace cloud-foundry.model.account.Account
   * @memberof cloud-foundry.model.account
   * @name cloud-foundry.model.account.Account
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {app.api.apiManager} apiManager - the application API manager
   * @class
   */
  function Application(apiManager) {
    this.apiManager = apiManager;
    this.applicationApi = this.apiManager.retrieve('cloud-foundry.api.application');
  }

  angular.extend(Application.prototype, {

    /**
     * @function all
     * @memberof cloud-foundry.model.account
     * @description List all applications at the model layer
     * @param guid
     * @param options
     * @returns {promise} A promise object
     * @public
     **/
    all: function (guid, options) {
      var that = this;
      return this.applicationApi.all(guid, options)
        .then(function (response) {
          that.onAll(response);
        });
    },

    /**
     * @function usage
     * @memberof cloud-foundry.model.account
     * @description List the usage at the model layer
     * @param guid
     * @param options
     * @returns {promise} A promise object
     * @public
     **/
    usage: function (guid, options) {
      var that = this;
      return this.applicationApi.usage(guid, options)
        .then(function (response) {
          that.onUsage(response);
        });
    },

    /**
     * @function files
     * @memberof cloud-foundry.model.account
     * @description List the files at the model layer
     * @param guid
     * @param instanceIndex
     * @param filepath
     * @param options
     * @returns {promise} A promise object
     * @public
     **/
    files: function (guid, instanceIndex, filepath, options) {
      var that = this;
      return this.applicationApi.files(guid, instanceIndex, filepath, options)
        .then(function (response) {
          that.onFiles(response);
        });
    },

    /**
     * @function onAll
     * @memberof cloud-foundry.model.account
     * @description onAll handler at model layer
     * @private
     * @returns {void}
     * */
    onAll: function (response) {
      this.data = response.data;
    },
    /**
     * @function onUsage
     * @memberof cloud-foundry.model.account
     * @description onUsage handler at model layer
     * @private
     * @returns {void}
     * */
    onUsage: function (response) {
      this.data = response.data;
    },
    /**
     * @function onFiles
     * @memberof cloud-foundry.model.account
     * @description onFiles handler at model layer
     * @property data - the return data from the api call
     * @private
     * @returns {void}
     * */
    onFiles: function (response) {
      this.data = response.data;
    }

  });

})();
