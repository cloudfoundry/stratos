import { TestBed } from '@angular/core/testing';
import { createBasicStoreModule, createEntityStoreState, TestStoreEntity } from '@stratos/store/testing';
import { first, tap } from 'rxjs/operators';

import { AppState } from '../../../store/src/app-state';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '../../../store/src/entity-catalog-test.module';
import { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel } from '../../../store/src/types/endpoint.types';
import { generateStratosEntities } from '../base-entity-types';
import { PermissionConfig, PermissionStrings, PermissionTypes, ScopeStrings } from './current-user-permissions.config';
import { CurrentUserPermissionsService } from './current-user-permissions.service';


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
            ScopeStrings.STRATOS_CHANGE_PASSWORD,
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
            ScopeStrings.SCIM_READ
          ]
        },
        metricsAvailable: false,
        connectionStatus: 'connected',
        system_shared_token: false,
        sso_allowed: false
      }
    ];

    // User roles
    const initialState: Partial<AppState<BaseEntityValues>> = {

    };


    // Create request and requestData sections
    const entityMap = new Map<EntityCatalogEntityConfig, Array<TestStoreEntity | string>>();
    const requestAndRequestData = createEntityStoreState(entityMap);

    return {
      currentUserRoles: {
        internal: {
          isAdmin: false,
          scopes: [
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
      ],

    });
    service = TestBed.get(CurrentUserPermissionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
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

    service.can(new PermissionConfig(PermissionTypes.STRATOS_SCOPE, ScopeStrings.STRATOS_CHANGE_PASSWORD)).pipe(
      tap(can => {
        expect(can).toBe(true);
        done();
      }),
      first()
    ).subscribe();
  });

  // it('should allow if has endpoint scope', done => {
  //   service.can(new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.SCIM_READ), 'c80420ca-204b-4879-bf69-b6b7a202ad87').pipe(
  //     tap(can => {
  //       expect(can).toBe(true);
  //       done();
  //     }),
  //     first()
  //   ).subscribe();
  // });

  // it('should not allow if has endpoint scope', done => {
  //   service.can(new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.SCIM_READ), '0e934dc8-7ad4-40ff-b85c-53c1b61d2abb').pipe(
  //     tap(can => {
  //       expect(can).toBe(false);
  //       done();
  //     }),
  //     first()
  //   ).subscribe();
  // });

});
