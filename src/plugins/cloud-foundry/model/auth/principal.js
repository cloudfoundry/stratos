(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @memberOf cloud-foundry.model
   * @name PrincipalFactory
   * @description CF ACL Model
   */
  angular
    .module('cloud-foundry.model')
    .run(register);

  register.$inject = [
    'app.model.modelManager'
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
     * @description initialise a Principal object
     * @param {String} username - username
     * @param {String} expiresIn - expires in
     * @param {Boolean} isAdmin - is this user and admin
     * @param {Object} userInfo - user info
     * @constructor
     */
    function Principal(username, expiresIn, isAdmin, userInfo) {
      this.username = username;
      // this.authToken = authToken;
      // this.refreshToken = refreshToken;
      this.expiresIn = expiresIn;
      // this.tokenType = tokenType;
      this.isAdmin = isAdmin;
      this.userInfo = userInfo;
    }

    angular.extend(Principal.prototype, {

      /**
       * @name hasAccessTo
       * @description Does user have access to operation
       * @param {String} operation - operation name
       * @param {Array} flags - feature flags
       * @returns {*}
       */
      hasAccessTo: function (operation, flags) {
        return this.isAdmin || flags[operation];
      },

      /**
       * @name isAllowed
       * @description Is user permitted to do the action
       * @param {Object} context - context
       * @param {String} resourceType - ACL type
       * @param {String} action - action name
       * @param {Array} flags - feature flags
       * @returns {*}
       */
      isAllowed: function (context, resourceType, action, flags) {
        var accessChecker = this._getAccessChecker(resourceType, flags);
        return accessChecker[action](context);
      },

      /**
       * @name_createAccessCheckerList
       * @description Internal method to create checker list
       * @param {Array} flags - feature flags
       * @returns {Array}
       * @private
       */
      _createAccessCheckerList: function (flags) {

        var ServiceInstanceAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.serviceInstanceAccess');
        var OrganizationAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.organizationAccess');
        var RouteAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.routeAccess');
        var ApplicationAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.applicationAccess');

        var checkers = [];

        checkers.push(new OrganizationAccess(this));
        checkers.push(new ServiceInstanceAccess(this, flags));
        checkers.push(new RouteAccess(this, flags));
        checkers.push(new ApplicationAccess(this, flags));
        return checkers;
      },

      /**
       * Access constants
       * @returns {object}
       * @private
       */
      _accessConstants: function () {
        return {
          resources: {
            space: 'space',
            space_quota_definition: 'space_quota_definition',
            user_provided_service_instance: 'user_provided_service_instance',
            managed_service_instance: 'managed_service_instance',
            service_instance: 'service_instance',
            organization: 'organization',
            application: 'application',
            domain: 'domain',
            route: 'route'
          },

          actions: {
            create: 'create',
            update: 'update',
            delete: 'delete'
          }
        };
      },

      /**
       * @name _getAccessChecker
       * @description Get Access checker for a given resource type
       * @param {string} resourceType - resource type
       * @param {array} flags - feature flags
       * @returns {*}
       * @private
       */
      _getAccessChecker: function (resourceType, flags) {
        var checkers = this._createAccessCheckerList(flags);
        return _.find(checkers, function (checker) {
          return checker.canHandle(resourceType);
        });
      }
    });

    return Principal;
  }

})();
