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
    'app.api.apiManager',
    'cloud-foundry.model.modelUtils'
  ];

  function registerUsersModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.users', new Users(apiManager, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Users
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @class
   */
  function Users(apiManager, modelUtils) {
    this.apiManager = apiManager;
    this.modelUtils = modelUtils;
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
        .GetUserSummary(userGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
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
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllUsers: function (cnsiGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllUsers(this.modelUtils.makeListParams(params), this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    associateAuditedOrganizationWithUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateAuditedOrganizationWithUser(userGuid, orgGuid, params,
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeAuditedOrganizationFromUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveAuditedOrganizationFromUser(userGuid, orgGuid, params,
          this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateBillingManagedOrganizationWithUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateBillingManagedOrganizationWithUser(userGuid, orgGuid, params,
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeBillingManagedOrganizationFromUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveBillingManagedOrganizationFromUser(userGuid, orgGuid, params,
          this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateManagedOrganizationWithUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateManagedOrganizationWithUser(userGuid, orgGuid, params,
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeManagedOrganizationFromUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveManagedOrganizationFromUser(userGuid, orgGuid, params,
          this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateOrganizationWithUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateOrganizationWithUser(userGuid, orgGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeOrganizationFromUser: function (cnsiGuid, orgGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveOrganizationFromUser(userGuid, orgGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    associateAuditedSpaceWithUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateAuditedSpaceWithUser(userGuid, spaceGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeAuditedSpaceFromUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveAuditedSpaceFromUser(userGuid, spaceGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateManagedSpaceWithUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateManagedSpaceWithUser(userGuid, spaceGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeManagedSpaceFromUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveManagedSpaceFromUser(userGuid, spaceGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateSpaceWithUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateSpaceWithUser(userGuid, spaceGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    removeSpaceFromUser: function (cnsiGuid, spaceGuid, userGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveSpaceFromUser(userGuid, spaceGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    /**
     * @name listAllAuditedOrganizationsForUser
     * @describe lists all audited organizations for user in cluster
     * @param {string} cnsiGuid - CNSI GUID
     * @param {string} userGuid - User GUID
     * @param {object=} params - http params
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {*}
     */
    listAllAuditedOrganizationsForUser: function (cnsiGuid, userGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllAuditedOrganizationsForUser(userGuid, this.modelUtils.makeListParams(params),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @name listAllBillingManagedOrganizationsForUser
     * @describe lists all billing managed organizations for user in cluster
     * @param {string} cnsiGuid - CNSI GUID
     * @param {string} userGuid - User GUID
     * @param {object=} params - http params
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {*}
     */
    listAllBillingManagedOrganizationsForUser: function (cnsiGuid, userGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllBillingManagedOrganizationsForUser(userGuid, this.modelUtils.makeListParams(params),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @name listAllManagedOrganizationsForUser
     * @describe lists all managed organizations for user in cluster
     * @param {string} cnsiGuid - CNSI GUID
     * @param {string} userGuid - User GUID
     * @param {object=} params - http params
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {*}
     */
    listAllManagedOrganizationsForUser: function (cnsiGuid, userGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllManagedOrganizationsForUser(userGuid, this.modelUtils.makeListParams(params),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @name listAllOrganizationsForUser
     * @describe lists all organizations where the user is an Org User in cluster
     * @param {string} cnsiGuid - CNSI GUID
     * @param {string} userGuid - User GUID
     * @param {object=} params - http params
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {*}
     */
    listAllOrganizationsForUser: function (cnsiGuid, userGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllOrganizationsForUser(userGuid, this.modelUtils.makeListParams(params),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @name listAllAuditedSpacesForUser
     * @describe lists all audited spaces for user in cluster
     * @param {string} cnsiGuid - CNSI GUID
     * @param {string} userGuid - User GUID
     * @param {object=} params - http params
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {*}
     */
    listAllAuditedSpacesForUser: function (cnsiGuid, userGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllAuditedSpacesForUser(userGuid, this.modelUtils.makeListParams(params),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @name listAllManagedSpacesForUser
     * @describe lists all managed spaces for user in cluster
     * @param {string} cnsiGuid - CNSI GUID
     * @param {string} userGuid - User GUID
     * @param {object=} params - http params
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {*}
     */
    listAllManagedSpacesForUser: function (cnsiGuid, userGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllManagedSpacesForUser(userGuid, this.modelUtils.makeListParams(params),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @name listAllSpacesForUser
     * @describe lists all spaces where user is a developer in
     * @param {string} cnsiGuid - CNSI GUID
     * @param {string} userGuid - User GUID
     * @param {object=} params - http params
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {*}
     */
    listAllSpacesForUser: function (cnsiGuid, userGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllSpacesForUser(userGuid, this.modelUtils.makeListParams(params),this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }
  });

})();
