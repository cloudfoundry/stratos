import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  AppState,
  BaseEntityValues,
  EndpointsDataService,
  EndpointModel,
  entityCatalog,
  EntityCatalogEntityConfig,
  getDefaultPaginationEntityState,
  getDefaultRequestState,
  getDefaultRolesRequestState,
  rootUpdatingKey,
  SessionData,
  SessionDataEndpoint,
} from '@stratosui/store';

// The ngrx root store was removed in the final ngrx-removal closer. The
// store-module factory functions below used to return `StoreModule.forRoot(...)`
// modules; specs added them to `imports: []` but no spec injects/reads the
// store any more (all data is signal-native). They now return this inert
// module so the existing call sites keep compiling unchanged.
@NgModule({})
export class EmptyTestStoreModule { }

export const testSCFEndpointGuid = '01ccda9d-8f40-4dd0-bc39-08eea68e364f';
const testSCFSessionEndpoint: SessionDataEndpoint = {
  guid: testSCFEndpointGuid,
  name: 'SCF-2.2.0-beta',
  version: '',
  user: {
    scopes: [],
    guid: 'a6254a42-a218-4f41-b77e-35a8d53d9dd1',
    name: 'admin',
    admin: true
  },
  type: ''
};

export const testSCFEndpoint: EndpointModel = {
  guid: testSCFEndpointGuid,
  name: 'SCF-2.2.0-beta',
  user: {
    scopes: [],
    guid: 'a6254a42-a218-4f41-b77e-35a8d53d9dd1',
    name: 'admin',
    admin: true
  },
  cnsi_type: 'cf',
  system_shared_token: false,
  sso_allowed: false,
  metricsAvailable: false,
  creator: {
    name: 'admin',
    admin: true,
    system: false
  }
};

export const testSessionData: SessionData = {
  version: {
    proxy_version: '0.9.5-a77102d6',
    database_version: 20170818162837
  },
  user: {
    guid: '530170c7-5042-40ed-8654-c4a79e4d1302',
    name: 'admin',
    admin: true,
    scopes: []
  },
  endpoints: {
    cf: {
      [testSCFEndpointGuid]: testSCFSessionEndpoint,
      '521a9d96-2d6c-4d94-a555-807437ab106d': {
        guid: '521a9d96-2d6c-4d94-a555-807437ab106d',
        name: 'SCF',
        version: '',
        user: {
          scopes: [],
          guid: 'ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
          name: 'admin',
          admin: true
        },
        type: ''
      },
      '663a363e-1faf-4359-ac96-b8c24ec1a4ab': {
        guid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab',
        name: 'TEST',
        version: '',
        user: {
          scopes: [],
          guid: 'b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
          name: 'admin',
          admin: true
        },
        type: ''
      },
      'b24923d0-f1ad-4534-bb02-f609a1667bb1': {
        guid: 'b24923d0-f1ad-4534-bb02-f609a1667bb1',
        name: 'SAP',
        version: '',
        user: {
          scopes: [],
          guid: '7965e2cc-ef57-4373-bb0d-b45025355883',
          name: 'macdougall.neil@gmail.com',
          admin: false
        },
        type: ''
      },
      'e2f91bca-38e8-435a-9f72-7a8f8de0ee17': {
        guid: 'e2f91bca-38e8-435a-9f72-7a8f8de0ee17',
        name: 'SCF 2.1.0-beta',
        version: '',
        user: {
          scopes: [],
          guid: 'a1e15ade-2f3d-4354-8935-0553973afb2c',
          name: 'admin',
          admin: true
        },
        type: ''
      }
    }
  },
  valid: true,
  uaaError: false,
  upgradeInProgress: false,
  sessionExpiresOn: 1000,
  plugins: {
    demo: false
  },
  config: {
    enableTechPreview: false
  }
};

function getDefaultInitialTestStratosStoreState() {
  return {
    recentlyVisited: {},
    auth: {
      loggedIn: true,
      loggingIn: false,
      user: null as any,
      error: false,
      errorResponse: '',
      sessionData: testSessionData,
      verifying: false
    },
    endpoints: {
      loading: false,
      error: false,
      message: ''
    },
    lists: {},
    currentUserRoles: {
      internal: {
        isAdmin: false,
        scopes: [] as any[]
      },
      endpoints: {},
      state: getDefaultRolesRequestState()
    }
  };
}

function getDefaultInitialTestStoreState(): AppState<BaseEntityValues> {
  return {
    ...getDefaultInitialTestStratosStoreState(),
    pagination: {
      system: {},
      stratosEndpoint: {
        'endpoint-list': {
          pageCount: 1,
          currentPage: 1,
          totalResults: 0,
          params: {
            key: 'a'
          },
          pageRequests: {
          },
          ids: {},
          clientPagination: {
            pageSize: 5,
            currentPage: 1,
            totalResults: 50,
            filter: {
              string: '',
              items: {}
            },
          },
          maxedState: {},
          isListPagination: true
        }
      },
      metrics: {},
    },
    request: {
      metrics: {},      stratosEndpoint: {
        '57ab08d8-86cc-473a-8818-25d5e8d0ea23': {
          fetching: false,
          updating: {
            [rootUpdatingKey]: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        }
      },
      system: {},
    },
    requestData: {      stratosEndpoint: {
        [testSCFEndpointGuid]: {
          guid: testSCFEndpointGuid,
          name: 'SCF',
          cnsi_type: 'cf',
          api_endpoint: {
            Scheme: 'https',
            Opaque: '',
            // Go's url.Userinfo pointer serializes to JSON null when absent;
            // this fixture reproduces that real wire shape (User: object | null).
            User: null,
            Host: 'api.127.0.0.1.xip.io:8443',
            Path: '',
            RawPath: '',
            ForceQuery: false,
            RawQuery: '',
            Fragment: ''
          },
          authorization_endpoint: 'https://cf.uaa.127.0.0.1.xip.io:2793',
          token_endpoint: 'https://cf.uaa.127.0.0.1.xip.io:2793',
          doppler_logging_endpoint: 'wss://doppler.127.0.0.1.xip.io:4443',
          skip_ssl_validation: true,
          sso_allowed: true,
          user: {
            guid: 'bcf78136-6225-4515-bf8e-a32243deea0c',
            name: 'admin',
            admin: true
          },
          creator: {
            name: 'admin',
            admin: true,
            system: false
          },
          connectionStatus: 'connected',
          system_shared_token: false,
          metricsAvailable: false
        },
      },
      metrics: {},
      system: {},
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature preserved for call sites; state is no longer consumed (no ngrx store)
export function createBasicStoreModule(
  initialState: Partial<AppState<BaseEntityValues>> = getDefaultInitialTestStoreState()
): typeof EmptyTestStoreModule {
  return EmptyTestStoreModule;
}

export function createEmptyStoreModule(): typeof EmptyTestStoreModule {
  return EmptyTestStoreModule;
}

function getStoreSectionForIds(entities: Array<TestStoreEntity | string>, dataOverride?: any): Record<string, any> {
  return entities.reduce((sections, entity) => {
    if (typeof entity === 'string') {
      return {
        [entity]: dataOverride || {}
      };
    }
    sections[entity.guid] = dataOverride || entity.data || {};
    return sections;
  }, {} as Record<string, any>);
}

export interface TestStoreEntity {
  guid: string;
  data?: any;
}

/**
 * Should not be used by StoreModule.forRoot's initialState (lack of specific reducers in same object cause parts of state to be ignored)
 */
export function createEntityStoreState(entityMap: Map<EntityCatalogEntityConfig, Array<TestStoreEntity | string>>) {
  return Array.from(entityMap.keys()).reduce((state, entityConfig) => {
    // strict: key comes from entityMap.keys(), so get() always resolves; ?? []
    // here is an unreachable type-narrowing fallback, not fabricated data.
    const entities = entityMap.get(entityConfig) ?? [];
    const entityKey = entityCatalog.getEntityKey(entityConfig);
    return {
      request: {
        ...state.request,
        [entityKey]: getStoreSectionForIds(entities, getDefaultRequestState())
      },
      requestData: {
        ...state.requestData,
        [entityKey]: getStoreSectionForIds(entities)
      },
      pagination: {
        ...state.pagination,
        [entityKey]: getStoreSectionForIds(entities, getDefaultPaginationEntityState())
      }
    };
  }, getDefaultInitialTestStoreState());
}

export function createEntityStore(
  entityMap: Map<EntityCatalogEntityConfig, Array<TestStoreEntity | string>>
): typeof EmptyTestStoreModule {
  const initialState = createEntityStoreState(entityMap);
  return createBasicStoreModule(initialState);
}

/**
 * Seed the signal-native EndpointsDataService with the given endpoints. For
 * specs that previously dispatched endpoint data into the ngrx store so a
 * (now signal-native) component could read it back. Tolerates the service not
 * being available in the test injector (non-fatal).
 */
export function seedEndpointsDataService(endpoints: EndpointModel[]): void {
  try {
    const endpointsService = TestBed.inject(EndpointsDataService, null);
    if (endpointsService) {
      // Bypass private encapsulation via index access — the writable signal
      // is the source of truth that the public readonly `endpoints` signal
      // mirrors. This is a test-only seam; production code mutates via
      // `getAll()` / `register()` etc.
      const writable = (endpointsService as unknown as { ['_endpoints']?: { set: (m: Map<string, EndpointModel>) => void } })['_endpoints'];
      if (writable && typeof writable.set === 'function') {
        // EndpointModel.guid is optional in the source type, but the signal map
        // is keyed by guid; drop any guid-less endpoint (it could never be keyed)
        // so the entry tuples are genuinely [string, EndpointModel].
        const entries = endpoints
          .filter((e): e is EndpointModel & { guid: string } => e.guid !== undefined)
          .map(e => [e.guid, e] as const);
        writable.set(new Map(entries));
      }
    }
  } catch {
    // Service not provided in this test — non-fatal.
  }
}

export function populateStoreWithTestEndpoint(): EndpointModel {
  // The ngrx store is gone; seed the signal-native EndpointsDataService
  // directly so signal consumers (`EndpointsSignalService`,
  // `CfEndpointsDataService`, `EndpointsService.endpoints$`) see the test
  // endpoint.
  seedEndpointsDataService([testSCFEndpoint]);
  return testSCFEndpoint;
}
