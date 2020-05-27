import { TestBed } from '@angular/core/testing';
import { createBasicStoreModule, createEntityStoreState, TestStoreEntity } from '@stratos/store/testing';
import { first, tap } from 'rxjs/operators';

import { CFFeatureFlagTypes, IFeatureFlag } from '../../../cloud-foundry/src/cf-api.types';
import { cfEntityFactory } from '../../../cloud-foundry/src/cf-entity-factory';
import { generateCFEntities } from '../../../cloud-foundry/src/cf-entity-generator';
import { featureFlagEntityType } from '../../../cloud-foundry/src/cf-entity-types';
import { AppState } from '../../../store/src/app-state';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '../../../store/src/entity-catalog-test.module';
import { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import { APIResource } from '../../../store/src/types/api.types';
import { EndpointModel } from '../../../store/src/types/endpoint.types';
import { BaseEntityValues } from '../../../store/src/types/entity.types';
import { PaginationState } from '../../../store/src/types/pagination.types';
import { AppTestModule } from '../../test-framework/core-test.helper';
import { endpointEntitySchema } from '../base-entity-schemas';
import { generateStratosEntities } from '../base-entity-types';
import {
  CurrentUserPermissions,
  PermissionConfig,
  PermissionStrings,
  PermissionTypes,
  ScopeStrings,
} from './current-user-permissions.config';
import { CurrentUserPermissionsService } from './current-user-permissions.service';

const ffSchema = cfEntityFactory(featureFlagEntityType);

describe('CurrentUserPermissionsService', () => {
  let service: CurrentUserPermissionsService;


  function createStoreState(): Partial<AppState<BaseEntityValues>> {
    // Data
    const endpoints: EndpointModel[] = [
      {
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
            ScopeStrings.CF_WRITE_SCOPE,
            ScopeStrings.STRATOS_CHANGE_PASSWORD,
            ScopeStrings.CF_READ_SCOPE,
          ]
        },
        metricsAvailable: false,
        connectionStatus: 'connected',
        system_shared_token: false,
        sso_allowed: false
      },
      {
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
            ScopeStrings.CF_WRITE_SCOPE,
            ScopeStrings.STRATOS_CHANGE_PASSWORD,
            ScopeStrings.CF_READ_SCOPE,
            ScopeStrings.CF_ADMIN_GROUP,
            ScopeStrings.CF_READ_ONLY_ADMIN_GROUP,
            ScopeStrings.CF_ADMIN_GLOBAL_AUDITOR_GROUP,
            ScopeStrings.SCIM_READ
          ]
        },
        metricsAvailable: false,
        connectionStatus: 'connected',
        system_shared_token: false,
        sso_allowed: false
      }
    ];

    const featureFlags1: APIResource<IFeatureFlag>[] = [
      {
        entity: {
          name: 'user_org_creation',
          enabled: false,
          error_message: null,
          url: '/v2/config/feature_flags/user_org_creation',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-0',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'private_domain_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/private_domain_creation',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-1'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-1',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }, {
        entity: {
          name: 'app_bits_upload',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/app_bits_upload',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-2'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-2',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }, {
        entity: {
          name: 'app_scaling',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/app_scaling',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-3'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-3',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }, {
        entity: {
          name: 'route_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/route_creation',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-4'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-4',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }, {
        entity: {
          name: 'service_instance_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/service_instance_creation',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-5'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-5',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }, {
        entity: {
          name: 'diego_docker',
          enabled: false,
          error_message: null,
          url: '/v2/config/feature_flags/diego_docker',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-6'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-6',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }, {
        entity: {
          name: 'set_roles_by_username',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/set_roles_by_username',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-7'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-7',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }, {
        entity: {
          name: 'unset_roles_by_username',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/unset_roles_by_username',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-8'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-8',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }, {
        entity: {
          name: 'env_var_visibility',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/env_var_visibility',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-10'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-10',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }, {
        entity: {
          name: 'space_scoped_private_broker_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/space_scoped_private_broker_creation',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-11'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-11',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }, {
        entity: {
          name: 'space_developer_env_var_visibility',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/space_developer_env_var_visibility',
          cfGuid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb',
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-12'
        },
        metadata: {
          guid: '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb-12',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }
    ];
    const featureFlags2: APIResource<IFeatureFlag>[] = [
      // {
      //   entity: {
      //     name: 'user_org_creation',
      //     enabled: false,
      //     error_message: null,
      //     url: '/v2/config/feature_flags/user_org_creation',
      //     cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
      //     guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-0'
      //   },
      //   metadata: {
      //     guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-0',
      //     created_at: '',
      //     updated_at: '',
      //     url: ''
      //   }
      // },
      {
        entity: {
          name: 'private_domain_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/private_domain_creation',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-1'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-1',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'app_bits_upload',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/app_bits_upload',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-2'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-2',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'app_scaling',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/app_scaling',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-3'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-3',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'route_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/route_creation',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-4'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-4',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'service_instance_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/service_instance_creation',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-5'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-5',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'diego_docker',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/diego_docker',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-6'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-6',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'set_roles_by_username',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/set_roles_by_username',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-7'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-7',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'unset_roles_by_username',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/unset_roles_by_username',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-8'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-8',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'env_var_visibility',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/env_var_visibility',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-10'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-10',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'space_scoped_private_broker_creation',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/space_scoped_private_broker_creation',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-11'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-11',
          created_at: '',
          updated_at: '',
          url: ''
        }
      },
      {
        entity: {
          name: 'space_developer_env_var_visibility',
          enabled: true,
          error_message: null,
          url: '/v2/config/feature_flags/space_developer_env_var_visibility',
          cfGuid: 'c80420ca-204b-4879-bf69-b6b7a202ad87',
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-12'
        },
        metadata: {
          guid: 'c80420ca-204b-4879-bf69-b6b7a202ad87-12',
          created_at: '',
          updated_at: '',
          url: ''
        }
      }
    ];

    // Pagination
    const pagination: PaginationState = {
      stratosEndpoint: {
        'endpoint-list': {
          currentPage: 1,
          totalResults: 2,
          pageCount: 1,
          ids: {
            1: endpoints.map(endpoint => endpoint.guid)
          },
          pageRequests: {
            1: {
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
          maxedState: {}
        }
      },
      cfFeatureFlag: {
        'endpoint-0e934dc8-7ad4-40ff-b85c-53c1b61d2abb': {
          pageCount: 1,
          currentPage: 1,
          totalResults: 13,
          ids: {
            1: featureFlags1.map(ff => ff.entity.guid)
          },
          pageRequests: {
            1: {
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
          },
          maxedState: {}
        },
        'endpoint-c80420ca-204b-4879-bf69-b6b7a202ad87': {
          pageCount: 1,
          currentPage: 1,
          totalResults: 13,
          ids: {
            1: featureFlags2.map(ff => ff.entity.guid)
          },
          pageRequests: {
            1: {
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
          },
          maxedState: {}
        }
      },
    };

    // User roles
    const initialState: Partial<AppState<BaseEntityValues>> = {

    };


    // Create request and requestData sections
    const entityMap = new Map<EntityCatalogEntityConfig, Array<TestStoreEntity | string>>([
      [
        endpointEntitySchema,
        endpoints.map(endpoint => ({
          guid: endpoint.guid,
          data: endpoint
        }))
      ],
      [
        ffSchema,
        [...featureFlags1, ...featureFlags2].map(featureFlag => ({
          guid: featureFlag.entity.guid,
          data: featureFlag
        }))
      ]
    ]);
    const requestAndRequestData = createEntityStoreState(entityMap);

    return {
      currentUserRoles: {
        internal: {
          isAdmin: false,

          scopes: [
            ScopeStrings.CF_ADMIN_GROUP,
            ScopeStrings.CF_READ_ONLY_ADMIN_GROUP,
            ScopeStrings.CF_ADMIN_GLOBAL_AUDITOR_GROUP,
            ScopeStrings.CF_WRITE_SCOPE,
            ScopeStrings.CF_READ_SCOPE,
            ScopeStrings.STRATOS_CHANGE_PASSWORD,
            ScopeStrings.SCIM_READ
          ],
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
                orgId: 'abc',
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
                isUser: true,
                spaceGuids: []
              },
              'c58e7cfd-c765-400a-a473-313fa572d5c4': {
                isManager: false,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              }
            },
            state: {
              initialised: true,
              fetching: false,
              error: null
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
                isDeveloper: true,
                orgId: 'abc'
              },
              'c6450a21-aa1a-4643-9437-035cc818ea72': {
                isManager: true,
                isAuditor: false,
                isDeveloper: true,
                orgId: 'abc'
              },
              '86577124-4b64-4ca1-9a78-d904c60505c4': {
                isManager: true,
                isAuditor: false,
                isDeveloper: true,
                orgId: 'abc'
              }
            },
            organizations: {
              '367a49c1-b5dc-44e6-a8cf-84b1f56426a7': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              },
              'dccfedde-be2c-46a6-99cf-c1320ea8cb6d': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              },
              '8a175cad-ff61-436b-8c6f-e5beb13edb5f': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              },
              'd5246255-867b-4f62-9040-346f113f0b7d': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              }
            },
            state: {
              initialised: true,
              fetching: false,
              error: null
            }
          },
          READ_ONLY_ADMIN: {
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
                orgId: 'abc',
                isManager: true,
                isAuditor: false,
                isDeveloper: true
              },
              'c6450a21-aa1a-4643-9437-035cc818ea72': {
                orgId: 'abc',
                isManager: true,
                isAuditor: false,
                isDeveloper: true
              },
              '86577124-4b64-4ca1-9a78-d904c60505c4': {
                orgId: 'abc',
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
                isUser: true,
                spaceGuids: []
              },
              'dccfedde-be2c-46a6-99cf-c1320ea8cb6d': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              },
              '8a175cad-ff61-436b-8c6f-e5beb13edb5f': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              },
              'd5246255-867b-4f62-9040-346f113f0b7d': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              }
            },
            state: {
              initialised: true,
              fetching: false,
              error: null
            }
          },
          READ_ONLY_USER: {
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
                isDeveloper: true,
                orgId: 'abc'
              },
              'c6450a21-aa1a-4643-9437-035cc818ea72': {
                isManager: true,
                isAuditor: false,
                isDeveloper: true,
                orgId: 'abc'
              },
              '86577124-4b64-4ca1-9a78-d904c60505c4': {
                isManager: true,
                isAuditor: false,
                isDeveloper: true,
                orgId: 'abc'
              }
            },
            organizations: {
              '367a49c1-b5dc-44e6-a8cf-84b1f56426a7': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              },
              'dccfedde-be2c-46a6-99cf-c1320ea8cb6d': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              },
              '8a175cad-ff61-436b-8c6f-e5beb13edb5f': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              },
              'd5246255-867b-4f62-9040-346f113f0b7d': {
                isManager: true,
                isAuditor: false,
                isBillingManager: false,
                isUser: true,
                spaceGuids: []
              }
            },
            state: {
              initialised: true,
              fetching: false,
              error: null
            }
          }
        },
        state: {
          initialised: true,
          fetching: false,
          error: null
        }
      },
      requestData: {
        ...initialState.requestData,
        ...requestAndRequestData.requestData
      },
      pagination: {
        ...initialState.pagination,
        ...pagination
      },
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CurrentUserPermissionsService,
      ],
      imports: [
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES, useValue: [
                ...generateStratosEntities(),
                generateCFEntities().find(a => a.type === ffSchema.entityType)
              ]
            }
          ]
        },
        createBasicStoreModule(createStoreState()),
        AppTestModule
      ],

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
      [new PermissionConfig(PermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.private_domain_creation)]
    ).pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should allow if feature flag with cf', done => {
    service.can(
      [new PermissionConfig(PermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.private_domain_creation)],
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
