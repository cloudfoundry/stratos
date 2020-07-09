import { ModuleWithProviders } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { AppState } from '../../src/app-state';
import { entityCatalog } from '../../src/entity-catalog/entity-catalog';
import { EntityCatalogEntityConfig } from '../../src/entity-catalog/entity-catalog.types';
import { endpointEntityType, stratosEntityFactory } from '../../src/helpers/stratos-entity-factory';
import { appReducers } from '../../src/reducers.module';
import { getDefaultRequestState, rootUpdatingKey } from '../../src/reducers/api-request-reducer/types';
import { getDefaultPaginationEntityState } from '../../src/reducers/pagination-reducer/pagination-reducer-reset-pagination';
import { NormalizedResponse } from '../../src/types/api.types';
import { SessionData, SessionDataEndpoint } from '../../src/types/auth.types';
import { getDefaultRolesRequestState } from '../../src/types/current-user-roles.types';
import { EndpointModel } from '../../src/types/endpoint.types';
import { BaseEntityValues } from '../../src/types/entity.types';
import { WrapperRequestActionSuccess } from '../../src/types/request.types';

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
  metricsAvailable: false
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
    userFavoritesGroups: {
      busy: false,
      error: false,
      message: '',
      groups: {}
    },
    auth: {
      loggedIn: true,
      loggingIn: false,
      user: null,
      error: false,
      errorResponse: '',
      sessionData: testSessionData,
      verifying: false
    },
    uaaSetup: {
      payload: null,
      setup: false,
      error: false,
      message: '',
      settingUp: false
    },
    endpoints: {
      loading: false,
      error: false,
      message: ''
    },
    dashboard: {
      sidenavOpen: true,
      timeoutSession: true,
      sideHelpOpen: false,
      sideHelpDocument: '',
      isMobile: false,
      isMobileNavOpen: false,
      sideNavPinned: false,
      pollingEnabled: true,
      themeKey: null,
      headerEventMinimized: true,
      gravatarEnabled: false,
    },
    actionHistory: [],
    lists: {},
    routing: {
      previousState: {
        id: 4,
        url: '/marketplace',
        urlAfterRedirects: '/marketplace',
        state: {
          url: '/marketplace',
          params: {},
          queryParams: {}
        }
      },
      currentState: {
        id: 5,
        url: '/applications',
        urlAfterRedirects: '/applications',
        state: {
          url: '/applications',
          params: {},
          queryParams: {}
        }
      }
    },
    internalEvents: {
      types: {
        global: {},
        endpoint: {}
      }
    },
    currentUserRoles: {
      internal: {
        isAdmin: false,
        scopes: []
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
          maxedState: {}
        }
      },
      metrics: {},
      stratosUserProfile: {},
      stratosUserFavorites: {}
    },
    request: {
      stratosUserProfile: {},
      metrics: {},
      stratosUserFavorites: {},
      stratosEndpoint: {
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
    requestData: {
      stratosUserFavorites: {},
      stratosEndpoint: {
        [testSCFEndpointGuid]: {
          guid: testSCFEndpointGuid,
          name: 'SCF',
          cnsi_type: 'cf',
          api_endpoint: {
            Scheme: 'https',
            Opaque: '',
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
          connectionStatus: 'connected',
          system_shared_token: false,
          metricsAvailable: false
        },
      },
      metrics: {},
      system: {},
      stratosUserProfile: {
        id: 'test-user',
        name: {
          familyName: 'User',
          givenName: 'Test',
        },
        userName: 'tesy-user-name',
        meta: {
          version: 1,
          created: '',
          lastModified: '',
        },
        verified: true,
        active: true,
        emails: [
          {
            primary: true,
            value: 'test@test.com',
          }
        ],
        passwordLastModified: '',
        schemas: '',
        zoneId: '',
        origin: ''
      },
    },
  };
}

export function createBasicStoreModule(
  initialState: Partial<AppState<BaseEntityValues>> = getDefaultInitialTestStoreState()
): ModuleWithProviders {
  return StoreModule.forRoot(
    appReducers,
    {
      initialState, runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
    }
  );
}

export function createEmptyStoreModule(): ModuleWithProviders {
  return StoreModule.forRoot(
    appReducers, { runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false } }
  );
}

function getStoreSectionForIds(entities: Array<TestStoreEntity | string>, dataOverride?: any) {
  return entities.reduce((sections, entity) => {
    if (typeof entity === 'string') {
      return {
        [entity]: dataOverride || {}
      };
    }
    sections[entity.guid] = dataOverride || entity.data || {};
    return sections;
  }, {});
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
    const entities = entityMap.get(entityConfig);
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

export function createEntityStore(entityMap: Map<EntityCatalogEntityConfig, Array<TestStoreEntity | string>>): ModuleWithProviders {
  const initialState = createEntityStoreState(entityMap);
  return createBasicStoreModule(initialState);
}

export function populateStoreWithTestEndpoint(): EndpointModel {
  const stratosEndpointEntityConfig: EntityCatalogEntityConfig = stratosEntityFactory(endpointEntityType);
  const stratosEndpointEntityKey = entityCatalog.getEntityKey(stratosEndpointEntityConfig);
  const mappedData = {
    entities: {
      [stratosEndpointEntityKey]: {
        [testSCFEndpoint.guid]: testSCFEndpoint
      }
    },
    result: [testSCFEndpoint.guid]
  } as NormalizedResponse;
  const store = TestBed.get(Store);
  store.dispatch(new WrapperRequestActionSuccess(mappedData, {
    type: 'POPULATE_TEST_DATA',
    ...stratosEndpointEntityConfig
  }, 'fetch'));

  return testSCFEndpoint;
}
