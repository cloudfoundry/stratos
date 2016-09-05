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
    '$q',
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerVcsModel($q, modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.vcs', new VcsModel($q, apiManager));
  }

  /**
   * @memberof cloud-foundry.model.hce
   * @name VcsModel
   * @param {object} $q - the Angular $q service
   * @param {app.api.apiManager} apiManager - the application API manager
   * @property {object} $q - the Angular $q service
   * @property {app.api.apiManager} apiManager - the application API manager
   * @property {array} vcsClients - the list of VCS clients
   * @class
   */
  function VcsModel($q, apiManager) {
    this.$q = $q;
    this.apiManager = apiManager;
    this.vcsClients = null;
  }

  angular.extend(VcsModel.prototype, {
    /**
     * @function listVcsClients
     * @memberof cloud-foundry.model.vcs.VcsModel
     * @description Get the list of valid VCS clients
     * @param {boolean} forceFetch - force fetch VCS clients
     * @returns {promise} A promise object
     * @public
     */
    listVcsClients: function (forceFetch) {
      if (forceFetch || this.vcsClients === null) {
        var that = this;
        return this.apiManager.retrieve('cloud-foundry.api.Vcs')
          .listVcsClients()
          .then(function (response) {
            that.vcsClients = response.data;
            return response;
          });
      } else {
        var deferred = this.$q.defer();
        deferred.resolve({data: this.vcsClients});
        return deferred.promise;
      }
    }
  });

})();
