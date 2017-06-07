(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Users model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerUsersModel);

  function registerUsersModel(modelManager, apiManager, modelUtils) {
    modelManager.register('cloud-foundry.model.users', new Users(apiManager, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Users
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general cf model helpers
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general cf model helpers
   * @class
   */
  function Users(apiManager, modelUtils) {

    return {
      getUserSummary: getUserSummary,
      listAllUsers: listAllUsers,
      associateAuditedOrganizationWithUser: associateAuditedOrganizationWithUser,
      removeAuditedOrganizationFromUser: removeAuditedOrganizationFromUser,
      associateBillingManagedOrganizationWithUser: associateBillingManagedOrganizationWithUser,
      removeBillingManagedOrganizationFromUser: removeBillingManagedOrganizationFromUser,
      associateManagedOrganizationWithUser: associateManagedOrganizationWithUser,
      removeManagedOrganizationFromUser: removeManagedOrganizationFromUser,
      associateOrganizationWithUser: associateOrganizationWithUser,
      removeOrganizationFromUser: removeOrganizationFromUser,
      associateAuditedSpaceWithUser: associateAuditedSpaceWithUser,
      removeAuditedSpaceFromUser: removeAuditedSpaceFromUser,
      associateManagedSpaceWithUser: associateManagedSpaceWithUser,
      removeManagedSpaceFromUser: removeManagedSpaceFromUser,
      associateSpaceWithUser: associateSpaceWithUser,
      removeSpaceFromUser: removeSpaceFromUser,
      listAllAuditedOrganizationsForUser: listAllAuditedOrganizationsForUser,
      listAllBillingManagedOrganizationsForUser: listAllBillingManagedOrganizationsForUser,
      listAllManagedOrganizationsForUser: listAllManagedOrganizationsForUser,
      listAllOrganizationsForUser: listAllOrganizationsForUser,
      listAllAuditedSpacesForUser: listAllAuditedSpacesForUser,
      listAllManagedSpacesForUser: listAllManagedSpacesForUser,
      listAllSpacesForUser: listAllSpacesForUser
    };

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
    function getUserSummary(cnsiGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .GetUserSummary(userGuid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data;
        });
    }

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
    function listAllUsers(cnsiGuid, params, paginate) {

      return apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllUsers(modelUtils.makeListParams(params), modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        }).then(function (users) {
          // Pre-sort users to avoid smart-table flicker in the endpoints dashboard
          return _.sortBy(users, function (u) {
            if (u.entity.username) {
              return u.entity.username.toLowerCase();
            }
            return u.entity.username;
          });
        });
    }

    function associateAuditedOrganizationWithUser(cnsiGuid, orgGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateAuditedOrganizationWithUser(userGuid, orgGuid, params,
          modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    }

    function removeAuditedOrganizationFromUser(cnsiGuid, orgGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveAuditedOrganizationFromUser(userGuid, orgGuid, params,
          modelUtils.makeHttpConfig(cnsiGuid));
    }

    function associateBillingManagedOrganizationWithUser(cnsiGuid, orgGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateBillingManagedOrganizationWithUser(userGuid, orgGuid, params,
          modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    }

    function removeBillingManagedOrganizationFromUser(cnsiGuid, orgGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveBillingManagedOrganizationFromUser(userGuid, orgGuid, params,
          modelUtils.makeHttpConfig(cnsiGuid));
    }

    function associateManagedOrganizationWithUser(cnsiGuid, orgGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateManagedOrganizationWithUser(userGuid, orgGuid, params,
          modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    }

    function removeManagedOrganizationFromUser(cnsiGuid, orgGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveManagedOrganizationFromUser(userGuid, orgGuid, params,
          modelUtils.makeHttpConfig(cnsiGuid));
    }

    function associateOrganizationWithUser(cnsiGuid, orgGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateOrganizationWithUser(userGuid, orgGuid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    }

    function removeOrganizationFromUser(cnsiGuid, orgGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveOrganizationFromUser(userGuid, orgGuid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    }

    function associateAuditedSpaceWithUser(cnsiGuid, spaceGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateAuditedSpaceWithUser(userGuid, spaceGuid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    }

    function removeAuditedSpaceFromUser(cnsiGuid, spaceGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveAuditedSpaceFromUser(userGuid, spaceGuid, params, modelUtils.makeHttpConfig(cnsiGuid));
    }

    function associateManagedSpaceWithUser(cnsiGuid, spaceGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateManagedSpaceWithUser(userGuid, spaceGuid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    }

    function removeManagedSpaceFromUser(cnsiGuid, spaceGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveManagedSpaceFromUser(userGuid, spaceGuid, params, modelUtils.makeHttpConfig(cnsiGuid));
    }

    function associateSpaceWithUser(cnsiGuid, spaceGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .AssociateSpaceWithUser(userGuid, spaceGuid, params, modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    }

    function removeSpaceFromUser(cnsiGuid, spaceGuid, userGuid, params) {
      return apiManager.retrieve('cloud-foundry.api.Users')
        .RemoveSpaceFromUser(userGuid, spaceGuid, params, modelUtils.makeHttpConfig(cnsiGuid));
    }

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
    function listAllAuditedOrganizationsForUser(cnsiGuid, userGuid, params, paginate) {

      return apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllAuditedOrganizationsForUser(userGuid, modelUtils.makeListParams(params),
          modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }

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
    function listAllBillingManagedOrganizationsForUser(cnsiGuid, userGuid, params, paginate) {

      return apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllBillingManagedOrganizationsForUser(userGuid, modelUtils.makeListParams(params),
          modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }

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
    function listAllManagedOrganizationsForUser(cnsiGuid, userGuid, params, paginate) {

      return apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllManagedOrganizationsForUser(userGuid, modelUtils.makeListParams(params),
          modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }

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
    function listAllOrganizationsForUser(cnsiGuid, userGuid, params, paginate) {

      return apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllOrganizationsForUser(userGuid, modelUtils.makeListParams(params),
          modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }

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
    function listAllAuditedSpacesForUser(cnsiGuid, userGuid, params, paginate) {

      return apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllAuditedSpacesForUser(userGuid, modelUtils.makeListParams(params),
          modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }

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
    function listAllManagedSpacesForUser(cnsiGuid, userGuid, params, paginate) {

      return apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllManagedSpacesForUser(userGuid, modelUtils.makeListParams(params),
          modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }

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
    function listAllSpacesForUser(cnsiGuid, userGuid, params, paginate) {

      return apiManager.retrieve('cloud-foundry.api.Users')
        .ListAllSpacesForUser(userGuid, modelUtils.makeListParams(params), modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return modelUtils.dePaginate(response.data, modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    }
  }

})();
