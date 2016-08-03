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
    '$q'
  ];

  function registerSpaceModel(modelManager, apiManager, $q) {
    modelManager.register('cloud-foundry.model.space', new Space(apiManager, modelManager, $q));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Space
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @param {object} modelManager - the model manager
   * @property {object} stackatoInfoModel - the stackatoInfoModel service
   * @param {object} $q - angular $q service
   * @property {object} $q - angular $q service
   * @class
   */
  function Space(apiManager, modelManager, $q) {
    this.apiManager = apiManager;
    this.stackatoInfoModel = modelManager.retrieve('app.model.stackatoInfo');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
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
        .then(function (response) {
          return that.onListAllAppsForSpace(cnsiGuid, guid, response.data.resources);
        });
    },

    /**
     * @function onListAllAppsForSpace
     * @memberof cloud-foundry.model.space
     * @description Cache response
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - space GUID.
     * @param {object} apps - list of apps
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    onListAllAppsForSpace: function (cnsiGuid, guid, apps) {
      _.set(this, 'spaces.' + cnsiGuid + '.' + guid + '.apps', apps);
      return apps;
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
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllSpaces(params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
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
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllServicesForSpace(guid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return that.onListAllServicesForSpace(cnsiGuid, guid, response.data.resources);
        });
    },

    /**
     * @function onListAllServicesForSpace
     * @memberof cloud-foundry.model.space
     * @description Cache response
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object} services - list of services
     * @returns {object} services
     * @public
     */
    onListAllServicesForSpace: function (cnsiGuid, guid, services) {
      _.set(this, 'spaces.' + cnsiGuid + '.' + guid + '.services', services);
      return services;
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
          return that.onListAllServiceInstancesForSpace(cnsiGuid, guid, response.data.resources);
        });
    },

    /**
     * @function onListAllServiceInstancesForSpace
     * @memberof cloud-foundry.model.space
     * @description handle response
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object} serviceInstances - list of service instances
     * @returns {object} list of service instances
     * @public
     */
    onListAllServiceInstancesForSpace: function (cnsiGuid, guid, serviceInstances) {
      _.set(this, 'spaces.' + cnsiGuid + '.' + guid + '.instances', serviceInstances);
      return serviceInstances;
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

    /**
     * @function onListAllRoutesForSpace
     * @memberof cloud-foundry.model.space
     * @description Cache repsonse
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object} routes - list of routes
     * @returns {object} list of routes
     * @public
     */
    onListAllRoutesForSpace: function (cnsiGuid, guid, routes) {
      _.set(this, 'spaces.' + cnsiGuid + '.' + guid + '.routes', routes);
      return routes;
    },

    /**
     * @function listRolesOfAllUsersInSpace
     * @memberof cloud-foundry.model.space
     * @description lists all roles of all users in space
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - space GUID.
     * @param {object=} params - optional parameters
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listRolesOfAllUsersInSpace: function (cnsiGuid, guid, params) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .RetrievingRolesOfAllUsersInSpace(guid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return that.onListRolesOfAllUsersInSpace(cnsiGuid, guid, response.data.resources);
        });
    },

    /**
     * @function onListRolesOfAllUsersInSpace
     * @memberof cloud-foundry.model.space
     * @description Cache response
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - space GUID.
     * @param {object} roles - list of apps
     * @returns {object} roles
     * @public
     */
    onListRolesOfAllUsersInSpace: function (cnsiGuid, guid, roles) {
      var rolesByUserGuid = {};
      _.forEach(roles, function (user) {
        _.set(rolesByUserGuid, user.metadata.guid, user.entity.space_roles);
      });
      _.set(this, 'spaces.' + cnsiGuid + '.' + guid + '.roles', rolesByUserGuid);
      return roles;
    },

    /**
     * @function spaceRoleToString
     * @memberof cloud-foundry.model.space
     * @description Converts a space role to a localized string. The list of all organization
     * roles is: space_user, space_manager, space_auditor, space_developer
     * @param {string} role - The organization role
     * @returns {string} A localised version of the role
     * @public
     */
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

    /**
     * @function spaceRolesToStrings
     * @memberof cloud-foundry.model.space
     * @description Converts a list of cloud-foundry organization roles to a sorted localized list.
     * The list of all organization roles is: space_manager, space_auditor, space_developer
     * @param {Array} roles - A list of cloud-foundry space roles
     * @returns {string} An array of localised versions of the roles
     * @public
     */
    spaceRolesToStrings: function (roles) {
      var that = this;
      var rolesOrder = ['space_manager', 'space_auditor', 'space_developer'];

      if (!roles || roles.length === 0) {
        // Shouldn't happen as we should at least be a user of the space
        return [gettext('none assigned')];
      }
      roles.sort(function (r1, r2) {
        return rolesOrder.indexOf(r1) - rolesOrder.indexOf(r2);
      });
      return _.map(roles, function (role) {
        return that.spaceRoleToString(role);
      });
    },

    fetchSpacePath: function (cnsiGuid, guid) {
      return 'spaces.' + cnsiGuid + '.' + guid;
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

      var httpConfig = this.makeHttpConfig(cnsiGuid);
      var createdDate = moment(space.metadata.created_at, "YYYY-MM-DDTHH:mm:ssZ");

      var spaceQuotaApi = that.apiManager.retrieve('cloud-foundry.api.SpaceQuotaDefinitions');

      // var usedMemP = orgsApi.RetrievingOrganizationMemoryUsage(orgGuid, params, httpConfig);
      var instancesP = this.listAllServiceInstancesForSpace(cnsiGuid, spaceGuid);
      var quotaP = spaceQuotaGuid
        ? spaceQuotaApi.RetrieveSpaceQuotaDefinition(spaceQuotaGuid, params, httpConfig)
        : this.$q.when();

      // Find our user's GUID
      var userGuid = that.stackatoInfoModel.info;
      var rolesP = this.listRolesOfAllUsersInSpace(cnsiGuid, spaceGuid, params);

      var spaceRolesP = rolesP.then(function () {
        // Find my user's roles
        var myRoles = that.spaces[cnsiGuid][spaceGuid].roles[userGuid];
        if (!myRoles) {
          return [];
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

        details.totalRoles = (vals.roles || []).length;
        details.roles = vals.roles;

        details.totalServices = (vals.services || []).length;

        details.totalRoutes = (vals.routes || []).length;

        details.totalInstances = (vals.instances || []).length;

        _.set(that, 'spaces.' + cnsiGuid + '.' + spaceGuid + '.details', details);

        return details;
      });
    },

    createSpaces: function (cnsiGuid, orgGuid, spaceNames, params) {
      var that = this;

      var userGuid = this.stackatoInfoModel.info.endpoints.hcf[cnsiGuid].user.guid;
      var spaceApi = this.apiManager.retrieve('cloud-foundry.api.Spaces');

      var createPromises = [];

      function getSpaceDetails(response) {
        return that.getSpaceDetails(cnsiGuid, response.data);
      }

      for (var i = 0; i < spaceNames.length; i++) {
        var spaceName = spaceNames[i];
        var newSpace = {
          organization_guid: orgGuid,
          name: spaceName,
          manager_guids: [userGuid],
          developer_guids: [userGuid]
        };

        var createP = spaceApi.CreateSpace(newSpace, params, this.makeHttpConfig(cnsiGuid))
          .then(getSpaceDetails); // Cache the space details

        createPromises.push(createP);
      }

      return that.$q.all(createPromises).then(function () {
        // Refresh the org!
        var org = that.organizationModel.organizations[cnsiGuid][orgGuid].details.org;
        return that.organizationModel.getOrganizationDetails(cnsiGuid, org);
      });

    },

    deleteSpace: function (cnsiGuid, orgGuid, spaceGuid) {
      var that = this;
      var params = {
        recursive: false,
        async: false
      };
      var spaceApi = this.apiManager.retrieve('cloud-foundry.api.Spaces');
      return spaceApi.DeleteSpace(spaceGuid, params, this.makeHttpConfig(cnsiGuid)).then(function () {
        // Refresh the org!
        var org = that.organizationModel.organizations[cnsiGuid][orgGuid].details.org;
        return that.organizationModel.getOrganizationDetails(cnsiGuid, org);
      });
    },

    updateSpace: function (cnsiGuid, orgGuid, spaceGuid, spaceData) {
      var that = this;
      var spaceApi = this.apiManager.retrieve('cloud-foundry.api.Spaces');
      return spaceApi.UpdateSpace(spaceGuid, spaceData, {}, this.makeHttpConfig(cnsiGuid)).then(function (val) {
        // Refresh the org!
        var org = that.organizationModel.organizations[cnsiGuid][orgGuid].details.org;
        var orgRefreshedP = that.organizationModel.getOrganizationDetails(cnsiGuid, org);
        // Refresh the space!
        var spaceRefreshedP = that.getSpaceDetails(cnsiGuid, val.data, {});
        return that.$q.all([orgRefreshedP, spaceRefreshedP]);
      });
    }

  });

})();
