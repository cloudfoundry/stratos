import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import { CF_ENDPOINT_TYPE } from '../../../../cloud-foundry/cf-types';
import { GetOrganization } from '../../../../cloud-foundry/src/actions/organization.actions';
import {
  FetchRelationPaginatedAction,
  FetchRelationSingleAction,
} from '../../../../cloud-foundry/src/actions/relation.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import {
  cfEntityFactory,
  organizationEntityType,
  quotaDefinitionEntityType,
  routeEntityType,
  spaceEntityType,
} from '../../../../cloud-foundry/src/cf-entity-factory';
import { generateCFEntities } from '../../../../cloud-foundry/src/cf-entity-generator';
import { CFRequestDataState } from '../../../../cloud-foundry/src/cf-entity-types';
import { EffectsFeatureTestModule, TEST_CATALOGUE_ENTITIES } from '../../../../core/src/core/entity-catalogue.module';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../../../core/src/core/entity-catalogue/entity-catalogue.types';
import {
  createBasicStoreModule,
  createEntityStoreState,
  TestStoreEntity,
} from '../../../../core/test-framework/store-test-helper';
import { SetInitialParams } from '../../actions/pagination.actions';
import { APIResponse } from '../../actions/request.actions';
import { IRequestTypeState } from '../../app-state';
import { IRequestAction, RequestEntityLocation, WrapperRequestActionSuccess } from '../../types/request.types';
import { EntityTreeRelation } from './entity-relation-tree';
import { validateEntityRelations } from './entity-relations';
import {
  entityRelationMissingQuotaGuid,
  entityRelationMissingQuotaUrl,
  entityRelationMissingSpacesUrl,
  EntityRelationSpecHelper,
} from './entity-relations-spec-helper';
import { createEntityRelationKey, createEntityRelationPaginationKey } from './entity-relations.types';

fdescribe('Entity Relations - validate -', () => {

  const helper = new EntityRelationSpecHelper();

  const cfGuid = 'validateEntityRelations-cf';
  const orgGuid = 'validateEntityRelations-org';
  const spaceGuid = 'validateEntityRelations-space';

  // let store: CFAppState;
  let allEntities: CFRequestDataState;
  let apiResponse: APIResponse;
  let newEntities: IRequestTypeState;

  const orgEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, organizationEntityType);
  const spaceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, spaceEntityType);
  const quotaEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, quotaDefinitionEntityType);

  function setup(store) {
    TestBed.configureTestingModule({
      imports: [
        {
          ngModule: EffectsFeatureTestModule,
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

    expect(res.completed.then(completedRes => {
      if (apiResponse) {
        expect(completedRes).toBeTruthy();
      } else {
        expect(completedRes).toBeFalsy();
      }
      done();
    }));

    expect(iStore.dispatch).toHaveBeenCalledTimes(0);
    expect(dispatchSpy.calls.count()).toBe(0);
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

      expect(iStore.dispatch).toHaveBeenCalledTimes(1);
      expect(dispatchSpy.calls.count()).toBe(1);
      expect(dispatchSpy.calls.all()[0].args[0]).toEqual(getQuotaAction);
      done();

    })();
  }

  fdescribe('validate from store - ', () => {

    function createBasicStore() {
      const entityMap = new Map<EntityCatalogueEntityConfig, Array<TestStoreEntity>>([
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
        ]
      ]);
      return createEntityStoreState(entityMap) as Partial<CFAppState>;
    }

    function advancedSetup(mapStore: (store) => Partial<CFAppState> = mStore => mStore) {
      const store = mapStore(createBasicStore());
      console.log(store);
      setup(store);
      // store = getInitialTestStoreState();
      // store.requestData[orgEntity.entityKey][orgGuid] = helper.createEmptyOrg(orgGuid, 'org-name');
      // store.request[orgEntity.entityKey][orgGuid] = getDefaultRequestState();
      // TestBed.configureTestingModule({
      //   imports: [
      //     createBasicStoreModule(store),
      //   ]
      // });
      allEntities = store.requestData;
      newEntities = null;
      apiResponse = null;
    }

    it('Everything missing, nothing required', (done) => {
      advancedSetup();
      testEverythingMissingNothingRequired(done);
    });

    fit('List missing, list required', (done) => {
      advancedSetup();
      testListMissingListRequired(done);
    });

    it('List exists, list required', (done) => {
      advancedSetup(store => {
        store.requestData[orgEntity.entityKey][orgGuid].entity.spaces = [
          helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid)
        ];
        return store;
      });
      testListExistsListRequired(done);
    });

    it('List exists, list not required', (done) => {
      advancedSetup(store => {
        store.requestData[orgEntity.entityKey][orgGuid].entity.spaces = [
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
        store.requestData[orgEntity.entityKey][orgGuid].entity.spaces = [space];
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
      // const parentOrgToSpaceRelation = new EntityTreeRelation(getOrgAction.entity[0], true, null, '', [childSpaceToOrgRelation]);

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
        store.requestData[quotaEntity.entityKey] = {
          [quotaDefinition.metadata.guid]: quotaDefinition
        };
        const org = store.requestData[orgEntity.entityKey][orgGuid];
        org.entity.quota_definition_guid = quotaDefinition.metadata.guid;
        return store;
      });

      const getOrgAction = new GetOrganization(
        orgGuid,
        cfGuid,
        [createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType)],
        true);

      const associateAction = new WrapperRequestActionSuccess({
        entities: {
          [orgEntity.entityKey]: { [orgGuid]: { entity: { quota_definition: quotaDefinition.metadata.guid }, } }
        },
        result: [orgGuid]
      }, {
        endpointGuid: getOrgAction.endpointGuid,
        entity: getOrgAction.entity[0],
        entityLocation: RequestEntityLocation.OBJECT,
        guid: orgGuid,
        entityType: organizationEntityType,
        type: '[Entity] Associate with parent',
        childEntityKey: quotaEntity.entityKey,
        endpointType: CF_ENDPOINT_TYPE
      } as IRequestAction, 'fetch', 1, 1);

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

        expect(iStore.dispatch).toHaveBeenCalledTimes(1);
        expect(dispatchSpy.calls.count()).toBe(1);
        expect(dispatchSpy.calls.all()[0].args[0]).toEqual(associateAction);
        done();

      })();

    });
  });

  describe('validate from api response', () => {

    beforeEach(() => {
      // store = getInitialTestStoreState();

      // store.request[orgEntity.entityKey][orgGuid] = getDefaultRequestState();
      // TestBed.configureTestingModule({
      //   imports: [
      //     createBasicStoreModule(store),
      //   ]
      // });
      // allEntities = store.requestData;

      const entityMap = new Map<EntityCatalogueEntityConfig, Array<TestStoreEntity>>([
        [
          cfEntityFactory(organizationEntityType),
          []
        ]
      ]);
      const store = createEntityStoreState(entityMap) as Partial<CFAppState>;
      setup(store);

      apiResponse = {
        response: {
          entities: {
            [orgEntity.entityKey]: {
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
      apiResponse.response.entities[orgEntity.entityKey][orgGuid].entity.spaces = [newSpace];
      apiResponse.response.entities[spaceEntity.entityKey] = { [spaceGuid]: newSpace };
      testListExistsListRequired(done);
    });

    it('List exists, list not required', (done) => {
      const newSpace = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      apiResponse.response.entities[orgEntity.entityKey][orgGuid].entity.spaces = [newSpace];
      apiResponse.response.entities[spaceEntity.entityKey] = { [spaceGuid]: newSpace };
      testListExistsListNotRequired(done);
    });

    it('Entity Missing, entity required', (done) => {
      testEntityMissingEntityRequired(done);
    });

  });

});
