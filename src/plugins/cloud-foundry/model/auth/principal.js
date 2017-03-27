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

  register.$inject = [
    'modelManager'
  ];

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
     * @param {String} stackatoInfo - stackatoInfo data
     * @param {Object} userSummary - user info
     * @param {Object} featureFlags - Feature flags for cluster
     * @param {String} cnsiGuid - cluster GUID
     * @constructor
     */
    function Principal(stackatoInfo, userSummary, featureFlags, cnsiGuid) {

      this.isAdmin = stackatoInfo.endpoints.hcf[cnsiGuid].user.admin;
      this.stackatoInfo = stackatoInfo;
      this.userSummary = userSummary;
      this.featureFlags = featureFlags;
      this.checkers = [];
    }

    angular.extend(Principal.prototype, {

      /**
       * @name hasAccessTo
       * @description Does user have access to operation based on feature flags
       * @param {String} operation - operation name
       * @returns {*}
       */
      hasAccessTo: function (operation) {
        return this.isAdmin || this.featureFlags[operation];
      },

      /**
       * @name isAllowed
       * @description Is user permitted to do the action.
       * @param {String} resourceType - ACL type
       * @param {String} action - action name
       * @returns {*}
       */
      isAllowed: function (resourceType, action) {

        var args = Array.prototype.slice.call(arguments);
        if (args.length > 2) {
          // pass the rest of the arguments into accessChecker action
          args = args.splice(2);
        }

        var accessChecker = this._getAccessChecker(resourceType, this.featureFlags);
        return accessChecker[action].apply(accessChecker, args);
      },

      /**
       * @name_createAccessCheckerList
       * @description Internal method to create checker list
       * @returns {Array}
       * @private
       */
      _createAccessCheckerList: function () {

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

        checkers.push(new OrganizationAccess(this));
        checkers.push(new ServiceInstanceAccess(this, this.featureFlags));
        checkers.push(new RouteAccess(this, this.featureFlags));
        checkers.push(new ApplicationAccess(this, this.featureFlags));
        checkers.push(new SpaceAccess(this, this.featureFlags));
        checkers.push(new UserAssignmentAccess(this, this.featureFlags));
        return checkers;
      },

      /**
       * @name _getAccessChecker
       * @description Get Access checker for a given resource type
       * @param {string} resourceType - resource type
       * @returns {*}
       * @private
       */
      _getAccessChecker: function (resourceType) {

        if (this.checkers.length === 0) {
          this.checkers = this._createAccessCheckerList();
        }
        return _.find(this.checkers, function (checker) {
          return checker.canHandle(resourceType);
        });
      }
    });

    return Principal;
  }

})();
