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
    '$log'
  ];

  function registerOrgModel(modelManager, apiManager, utils, $q, $log) {
    modelManager.register('cloud-foundry.model.organization',
      new Organization(modelManager, apiManager, utils, $q, $log));
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
   * @property {object} modelManager - the model manager
   * @property {object} apiManager - the API manager
   * @property {object} utils - the utils service
   * @property {object} $q - angular $q service
   * @property {object} $log - angular $log service
   * @class
   */
  function Organization(modelManager, apiManager, utils, $q, $log) {
    this.apiManager = apiManager;
    this.modelManager = modelManager;
    this.$q = $q;
    this.$log = $log;
    this.utils = utils;
    this.stackatoInfoModel = modelManager.retrieve('app.model.stackatoInfo');
    this.organizations = {};

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

  angular.extend(Organization.prototype, {
    /**
     * @function listAllOrganizations
     * @memberof cloud-foundry.model.organization
     * @description lists all organizations
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {object} params - optional parameters
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllOrganizations: function (cnsiGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllOrganizations(params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
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
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllSpacesForOrganization: function (cnsiGuid, orgGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllSpacesForOrganization(orgGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
          return response.data.resources;
        });
    },

    /**
     * @function listAllServicesForOrganization
     * @memberof cloud-foundry.model.organization
     * @description lists all services for organization
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server.
     * @param {string} orgGuid - organization id
     * @param {object} params - optional parameters
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    listAllServicesForOrganization: function (cnsiGuid, orgGuid, params) {
      return this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllServicesForOrganization(orgGuid, params, this.makeHttpConfig(cnsiGuid))
        .then(function (response) {
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
     * @function organizationRoleToString
     * @memberof cloud-foundry.model.organization
     * @description Converts a list of cloud-foundry organization roles to a localized list. The list of all
     * organization roles is: org_user, org_manager, org_auditor, billing_manager
     * @param {Array} roles - A list of cloud-foundry organization roles
     * @returns {string} A localised version of the role
     * @public
     */
    organizationRolesToString: function (roles) {
      var that = this;

      if (!roles || roles.length === 0) {
        // Shouldn't happen as we should at least be a user of the org
        return gettext('none');
      } else {
        // If there are more than one role, don't show the user role
        if (roles.length > 1) {
          _.remove(roles, function (role) {
            return role === 'org_user';
          });
        }
        return _.map(roles, function (role) {
          return that.organizationRoleToString(role);
        }).join(', ');
      }
    },

    initOrganizationCache: function (cnsiGuid, orgGuid) {
      this.organizations[cnsiGuid] = this.organizations[cnsiGuid] || {};
      this.organizations[cnsiGuid][orgGuid] = this.organizations[cnsiGuid][orgGuid] || {
        details: {},
        roles: {},
        services: {},
        spaces: {}
      };
    },

    fetchOrganizationPath: function (cnsiGuid, orgGuid) {
      return 'organizations.' + cnsiGuid + '.' + orgGuid;
    },

    cacheOrganizationDetails: function (cnsiGuid, orgGuid, details) {
      this.initOrganizationCache(cnsiGuid, orgGuid);
      this.organizations[cnsiGuid][orgGuid].details = details;
    },

    cacheOrganizationUsersRoles: function (cnsiGuid, orgGuid, roles) {
      var that = this;
      this.initOrganizationCache(cnsiGuid, orgGuid);
      _.forEach(roles, function (user) {
        that.organizations[cnsiGuid][orgGuid].roles[user.metadata.guid] = user.entity.organization_roles;
      });
    },

    cacheOrganizationServices: function (cnsiGuid, orgGuid, services) {
      var that = this;
      this.initOrganizationCache(cnsiGuid, orgGuid);
      _.forEach(services, function (service) {
        that.organizations[cnsiGuid][orgGuid].services[service.metadata.guid] = service;
      });
    },

    cacheOrganizationSpaces: function (cnsiGuid, orgGuid, spaces) {
      var that = this;
      this.initOrganizationCache(cnsiGuid, orgGuid);
      _.forEach(spaces, function (space) {
        that.organizations[cnsiGuid][orgGuid].spaces[space.metadata.guid] = space;
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
      var httpConfig = this.makeHttpConfig(cnsiGuid);
      var orgGuid = org.metadata.guid;
      var orgQuotaGuid = org.entity.quota_definition_guid;
      var createdDate = moment(org.metadata.created_at, "YYYY-MM-DDTHH:mm:ssZ");

      var spaceApi = that.apiManager.retrieve('cloud-foundry.api.Spaces');
      var orgsApi = that.apiManager.retrieve('cloud-foundry.api.Organizations');
      var orgsQuotaApi = that.apiManager.retrieve('cloud-foundry.api.OrganizationQuotaDefinitions');

      var usedMemP = orgsApi.RetrievingOrganizationMemoryUsage(orgGuid, params, httpConfig);
      var instancesP = orgsApi.RetrievingOrganizationInstanceUsage(orgGuid, params, httpConfig);
      var quotaP = orgsQuotaApi.RetrieveOrganizationQuotaDefinition(orgQuotaGuid, params, httpConfig);

      var rolesP = orgsApi.RetrievingRolesOfAllUsersInOrganization(orgGuid, params, httpConfig);
      var stackatoInfoP = that.stackatoInfoModel.getStackatoInfo();

      var orgRolesP = that.$q.all({roles: rolesP, stackatoInfo: stackatoInfoP}).then(function (values) {
        var i, userGuid, myRoles;

        /* eslint-disable no-warning-comments */
        // TODO[TEAMFOUR-780]: there may be many pages of Users!
        /* eslint-enable no-warning-comments */
        that.cacheOrganizationUsersRoles(cnsiGuid, orgGuid, values.roles.data.resources);

        // Find our user's GUID
        userGuid = values.stackatoInfo.endpoints.hcf[cnsiGuid].user.guid;

        // Find my user's roles
        for (i = 0; i < values.roles.data.resources.length; i++) {
          var roles = values.roles.data.resources[i];
          if (roles.metadata.guid === userGuid) {
            myRoles = roles.entity.organization_roles;
            break;
          }
        }
        if (!myRoles) {
          throw new Error('Failed to find my roles in this organization');
        }
        return myRoles;
      });

      var allSpacesP = this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllSpacesForOrganization(orgGuid, params, httpConfig).then(function (res) {
          that.cacheOrganizationSpaces(cnsiGuid, orgGuid, res.data.resources);
          return res.data.resources;
        });

      var appCountsP = allSpacesP.then(function (spaces) {
        var promises = [];
        _.forEach(spaces, function (space) {
          var promise = spaceApi.ListAllAppsForSpace(space.metadata.guid, params, httpConfig).then(function (res2) {
            return res2.data.resources.length;
          }).catch(function (error) {
            that.$log.error('Failed to ListAllAppsForSpace', error);
            throw error;
          });
          promises.push(promise);
        });
        return that.$q.all(promises).then(function (appCounts) {
          var total = 0;
          _.forEach(appCounts, function (count) {
            total += count;
          });
          return total;
        });
      }).catch(function (error) {
        that.$log.error('Failed to ListAllSpacesForOrganization', error);
        throw error;
      });

      var servicesP = this.listAllServicesForOrganization(cnsiGuid, orgGuid).then(function (services) {
        that.cacheOrganizationServices(cnsiGuid, orgGuid, services);
        return services;
      });
      var spaceModel = this.modelManager.retrieve('cloud-foundry.model.space');
      var routesCountP = allSpacesP.then(function (spaces) {
        var promises = [];
        _.forEach(spaces, function (space) {
          var promise = spaceModel.listAllRoutesForSpace(cnsiGuid, space.metadata.guid).then(function (res2) {
            return res2.length;
          }).catch(function (error) {
            that.$log.error('Failed to listAllRoutesForSpace', error);
            throw error;
          });
          promises.push(promise);
        });
        return that.$q.all(promises).then(function (appCounts) {
          var total = 0;
          _.forEach(appCounts, function (count) {
            total += count;
          });
          return total;
        });

      });

      return this.$q.all({
        memory: usedMemP,
        quota: quotaP,
        instances: instancesP,
        apps: appCountsP,
        roles: orgRolesP,
        services: servicesP,
        routes: routesCountP,
        spaces: allSpacesP
      }).then(function (vals) {
        var details = {};

        details.guid = orgGuid;

        details.org = org;

        // Set created date for sorting
        details.created_at = createdDate.unix();

        // Set memory utilisation
        details.memUsed = vals.memory.data.memory_usage_in_mb;
        details.memQuota = vals.quota.data.entity.memory_limit;

        details.instances = vals.instances.data.instance_usage;
        details.instancesQuota = vals.quota.data.entity.app_instance_limit;

        // Set total apps count
        details.totalApps = vals.apps;

        details.name = org.entity.name;

        details.roles = vals.roles;

        details.totalRoutes = vals.routes;

        that.cacheOrganizationDetails(cnsiGuid, orgGuid, details);
        return details;
      });
    }

  });

})();
