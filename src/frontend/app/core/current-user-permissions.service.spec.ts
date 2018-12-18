import { TestBed, inject } from '@angular/core/testing';
import { StoreModule, Store } from '@ngrx/store';
import { CurrentUserPermissionsService } from './current-user-permissions.service';
import {
  CurrentUserPermissions,
  PermissionConfig,
  PermissionTypes,
  PermissionStrings,
  ScopeStrings
} from './current-user-permissions.config';
import { tap, first } from 'rxjs/operators';
import { appReducers } from '../store/reducers.module';
import { CFFeatureFlagTypes } from '../shared/components/cf-auth/cf-auth.types';
const initialState = {
  pagination: {
    application: {},
    stack: {},
    space: {},
    organization: {},
    route: {},
    event: {},
    endpoint: {
      'endpoint-list': {
        currentPage: 1,
        totalResults: 2,
        ids: {
          '1': [
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
            'c80420ca-204b-4879-bf69-b6b7a202ad87'
          ]
        },
        pageRequests: {
          '1': {
            busy: false,
            error: false,
            message: ''
          }
        },
        params: {
          'results-per-page': 50,
          'order-direction': 'desc',
          'order-direction-field': 'name',
          page: 1,
          q: []
        },
        clientPagination: {
          pageSize: 5,
          currentPage: 1,
          filter: {
            string: '',
            items: {}
          },
          totalResults: 2
        },
        error: false
      }
    },
    githubBranches: {},
    user: {},
    domain: {},
    environmentVars: {},
    stats: {},
    summary: {},
    serviceInstance: {},
    servicePlan: {},
    service: {},
    serviceBinding: {},
    buildpack: {},
    securityGroup: {},
    featureFlag: {
      'endpoint-0e934dc8-7ad4-40ff-b85c-53c1b61d2abb': {
        pageCount: 1,
        currentPage: 1,
        totalResults: 13,
        ids: {
          '1': [
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-0',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-1',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-2',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-3',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-4',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-5',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-6',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-7',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-8',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-9',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-10',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-11',
            '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-12'
          ]
        },
        pageRequests: {
          '1': {
            busy: false,
            error: false,
            message: ''
          }
        },
        params: {},
        clientPagination: {
          pageSize: 9,
          currentPage: 1,
          filter: {
            string: '',
            items: {}
          },
          totalResults: 13
        }
      },
      'endpoint-c80420ca-204b-4879-bf69-b6b7a202ad87': {
        pageCount: 1,
        currentPage: 1,
        totalResults: 13,
        ids: {
          '1': [
            'c80420ca-204b-4879-bf69-b6b7a202ad87-0',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-1',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-2',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-3',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-4',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-5',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-6',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-7',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-8',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-9',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-10',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-11',
            'c80420ca-204b-4879-bf69-b6b7a202ad87-12'
          ]
        },
        pageRequests: {
          '1': {
            busy: false,
            error: false,
            message: ''
          }
        },
        params: {},
        clientPagination: {
          pageSize: 9,
          currentPage: 1,
          filter: {
            string: '',
            items: {}
          },
          totalResults: 13
        }
      }
    },
    private_domains: {},
    space_quota_definition: {},
    metrics: {}
  },
  requestData: {
    application: {},
    stack: {},
    space: {},
    organization: {},
    route: {},
    event: {},
    endpoint: {
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb': {
        guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
        name: 'SCF',
        cnsi_type: 'cf',
        api_endpoint: {
          Scheme: 'https',
          Opaque: '',
          User: null,
          Host: 'api.10.84.93.10.nip.io:8443',
          Path: '',
          RawPath: '',
          ForceQuery: false,
          RawQuery: '',
          Fragment: ''
        },
        authorization_endpoint: 'https://cf.uaa.10.84.93.10.nip.io:2793',
        token_endpoint: 'https://cf.uaa.10.84.93.10.nip.io:2793',
        doppler_logging_endpoint: 'wss://doppler.10.84.93.10.nip.io:4443',
        skip_ssl_validation: true,
        user: {
          guid: '670f4618-525e-4784-a56e-a238a0daf63d',
          name: 'nathan',
          admin: false,
          scopes: [
            'cloud_controller.read',
            'password.write',
            'cloud_controller.write',
            'openid',
            'uaa.user'
          ]
        },
        metricsAvailable: false,
        connectionStatus: 'connected',
        registered: true
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87': {
        guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
        name: 'MainSCF',
        cnsi_type: 'cf',
        api_endpoint: {
          Scheme: 'https',
          Opaque: '',
          User: null,
          Host: 'api.10.84.93.55.nip.io:8443',
          Path: '',
          RawPath: '',
          ForceQuery: false,
          RawQuery: '',
          Fragment: ''
        },
        authorization_endpoint: 'https://cf.uaa.10.84.93.55.nip.io:2793',
        token_endpoint: 'https://cf.uaa.10.84.93.55.nip.io:2793',
        doppler_logging_endpoint: 'wss://doppler.10.84.93.55.nip.io:4443',
        skip_ssl_validation: true,
        user: {
          guid: '4389dfd6-6048-4149-8b26-5aa6893ac21d',
          name: 'admin',
          admin: true,
          scopes: [
            'openid',
            'scim.read',
            'cloud_controller.admin',
            'uaa.user',
            'routing.router_groups.read',
            'cloud_controller.read',
            'password.write',
            'cloud_controller.write',
            'doppler.firehose',
            'scim.write'
          ]
        },
        metricsAvailable: false,
        connectionStatus: 'connected',
        registered: true
      }
    },
    domain: {},
    system: {},
    routerReducer: {},
    createApplication: {},
    uaaSetup: {},
    user: {},
    cloudFoundryInfo: {},
    gitRepo: {},
    gitBranches: {},
    gitCommits: {},
    environmentVars: {},
    stats: {},
    summary: {},
    quota_definition: {},
    buildpack: {},
    securityGroup: {},
    servicePlan: {},
    service: {},
    serviceBinding: {},
    serviceInstance: {},
    featureFlag: {
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-0': {
        entity: {
          name: 'user_org_creation',
          enabled: false,
          error_message: null,
          url: '/v2/config/feature_flags/user_org_creation',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-0'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-0'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-1': {
        entity: {
          name: 'private_domain_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/private_domain_creation',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-1'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-1'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-2': {
        entity: {
          name: 'app_bits_upload',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/app_bits_upload',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-2'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-2'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-3': {
        entity: {
          name: 'app_scaling',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/app_scaling',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-3'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-3'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-4': {
        entity: {
          name: 'route_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/route_creation',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-4'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-4'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-5': {
        entity: {
          name: 'service_instance_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/service_instance_creation',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-5'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-5'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-6': {
        entity: {
          name: 'diego_docker',
          enabled: false,
          error_message: null,
          url: '/v2/config/feature_flags/diego_docker',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-6'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-6'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-7': {
        entity: {
          name: 'set_roles_by_username',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/set_roles_by_username',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-7'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-7'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-8': {
        entity: {
          name: 'unset_roles_by_username',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/unset_roles_by_username',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-8'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-8'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-10': {
        entity: {
          name: 'env_var_visibility',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/env_var_visibility',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-10'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-10'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-11': {
        entity: {
          name: 'space_scoped_private_broker_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/space_scoped_private_broker_creation',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-11'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-11'
        }
      },
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-12': {
        entity: {
          name: 'space_developer_env_var_visibility',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/space_developer_env_var_visibility',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-12'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-12'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-0': {
        entity: {
          name: 'user_org_creation',
          enabled: false,
          error_message: null,
          url: '/v2/config/feature_flags/user_org_creation',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-0'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-0'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-1': {
        entity: {
          name: 'private_domain_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/private_domain_creation',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-1'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-1'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-2': {
        entity: {
          name: 'app_bits_upload',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/app_bits_upload',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-2'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-2'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-3': {
        entity: {
          name: 'app_scaling',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/app_scaling',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-3'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-3'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-4': {
        entity: {
          name: 'route_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/route_creation',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-4'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-4'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-5': {
        entity: {
          name: 'service_instance_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/service_instance_creation',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-5'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-5'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-6': {
        entity: {
          name: 'diego_docker',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/diego_docker',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-6'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-6'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-7': {
        entity: {
          name: 'set_roles_by_username',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/set_roles_by_username',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-7'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-7'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-8': {
        entity: {
          name: 'unset_roles_by_username',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/unset_roles_by_username',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-8'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-8'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-10': {
        entity: {
          name: 'env_var_visibility',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/env_var_visibility',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-10'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-10'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-11': {
        entity: {
          name: 'space_scoped_private_broker_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/space_scoped_private_broker_creation',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-11'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-11'
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87-12': {
        entity: {
          name: 'space_developer_env_var_visibility',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/space_developer_env_var_visibility',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-12'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-12'
        }
      }
    },
    private_domains: {},
    space_quota_definition: {},
    metrics: {},
    userProfile: {}
  },
  currentUserRoles: {
    internal: {
      isAdmin: false,
      scopes: [
        'scim.me',
        'openid',
        'profile',
        'roles',
        'uaa.user',
        'notification_preferences.write',
        'cloud_controller.read',
        'password.write',
        'approvals.me',
        'cloud_controller.write',
        'cloud_controller_service_permissions.read',
        'oauth.approvals',
        'stratos.user'
      ]
    },
    cf: {
      '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb': {
        global: {
          isAdmin: false,
          isReadOnlyAdmin: false,
          isGlobalAuditor: false,
          canRead: true,
          canWrite: true,
          scopes: [
            'cloud_controller.read',
            'password.write',
            'cloud_controller.write',
            'openid',
            'uaa.user'
          ]
        },
        spaces: {
          '56eb5ecc-7c96-4bb1-bdcc-0c6c3d444dc6': {
            isManager: true,
            isAuditor: false,
            isDeveloper: true
          }
        },
        organizations: {
          'd5e50b05-497f-4b3b-9658-a396a592a8ba': {
            isManager: false,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          },
          'c58e7cfd-c765-400a-a473-313fa572d5c4': {
            isManager: false,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          }
        }
      },
      'c80420ca-204b-4879-bf69-b6b7a202ad87': {
        global: {
          isAdmin: false,
          isReadOnlyAdmin: false,
          isGlobalAuditor: false,
          canRead: true,
          canWrite: true,
          scopes: [
            'openid',
            'scim.read',
            'cloud_controller.admin',
            'uaa.user',
            'routing.router_groups.read',
            'cloud_controller.read',
            'password.write',
            'cloud_controller.write',
            'doppler.firehose',
            'scim.write'
          ]
        },
        spaces: {
          '56eb5ecc-7c96-4bb1-bdcc-0c6c3d444dc6': {
            isManager: true,
            isAuditor: false,
            isDeveloper: true
          },
          'c6450a21-aa1a-4643-9437-035cc818ea72': {
            isManager: true,
            isAuditor: false,
            isDeveloper: true
          },
          '86577124-4b64-4ca1-9a78-d904c60505c4': {
            isManager: true,
            isAuditor: false,
            isDeveloper: true
          }
        },
        organizations: {
          '367a49c1-b5dc-44e6-a8cf-84b1f56426a7': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          },
          'dccfedde-be2c-46a6-99cf-c1320ea8cb6d': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          },
          '8a175cad-ff61-436b-8c6f-e5beb13edb5f': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          },
          'd5246255-867b-4f62-9040-346f113f0b7d': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          }
        }
      },
      'READ_ONLY_ADMIN': {
        global: {
          isAdmin: false,
          isReadOnlyAdmin: true,
          isGlobalAuditor: false,
          canRead: true,
          canWrite: true,
          scopes: [
            'openid',
            'scim.read',
            'cloud_controller.admin',
            'uaa.user',
            'routing.router_groups.read',
            'cloud_controller.read',
            'password.write',
            'cloud_controller.write',
            'doppler.firehose',
            'scim.write'
          ]
        },
        spaces: {
          '56eb5ecc-7c96-4bb1-bdcc-0c6c3d444dc6': {
            isManager: true,
            isAuditor: false,
            isDeveloper: true
          },
          'c6450a21-aa1a-4643-9437-035cc818ea72': {
            isManager: true,
            isAuditor: false,
            isDeveloper: true
          },
          '86577124-4b64-4ca1-9a78-d904c60505c4': {
            isManager: true,
            isAuditor: false,
            isDeveloper: true
          }
        },
        organizations: {
          '367a49c1-b5dc-44e6-a8cf-84b1f56426a7': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          },
          'dccfedde-be2c-46a6-99cf-c1320ea8cb6d': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          },
          '8a175cad-ff61-436b-8c6f-e5beb13edb5f': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          },
          'd5246255-867b-4f62-9040-346f113f0b7d': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          }
        }
      },
      'READ_ONLY_USER': {
        global: {
          isAdmin: false,
          isReadOnlyAdmin: false,
          isGlobalAuditor: false,
          canRead: true,
          canWrite: false,
          scopes: [
            'openid',
            'scim.read',
            'cloud_controller.admin',
            'uaa.user',
            'routing.router_groups.read',
            'cloud_controller.read',
            'password.write',
            'cloud_controller.write',
            'doppler.firehose',
            'scim.write'
          ]
        },
        spaces: {
          '56eb5ecc-7c96-4bb1-bdcc-0c6c3d444dc6': {
            isManager: true,
            isAuditor: false,
            isDeveloper: true
          },
          'c6450a21-aa1a-4643-9437-035cc818ea72': {
            isManager: true,
            isAuditor: false,
            isDeveloper: true
          },
          '86577124-4b64-4ca1-9a78-d904c60505c4': {
            isManager: true,
            isAuditor: false,
            isDeveloper: true
          }
        },
        organizations: {
          '367a49c1-b5dc-44e6-a8cf-84b1f56426a7': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          },
          'dccfedde-be2c-46a6-99cf-c1320ea8cb6d': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          },
          '8a175cad-ff61-436b-8c6f-e5beb13edb5f': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          },
          'd5246255-867b-4f62-9040-346f113f0b7d': {
            isManager: true,
            isAuditor: false,
            isBillingManager: false,
            isUser: true
          }
        }
      }
    }
  }
};
describe('CurrentUserPermissionsService', () => {
  let service: CurrentUserPermissionsService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrentUserPermissionsService],
      imports: [
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        )
      ]
    });
    service = TestBed.get(CurrentUserPermissionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should allow create application', done => {
    service.can(CurrentUserPermissions.APPLICATION_CREATE).pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();
  });
  it('should allow create application for single endpoint with access', done => {
    service.can(CurrentUserPermissions.APPLICATION_CREATE, '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb').pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();
  });
  it('should allow create application for single endpoint with access and org/space', done => {
    service.can(
      CurrentUserPermissions.APPLICATION_CREATE,
      'c80420ca-204b-4879-bf69-b6b7a202ad87',
      '86577124-4b64-4ca1-9a78-d904c60505c4'
    ).pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should allow if feature flag', done => {
    service.can(
      [
        new PermissionConfig(PermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.private_domain_creation)
      ]
    ).pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should not allow if no feature flag', done => {
    service.can(
      [new PermissionConfig(PermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.user_org_creation)],
      'c80420ca-204b-4879-bf69-b6b7a202ad87'
    ).pipe(
      tap(can => {
        expect(can).toBe(false);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should not allow if no feature flag', done => {
    service.can(
      [new PermissionConfig(PermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.user_org_creation)],
      'c80420ca-204b-4879-bf69-b6b7a202ad87'
    ).pipe(
      tap(can => {
        expect(can).toBe(false);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should allow if stratos admin', done => {
    service.can(new PermissionConfig(PermissionTypes.STRATOS, PermissionStrings.STRATOS_ADMIN)).pipe(
      tap(can => {
        expect(can).toBe(false);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should allow if has stratos change password scope', done => {
    service.can(new PermissionConfig(PermissionTypes.STRATOS_SCOPE, ScopeStrings.STRATOS_CHANGE_PASSWORD)).pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();

    service.can([new PermissionConfig(PermissionTypes.STRATOS_SCOPE, ScopeStrings.STRATOS_CHANGE_PASSWORD)]).pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should allow if has endpoint scope', done => {
    service.can(new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.SCIM_READ), 'c80420ca-204b-4879-bf69-b6b7a202ad87').pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should not allow if has endpoint scope', done => {
    service.can(new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.SCIM_READ), '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb').pipe(
      tap(can => {
        expect(can).toBe(false);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should not allow if read only admin', done => {
    service.can(
      CurrentUserPermissions.APPLICATION_CREATE,
      'READ_ONLY_ADMIN',
      'c6450a21-aa1a-4643-9437-035cc818ea72'
    ).pipe(
      tap(can => {
        expect(can).toBe(false);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should not allow if read only user', done => {
    service.can(
      CurrentUserPermissions.APPLICATION_CREATE,
      'READ_ONLY_USER',
      'c6450a21-aa1a-4643-9437-035cc818ea72'
    ).pipe(
      tap(can => {
        expect(can).toBe(false);
        done();
      }),
      first()
    ).subscribe();
  });

});
