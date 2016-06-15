(function() {
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


  function PrincipalFactory(modelManager) {

    function Principal(username, authToken, refreshToken, expiresIn, tokenType, scope, userInfo) {
      this.username = username;
      this.authToken = authToken;
      this.refreshToken = refreshToken;
      this.expiresIn = expiresIn;
      this.tokenType = tokenType;
      this.scope = scope;
      this.userInfo = userInfo;
    }

    angular.extend(Principal.prototype, {

      hasAccessTo: function(operation, flags) {
        return this.isAdmin() || flags[operation];
      },

      isAdmin: function() {
        return _.includes(this.scope, 'cloud_controller.admin');
      },

      isAllowed: function(context, resource_type, action, flags) {
        var accessChecker = this._getAccessChecker(resource_type, flags);
        return accessChecker[action](context);
      },

      _createAccessCheckerList: function(flags) {

        var OrganizationAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.organizationAccess');
        var ServiceInstanceAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.ServiceInstanceAccess');
        var RouteAccess = modelManager.retrieve('cloud-foundry.model.auth.checkers.RouteAccess');
        var ApplicationAccess = modelManager
          .retrieve('cloud-foundry.model.auth.checkers.ApplicationAccess');
        var checkers = [];
        checkers.push(new OrganizationAccess(this));
        checkers.push(new ServiceInstanceAccess(this, flags));
        checkers.push(new RouteAccess(this, flags));
        checkers.push(new ApplicationAccess(this, flags));
        return checkers;
      },

      _accessConstants: function() {
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
      }
      ,

      _getAccessChecker: function(resourceType, flags) {
        var checkers = this._createAccessCheckerList(flags);
        return checkers.find(function(x) {
          return x.canHandle(resourceType);
        });
      }
    });

    return Principal;
  }


})();
