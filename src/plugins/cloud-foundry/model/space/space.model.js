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
    'app.api.apiManager',
    'cloud-foundry.model.service.serviceUtils',
    'cloud-foundry.model.modelUtils'
  ];

  function registerSpaceModel($q, modelManager, apiManager, serviceUtils, modelUtils) {
    modelManager.register('cloud-foundry.model.space', new Space($q, apiManager, modelManager, serviceUtils, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Space
   * @param {object} $q - angular $q service
   * @property {object} $q - angular $q service
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @param {object} modelManager - the model manager
   * @param {cloud-foundry.model.service.serviceUtils} serviceUtils - the service utils service
   * @param {cloud-foundry.model.modelUtils} modelUtils - a service containing general hcf model helpers
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @class
   */
  function Space($q, apiManager, modelManager, serviceUtils, modelUtils) {
    this.$q = $q;
    this.apiManager = apiManager;
    this.modelManager = modelManager;
    this.serviceUtils = serviceUtils;
    this.modelUtils = modelUtils;
    this.spaceApi = apiManager.retrieve('cloud-foundry.api.Spaces');
    this.data = {};

  }

  angular.extend(Space.prototype, {
   /**
    * @function listAllAppsForSpace
    * @memberof cloud-foundry.model.space
    * @description lists all spaces
    * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
    * @param {string} guid - space GUID.
    * @param {object=} params - optional parameters
    * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
    * containing ALL results will be returned. This could mean more than one http request is made.
    * @returns {promise} A resolved/rejected promise
    * @public
    */
    listAllAppsForSpace: function (cnsiGuid, guid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllAppsForSpace(guid, this.modelUtils.makeListParams(params), this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (apps) {
          return that.onListAllAppsForSpace(cnsiGuid, guid, apps);
        });
    },

    /**
     * @function onListAllAppsForSpace
     * @memberof cloud-foundry.model.space
     * @description Cache response
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - space GUID.
     * @param {Array} apps - array of apps
     * @returns {Array} The array of apps
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
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllSpaces: function (cnsiGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllSpaces(this.modelUtils.makeListParams(params), this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @function listAllServicesForSpace
     * @memberof cloud-foundry.model.space
     * @description List all services available for space
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object=} params - extra params to pass to request
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllServicesForSpace: function (cnsiGuid, guid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllServicesForSpace(guid, this.modelUtils.makeListParams(params), this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (services) {
          return that.onListAllServicesForSpace(cnsiGuid, guid, services);
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
      this.serviceUtils.enhance(services);
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
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllServiceInstancesForSpace: function (cnsiGuid, guid, params, paginate) {
      var that = this;
      var inlineParams = {
        'inline-relations-depth': 2,
        'include-relations': 'service_bindings,service_plan,service,app'
      };
      var combinedParams = _.assign(params, inlineParams);
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllServiceInstancesForSpace(guid, this.modelUtils.makeListParams(combinedParams),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (serviceInstances) {
          return that.onListAllServiceInstancesForSpace(cnsiGuid, guid, serviceInstances);
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
      _.set(this, 'spaces.' + cnsiGuid + '.' + guid + '.details.totalServiceInstances', (serviceInstances || []).length);
      return serviceInstances;
    },

    /**
     * @function listAllRoutesForSpace
     * @memberof cloud-foundry.model.space
     * @description Lost all routes for service
     * @param {string} cnsiGuid - the CNSI guid
     * @param {string} guid - the space guid
     * @param {object=} params - additional parameters for request
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A promise object
     * @public
     */
    listAllRoutesForSpace: function (cnsiGuid, guid, params, paginate) {
      var that = this;
      var inlineParams = {
        'inline-relations-depth': 1,
        'include-relations': 'domain,apps'
      };
      var combinedParams = _.assign(params, inlineParams);
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .ListAllRoutesForSpace(guid, this.modelUtils.makeListParams(combinedParams),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (routes) {
          return that.onListAllRoutesForSpace(cnsiGuid, guid, routes);
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
      _.set(this, 'spaces.' + cnsiGuid + '.' + guid + '.details.totalRoutes', (routes || []).length);
      return routes;
    },

    /**
     * @function listRolesOfAllUsersInSpace
     * @memberof cloud-foundry.model.space
     * @description lists all roles of all users in space
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - space GUID.
     * @param {object=} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listRolesOfAllUsersInSpace: function (cnsiGuid, guid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Spaces')
        .RetrievingRolesOfAllUsersInSpace(guid, this.modelUtils.makeListParams(params),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        })
        .then(function (roles) {
          return that.onListRolesOfAllUsersInSpace(cnsiGuid, guid, roles);
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
     * @function cacheUsersRolesInSpace
     * @memberof cloud-foundry.model.space
     * @description Cache user roles from a HCF space entity
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} space - HCF space entity. This should contain a set of params to extract the roles from
     * @returns {object} unsplit space roles
     * @public
     */
    cacheUsersRolesInSpace: function (cnsiGuid, space) {
      var unsplitRoles = _unsplitSpaceRoles(space);
      this.onListRolesOfAllUsersInSpace(cnsiGuid, space.metadata.guid, unsplitRoles);
      return unsplitRoles;
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

    /**
     * @function fetchSpace
     * @memberof cloud-foundry.model.space
     * @description Fetches the cached space object
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - space GUID.
     * @returns {object} The cached space object
     * @public
     */
    fetchSpace: function (cnsiGuid, guid) {
      if (this.spaces && this.spaces[cnsiGuid]) {
        return this.spaces[cnsiGuid][guid];
      }
    },

    /**
     * @function updateRoutesCount
     * @memberof cloud-foundry.model.space
     * @description Updates the cached route count either from the provided value or via HCF. This will be used when
     * it's not appropriate to fetch/use data that's inline
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - space GUID.
     * @param {number=} count - the number of routes.
     * @returns {promise} promise object once completed, contains number of routes
     * @public
     */
    updateRoutesCount: function (cnsiGuid, guid, count) {
      var that = this;
      var promise = this.$q.resolve({ data: { total_results: count }});
      if (!count) {
        promise = this.apiManager.retrieve('cloud-foundry.api.Spaces')
          .ListAllRoutesForSpace(guid, { 'results-per-page': 1 }, this.modelUtils.makeHttpConfig(cnsiGuid));
      }
      return promise.then(function (response) {
        _.set(that, 'spaces.' + cnsiGuid + '.' + guid + '.details.totalRoutes', response.data.total_results);
        return response.data.total_results;
      });
    },

    /**
     * @function updateServiceInstanceCount
     * @memberof cloud-foundry.model.space
     * @description Updates the service instance count either from the provided value or via HCF. This will be used when
     * it's not appropriate to fetch/use data that's inline
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - space GUID.
     * @param {number=} count - the number of routes.
     * @returns {promise} promise object once completed, contains number of service instances
     * @public
     */
    updateServiceInstanceCount: function (cnsiGuid, guid, count) {
      var that = this;
      var promise = this.$q.resolve({ data: { total_results: count }});
      if (!count) {
        promise = this.apiManager.retrieve('cloud-foundry.api.Spaces')
          .ListAllServiceInstancesForSpace(guid, { 'results-per-page': 1 }, this.modelUtils.makeHttpConfig(cnsiGuid));
      }
      return promise.then(function (response) {
        _.set(that, 'spaces.' + cnsiGuid + '.' + guid + '.details.totalServiceInstances', response.data.total_results);
        return response.data.total_results;
      });
    },

    /**
     * @function updateServiceCount
     * @memberof cloud-foundry.model.space
     * @description Updates the service count either from the provided value or via HCF. This will be used when
     * it's not appropriate to fetch/use data that's inline
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} guid - space GUID.
     * @param {number=} count - the number of routes.
     * @returns {promise} promise object once completed, contains number of services
     * @public
     */
    updateServiceCount: function (cnsiGuid, guid, count) {
      var that = this;
      var promise = this.$q.resolve({ data: { total_results: count }});
      if (!count) {
        promise = this.apiManager.retrieve('cloud-foundry.api.Spaces')
          .ListAllServicesForSpace(guid, { 'results-per-page': 1 }, this.modelUtils.makeHttpConfig(cnsiGuid));
      }
      return promise.then(function (response) {
        _.set(that, 'spaces.' + cnsiGuid + '.' + guid + '.details.totalServices', response.data.total_results);
        return response.data.total_results;
      });
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

      var httpConfig = this.modelUtils.makeHttpConfig(cnsiGuid);
      var createdDate = moment(space.metadata.created_at, "YYYY-MM-DDTHH:mm:ssZ");

      var spaceQuotaApi = that.apiManager.retrieve('cloud-foundry.api.SpaceQuotaDefinitions');

      var rolesP, appP, quotaP;

      // Service instances will not be cached now, they lack the 'depth' required and will be loaded on demand.
      // If there's no service instances (probably due to paging), lazy load later on to avoid blocking space lists
      // with 100's in
      var serviceInstancesCountP = space.entity.service_instances
        ? that.$q.resolve(space.entity.service_instances.length)
        : that.$q.resolve();

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
      var stackatoInfoModel = this.modelManager.retrieve('app.model.stackatoInfo');
      var userGuid = stackatoInfoModel.info;

      // Space roles can be inlined
      if (space.entity.managers && space.entity.developers && space.entity.auditors) {
        rolesP = that.$q.resolve(that.cacheUsersRolesInSpace(cnsiGuid, space));
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

      // Routes will not be cached now, they lack the 'depth' required and will be loaded on demand.
      // If there's no service instances (probably due to paging), lazy load later on to avoid blocking space lists
      // with 100's in
      var routesCountP = space.entity.routes
        ? that.$q.resolve(space.entity.routes.length)
        : that.$q.resolve();

      return this.$q.all({
        quota: quotaP,
        serviceInstancesCount: serviceInstancesCountP,
        apps: appP,
        roles: spaceRolesP,
        routesCount: routesCountP
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

        details.roles = vals.roles;

        // Will be lazy loaded to avoid block in cases where there are 100's of spaces. At this point we're just
        // clearing the cache
        details.totalServices = undefined;
        details.servicesQuota = _.get(vals.quota, 'entity.total_services', -1);

        details.totalRoutes = vals.routesCount;
        details.routesQuota = _.get(vals.quota, 'entity.total_routes', -1);

        details.totalServiceInstances = vals.serviceInstancesCount;
        details.serviceInstancesQuota = _.get(vals.quota, 'entity.total_services', -1);

        _.set(that, 'spaces.' + cnsiGuid + '.' + spaceGuid + '.details', details);

        return details;
      });
    },

    createSpaces: function (cnsiGuid, orgGuid, spaceNames, params) {
      var that = this;

      var stackatoInfoModel = this.modelManager.retrieve('app.model.stackatoInfo');
      var userGuid = stackatoInfoModel.info.endpoints.hcf[cnsiGuid].user.guid;
      var organizationModel = this._getOrganizationModel();
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

        var createP = this.spaceApi.CreateSpace(newSpace, params, this.modelUtils.makeHttpConfig(cnsiGuid))
          .then(getSpaceDetails); // Cache the space details

        createPromises.push(createP);
      }

      return that.$q.all(createPromises).then(function () {
        // Refresh the spaces
        return organizationModel.refreshOrganizationSpaces(cnsiGuid, orgGuid);
      });

    },

    deleteSpace: function (cnsiGuid, orgGuid, spaceGuid) {
      var params = {
        recursive: false,
        async: false
      };
      var organizationModel = this._getOrganizationModel();
      return this.spaceApi.DeleteSpace(spaceGuid, params, this.modelUtils.makeHttpConfig(cnsiGuid)).then(function () {
        // Refresh the spaces
        return organizationModel.refreshOrganizationSpaces(cnsiGuid, orgGuid);
      });
    },

    updateSpace: function (cnsiGuid, orgGuid, spaceGuid, spaceData) {
      var that = this;
      var organizationModel = this._getOrganizationModel();
      return this.spaceApi.UpdateSpace(spaceGuid, spaceData, {}, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (val) {
          // Refresh the org spaces
          var orgRefreshedP = organizationModel.refreshOrganizationSpaces(cnsiGuid, orgGuid);

          // Refresh the space itself
          var spaceRefreshedP = that.getSpaceDetails(cnsiGuid, val.data, {});

          return that.$q.all([orgRefreshedP, spaceRefreshedP]);
        });
    },

    // Warning: this does not update the cache
    removeManagerFromSpace: function (cnsiGuid, spaceGuid, userGuid) {
      return this.spaceApi.RemoveManagerFromSpace(spaceGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateManagerWithSpace: function (cnsiGuid, spaceGuid, userGuid) {
      return this.spaceApi.AssociateManagerWithSpace(spaceGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    // Warning: this does not update the cache
    removeAuditorFromSpace: function (cnsiGuid, spaceGuid, userGuid) {
      return this.spaceApi.RemoveAuditorFromSpace(spaceGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateAuditorWithSpace: function (cnsiGuid, spaceGuid, userGuid) {
      return this.spaceApi.AssociateAuditorWithSpace(spaceGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    // Warning: this does not update the cache
    removeDeveloperFromSpace: function (cnsiGuid, spaceGuid, userGuid) {
      return this.spaceApi.RemoveDeveloperFromSpace(spaceGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateDeveloperWithSpace: function (cnsiGuid, spaceGuid, userGuid) {
      return this.spaceApi.AssociateDeveloperWithSpace(spaceGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    _getOrganizationModel: function () {
      return this.modelManager.retrieve('cloud-foundry.model.organization');
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
