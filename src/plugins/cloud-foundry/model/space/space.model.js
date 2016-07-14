(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Space model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerSpaceModel);

  registerSpaceModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'userInfoService',
    '$q'
  ];

  function registerSpaceModel(modelManager, apiManager, userInfoService, $q) {
    modelManager.register('cloud-foundry.model.space', new Space(apiManager, userInfoService, $q));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Space
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @class
   */
  function Space(apiManager, userInfoService, $q) {
    this.apiManager = apiManager;
    this.userInfoService = userInfoService;
    this.$q = $q;
    this.data = {
    };

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

  angular.extend(Space.prototype, {
   /**
    * @function listAllAppsForSpace
    * @memberof cloud-foundry.model.space
    * @description lists all spaces
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} guid - space GUID.
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllAppsForSpace: function (cnsiGuid, guid, params) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllAppsForSpace(guid, params, this.makeHttpConfig(cnsiGuid))
        .then(function(response) {
          that.onAllAppsForSpace(cnsiGuid, guid, response.data.resources);
          return response.data.resources;
        });
    },

    onAllAppsForSpace: function(cnsiGuid, spaceGuid, apps) {
      _.set(this.data, cnsiGuid + '.apps.' + spaceGuid, apps);
    },

   /**
    * @function listAllSpaces
    * @memberof cloud-foundry.model.space
    * @description lists all spaces
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {object} params - optional parameters
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllSpaces: function (cnsiGuid, params) {
     // var that = this;
     return this.apiManager.retrieve('cloud-foundry.api.Spaces')
       .ListAllSpaces(params, this.makeHttpConfig(cnsiGuid))
       .then(function(response) {
        // that.onAllSpaces(cnsiGuid, response.data.resources);
         return response.data.resources;
       });
    },

    onAllSpaces: function(cnsiGuid, spaces) {
      // var that = this;
      // _.unset(this.data, cnsiGuid + '.spaces');
      // _.forEach(spaces, function(space) {
      //   var dataPath = cnsiGuid + '.spaces.' + space.entity.organization_guid;
      //   var orgSpaces = _.get(that.data, dataPath, {});
      //   orgSpaces[space.metadata.guid] = space;
      //   _.set(that.data, dataPath, orgSpaces);
      // });
    },

    /**
     * @function listAllServicesForSpace
     * @memberof cloud-foundry.model.space
     * @description List all services available for space
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object} params - extra params to pass to request
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllServicesForSpace: function (cnsiGuid, guid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllServicesForSpace(guid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    /**
     * @function listAllServiceInstancesForSpace
     * @memberof cloud-foundry.model.space
     * @description List all service instances available for space
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object=} params - extra params to pass to request
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllServiceInstancesForSpace: function (cnsiGuid, guid, params) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllServiceInstancesForSpace(guid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          that.onAllServiceInstancesForSpace(cnsiGuid, guid, response.data.resources);
          return response.data.resources;
        });
    },

    /**
     * @function listAllRoutesForSpace
     * @memberof cloud-foundry.model.space
     * @description Lost all routes for service
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object=} options - additional parameters for request
     * @returns {promise} A promise object
     * @public
     */
    listAllRoutesForSpace: function (cnsiGuid, guid, options) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllRoutesForSpace(guid, options, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return that.onListAllRoutesForSpace(cnsiGuid, guid, response.data.resources);
        });
    },

    onAllServiceInstancesForSpace: function(cnsiGuid, spaceGuid, instances) {
      _.set(this.data, cnsiGuid + '.serviceInstances.' + spaceGuid, instances);
    },

    /**
     * @function onListAllRoutesForSpace
     * @memberof cloud-foundry.model.space
     * @description listAllRoutesForSpace handler at model layer
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} spaceGuid - the space guid
     * @param {string} routes - the JSON returned from API call
     * @returns {object} The response
     * @private
     */
    onListAllRoutesForSpace: function (cnsiGuid, spaceGuid, routes) {
      _.set(this, 'routes.' + cnsiGuid + '.' + spaceGuid, routes);
      return routes;
    },

    //The list of all organization roles is: org_user, org_manager, org_auditor, billing_manager
    spaceRoleToString: function (role) {
      switch (role) {
        case 'space_user':
          return gettext('User');
        case 'space_manager':
          return gettext('Manager');
        case 'space_auditor':
          return gettext('Auditor');
        case 'space_developer':
          return gettext('Developer');
      }
      return role;
    },

    //The list of all organization roles is: org_user, org_manager, org_auditor, billing_manager
    spaceRolesToString: function (roles) {
      var that = this;

      if (roles.length === 0) {
        // Shouldn't happen as we should at least be a user of the org
        return gettext('none');
      } else {
        // If there are more than one role, don't show the user role
        if (roles.length > 1) {
          _.remove(roles, function (role) {
            return role === 'space_user';
          });
        }
        return _.map(roles, function (role) {
          return that.spaceRoleToString(role);
        }).join(', ');
      }
    },

    /**
     * @function  getSpaceDetails
     * @memberof cloud-foundry.model.space
     * @description gather all sorts of details about an space
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server
     * @param {string} space - the space object as defined by cloud-foundry
     * @param {object=} params - optional parameters
     * @returns {promise} A promise which will be resolved with the organizations's details
     * */
    getSpaceDetails: function (cnsiGuid, space, params) {
      var that = this;

      var spaceGuid = space.metadata.guid;
      var spaceQuotaGuid = space.entity.space_quota_definition_guid;

      var exists = _.get(that, 'spaces.' + cnsiGuid + '.' + spaceGuid);
      if (exists) {
        return exists;
      }

      var httpConfig = this.makeHttpConfig(cnsiGuid);
      var createdDate = moment(space.metadata.created_at, "YYYY-MM-DDTHH:mm:ssZ");

      var spaceApi = that.apiManager.retrieve('cloud-foundry.api.Spaces');
      // var orgsApi = that.apiManager.retrieve('cloud-foundry.api.Organizations');
      var spaceQuotaApi = that.apiManager.retrieve('cloud-foundry.api.SpaceQuotaDefinitions');

      // var usedMemP = orgsApi.RetrievingOrganizationMemoryUsage(orgGuid, params, httpConfig);
      var instancesP = this.listAllServiceInstancesForSpace(cnsiGuid, spaceGuid);
      var quotaP = spaceQuotaGuid
        ? spaceQuotaApi.RetrieveSpaceQuotaDefinition(spaceQuotaGuid, params, httpConfig)
        : this.$q.when();

      var rolesP = spaceApi.RetrievingRolesOfAllUsersInSpace(spaceGuid, params, httpConfig);
      var userInfoP = that.userInfoService.userInfo();

      var spaceRolesP = that.$q.all({roles: rolesP, userInfo: userInfoP}).then(function (values) {
        var i, userGuid, myRoles;

        // Find our user's GUID
        for (i = 0; i < values.userInfo.data.length; i++) {
          var userPerms = values.userInfo.data[i];
          if (userPerms.type === 'hcf' && userPerms.cnsi_guid === cnsiGuid) {
            userGuid = userPerms.user_guid;
            break;
          }
        }
        if (!userGuid) {
          throw new Error('Failed to get HCF user GUID');
        }

        // Find my user's roles
        for (i = 0; i < values.roles.data.resources.length; i++) {
          var roles = values.roles.data.resources[i];
          if (roles.metadata.guid === userGuid) {
            myRoles = roles.entity.space_roles;
            break;
          }
        }
        if (!myRoles) {
          throw new Error('Failed to find my roles in this space');
        }
        return myRoles;
      });

      var appP = this.listAllAppsForSpace(cnsiGuid, spaceGuid);
      var servicesP = this.listAllServicesForSpace(cnsiGuid, spaceGuid);
      var routesCountP = this.listAllRoutesForSpace(cnsiGuid, spaceGuid);

      return this.$q.all({
        // memory: usedMemP,
        quota: quotaP,
        instances: instancesP,
        apps: appP,
        roles: spaceRolesP,
        services: servicesP,
        routes: routesCountP
      }).then(function (vals) {
        var details = {};

        details.guid = spaceGuid;

        details.space = space;

        // Set created date for sorting
        details.created_at = createdDate.unix();

        // Set memory utilisation
        // details.memUsed = vals.memory.data.memory_usage_in_mb;
        // details.memQuota = vals.quota.data.entity.memory_limit;

        // Set total apps count
        details.totalApps = (vals.apps || []).length;
        details.apps = vals.apps;

        details.totalRoles = (vals.roles || []).length;
        details.roles = vals.roles;

        details.totalServices = (vals.services || []).length;
        details.services = vals.services;

        details.totalRoutes = (vals.routes || []).length;
        details.routes = vals.routes;

        details.totalInstances = (vals.instances || []).length;
        details.instances = vals.instances;

        _.set(that, 'spaces.' + cnsiGuid + '.' + spaceGuid, details);
        return details;
      });
    }
  });

})();
