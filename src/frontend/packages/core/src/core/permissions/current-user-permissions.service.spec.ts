import { TestBed } from '@angular/core/testing';
import { createBasicStoreModule, createEntityStoreState, TestStoreEntity } from '@stratosui/store/testing';
import { first, tap } from 'rxjs/operators';

import { AppState } from '../../../../store/src/app-state';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '../../../../store/src/entity-catalog-test.module';
import { EntityCatalogEntityConfig } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { endpointEntityType, stratosEntityFactory } from '../../../../store/src/helpers/stratos-entity-factory';
import { generateStratosEntities } from '../../../../store/src/stratos-entity-generator';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { BaseEntityValues } from '../../../../store/src/types/entity.types';
import { PaginationState } from '../../../../store/src/types/pagination.types';
import { AppTestModule } from '../../../test-framework/core-test.helper';
import { PermissionConfig } from './current-user-permissions.config';
import { CurrentUserPermissionsService } from './current-user-permissions.service';
import { StratosPermissionStrings, StratosPermissionTypes, StratosScopeStrings } from './stratos-user-permissions.checker';


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
            StratosScopeStrings.STRATOS_CHANGE_PASSWORD,
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
            StratosScopeStrings.STRATOS_CHANGE_PASSWORD,
            StratosScopeStrings.SCIM_READ
          ]
        },
        metricsAvailable: false,
        connectionStatus: 'connected',
        system_shared_token: false,
        sso_allowed: false
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
    };

    // User roles
    const initialState: Partial<AppState<BaseEntityValues>> = {

    };


    // Create request and requestData sections
    const entityMap = new Map<EntityCatalogEntityConfig, Array<TestStoreEntity | string>>([
      [
        stratosEntityFactory(endpointEntityType),
        endpoints.map(endpoint => ({
          guid: endpoint.guid,
          data: endpoint
        }))
      ],
    ]);
    const requestAndRequestData = createEntityStoreState(entityMap);

    return {
      currentUserRoles: {
        internal: {
          isAdmin: false,
          scopes: [
            StratosScopeStrings.STRATOS_CHANGE_PASSWORD,
            StratosScopeStrings.SCIM_READ
          ],
        },
        endpoints: {
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


  it('should allow if stratos admin', done => {
    service.can(new PermissionConfig(StratosPermissionTypes.STRATOS, StratosPermissionStrings.STRATOS_ADMIN)).pipe(
      tap(can => {
        expect(can).toBe(false);
        done();
      }),
      first()
    ).subscribe();
  });

  it('should allow if has stratos change password scope', done => {
    service.can(new PermissionConfig(StratosPermissionTypes.STRATOS_SCOPE, StratosScopeStrings.STRATOS_CHANGE_PASSWORD)).pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();

    service.can([new PermissionConfig(StratosPermissionTypes.STRATOS_SCOPE, StratosScopeStrings.STRATOS_CHANGE_PASSWORD)]).pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();
  });


});
