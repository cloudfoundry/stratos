import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { createBasicStoreModule, createEntityStoreState, TestStoreEntity } from '@stratosui/store/testing';

import { environment } from '../../../core/src/environments/environment';
import { SetInitialParams } from '../../../store/src/actions/pagination.actions';
import { APIResponse } from '../../../store/src/actions/request.actions';
import { InternalAppState, IRequestTypeState } from '../../../store/src/app-state';
import { EntityCatalogTestModuleManualStore, TEST_CATALOGUE_ENTITIES } from '../../../store/src/entity-catalog-test.module';
import { entityCatalog } from '../../../store/src/entity-catalog/entity-catalog';
import { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import { EntityRequestAction, WrapperRequestActionSuccess } from '../../../store/src/types/request.types';
import {
  entityRelationMissingQuotaGuid,
  entityRelationMissingQuotaUrl,
  entityRelationMissingSpacesUrl,
  EntityRelationSpecHelper,
} from '../../test-framework/entity-relations-spec-helper';
import { GetOrganization } from '../actions/organization.actions';
import { FetchRelationPaginatedAction, FetchRelationSingleAction } from '../actions/relation.actions';
import { CFAppState } from '../cf-app-state';
import { cfEntityFactory } from '../cf-entity-factory';
import { generateCFEntities } from '../cf-entity-generator';
import {
  CFRequestDataState,
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

  const orgEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, organizationEntityType);
  const spaceEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, spaceEntityType);
  const quotaEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, quotaDefinitionEntityType);

  function setup(store) {
    TestBed.configureTestingModule({
      imports: [
        {
          ngModule: EntityCatalogTestModuleManualStore,
          providers: [
            { provide: TEST_CATALOGUE_ENTITIES, useValue: generateCFEntities() }
          ]
        },
        createBasicStoreModule(store),
      ],
    });
  }


  function noOp(iStore: Store<CFAppState>, includeRelations: string[], done: () => void) {
    const dispatchSpy = spyOn(iStore, 'dispatch').and.callThrough();
    const res = validateEntityRelations({
      cfGuid,
      action: new GetOrganization(orgGuid, cfGuid, includeRelations, true),
      allEntities,
      allPagination: {},
      apiResponse,
      parentEntities: [orgGuid],
      newEntities,
      populateMissing: true,
      store: iStore
    });
    expect(res.started).toBeFalsy();

    res.completed
      .then(completedRes => {
        expect(iStore.dispatch).toHaveBeenCalledTimes(0);
        expect(dispatchSpy.calls.count()).toBe(0);

        if (apiResponse) {
          expect(completedRes).toBeTruthy();
        } else {
          expect(completedRes).toBeFalsy();
        }
      })
      .catch(err => fail(err))
      .finally(done);
  }

  function testEverythingMissingNothingRequired(done: () => void) {
    inject([Store], (iStore: Store<CFAppState>) => {
      noOp(iStore, [], done);
    })();
  }

  function testListMissingListRequired(done: () => void) {
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
      entityRelationMissingSpacesUrl
    );
    const setSpacesParamsActions = new SetInitialParams(
      getSpacesAction,
      getSpacesAction.paginationKey,
      getSpacesAction.initialParams,
      true
    );

    inject([Store], (iStore: Store<CFAppState>) => {
      const dispatchSpy = spyOn(iStore, 'dispatch').and.callThrough();

      const res = validateEntityRelations({
        cfGuid,
        action: getOrgAction,
        allEntities,
        allPagination: {},
        apiResponse,
        parentEntities: [orgGuid],
        newEntities,
        populateMissing: true,
        store: iStore
      });
      expect(res.started).toBeTruthy();

      expect(iStore.dispatch).toHaveBeenCalledTimes(2);
      expect(dispatchSpy.calls.count()).toBe(2);
      expect(dispatchSpy.calls.all()[0].args[0]).toEqual(setSpacesParamsActions);
      expect(dispatchSpy.calls.all()[1].args[0]).toEqual(getSpacesAction);
      done();
    })();
  }

  function testListExistsListRequired(done: () => void) {
    inject([Store], (iStore: Store<CFAppState>) => {
      noOp(iStore, [createEntityRelationKey(organizationEntityType, spaceEntityType)], done);
    })();
  }

  function testListExistsListNotRequired(done: () => void) {
    inject([Store], (iStore: Store<CFAppState>) => {
      noOp(iStore, [], done);
    })();
  }

  function testEntityMissingEntityRequired(done: () => void) {
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
      entityRelationMissingQuotaUrl
    );

    inject([Store], (iStore: Store<InternalAppState>) => {
      const dispatchSpy = spyOn(iStore, 'dispatch').and.callThrough();

      const res = validateEntityRelations({
        cfGuid,
        action: getOrgAction,
        allEntities,
        allPagination: {},
        apiResponse,
        parentEntities: [orgGuid],
        newEntities,
        populateMissing: true,
        store: iStore
      });

      expect(iStore.dispatch).toHaveBeenCalledTimes(1);
      expect(dispatchSpy.calls.count()).toBe(1);
      expect(dispatchSpy.calls.all()[0].args[0]).toEqual(getQuotaAction);
      done();

    })();
  }

  describe('validate from store - ', () => {

    function createBasicStore() {
      const entityMap = new Map<EntityCatalogEntityConfig, Array<TestStoreEntity>>([
        [
          cfEntityFactory(organizationEntityType),
          [{
            guid: orgGuid,
            data: helper.createEmptyOrg(orgGuid, 'org-name')
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

    function advancedSetup(mapStore: (store) => Partial<CFAppState> = mStore => mStore) {
      const store = mapStore(createBasicStore());
      setup(store);
      allEntities = store.requestData;
      newEntities = null;
      apiResponse = null;
    }

    it('Everything missing, nothing required', (done) => {
      advancedSetup();
      testEverythingMissingNothingRequired(done);
    });

    it('List missing, list required', (done) => {
      advancedSetup();
      testListMissingListRequired(done);
    });

    it('List exists, list required', (done) => {
      advancedSetup(store => {
        store.requestData[orgEntityKey][orgGuid].entity.spaces = [
          helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid)
        ];
        return store;
      });
      testListExistsListRequired(done);
    });

    it('List exists, list not required', (done) => {
      advancedSetup(store => {
        store.requestData[orgEntityKey][orgGuid].entity.spaces = [
          helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid)
        ];
        return store;
      });
      testListExistsListNotRequired(done);
    });

    it('Entity Missing, entity required', (done) => {
      advancedSetup();
      testEntityMissingEntityRequired(done);
    });

    it('child has missing required relation', (done) => {
      const space = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      space.entity.routes_url = 'routes_url';

      advancedSetup(store => {
        store.requestData[orgEntityKey][orgGuid].entity.spaces = [space];
        return store;
      });

      const getOrgAction = new GetOrganization(
        orgGuid,
        cfGuid,
        [
          createEntityRelationKey(organizationEntityType, spaceEntityType),
          createEntityRelationKey(spaceEntityType, routeEntityType)
        ],
        true);

      const childRoutesToSpaceRelation = new EntityTreeRelation(
        cfEntityFactory(routeEntityType),
        true,
        'routes',
        'entity.routes',
        []);

      const childSpaceToOrgRelation = new EntityTreeRelation(cfEntityFactory(spaceEntityType), true, 'spaces', 'entity.spaces', [
        childRoutesToSpaceRelation
      ]);

      const getSpaceRoutesAction = new FetchRelationPaginatedAction(
        cfGuid,
        spaceGuid,
        childSpaceToOrgRelation,
        childRoutesToSpaceRelation,
        getOrgAction.includeRelations,
        createEntityRelationPaginationKey(spaceEntityType, spaceGuid) + '-relation',
        true,
        space.entity.routes_url
      );
      const setSpaceRoutesParamsActions = new SetInitialParams(
        getSpaceRoutesAction,
        getSpaceRoutesAction.paginationKey,
        getSpaceRoutesAction.initialParams,
        true
      );

      inject([Store], (iStore: Store<InternalAppState>) => {
        const dispatchSpy = spyOn(iStore, 'dispatch').and.callThrough();

        const res = validateEntityRelations({
          cfGuid,
          action: getOrgAction,
          allEntities,
          allPagination: {},
          apiResponse,
          parentEntities: [orgGuid],
          newEntities,
          populateMissing: true,
          store: iStore
        });
        expect(res.started).toBeTruthy();

        expect(iStore.dispatch).toHaveBeenCalledTimes(2);
        expect(dispatchSpy.calls.count()).toBe(2);
        expect(dispatchSpy.calls.all()[0].args[0]).toEqual(setSpaceRoutesParamsActions);
        expect(dispatchSpy.calls.all()[1].args[0]).toEqual(getSpaceRoutesAction);
        done();

      })();
    });

    it('Missing entities has required relations but not allowed to populate missing', (done) => {
      const populateMissing = false;
      const getOrgAction = new GetOrganization(
        orgGuid,
        cfGuid,
        [createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType)],
        populateMissing);
      advancedSetup();
      inject([Store], (iStore: Store<CFAppState>) => {
        const dispatchSpy = spyOn(iStore, 'dispatch').and.callThrough();

        const res = validateEntityRelations({
          cfGuid,
          action: getOrgAction,
          allEntities,
          allPagination: {},
          apiResponse,
          parentEntities: [orgGuid],
          newEntities,
          populateMissing,
          store: iStore
        });

        expect(res.started).toBeFalsy();
        expect(res.completed.then(completedRes => {
          expect(completedRes).toBeFalsy();
          done();
        }));

        expect(iStore.dispatch).toHaveBeenCalledTimes(0);
        expect(dispatchSpy.calls.count()).toBe(0);

      })();
    });

    it('Basic no-op', (done) => {
      const getOrgAction = new GetOrganization(
        orgGuid,
        cfGuid,
        [createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType)],
        true);
      advancedSetup();
      inject([Store], (iStore: Store<CFAppState>) => {
        const dispatchSpy = spyOn(iStore, 'dispatch').and.callThrough();

        const res = validateEntityRelations({
          cfGuid,
          action: getOrgAction,
          allEntities,
          allPagination: {},
          apiResponse,
          parentEntities: [],
          newEntities,
          populateMissing: true,
          store: iStore
        });

        expect(res.started).toBeFalsy();
        expect(res.completed.then(completedRes => {
          expect(completedRes).toBeFalsy();
          done();
        }));


        expect(iStore.dispatch).toHaveBeenCalledTimes(0);
        expect(dispatchSpy.calls.count()).toBe(0);
        done();

      })();
    });

    it('Have missing relation in store, associate it with parent', (done) => {
      const quotaDefinition = helper.createEmptyQuotaDefinition('quota_guid', 'missing but in store');


      advancedSetup(store => {
        store.requestData[quotaEntityKey] = {
          [quotaDefinition.metadata.guid]: quotaDefinition
        };
        const org = store.requestData[orgEntityKey][orgGuid];
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
        endpointType: CF_ENDPOINT_TYPE
      };
      if (!environment.production) {
        // Add for easier debugging
        /* tslint:disable-next-line:no-string-literal  */
        associateAPIAction['childEntityKey'] = quotaEntityKey;
      }

      const associateAction = new WrapperRequestActionSuccess({
        entities: {
          [orgEntityKey]: { [orgGuid]: { entity: { quota_definition: quotaDefinition.metadata.guid }, } }
        },
        result: [orgGuid]
      }, associateAPIAction, 'fetch', 1, 1);


      inject([Store], (iStore: Store<InternalAppState>) => {
        const dispatchSpy = spyOn(iStore, 'dispatch').and.callThrough();

        const res = validateEntityRelations({
          cfGuid,
          action: getOrgAction,
          allEntities,
          allPagination: {},
          apiResponse,
          parentEntities: [orgGuid],
          newEntities,
          populateMissing: true,
          store: iStore
        });
        expect(res.started).toBeTruthy();

        expect(iStore.dispatch).toHaveBeenCalledTimes(1);
        expect(dispatchSpy.calls.count()).toBe(1);
        expect(dispatchSpy.calls.all()[0].args[0]).toEqual(associateAction);
        done();

      })();

    });
  });

  describe('validate from api response', () => {

    beforeEach(() => {

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

      apiResponse = {
        response: {
          entities: {
            [orgEntityKey]: {
              [orgGuid]: helper.createEmptyOrg(orgGuid, 'org-name')
            }
          },
          result: [orgGuid]
        },
        totalPages: 1,
        totalResults: 1
      };
      newEntities = apiResponse.response.entities;
    });

    it('Everything missing, nothing required', (done) => {
      testEverythingMissingNothingRequired(done);
    });

    it('List missing, list required', (done) => {
      testListMissingListRequired(done);
    });

    it('List exists, list required', (done) => {
      const newSpace = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      apiResponse.response.entities[orgEntityKey][orgGuid].entity.spaces = [newSpace];
      apiResponse.response.entities[spaceEntityKey] = { [spaceGuid]: newSpace };
      testListExistsListRequired(done);
    });

    it('List exists, list not required', (done) => {
      const newSpace = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      apiResponse.response.entities[orgEntityKey][orgGuid].entity.spaces = [newSpace];
      apiResponse.response.entities[spaceEntityKey] = { [spaceGuid]: newSpace };
      testListExistsListNotRequired(done);
    });

    it('Entity Missing, entity required', (done) => {
      testEntityMissingEntityRequired(done);
    });

  });

});
