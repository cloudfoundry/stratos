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
    'userInfoService',
    '$q',
    '$log'
  ];

  function registerOrgModel(modelManager, apiManager, utils, userInfoService, $q, $log) {
    modelManager.register('cloud-foundry.model.organization',
      new Organization(apiManager, utils, userInfoService, $q, $log));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Organization
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @class
   */
  function Organization(apiManager, utils, userInfoService, $q, $log) {
    this.apiManager = apiManager;
    this.$q = $q;
    this.$log = $log;
    this.utils = utils;
    this.userInfoService = userInfoService;
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
     * @function  getOrganizationDetails
     * @memberof cloud-foundry.model.organization
     * @description gather all sorts of details about an organization
     * @param {string} cnsiGuid - The GUID of the cloud-foundry server
     * @param {string} org - organization entry as returned by listAllOrganizations()
     * @param {object} params - optional parameters
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
      var userInfoP = that.userInfoService.userInfo();

      var orgRolesP = that.$q.all({roles: rolesP, userInfo: userInfoP}).then(function(values) {
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
            myRoles = roles.entity.organization_roles;
            break;
          }
        }
        if (!myRoles) {
          throw new Error('Failed to find my roles in this organization');
        }
        return myRoles;
      });


      var appCountsP = this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllSpacesForOrganization(orgGuid, params, httpConfig).then(function (res) {
          var spaces = res.data.resources;
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

      return this.$q.all({
        memory: usedMemP,
        quota: quotaP,
        instances: instancesP,
        apps: appCountsP,
        roles: orgRolesP
      }).then(function (vals) {
        var details = {};

        details.guid = orgGuid;

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

        if (_.isUndefined(that.organizations[cnsiGuid])) {
          that.organizations[cnsiGuid] = {};
        }
        that.organizations[cnsiGuid][orgGuid] = details;
        return details;
      });
    }

  });

})();
