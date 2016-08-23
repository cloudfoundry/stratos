(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Users model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerUsersModel);

  registerUsersModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerUsersModel(modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.users', new Users(apiManager));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Users
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @class
   */
  function Users(apiManager) {
    this.apiManager = apiManager;

    var passThroughHeader = {
      'x-cnap-passthrough': 'true'
    };

    this.makeHttpConfig = function (cnsiGuid) {
      var headers = {'x-cnap-cnsi-list': cnsiGuid};
      angular.extend(headers, passThroughHeader);
      return {
        headers: headers
      };
    };
  }

  angular.extend(Users.prototype, {
    /**
     * @function getUserSummary
     * @memberof cloud-foundry.model.space
     * @description lists all spaces
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} userGuid -
     * @param {object} params - optional parameters
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    getUserSummary: function (cnsiGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .GetUserSummary(userGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    },

    /**
     * @function listAllAppsForSpace
     * @memberof cloud-foundry.model.space
     * @description lists all spaces
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - optional parameters
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllUsers: function (cnsiGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllUsers(params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    associateAuditedOrganizationWithUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateAuditedOrganizationWithUser(userGuid, orgGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeAuditedOrganizationFromUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveAuditedOrganizationFromUser(userGuid, orgGuid, params, this.makeHttpConfig(cnsiGuid));
    },

    associateBillingManagedOrganizationWithUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateBillingManagedOrganizationWithUser(userGuid, orgGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeBillingManagedOrganizationFromUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveBillingManagedOrganizationFromUser(userGuid, orgGuid, params, this.makeHttpConfig(cnsiGuid));
    },

    associateManagedOrganizationWithUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateManagedOrganizationWithUser(userGuid, orgGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeManagedOrganizationFromUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveManagedOrganizationFromUser(userGuid, orgGuid, params, this.makeHttpConfig(cnsiGuid));
    },

    associateOrganizationWithUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateOrganizationWithUser(userGuid, orgGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeOrganizationFromUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveOrganizationFromUser(userGuid, orgGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    associateAuditedSpaceWithUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateAuditedSpaceWithUser(userGuid, spaceGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeAuditedSpaceFromUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveAuditedSpaceFromUser(userGuid, spaceGuid, params, this.makeHttpConfig(cnsiGuid));
    },

    associateManagedSpaceWithUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateManagedSpaceWithUser(userGuid, spaceGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeManagedSpaceFromUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveManagedSpaceFromUser(userGuid, spaceGuid, params, this.makeHttpConfig(cnsiGuid));
    },

    associateSpaceWithUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateSpaceWithUser(userGuid, spaceGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeSpaceFromUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveSpaceFromUser(userGuid, spaceGuid, params, this.makeHttpConfig(cnsiGuid));
    }
  });

})();
