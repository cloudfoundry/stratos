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
    '$q'
  ];

  function registerOrgModel(modelManager, apiManager, utils, userInfoService, $q) {
    modelManager.register('cloud-foundry.model.organization', new Organization(apiManager, utils, userInfoService, $q));
  }

  /**
   * @memberof cloud-foundry.model
   * @name Organization
   * @param {app.api.apiManager} apiManager - the API manager
   * @property {app.api.apiManager} apiManager - the API manager
   * @class
   */
  function Organization(apiManager, utils, userInfoService, $q) {
    this.apiManager = apiManager;
    this.$q = $q;
    this.utils = utils;
    this.userInfoService = userInfoService;

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

    getOrganizationDetails: function (cnsiGuid, org, params) {

      var that = this;
      var httpConfig = this.makeHttpConfig(cnsiGuid);
      var orgGuid = org.metadata.guid;
      var orgQuotaGuid = org.entity.quota_definition_guid;

      var spaceApi = that.apiManager.retrieve('cloud-foundry.api.Spaces');
      var orgsApi = that.apiManager.retrieve('cloud-foundry.api.Organizations');
      var orgsQuotaApi = that.apiManager.retrieve('cloud-foundry.api.OrganizationQuotaDefinitions');

      var usedMemP = orgsApi.RetrievingOrganizationMemoryUsage(orgGuid, params, httpConfig);
      var instancesP = orgsApi.RetrievingOrganizationInstanceUsage(orgGuid, params, httpConfig);
      var quotaP = orgsQuotaApi.RetrieveOrganizationQuotaDefinition(orgQuotaGuid, params, httpConfig);

      var rolesP = orgsApi.RetrievingRolesOfAllUsersInOrganization(orgGuid, params, httpConfig);
      var userInfoP = that.userInfoService.userInfo();

      that.$q.all({roles: rolesP, userInfo: userInfoP}).then(function(values) {
        // console.log('Roles:', values.roles);
        // console.log('userInfo:', values.userInfo);
        // Find our user in the list of all OrgUsers
        var userGuid;
        for (var i = 0; i < values.userInfo.data.length; i++) {
          var userPerms = values.userInfo.data[i];
          if (userPerms.type === 'hcf' && userPerms.cnsi_guid === cnsiGuid) {
            userGuid = userPerms.user_guid;
            break;
          }
        }
        if (!userGuid) {
          throw new Error('Failed to get HCF user GUID');
        }

      });


      var appCountsP = this.apiManager.retrieve('cloud-foundry.api.Organizations')
        .ListAllSpacesForOrganization(orgGuid, params, httpConfig).then(function (res) {
          var spaces = res.data.resources;
          var promises = [];
          _.forEach(spaces, function (space) {
            // console.log('a space: ', space);
            var promise = spaceApi.ListAllAppsForSpace(space.metadata.guid, params, httpConfig).then(function (res2) {
              // console.log('All apps: ', res2);
              return res2.data.resources.length;
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
        apps: appCountsP
      }).then(function (vals) {
        var details = {};

        // Set memory utilisation
        var usedMem = vals.memory.data.memory_usage_in_mb;
        var memQuota = vals.quota.data.entity.memory_limit;

        var usedMemHuman = that.utils.mbToHumanSize(usedMem);
        var memQuotaHuman = that.utils.mbToHumanSize(memQuota);

        // var memQuota = that.utils.mbToHumanSize(-1); // test infinite quota
        details.memory_utilization_percentage = (100 * usedMem / memQuota).toFixed(1);
        // details.memory_utilization = usedMemHuman + ' / ' + memQuotaHuman + ' [' + details.memory_utilization_percentage + '%]';
        details.memory_utilization = usedMemHuman + ' / ' + memQuotaHuman;

        details.mem_used = 1024 * usedMem;
        details.mem_quota = 1024 * memQuota;

        // Set instances utilisation
        var instancesUsed = vals.instances.data.instance_usage;
        var appInstanceQuota = vals.quota.data.entity.app_instance_limit;
        if (appInstanceQuota === -1) {
          appInstanceQuota = '∞';
        }
        details.instances = instancesUsed + ' / ' + appInstanceQuota;

        // Set total apps count
        details.total_apps = vals.apps;

        details.name = org.entity.name;

        return details;
      });
    }

  });

})();
