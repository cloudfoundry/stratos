(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model.PrincipalFactory
   * @memberof cloud-foundry.model
   * @name PrincipalFactory
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  function register(modelManager) {
    modelManager.register('cloud-foundry.model.auth.principal', PrincipalFactory(modelManager));
  }

  /**
   * @name PrincipalFactory
   * @description Function to return an Principal class
   * @param {app.api.modelManager}  modelManager - the Model management service
   * @returns {Principal}
   * @constructor
   */
  function PrincipalFactory(modelManager) {

    /**
     * @name Principal
     * @description Enforces ACLs for a particular connceted endpoint
     * @param {String} consoleInfo - consoleInfo data
     * @param {Object} userSummary - user info
     * @param {Object} featureFlags - Feature flags for cluster
     * @param {String} cnsiGuid - cluster GUID
     * @constructor
     */
    function Principal(consoleInfo, userSummary, featureFlags, cnsiGuid) {

      var model = {
        consoleInfo: consoleInfo,
        isAdmin: consoleInfo.endpoints.cf[cnsiGuid].user.admin,
        userSummary: userSummary,
        featureFlags: featureFlags,
        checkers: [],
        hasAccessTo: hasAccessTo,
        isAllowed: isAllowed
      };

      return model;

      /**
       * @name hasAccessTo
       * @description Does user have access to operation based on feature flags
       * @param {String} operation - operation name
       * @returns {*}
       */
      function hasAccessTo(operation) {
        return model.isAdmin || model.featureFlags[operation];
      }

      /**
       * @name isAllowed
       * @description Is user permitted to do the action.
       * @param {String} resourceType - ACL type
       * @param {String} action - action name
       * @returns {*}
       */
      function isAllowed(resourceType, action) {

        var args = Array.prototype.slice.call(arguments);
        if (args.length > 2) {
          // pass the rest of the arguments into accessChecker action
          args = args.splice(2);
        }

        var accessChecker = _getAccessChecker(resourceType, model.featureFlags);
        return accessChecker[action].apply(accessChecker, args);
      }

      /**
       * @name_createAccessCheckerList
       * @description Internal method to create checker list
       * @returns {Array}
       * @private
       */
      function _createAccessCheckerList() {

        var ServiceInstanceAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.serviceInstanceAccess');
        var OrganizationAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.organizationAccess');
        var RouteAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.routeAccess');
        var ApplicationAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.applicationAccess');
        var SpaceAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.spaceAccess');
        var UserAssignmentAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.usersAssignmentAccess');

        var checkers = [];

        checkers.push(new OrganizationAccess(model));
        checkers.push(new ServiceInstanceAccess(model, model.featureFlags));
        checkers.push(new RouteAccess(model, model.featureFlags));
        checkers.push(new ApplicationAccess(model, model.featureFlags));
        checkers.push(new SpaceAccess(model, model.featureFlags));
        checkers.push(new UserAssignmentAccess(model, model.featureFlags));
        return checkers;
      }

      /**
       * @name _getAccessChecker
       * @description Get Access checker for a given resource type
       * @param {string} resourceType - resource type
       * @returns {*}
       * @private
       */
      function _getAccessChecker(resourceType) {

        if (model.checkers.length === 0) {
          model.checkers = _createAccessCheckerList();
        }
        return _.find(model.checkers, function (checker) {
          return checker.canHandle(resourceType);
        });
      }
    }

    return Principal;
  }

})();
