/* DO NOT EDIT: This code has been generated by the cf-dotnet-sdk-builder */

(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .run(registerApi);

  registerApi.$inject = [
    '$http',
    'apiManager'
  ];

  function registerApi($http, apiManager) {
    apiManager.register('cloud-foundry.api.Spaces', new SpacesApi($http));
  }

  function SpacesApi($http) {
    this.$http = $http;
  }

  /* eslint-disable camelcase */
  angular.extend(SpacesApi.prototype, {

   /*
    * Associate Auditor with the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/associate_auditor_with_the_space.html
    */
    AssociateAuditorWithSpace: function (guid, auditor_guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/auditors/' + auditor_guid + '';
      config.method = 'PUT';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Associate Auditor with the Space by Username
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/associate_auditor_with_the_space_by_username.html
    */
    AssociateAuditorWithSpaceByUsername: function (guid, value, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/auditors';
      config.method = 'PUT';
      config.data = value;

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Associate Developer with the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/associate_developer_with_the_space.html
    */
    AssociateDeveloperWithSpace: function (guid, developer_guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/developers/' + developer_guid + '';
      config.method = 'PUT';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Associate Developer with the Space by Username
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/associate_developer_with_the_space_by_username.html
    */
    AssociateDeveloperWithSpaceByUsername: function (guid, value, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/developers';
      config.method = 'PUT';
      config.data = value;

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Associate Manager with the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/associate_manager_with_the_space.html
    */
    AssociateManagerWithSpace: function (guid, manager_guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/managers/' + manager_guid + '';
      config.method = 'PUT';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Associate Manager with the Space by Username
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/associate_manager_with_the_space_by_username.html
    */
    AssociateManagerWithSpaceByUsername: function (guid, value, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/managers';
      config.method = 'PUT';
      config.data = value;

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Associate Security Group with the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/associate_security_group_with_the_space.html
    */
    AssociateSecurityGroupWithSpace: function (guid, security_group_guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/security_groups/' + security_group_guid + '';
      config.method = 'PUT';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Creating a Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/creating_a_space.html
    */
    CreateSpace: function (value, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces';
      config.method = 'POST';
      config.data = value;

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Delete a Particular Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/delete_a_particular_space.html
    */
    DeleteSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '';
      config.method = 'DELETE';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Get Space summary
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/get_space_summary.html
    */
    GetSpaceSummary: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/summary';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Apps for the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_apps_for_the_space.html
    */
    ListAllAppsForSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/apps';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Auditors for the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_auditors_for_the_space.html
    */
    ListAllAuditorsForSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/auditors';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Developers for the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_developers_for_the_space.html
    */
    ListAllDevelopersForSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/developers';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Domains for the Space (deprecated)
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_domains_for_the_space_(deprecated).html
    */
    ListAllDomainsForSpaceDeprecated: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/domains';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Events for the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_events_for_the_space.html
    */
    ListAllEventsForSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/events';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Managers for the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_managers_for_the_space.html
    */
    ListAllManagersForSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/managers';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Routes for the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_routes_for_the_space.html
    */
    ListAllRoutesForSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/routes';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Security Groups for the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_security_groups_for_the_space.html
    */
    ListAllSecurityGroupsForSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/security_groups';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Service Instances for the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_service_instances_for_the_space.html
    */
    ListAllServiceInstancesForSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/service_instances';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Services for the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_services_for_the_space.html
    */
    ListAllServicesForSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/services';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * List all Spaces
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/list_all_spaces.html
    */
    ListAllSpaces: function (params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Remove Auditor from the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/remove_auditor_from_the_space.html
    */
    RemoveAuditorFromSpace: function (guid, auditor_guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/auditors/' + auditor_guid + '';
      config.method = 'DELETE';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Remove Auditor with the Space by Username
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/remove_auditor_with_the_space_by_username.html
    */
    RemoveAuditorWithSpaceByUsername: function (guid, value, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/auditors';
      config.method = 'DELETE';
      config.data = value;

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Remove Developer from the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/remove_developer_from_the_space.html
    */
    RemoveDeveloperFromSpace: function (guid, developer_guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/developers/' + developer_guid + '';
      config.method = 'DELETE';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Remove Developer with the Space by Username
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/remove_developer_with_the_space_by_username.html
    */
    RemoveDeveloperWithSpaceByUsername: function (guid, value, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/developers';
      config.method = 'DELETE';
      config.data = value;

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Remove Manager from the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/remove_manager_from_the_space.html
    */
    RemoveManagerFromSpace: function (guid, manager_guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/managers/' + manager_guid + '';
      config.method = 'DELETE';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Remove Manager with the Space by Username
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/remove_manager_with_the_space_by_username.html
    */
    RemoveManagerWithSpaceByUsername: function (guid, value, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/managers';
      config.method = 'DELETE';
      config.data = value;

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Remove Security Group from the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/remove_security_group_from_the_space.html
    */
    RemoveSecurityGroupFromSpace: function (guid, security_group_guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/security_groups/' + security_group_guid + '';
      config.method = 'DELETE';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Retrieve a Particular Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/retrieve_a_particular_space.html
    */
    RetrieveSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Retrieving the roles of all Users in the Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/retrieving_the_roles_of_all_users_in_the_space.html
    */
    RetrievingRolesOfAllUsersInSpace: function (guid, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '/user_roles';
      config.method = 'GET';

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    },

   /*
    * Update a Space
    * For detailed information, see online documentation at: http://apidocs.cloudfoundry.org/237/spaces/update_a_space.html
    */
    UpdateSpace: function (guid, value, params, httpConfigOptions) {
      var config = {};
      config.params = params;
      config.url = '/pp/v1/proxy/v2/spaces/' + guid + '';
      config.method = 'PUT';
      config.data = value;

      for (var option in httpConfigOptions) {
        if (!httpConfigOptions.hasOwnProperty(option)) { continue; }
        config[option] = httpConfigOptions[option];
      }
      return this.$http(config);
    }

  });
  /* eslint-enable camelcase */

})();
