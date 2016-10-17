(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.model
   * @description Organization model
   */
  angular
    .module('cloud-foundry.model')
    .run(registerOrgModel);

  registerOrgModel.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'app.utils.utilsService',
    '$q',
    '$log',
    'cloud-foundry.model.modelUtils'
  ];

  function registerOrgModel(modelManager, apiManager, utils, $q, $log, modelUtils) {
    modelManager.register('cloud-foundry.model.organization',
      new Organization(modelManager, apiManager, utils, $q, $log, modelUtils));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Organization
   * @param {object} modelManager - the model manager
   * @property {object} modelManager - the app's model manager
   * @param {object} apiManager - the API manager
   * @param {object} utils - the utils service
   * @param {object} $q - angular $q service
   * @param {object} $log - angular $log service
   * @param {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @property {object} modelManager - the model manager
   * @property {object} apiManager - the API manager
   * @property {object} utils - the utils service
   * @property {object} $q - angular $q service
   * @property {object} $log - angular $log service
   * @property {cloud-foundry.model.modelUtils} modelUtils - service containing general hcf model helpers
   * @class
   */
  function Organization(modelManager, apiManager, utils, $q, $log, modelUtils) {
    this.apiManager = apiManager;
    this.modelManager = modelManager;
    this.$q = $q;
    this.$log = $log;
    this.utils = utils;
    this.modelUtils = modelUtils;

    this.spaceApi = apiManager.retrieve('cloud-foundry.api.Spaces');
    this.orgsApi = apiManager.retrieve('cloud-foundry.api.Organizations');
    this.orgsQuotaApi = apiManager.retrieve('cloud-foundry.api.OrganizationQuotaDefinitions');
    this.appsApi = apiManager.retrieve('cloud-foundry.api.Apps');
    this.routesApi = apiManager.retrieve('cloud-foundry.api.Routes');

    this.organizations = {};
    this.organizationNames = {};

  }

  angular.extend(Organization.prototype, {
    /**
     * @function listAllOrganizations
     * @memberof cloud-foundry.model.organization
     * @description lists all organizations
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object=} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllOrganizations: function (cnsiGuid, params, paginate) {
      var that = this;
      this.unCacheOrganization(cnsiGuid);
      return this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllOrganizations(this.modelUtils.makeListParams(params), this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @function listAllSpacesForOrganization
     * @memberof cloud-foundry.model.organization
     * @description lists all spaces for organization
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} orgGuid - organization id
     * @param {object} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllSpacesForOrganization: function (cnsiGuid, orgGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllSpacesForOrganization(orgGuid, this.modelUtils.makeListParams(params),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @function listAllServicesForOrganization
     * @memberof cloud-foundry.model.organization
     * @description lists all services for organization
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} orgGuid - organization id
     * @param {object=} params - optional parameters
     * @param {boolean=} paginate - true to return the original possibly paginated list, otherwise a de-paginated list
     * containing ALL results will be returned. This could mean more than one http request is made.
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllServicesForOrganization: function (cnsiGuid, orgGuid, params, paginate) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllServicesForOrganization(orgGuid, this.modelUtils.makeListParams(params),
          this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (!paginate) {
            return that.modelUtils.dePaginate(response.data, that.modelUtils.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    /**
     * @function organizationRoleToString
     * @memberof cloud-foundry.model.organization
     * @description Converts an organization role to a localized string. The list of all organization
     * roles is: org_user, org_manager, org_auditor, billing_manager
     * @param {string} role - The organization role
     * @returns {string} A localised version of the role
     * @public
     */
    organizationRoleToString: function (role) {
      switch (role) {
        case 'org_user':
          return gettext('User');
        case 'org_manager':
          return gettext('Manager');
        case 'org_auditor':
          return gettext('Auditor');
        case 'billing_manager':
          return gettext('Billing Manager');
      }
      return role;
    },

    /**
     * @function organizationRoleToStrings
     * @memberof cloud-foundry.model.organization
     * @description Converts a list of cloud-foundry organization roles to a sorted localized list.
     * The list of all organization roles is: org_user, org_manager, org_auditor, billing_manager
     * @param {Array} roles - A list of cloud-foundry organization roles
     * @returns {string} An array of localised versions of the roles
     * @public
     */
    organizationRolesToStrings: function (roles) {
      var that = this;
      var rolesOrder = ['org_manager', 'org_auditor', 'billing_manager', 'org_user'];

      if (!roles || roles.length === 0) {
        // Shouldn't happen as we should at least be a user of the org
        return [gettext('none assigned')];
      } else {
        roles.sort(function (r1, r2) {
          return rolesOrder.indexOf(r1) - rolesOrder.indexOf(r2);
        });
        // If there are more than one role, don't show the user role
        if (roles.length > 1) {
          _.remove(roles, function (role) {
            return role === 'org_user';
          });
        }
        return _.map(roles, function (role) {
          return that.organizationRoleToString(role);
        });
      }
    },

    initOrganizationCache: function (cnsiGuid, orgGuid) {
      this.organizations[cnsiGuid] = this.organizations[cnsiGuid] || {};
      this.organizationNames[cnsiGuid] = this.organizationNames[cnsiGuid] || [];
      this.organizations[cnsiGuid][orgGuid] = this.organizations[cnsiGuid][orgGuid] || {
        details: {},
        roles: {},
        services: {},
        spaces: {}
      };
    },

    fetchOrganization: function (cnsiGuid, orgGuid) {
      if (this.organizations && this.organizations[cnsiGuid]) {
        return this.organizations[cnsiGuid][orgGuid];
      }
    },

    cacheOrganizationDetails: function (cnsiGuid, orgGuid, details) {
      this.initOrganizationCache(cnsiGuid, orgGuid);
      this.organizations[cnsiGuid][orgGuid].details = details;
      this.organizationNames[cnsiGuid].push(details.org.entity.name);
    },

    cacheOrganizationUsersRoles: function (cnsiGuid, orgGuid, allUsersRoles) {
      var that = this;

      this.initOrganizationCache(cnsiGuid, orgGuid);

      // Empty the cache without changing the Object reference
      this.uncacheOrganizationUserRoles(cnsiGuid, orgGuid);

      _.forEach(allUsersRoles, function (user) {
        that.organizations[cnsiGuid][orgGuid].roles[user.metadata.guid] = user.entity.organization_roles;
      });
    },

    cacheOrganizationServices: function (cnsiGuid, orgGuid, services) {

      this.initOrganizationCache(cnsiGuid, orgGuid);

      // Empty the cache without changing the Object reference
      var servicesCache = this.organizations[cnsiGuid][orgGuid].services;
      for (var service in servicesCache) {
        if (servicesCache.hasOwnProperty(service)) {
          delete servicesCache[service];
        }
      }

      _.forEach(services, function (service) {
        servicesCache[service.metadata.guid] = service;
      });
    },

    cacheOrganizationSpaces: function (cnsiGuid, orgGuid, spaces) {
      this.initOrganizationCache(cnsiGuid, orgGuid);
      this.uncacheOrganizationSpaces(cnsiGuid, orgGuid);

      var spaceCache = this.organizations[cnsiGuid][orgGuid].spaces;
      var spaceModel = this.modelManager.retrieve('cloud-foundry.model.space');

      var promises = [];
      _.forEach(spaces, function (space) {
        spaceCache[space.metadata.guid] = space;

        // Ensure the space roles get cached as well. This allows use to determine org role status from space roles
        // without having to fetch all space data

        // Space roles can be inlined
        if (space.entity.managers && space.entity.developers && space.entity.auditors) {
          spaceModel.cacheUsersRolesInSpace(cnsiGuid, space);
        } else {
          promises.push(spaceModel.listRolesOfAllUsersInSpace(cnsiGuid, space.metadata.guid));
        }
      });
      this.organizations[cnsiGuid][orgGuid].details.org.entity.spaces = spaces;

      return this.$q.all(promises);
    },

    unCacheOrganization: function (cnsiGuid, orgGuid) {
      // If no org is specified uncache the entire cluster
      if (angular.isUndefined(orgGuid)) {
        delete this.organizations[cnsiGuid];
        delete this.organizationNames[cnsiGuid];
        return;
      }
      var orgName = _.get(this.organizations, [cnsiGuid, orgGuid, 'details', 'org', 'entity', 'name']);
      var idx = this.organizationNames[cnsiGuid].indexOf(orgName);
      if (idx > -1) {
        this.organizationNames[cnsiGuid].splice(idx, 1);
      }
      delete this.organizations[cnsiGuid][orgGuid];
    },

    uncacheOrganizationUserRoles: function (cnsiGuid, orgGuid) {
      var rolesCache = this.organizations[cnsiGuid][orgGuid].roles;
      for (var role in rolesCache) {
        if (rolesCache.hasOwnProperty(role)) {
          delete rolesCache[role];
        }
      }
    },

    uncacheOrganizationSpaces: function (cnsiGuid, orgGuid) {
      this.initOrganizationCache(cnsiGuid, orgGuid);
      // Empty the cache without changing the Object reference
      var spaceCache = this.organizations[cnsiGuid][orgGuid].spaces;
      for (var space in spaceCache) {
        if (spaceCache.hasOwnProperty(space)) {
          delete spaceCache[space];
        }
      }
      var details = this.organizations[cnsiGuid][orgGuid].details;
      delete details.org.entity.spaces;
    },

    refreshOrganizationSpaces: function (cnsiGuid, orgGuid) {
      var that = this;
      return this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllSpacesForOrganization(orgGuid, {
          'inline-relations-depth': 1
        }, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (res) {
          return that.modelUtils.dePaginate(res.data, that.modelUtils.makeHttpConfig(cnsiGuid));
        })
        .then(function (depthOneSpaces) {
          that.uncacheOrganizationSpaces(cnsiGuid, orgGuid);
          return that.cacheOrganizationSpaces(cnsiGuid, orgGuid, depthOneSpaces).then(function () {
            return that.getOrganizationDetails(cnsiGuid, that.organizations[cnsiGuid][orgGuid].details.org).then(function () {
              return depthOneSpaces;
            });
          });
        });
    },

    /**
     * @function  getOrganizationDetails
     * @memberof cloud-foundry.model.organization
     * @description gather all sorts of details about an organization
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server
     * @param {string} org - organization entry as returned by listAllOrganizations()
     * @param {object=} params - optional parameters
     * @returns {promise} A promise which will be resolved with the organizations's details
     * */
    getOrganizationDetails: function (cnsiGuid, org, params) {

      var that = this;

      var stackatoInfoModel = this.modelManager.retrieve('app.model.stackatoInfo');
      var httpConfig = this.modelUtils.makeHttpConfig(cnsiGuid);
      var orgGuid = org.metadata.guid;
      var orgQuotaGuid = org.entity.quota_definition_guid;
      var createdDate = moment(org.metadata.created_at, "YYYY-MM-DDTHH:mm:ssZ");
      var userGuid = stackatoInfoModel.info.endpoints.hcf[cnsiGuid].user.guid;

      function getRoles(org) {
        // The users roles may be returned inline
        if (org.entity.users) {
          // Reconstruct all user roles from inline data
          return that.$q.resolve(_unsplitOrgRoles(org));
        }
        // Note, users in the context are users with a defined org or space role.
        return that.orgsApi.RetrievingRolesOfAllUsersInOrganization(orgGuid, params, httpConfig).then(function (val) {
          return that.modelUtils.dePaginate(val.data, httpConfig);
        });
      }

      function getUsedMem(spaces) {
        if (spaces) {
          if (spaces.length === 0) {
            return that.$q.resolve(0);
          }
          if (spaces[0].entity.apps) { // check if apps were inlined in the spaces
            var totalMem = 0;
            _.forEach(spaces, function (space) {
              var apps = space.entity.apps;
              _.forEach(apps, function (app) {
                // Only count running apps, like the CF API would do
                if (app.entity.state === 'STARTED') {
                  totalMem += parseInt(app.entity.memory, 10);
                }
              });
            });
            return that.$q.resolve(totalMem);
          }
        }
        // If spaces apps collection is missing it could be due to incorrect relation params in the list orgs requests.
        // More likely it's due to the items count exceeding the max items per page limit. Instead of returning this
        // large collection the _url is passed back instead. Therefore we cannot use the inline data and must make a
        // new request. The new request will be made once per org with this issue. This number may become troublesome
        // if there are 50+ such orgs.
        return that.orgsApi.RetrievingOrganizationMemoryUsage(orgGuid, params, httpConfig).then(function (res) {
          return res.data.memory_usage_in_mb;
        });
      }

      function getInstances(spaces) {
        if (spaces) {
          if (spaces.length === 0) {
            return that.$q.resolve(0);
          }
          if (spaces[0].entity.apps) { // check if apps were inlined in the spaces
            var totalInstances = 0;
            _.forEach(spaces, function (space) {
              var apps = space.entity.apps;
              _.forEach(apps, function (app) {
                // Only count running apps, like the CF API would do
                if (app.entity.state === 'STARTED') {
                  totalInstances += parseInt(app.entity.instances, 10);
                }
              });
            });
            return that.$q.resolve(totalInstances);
          }
        }
        // If spaces apps collection is missing it could be due to incorrect relation params in the list orgs requests.
        // More likely it's due to the items count exceeding the max items per page limit. Instead of returning this
        // large collection the _url is passed back instead. Therefore we cannot use the inline data and must make a
        // new request. The new request will be made once per org with this issue. This number may become troublesome
        // if there are 50+ such orgs.
        return that.orgsApi.RetrievingOrganizationInstanceUsage(orgGuid, params, httpConfig).then(function (res) {
          return res.data.instance_usage;
        });
      }

      function getRouteCount(spaces) {
        if (spaces) {
          if (spaces.length === 0) {
            return that.$q.resolve(0);
          } else {
            if (spaces[0].entity.routes) { // check if routes were inlined in the spaces
              var totalRoutes = 0;
              _.forEach(spaces, function (space) {
                totalRoutes += space.entity.routes.length;
              });
              return that.$q.resolve(totalRoutes);
            }
          }
        }
        // If spaces routes collection is missing it could be due to incorrect relation params in the list orgs requests.
        // More likely it's due to the items count exceeding the max items per page limit. Instead of returning this
        // large collection the _url is passed back instead. Therefore we cannot use the inline data and must make a
        // new request. The new request will be made once per org with this issue. This number may become troublesome
        // if there are 50+ such orgs.
        var q = 'organization_guid:' + orgGuid;
        var routesParams = {
          q: q,
          'results-per-page': 1
        };
        return that.routesApi.ListAllRoutes(_.defaults(routesParams, params), httpConfig).then(function (response) {
          return response.data.total_results;
        });
      }

      function getQuota(org) {
        if (org.entity.quota_definition) {
          return that.$q.resolve(org.entity.quota_definition);
        }
        return that.orgsQuotaApi.RetrieveOrganizationQuotaDefinition(orgQuotaGuid, params, httpConfig)
          .then(function (val) {
            return val.data;
          });
      }

      function getAppsCount(spaces) {
        var appsCountPromises = [];
        var missingSpaces = [];

        _.forEach(spaces, function (space) {
          // If spaces apps collection is missing it could be due to incorrect relation params in the list orgs
          // requests.
          // More likely it's due to the items count exceeding the max items per page limit. Instead of returning this
          // large collection the _url is passed back instead. Therefore we cannot use the inline data and must make a
          // new request. The new request will be made once per org with this issue. This number may become troublesome
          // if there are 50+ such orgs.
          if (space.entity.apps) {
            // If we have the space's apps, great, use that
            appsCountPromises.push(that.$q.resolve(space.entity.apps.length));
          } else {
            // If we don't have the space's apps (most probably due to the number of apps exceeding 'results-per-page')
            // then create a single request for the end. This avoids making a request per space.
            missingSpaces.push(space.metadata.guid);
          }
        });

        // Instead of making one request per space (this could be 50+ spaces) only make one and use total_results
        if (missingSpaces.length > 0) {
          // We shouldn't have to worry about the length of the query string, this only affects browsers.
          var q = 'space_guid IN ' + missingSpaces.join(',');
          var missingAppParams = {
            q: q,
            'results-per-page': 1
          };
          missingAppParams = _.defaults(missingAppParams, params);
          var promise = that.appsApi.ListAllApps(missingAppParams, httpConfig).then(function (response) {
            return response.data.total_results;
          });
          appsCountPromises.push(promise);
        }

        return that.$q.all(appsCountPromises).then(function (appCounts) {
          var total = 0;
          _.forEach(appCounts, function (count) {
            total += count;
          });
          return total;
        });
      }

      var rolesP = getRoles(org); // Roles can be returned inline
      var quotaP = getQuota(org); // The quota can be returned inline

      var allSpacesP, allUsersRoles;
      if (org.entity.spaces) {
        allSpacesP = that.$q.resolve(org.entity.spaces);
      }

      allSpacesP = allSpacesP || this.listAllSpacesForOrganization(cnsiGuid, orgGuid, {
        'inline-relations-depth': 1
      });

      var routesCountP = allSpacesP.then(getRouteCount);

      var orgRolesP = rolesP.then(function (usersRoles) {
        var i, myRoles;

        allUsersRoles = usersRoles; // Cached later!

        // Find the connected user's roles in each org
        for (i = 0; i < usersRoles.length; i++) {
          var user = usersRoles[i];
          if (user.metadata.guid === userGuid) {
            myRoles = user.entity.organization_roles;
            break;
          }
        }
        return myRoles || [];
      });

      // Count apps in each space
      var appCountsP = allSpacesP.then(getAppsCount);

      var usedMemP = allSpacesP.then(getUsedMem);

      var instancesP = allSpacesP.then(getInstances);

      return this.$q.all({
        memory: usedMemP,
        quota: quotaP,
        instances: instancesP,
        appCounts: appCountsP,
        routesCountP: routesCountP,
        roles: orgRolesP,
        spaces: allSpacesP
      }).then(function (vals) {
        var details = {};

        details.cnsiGuid = cnsiGuid;
        details.guid = orgGuid;

        details.org = org;

        // Set created date for sorting
        details.created_at = createdDate.unix();

        // Set memory utilisation
        details.memUsed = vals.memory;
        details.memQuota = vals.quota.entity.memory_limit;

        details.instances = vals.instances;
        details.instancesQuota = vals.quota.entity.app_instance_limit;

        // Set total counts
        details.totalApps = vals.appCounts;
        details.totalRoutes = vals.routesCountP;
        details.routesQuota = _.get(vals.quota, 'entity.total_routes', -1);

        details.servicesQuota = _.get(vals.quota, 'entity.total_services', -1);

        details.roles = vals.roles;

        that.cacheOrganizationDetails(cnsiGuid, orgGuid, details);
        that.cacheOrganizationUsersRoles(cnsiGuid, orgGuid, allUsersRoles);

        return that.cacheOrganizationSpaces(cnsiGuid, orgGuid, vals.spaces).then(function () {
          return details;
        });
      });
    },

    createOrganization: function (cnsiGuid, orgName) {
      var that = this;
      var stackatoInfoModel = this.modelManager.retrieve('app.model.stackatoInfo');

      var httpConfig = this.modelUtils.makeHttpConfig(cnsiGuid);
      return that.orgsApi.CreateOrganization({name: orgName}, {}, httpConfig).then(function (res) {
        var org = res.data;
        var newOrgGuid = org.metadata.guid;
        var userGuid = stackatoInfoModel.info.endpoints.hcf[cnsiGuid].user.guid;
        var makeUserP = that.orgsApi.AssociateUserWithOrganization(newOrgGuid, userGuid, {}, httpConfig);
        var makeManagerP = that.orgsApi.AssociateManagerWithOrganization(newOrgGuid, userGuid, {}, httpConfig);
        return that.$q.all([makeUserP, makeManagerP]).then(function () {
          that.getOrganizationDetails(cnsiGuid, org);
        });
      });
    },

    deleteOrganization: function (cnsiGuid, orgGuid) {
      var that = this;
      return that.orgsApi.DeleteOrganization(orgGuid, {}, this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (val) {
          that.unCacheOrganization(cnsiGuid, orgGuid);
          return val;
        });
    },

    updateOrganization: function (cnsiGuid, orgGuid, orgData) {
      var that = this;
      var oldName = _.get(that.organizations[cnsiGuid][orgGuid], 'details.org.entity.name');
      return that.orgsApi.UpdateOrganization(orgGuid, orgData, {}, that.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (val) {
          that.organizations[cnsiGuid][orgGuid].details.org = val.data;
          var newName = _.get(val.data, 'entity.name');
          if (oldName !== newName) {
            var idx = that.organizationNames[cnsiGuid].indexOf(oldName);
            if (idx > -1) {
              that.organizationNames[cnsiGuid].splice(idx, 1);
            }
            that.organizationNames[cnsiGuid].push(newName);
          }
          return val;
        });
    },

    refreshOrganizationUserRoles: function (cnsiGuid, orgGuid) {
      var that = this;
      return this.orgsApi.RetrievingRolesOfAllUsersInOrganization(orgGuid, null,
        this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (val) {
          return that.modelUtils.dePaginate(val.data, that.modelUtils.makeHttpConfig(cnsiGuid));
        })
        .then(function (allUsersRoles) {
          that.cacheOrganizationUsersRoles(cnsiGuid, orgGuid, allUsersRoles);
          // Ensures we also update inlined data for getDetails to pick up
          _splitOrgRoles(that.organizations[cnsiGuid][orgGuid].details.org, allUsersRoles);
          return allUsersRoles;
        });
    },

    retrievingRolesOfAllUsersInOrganization: function (cnsiGuid, orgGuid, params, dePaginate) {
      var that = this;
      return this.orgsApi
        .RetrievingRolesOfAllUsersInOrganization(orgGuid, this.modelUtils.makeListParams(params), this.modelUtils.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          if (dePaginate) {
            return that.hcfPagination.dePaginate(response.data, that.makeHttpConfig(cnsiGuid));
          }
          return response.data.resources;
        });
    },

    // Warning: this does not update the cache
    removeAuditorFromOrganization: function (cnsiGuid, orgGuid, userGuid) {
      return this.orgsApi.RemoveAuditorFromOrganization(orgGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateAuditorWithOrganization: function (cnsiGuid, orgGuid, userGuid) {
      return this.orgsApi.AssociateAuditorWithOrganization(orgGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    // Warning: this does not update the cache
    removeManagerFromOrganization: function (cnsiGuid, orgGuid, userGuid) {
      return this.orgsApi.RemoveManagerFromOrganization(orgGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateManagerWithOrganization: function (cnsiGuid, orgGuid, userGuid) {
      return this.orgsApi.AssociateManagerWithOrganization(orgGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    // Warning: this does not update the cache
    removeBillingManagerFromOrganization: function (cnsiGuid, orgGuid, userGuid) {
      return this.orgsApi.RemoveBillingManagerFromOrganization(orgGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateBillingManagerWithOrganization: function (cnsiGuid, orgGuid, userGuid) {
      return this.orgsApi.AssociateBillingManagerWithOrganization(orgGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    // Warning: this does not update the cache
    removeUserFromOrganization: function (cnsiGuid, orgGuid, userGuid) {
      return this.orgsApi.RemoveUserFromOrganization(orgGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    },

    associateUserWithOrganization: function (cnsiGuid, orgGuid, userGuid) {
      return this.orgsApi.AssociateUserWithOrganization(orgGuid, userGuid, null, this.modelUtils.makeHttpConfig(cnsiGuid));
    }

  });

  var ORG_ROLE_TO_KEY = {
    org_user: 'users',
    org_manager: 'managers',
    billing_manager: 'billing_managers',
    org_auditor: 'auditors'
  };

  function _shallowCloneUser(user) {
    var clone = {
      entity: _.clone(user.entity),
      metadata: _.clone(user.metadata)
    };
    if (clone.entity.organization_roles) {
      delete clone.entity.organization_roles;
    }
    return clone;
  }

  function _hasRole(user, role) {
    return user.entity.organization_roles.indexOf(role) > -1;
  }

  function _assembleOrgRoles(users, role, usersHash) {
    _.forEach(users, function (user) {
      var userKey = user.metadata.guid;
      if (!usersHash.hasOwnProperty(userKey)) {
        usersHash[userKey] = _shallowCloneUser(user);
      }
      usersHash[userKey].entity.organization_roles = usersHash[userKey].entity.organization_roles || [];
      usersHash[userKey].entity.organization_roles.push(role);
    });
  }

  /**
   * Transform split organization role properties into an array of users with an organization_roles property such as
   * returned by the: RetrievingRolesOfAllUsersInOrganization() cloud foundry API
   * @param {Object} anOrg organization object containing inlined managers etc.
   * @returns {Array} a list of Users of the organization with their organization_roles property populated
   * */
  function _unsplitOrgRoles(anOrg) {
    var usersHash = {};
    _.forEach(ORG_ROLE_TO_KEY, function (key, role) {
      _assembleOrgRoles(anOrg.entity[key], role, usersHash);
    });
    return _.values(usersHash);
  }

  function _splitOrgRoles(anOrg, usersRoles) {
    _.forEach(ORG_ROLE_TO_KEY, function (key, role) {
      // Clean while preserving ref in case directives are bound to it
      if (angular.isDefined(anOrg.entity[key])) {
        anOrg.entity[key].length = 0;
      } else {
        anOrg.entity[key] = [];
      }
      _.forEach(usersRoles, function (user) {
        if (_hasRole(user, role)) {
          anOrg.entity[key].push(user);
        }
      });
    });
  }

})();
