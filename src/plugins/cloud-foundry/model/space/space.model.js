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
    '$q',
    'app.model.modelManager',
    'app.api.apiManager'
  ];

  function registerSpaceModel($q, modelManager, apiManager) {
    modelManager.register('cloud-foundry.model.space', new Space($q, apiManager, modelManager));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Space
   * @param {object} $q - angular $q service
   * @property {object} $q - angular $q service
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @param {object} modelManager - the model manager
   * @property {object} stackatoInfoModel - the stackatoInfoModel service
   * @class
   */
  function Space($q, apiManager, modelManager) {
    this.$q = $q;
    this.apiManager = apiManager;
    this.stackatoInfoModel = modelManager.retrieve('app.model.stackatoInfo');
    this.organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
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

      // Ensures we also update inlined data for getDetails to pick up
      var cachedSpace = _.get(this, 'spaces.' + cnsiGuid + '.' + guid + '.details.space');
      if (angular.isDefined(cachedSpace)) {
        cachedSpace.entity.apps = apps;
      }

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
      var combinedParams = params || {};
      var inlineParams = {
        'inline-relations-depth': 2,
        'include-relations': 'service_bindings,service_plan,service,app'
      };
      _.assign(combinedParams, inlineParams);
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllServiceInstancesForSpace(guid, combinedParams, this.makeHttpConfig(cnsiGuid))
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
     * @param {object=} params - additional parameters for request
     * @returns {promise} A promise object
     * @public
     */
    listAllRoutesForSpace: function (cnsiGuid, guid, params) {
      var that = this;
      var combinedParams = params || {};
      var inlineParams = {
        'inline-relations-depth': 1,
        'include-relations': 'domain,apps'
      };
      _.assign(combinedParams, inlineParams);
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllRoutesForSpace(guid, combinedParams, this.makeHttpConfig(cnsiGuid))
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
     * @param {object} allUsersRoles - list of apps
     * @returns {object} roles
     * @public
     */
    onListRolesOfAllUsersInSpace: function (cnsiGuid, guid, allUsersRoles) {
      var rolesByUserGuid = {};
      _.forEach(allUsersRoles, function (user) {
        _.set(rolesByUserGuid, user.metadata.guid, user.entity.space_roles);
      });
      _.set(this, 'spaces.' + cnsiGuid + '.' + guid + '.roles', rolesByUserGuid);

      // Ensures we also update inlined data for getDetails to pick up
      var cachedSpace = _.get(this, 'spaces.' + cnsiGuid + '.' + guid + '.details.space');
      if (angular.isDefined(cachedSpace)) {
        _splitSpaceRoles(cachedSpace, allUsersRoles);
      }

      return allUsersRoles;
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

      var rolesP, appP, quotaP;

      // We cannot rely on inline routes as they lack the depth we need later on
      var serviceInstancesP = this.listAllServiceInstancesForSpace(cnsiGuid, spaceGuid, {
        return_user_provided_service_instances: false
      });

      if (spaceQuotaGuid) {
        // Check for inline quota!
        if (space.entity.space_quota_definition) {
          quotaP = this.$q.resolve(space.entity.space_quota_definition);
        } else {
          quotaP = spaceQuotaApi.RetrieveSpaceQuotaDefinition(spaceQuotaGuid, params, httpConfig).then(function (res) {
            return res.data;
          });
        }
      } else {
        quotaP = this.$q.when();
      }

      // Find our user's GUID
      var userGuid = that.stackatoInfoModel.info;

      // Space roles can be inlined
      if (space.entity.managers) {
        var unsplitRoles = _unsplitSpaceRoles(space);
        rolesP = that.$q.resolve(unsplitRoles);
        that.onListRolesOfAllUsersInSpace(cnsiGuid, spaceGuid, unsplitRoles);
      } else {
        rolesP = this.listRolesOfAllUsersInSpace(cnsiGuid, spaceGuid, params);
      }

      var spaceRolesP = rolesP.then(function () {
        // Find my user's roles
        var myRoles = that.spaces[cnsiGuid][spaceGuid].roles[userGuid];
        if (!myRoles) {
          return [];
        }
        return myRoles;
      });

      if (space.entity.apps) {
        appP = that.$q.resolve(space.entity.apps);
        that.onListAllAppsForSpace(cnsiGuid, spaceGuid, space.entity.apps);
      } else {
        appP = this.listAllAppsForSpace(cnsiGuid, spaceGuid);
      }

      // Services are never inlined
      var servicesP = this.listAllServicesForSpace(cnsiGuid, spaceGuid);

      // We cannot rely on inline routes as they lack the depth we need later on
      var routesP = this.listAllRoutesForSpace(cnsiGuid, spaceGuid);

      return this.$q.all({
        // memory: usedMemP,
        quota: quotaP,
        serviceInstances: serviceInstancesP,
        apps: appP,
        roles: spaceRolesP,
        services: servicesP,
        routes: routesP
      }).then(function (vals) {
        var details = {};

        var appInstances = 0;
        _.forEach(vals.apps, function (app) {
          if (app.entity.state === 'STARTED') {
            appInstances += parseInt(app.entity.instances, 10);
          }
        });

        details.guid = spaceGuid;

        details.space = space;

        // Set created date for sorting
        details.created_at = createdDate.unix();

        // Set memory utilisation
        details.memUsed = 0;
        _.forEach(space.entity.apps, function (app) {
          // Only count running apps, like the CF API would do
          if (app.entity.state === 'STARTED') {
            details.memUsed += parseInt(app.entity.memory, 10);
          }
        });
        details.memQuota = _.get(vals.quota, 'entity.memory_limit', -1);

        // Set total apps and app instances count
        details.totalApps = (vals.apps || []).length;

        details.totalAppInstances = appInstances;
        details.appInstancesQuota = _.get(vals.quota, 'entity.app_instance_limit', -1);

        details.totalRoles = (vals.roles || []).length;
        details.roles = vals.roles;

        details.totalServices = (vals.services || []).length;
        details.servicesQuota = _.get(vals.quota, 'entity.total_services', -1);

        details.totalRoutes = (vals.routes || []).length;
        details.routesQuota = _.get(vals.quota, 'entity.total_routes', -1);

        details.totalServiceInstances = (vals.serviceInstances || []).length;
        details.serviceInstancesQuota = _.get(vals.quota, 'entity.total_services', -1);

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
        that.organizationModel.uncacheOrganizationSpaces(cnsiGuid, orgGuid);
        var org = that.organizationModel.organizations[cnsiGuid][orgGuid].details.org;
        var orgRefreshedP = that.organizationModel.getOrganizationDetails(cnsiGuid, org);

        // Refresh the space!
        var spaceRefreshedP = that.getSpaceDetails(cnsiGuid, val.data, {});

        return that.$q.all([orgRefreshedP, spaceRefreshedP]);
      });
    }

  });

  var SPACE_ROLE_TO_KEY = {
    space_developer: 'developers',
    space_manager: 'managers',
    space_auditor: 'auditors'
  };

  function _shallowCloneUser(user) {
    var clone = {
      entity: _.clone(user.entity),
      metadata: _.clone(user.metadata)
    };
    if (clone.entity.space_roles) {
      delete clone.entity.space_roles;
    }
    return clone;
  }

  function _hasRole(user, role) {
    return user.entity.space_roles.indexOf(role) > -1;
  }

  function assembleSpaceRoles(users, role, usersHash) {
    _.forEach(users, function (user) {
      var userKey = user.metadata.guid;
      if (!usersHash.hasOwnProperty(userKey)) {
        usersHash[userKey] = _shallowCloneUser(user);
      }
      usersHash[userKey].entity.space_roles = usersHash[userKey].entity.space_roles || [];
      usersHash[userKey].entity.space_roles.push(role);
    });
  }

  /**
   * Transform split space role properties into an array of users with a space_roles property such as
   * returned by the: RetrievingRolesOfAllUsersInSpace() cloud foundry API
   * @param {Object} aSpace space object containing inlined managers etc.
   * @returns {Array} a list of Users of the space with their space_roles property populated
   * */
  function _unsplitSpaceRoles(aSpace) {
    var usersHash = {};
    _.forEach(SPACE_ROLE_TO_KEY, function (key, role) {
      assembleSpaceRoles(aSpace.entity[key], role, usersHash);
    });
    return _.values(usersHash);
  }

  function _splitSpaceRoles(aSpace, usersRoles) {
    _.forEach(SPACE_ROLE_TO_KEY, function (key, role) {
      // Clean while preserving ref in case directives are bound to it
      if (angular.isDefined(aSpace.entity[key])) {
        aSpace.entity[key].length = 0;
      } else {
        aSpace.entity[key] = [];
      }
      _.forEach(usersRoles, function (user) {
        if (_hasRole(user, role)) { aSpace.entity[key].push(user); }
      });
    });
  }

})();
