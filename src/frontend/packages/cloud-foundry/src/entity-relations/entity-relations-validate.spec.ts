import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { Store } from '@ngrx/store';
import { createBasicStoreModule, createEntityStoreState, type TestStoreEntity } from '@stratosui/store/testing';
import {
  SetInitialParams,
  type APIResponse,
  type APIResource,
  type InternalAppState,
  type IRequestTypeState,
  EntityCatalogTestModuleManualStore,
  TEST_CATALOGUE_ENTITIES,
  entityCatalog,
  type TestEntityCatalog,
  type EntityCatalogEntityConfig,
  type EntityRequestAction,
  WrapperRequestActionSuccess,
  EntityServiceFactory,
} from '@stratosui/store';
import {
  entityRelationMissingQuotaGuid,
  entityRelationMissingQuotaUrl,
  entityRelationMissingSpacesUrl,
  EntityRelationSpecHelper,
} from './entity-relations-spec-helper';
import { GetOrganization } from '../actions/organization.actions';
import { FetchRelationPaginatedAction, FetchRelationSingleAction } from '../actions/relation.actions';
import type { IOrganization } from '../cf-api.types';
import type { CFAppState } from '../cf-app-state';
import { cfEntityFactory } from '../cf-entity-factory';
import { generateCFEntities } from '../cf-entity-generator';
import {
  type CFRequestDataState,
  organizationEntityType,
  quotaDefinitionEntityType,
  routeEntityType,
  spaceEntityType,
} from '../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { EntityTreeRelation } from './entity-relation-tree';
import { validateEntityRelations } from './entity-relations';
import { createEntityRelationKey, createEntityRelationPaginationKey } from './entity-relations.types';
describe('Entity Relations - validate -', () => {

  const helper = new EntityRelationSpecHelper();

  const cfGuid = 'validateEntityRelations-cf';
  const orgGuid = 'validateEntityRelations-org';
  const spaceGuid = 'validateEntityRelations-space';

  // let store: CFAppState;
  let allEntities: CFRequestDataState;
  let apiResponse: APIResponse;
  let newEntities: IRequestTypeState;

  // Entity keys computed lazily after catalog is initialized
  let orgEntityKey: string;
  let spaceEntityKey: string;
  let quotaEntityKey: string;

  // Suppress entity catalog warnings for these tests
  // The warnings occur because EntityCatalogTestModuleManualStore clears and re-registers
  // the catalog after entity keys are computed, causing temporary lookup failures
  beforeAll(() => {
    const originalWarn = console.warn;
    vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      // Suppress only the entity catalog warnings
      const firstArg = args[0];
      if (typeof firstArg === 'string' && firstArg.includes('Missing catalog entity:')) {
        return;
      }
      // Allow other warnings through
      originalWarn.apply(console, args);
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  function initEntityCatalog() {
    // Clear and register CF entities
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();
    generateCFEntities().forEach(entity => {
      entityCatalog.register(entity);
    });

    // Compute entity keys after catalog is populated
    orgEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, organizationEntityType);
    spaceEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, spaceEntityType);
    quotaEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, quotaDefinitionEntityType);
  }

  function setup(store: Partial<CFAppState>) {
    TestBed.configureTestingModule({
      imports: [
        {
          ngModule: EntityCatalogTestModuleManualStore,
          providers: [
        EntityServiceFactory,
            { provide: TEST_CATALOGUE_ENTITIES, useValue: generateCFEntities() }
          ]
        },
        createBasicStoreModule(store),
      ],
    });
  }
  function noOp(iStore: Store, includeRelations: string[]): Promise<void> {
    return new Promise<void>((done) => {
      const dispatchSpy = vi.spyOn(iStore, 'dispatch').mockImplementation(vi.fn() as any);
      const res = validateEntityRelations({
        cfGuid,
        action: new GetOrganization(orgGuid, cfGuid, includeRelations, true),
        allEntities,
        allPagination: {},
        apiResponse,
        parentEntities: [orgGuid],
        newEntities,
        populateMissing: true,
        store: iStore,
      });
      expect(res.started).toBeFalsy();

      res.completed
        .then(completedRes => {
          expect(iStore.dispatch).toHaveBeenCalledTimes(0);
          expect(dispatchSpy.mock.calls.length).toBe(0);

          if (apiResponse) {
            expect(completedRes).toBeTruthy();
          } else {
            expect(completedRes).toBeFalsy();
          }
        })
        .catch(err => {
          throw err;
        })
        .finally(done);
    });
  }

  function testEverythingMissingNothingRequired(): Promise<void> {
    return new Promise<void>((done) => {
      inject([Store], (iStore: Store) => {
        noOp(iStore, []).then(done);
      })();
    });
  }

  function testListMissingListRequired(): Promise<void> {
    return new Promise<void>((done) => {
      const getOrgAction = new GetOrganization(orgGuid, cfGuid, [createEntityRelationKey(organizationEntityType, spaceEntityType)], true);

      const childSpaceToOrgRelation = new EntityTreeRelation(cfEntityFactory(spaceEntityType), true, 'spaces', 'entity.spaces', []);
      const parentOrgToSpaceRelation = new EntityTreeRelation(getOrgAction.entity[0], true, null, '', [childSpaceToOrgRelation]);

      const getSpacesAction = new FetchRelationPaginatedAction(
        cfGuid,
        orgGuid,
        parentOrgToSpaceRelation,
        childSpaceToOrgRelation,
        getOrgAction.includeRelations,
        createEntityRelationPaginationKey(organizationEntityType, orgGuid) + '-relation',
        true,
        entityRelationMissingSpacesUrl,
      );
      const setSpacesParamsActions = new SetInitialParams(
        getSpacesAction,
        getSpacesAction.paginationKey,
        getSpacesAction.initialParams,
        true,
      );

      inject([Store], (iStore: Store) => {
        const dispatchSpy = vi.spyOn(iStore, 'dispatch').mockImplementation(vi.fn() as any);

        const res = validateEntityRelations({
          cfGuid,
          action: getOrgAction,
          allEntities,
          allPagination: {},
          apiResponse,
          parentEntities: [orgGuid],
          newEntities,
          populateMissing: true,
          store: iStore,
        });
        expect(res.started).toBeTruthy();

        expect(iStore.dispatch).toHaveBeenCalledTimes(2);
        expect(dispatchSpy.mock.calls.length).toBe(2);
        expect(dispatchSpy.mock.calls[0][0]).toEqual(setSpacesParamsActions);
        expect(dispatchSpy.mock.calls[1][0]).toEqual(getSpacesAction);
        done();
      })();
    });
  }

  function testListExistsListRequired(): Promise<void> {
    return new Promise<void>((done) => {
      inject([Store], (iStore: Store) => {
        noOp(iStore, [createEntityRelationKey(organizationEntityType, spaceEntityType)]).then(done);
      })();
    });
  }

  function testListExistsListNotRequired(): Promise<void> {
    return new Promise<void>((done) => {
      inject([Store], (iStore: Store) => {
        noOp(iStore, []).then(done);
      })();
    });
  }

  function testEntityMissingEntityRequired(): Promise<void> {
    return new Promise<void>((done) => {
      const getOrgAction = new GetOrganization(
        orgGuid,
        cfGuid,
        [createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType)],
        true);

      const childQuotaToOrgRelation = new EntityTreeRelation(
        cfEntityFactory(quotaDefinitionEntityType),
        false,
        'quota_definition',
        'entity.quota_definition',
        []);
      const parentOrgToSpaceRelation = new EntityTreeRelation(getOrgAction.entity[0], true, null, '', [childQuotaToOrgRelation]);

      const getQuotaAction = new FetchRelationSingleAction(
        cfGuid,
        orgGuid,
        parentOrgToSpaceRelation,
        entityRelationMissingQuotaGuid,
        childQuotaToOrgRelation,
        getOrgAction.includeRelations,
        true,
        entityRelationMissingQuotaUrl,
      );

      inject([Store], (iStore: Store) => {
        const dispatchSpy = vi.spyOn(iStore, 'dispatch').mockImplementation(vi.fn() as any);

        const res = validateEntityRelations({
          cfGuid,
          action: getOrgAction,
          allEntities,
          allPagination: {},
          apiResponse,
          parentEntities: [orgGuid],
          newEntities,
          populateMissing: true,
          store: iStore,
        });

        expect(iStore.dispatch).toHaveBeenCalledTimes(1);
        expect(dispatchSpy.mock.calls.length).toBe(1);
        expect(dispatchSpy.mock.calls[0][0]).toEqual(getQuotaAction);
        done();

      })();
    });
  }

  describe('validate from store - ', () => {

    function createBasicStore() {
      // Initialize catalog before creating entity store
      initEntityCatalog();

      const entityMap = new Map<EntityCatalogEntityConfig, Array<TestStoreEntity>>([
        [
          cfEntityFactory(organizationEntityType),
          [{
            guid: orgGuid,
            data: helper.createEmptyOrg(orgGuid, 'org-name'),
          }],
        ],
        [
          cfEntityFactory(spaceEntityType),
          [],
        ],
        [
          cfEntityFactory(routeEntityType),
          [],
        ]
      ]);
      return createEntityStoreState(entityMap) as Partial<CFAppState>;
    }

    function advancedSetup(mapStore: (store: Partial<CFAppState>) => Partial<CFAppState> = mStore => mStore) {
      const store = mapStore(createBasicStore());
      setup(store);

      // Recompute entity keys after setup() clears and re-registers catalog
      orgEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, organizationEntityType);
      spaceEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, spaceEntityType);
      quotaEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, quotaDefinitionEntityType);

      allEntities = store.requestData;
      newEntities = null;
      apiResponse = null;
    }

    it('Everything missing, nothing required', () => {
      advancedSetup();
      return testEverythingMissingNothingRequired();
    });

    it('List missing, list required', () => {
      advancedSetup();
      return testListMissingListRequired();
    });

    it('List exists, list required', () => {
      advancedSetup(store => {
        const requestData = store.requestData as Record<string, Record<string, APIResource<IOrganization>>>;
        requestData[orgEntityKey][orgGuid].entity.spaces = [
          helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid),
        ];
        return store;
      });
      return testListExistsListRequired();
    });

    it('List exists, list not required', () => {
      advancedSetup(store => {
        const requestData = store.requestData as Record<string, Record<string, APIResource<IOrganization>>>;
        requestData[orgEntityKey][orgGuid].entity.spaces = [
          helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid),
        ];
        return store;
      });
      return testListExistsListNotRequired();
    });

    it('Entity Missing, entity required', () => {
      advancedSetup();
      return testEntityMissingEntityRequired();
    });

    it('child has missing required relation', () => {
      const space = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      space.entity.routes_url = 'routes_url';

      advancedSetup(store => {
        const requestData = store.requestData as Record<string, Record<string, APIResource<IOrganization>>>;
        requestData[orgEntityKey][orgGuid].entity.spaces = [space];
        return store;
      });

      const getOrgAction = new GetOrganization(
        orgGuid,
        cfGuid,
        [
          createEntityRelationKey(organizationEntityType, spaceEntityType),
          createEntityRelationKey(spaceEntityType, routeEntityType),
        ],
        true);

      const childRoutesToSpaceRelation = new EntityTreeRelation(
        cfEntityFactory(routeEntityType),
        true,
        'routes',
        'entity.routes',
        []);

      const childSpaceToOrgRelation = new EntityTreeRelation(cfEntityFactory(spaceEntityType), true, 'spaces', 'entity.spaces', [
        childRoutesToSpaceRelation,
    ]);

      const getSpaceRoutesAction = new FetchRelationPaginatedAction(
        cfGuid,
        spaceGuid,
        childSpaceToOrgRelation,
        childRoutesToSpaceRelation,
        getOrgAction.includeRelations,
        createEntityRelationPaginationKey(spaceEntityType, spaceGuid) + '-relation',
        true,
        space.entity.routes_url,
      );
      const setSpaceRoutesParamsActions = new SetInitialParams(
        getSpaceRoutesAction,
        getSpaceRoutesAction.paginationKey,
        getSpaceRoutesAction.initialParams,
        true,
      );

      return new Promise<void>((done) => {
        inject([Store], (iStore: Store) => {
          const dispatchSpy = vi.spyOn(iStore, 'dispatch').mockImplementation(vi.fn() as any);

          const res = validateEntityRelations({
            cfGuid,
            action: getOrgAction,
            allEntities,
            allPagination: {},
            apiResponse,
            parentEntities: [orgGuid],
            newEntities,
            populateMissing: true,
            store: iStore,
          });
          expect(res.started).toBeTruthy();

          expect(iStore.dispatch).toHaveBeenCalledTimes(2);
          expect(dispatchSpy.mock.calls.length).toBe(2);
          expect(dispatchSpy.mock.calls[0][0]).toEqual(setSpaceRoutesParamsActions);
          expect(dispatchSpy.mock.calls[1][0]).toEqual(getSpaceRoutesAction);
          done();

        })();
      });
    });

    it('Missing entities has required relations but not allowed to populate missing', () => {
      const populateMissing = false;
      const getOrgAction = new GetOrganization(
        orgGuid,
        cfGuid,
        [createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType)],
        populateMissing);
      advancedSetup();
      return new Promise<void>((done) => {
        inject([Store], (iStore: Store) => {
          const dispatchSpy = vi.spyOn(iStore, 'dispatch').mockImplementation(vi.fn() as any);

          const res = validateEntityRelations({
            cfGuid,
            action: getOrgAction,
            allEntities,
            allPagination: {},
            apiResponse,
            parentEntities: [orgGuid],
            newEntities,
            populateMissing,
            store: iStore,
          });

          expect(res.started).toBeFalsy();
          res.completed.then(completedRes => {
            expect(completedRes).toBeFalsy();
            expect(iStore.dispatch).toHaveBeenCalledTimes(0);
            expect(dispatchSpy.mock.calls.length).toBe(0);
            done();
          });

        })();
      });
    });

    it('Basic no-op', () => {
      const getOrgAction = new GetOrganization(
        orgGuid,
        cfGuid,
        [createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType)],
        true);
      advancedSetup();
      return new Promise<void>((done) => {
        inject([Store], (iStore: Store) => {
          const dispatchSpy = vi.spyOn(iStore, 'dispatch').mockImplementation(vi.fn() as any);

          const res = validateEntityRelations({
            cfGuid,
            action: getOrgAction,
            allEntities,
            allPagination: {},
            apiResponse,
            parentEntities: [],
            newEntities,
            populateMissing: true,
            store: iStore,
          });

          expect(res.started).toBeFalsy();
          res.completed.then(completedRes => {
            expect(completedRes).toBeFalsy();
            expect(iStore.dispatch).toHaveBeenCalledTimes(0);
            expect(dispatchSpy.mock.calls.length).toBe(0);
            done();
          });

        })();
      });
    });

    it('Have missing relation in store, associate it with parent', () => {
      const quotaDefinition = helper.createEmptyQuotaDefinition('quota_guid', 'missing but in store');
      advancedSetup(store => {
        const requestData = store.requestData as Record<string, Record<string, APIResource<IOrganization>>>;
        requestData[quotaEntityKey] = {
          [quotaDefinition.metadata.guid]: quotaDefinition,
        };
        const org = requestData[orgEntityKey][orgGuid];
        org.entity.quota_definition_guid = quotaDefinition.metadata.guid;
        return store;
      });

      const getOrgAction = new GetOrganization(
        orgGuid,
        cfGuid,
        [createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType)],
        true);

      const associateAPIAction: EntityRequestAction = {
        endpointGuid: getOrgAction.endpointGuid,
        entity: getOrgAction.entity[0],
        guid: orgGuid,
        entityType: organizationEntityType,
        type: '[Entity] Associate with parent',
        endpointType: CF_ENDPOINT_TYPE,
      };
      // Add for easier debugging in tests
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (associateAPIAction as any)['childEntityKey'] = quotaEntityKey;

      const associateAction = new WrapperRequestActionSuccess({
        entities: {
          [orgEntityKey]: { [orgGuid]: { entity: { quota_definition: quotaDefinition.metadata.guid }, } }
        },
        result: [orgGuid]
      }, associateAPIAction, 'fetch', 1, 1);
      return new Promise<void>((done) => {
        inject([Store], (iStore: Store) => {
          const dispatchSpy = vi.spyOn(iStore, 'dispatch').mockImplementation(vi.fn() as any);

          const res = validateEntityRelations({
            cfGuid,
            action: getOrgAction,
            allEntities,
            allPagination: {},
            apiResponse,
            parentEntities: [orgGuid],
            newEntities,
            populateMissing: true,
            store: iStore,
          });
          expect(res.started).toBeTruthy();

          expect(iStore.dispatch).toHaveBeenCalledTimes(1);
          expect(dispatchSpy.mock.calls.length).toBe(1);
          expect(dispatchSpy.mock.calls[0][0]).toEqual(associateAction);
          done();

        })();
      });
    });
  });

  describe('validate from api response', () => {

    beforeEach(() => {
      // Initialize catalog before creating entity store
      initEntityCatalog();

      const entityMap = new Map<EntityCatalogEntityConfig, Array<TestStoreEntity>>([
        [
          cfEntityFactory(organizationEntityType),
          [],
        ], [
          cfEntityFactory(spaceEntityType),
          [],
        ]
      ]);
      const store = createEntityStoreState(entityMap) as Partial<CFAppState>;
      setup(store);

      // Recompute entity keys after setup() clears and re-registers catalog
      orgEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, organizationEntityType);
      spaceEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, spaceEntityType);
      quotaEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, quotaDefinitionEntityType);

      apiResponse = {
        response: {
          entities: {
            [orgEntityKey]: {
              [orgGuid]: helper.createEmptyOrg(orgGuid, 'org-name'),
            }
          },
          result: [orgGuid]
        },
        totalPages: 1,
        totalResults: 1,
      };
      newEntities = apiResponse.response.entities;
    });

    it('Everything missing, nothing required', () => {
      return testEverythingMissingNothingRequired();
    });

    it('List missing, list required', () => {
      return testListMissingListRequired();
    });

    it('List exists, list required', () => {
      const newSpace = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      (apiResponse.response.entities[orgEntityKey][orgGuid] as APIResource<IOrganization>).entity.spaces = [newSpace];
      apiResponse.response.entities[spaceEntityKey] = { [spaceGuid]: newSpace };
      return testListExistsListRequired();
    });

    it('List exists, list not required', () => {
      const newSpace = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      (apiResponse.response.entities[orgEntityKey][orgGuid] as APIResource<IOrganization>).entity.spaces = [newSpace];
      apiResponse.response.entities[spaceEntityKey] = { [spaceGuid]: newSpace };
      return testListExistsListNotRequired();
    });

    it('Entity Missing, entity required', () => {
      return testEntityMissingEntityRequired();
    });

  });

});
