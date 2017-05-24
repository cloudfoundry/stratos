(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  // NOTE: This is not complete, I've just dont the minimum I required for Endpoints/ACL tests
  mock.cloudFoundryAPI.FeatureFlags = {

    GetAllFeatureFlags: function () {
      return {
        url: '/pp/v1/proxy/v2/config/feature_flags',

        success: {
          code: 200,
          response: {
            data: [
              {
                "name": "user_org_creation",
                "enabled": false,
                "error_message": null,
                "url": "/v2/config/feature_flags/user_org_creation"
              },
              {
                "name": "private_domain_creation",
                "enabled": true,
                "error_message": null,
                "url": "/v2/config/feature_flags/private_domain_creation"
              },
              {
                "name": "app_bits_upload",
                "enabled": true,
                "error_message": null,
                "url": "/v2/config/feature_flags/app_bits_upload"
              },
              {
                "name": "app_scaling",
                "enabled": true,
                "error_message": null,
                "url": "/v2/config/feature_flags/app_scaling"
              },
              {
                "name": "route_creation",
                "enabled": true,
                "error_message": null,
                "url": "/v2/config/feature_flags/route_creation"
              },
              {
                "name": "service_instance_creation",
                "enabled": true,
                "error_message": null,
                "url": "/v2/config/feature_flags/service_instance_creation"
              },
              {
                "name": "diego_docker",
                "enabled": false,
                "error_message": null,
                "url": "/v2/config/feature_flags/diego_docker"
              },
              {
                "name": "set_roles_by_username",
                "enabled": true,
                "error_message": null,
                "url": "/v2/config/feature_flags/set_roles_by_username"
              },
              {
                "name": "unset_roles_by_username",
                "enabled": true,
                "error_message": null,
                "url": "/v2/config/feature_flags/unset_roles_by_username"
              },
              {
                "name": "task_creation",
                "enabled": false,
                "error_message": null,
                "url": "/v2/config/feature_flags/task_creation"
              },
              {
                "name": "env_var_visibility",
                "enabled": true,
                "error_message": null,
                "url": "/v2/config/feature_flags/env_var_visibility"
              },
              {
                "name": "space_scoped_private_broker_creation",
                "enabled": true,
                "error_message": null,
                "url": "/v2/config/feature_flags/space_scoped_private_broker_creation"
              },
              {
                "name": "space_developer_env_var_visibility",
                "enabled": true,
                "error_message": null,
                "url": "/v2/config/feature_flags/space_developer_env_var_visibility"
              }
            ]
          }
        }
      };
    }
  };

  /* eslint-enable quote-props */
})
(this.mock = this.mock || {});
