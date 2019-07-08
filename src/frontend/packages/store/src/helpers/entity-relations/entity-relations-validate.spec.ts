import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import {
  cfEntityFactory,
  organizationEntityType,
  quotaDefinitionEntityType,
  routeEntityType,
  spaceEntityType,
} from '../../../../cloud-foundry/src/cf-entity-factory';
import { createBasicStoreModule, getInitialTestStoreState } from '../../../../core/test-framework/store-test-helper';
import { GetOrganization } from '../../../../cloud-foundry/src/actions/organization.actions';
import { SetInitialParams } from '../../actions/pagination.actions';
import { FetchRelationPaginatedAction, FetchRelationSingleAction } from '../../../../cloud-foundry/src/actions/relation.actions';
import { APIResponse } from '../../actions/request.actions';
import { CFAppState, IRequestTypeState } from '../../app-state';
import { getDefaultRequestState } from '../../reducers/api-request-reducer/types';
import { BaseRequestDataState } from '../../types/entity.types';
import { IRequestAction, RequestEntityLocation, WrapperRequestActionSuccess } from '../../types/request.types';
import { EntityTreeRelation } from './entity-relation-tree';
import { validateEntityRelations } from './entity-relations';
import {
  entityRelationMissingQuotaGuid,
  entityRelationMissingQuotaUrl,
  entityRelationMissingSpacesUrl,
  EntityRelationSpecHelper,
} from './entity-relations.spec';
import { createEntityRelationKey, createEntityRelationPaginationKey } from './entity-relations.types';

describe('Entity Relations - validate', () => {

  const helper = new EntityRelationSpecHelper();

  const pagKey = 'validateEntityRelations-pagKey';
  const cfGuid = 'validateEntityRelations-cf';
  const orgGuid = 'validateEntityRelations-org';
  const spaceGuid = 'validateEntityRelations-space';

  let store: CFAppState;
  let allEntities: BaseRequestDataState;
  let apiResponse: APIResponse;
  let newEntities: IRequestTypeState;

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
      {
        entityType: spaceEntityType,
        endpointType: 'cf'
      },
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

  describe('validate from store - ', () => {
    beforeEach(() => {
      store = getInitialTestStoreState();
      store.requestData[organizationEntityType][orgGuid] = helper.createEmptyOrg(orgGuid, 'org-name');
      store.request[organizationEntityType][orgGuid] = getDefaultRequestState();
      TestBed.configureTestingModule({
        imports: [
          createBasicStoreModule(store),
        ]
      });
      allEntities = store.requestData;
      newEntities = null;
      apiResponse = null;
    });

    it('Everything missing, nothing required', (done) => {
      testEverythingMissingNothingRequired(done);
    });

    it('List missing, list required', (done) => {
      testListMissingListRequired(done);
    });

    it('List exists, list required', (done) => {
      store.requestData[organizationEntityType][orgGuid].entity.spaces = [
        helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid)
      ];
      testListExistsListRequired(done);
    });

    it('List exists, list not required', (done) => {
      store.requestData[organizationEntityType][orgGuid].entity.spaces = [
        helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid)
      ];
      testListExistsListNotRequired(done);
    });

    it('Entity Missing, entity required', (done) => {
      testEntityMissingEntityRequired(done);
    });

    it('child has missing required relation', (done) => {
      const space = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      space.entity.routes_url = 'routes_url';
      store.requestData[organizationEntityType][orgGuid].entity.spaces = [space];

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
      const parentOrgToSpaceRelation = new EntityTreeRelation(getOrgAction.entity[0], true, null, '', [childSpaceToOrgRelation]);

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
        {
          entityType: routeEntityType,
          endpointType: 'cf'
        },
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
      store.requestData[quotaDefinitionEntityType] = {
        [quotaDefinition.metadata.guid]: quotaDefinition
      };
      const org = store.requestData[organizationEntityType][orgGuid];
      org.entity.quota_definition_guid = quotaDefinition.metadata.guid;


      const getOrgAction = new GetOrganization(
        orgGuid,
        cfGuid,
        [createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType)],
        true);

      const associateAction = new WrapperRequestActionSuccess({
        entities: {
          [organizationEntityType]: { [orgGuid]: { entity: { quota_definition: quotaDefinition.metadata.guid }, } }
        },
        result: [org.metadata.guid]
      }, {
        endpointGuid: getOrgAction.endpointGuid,
        entity: getOrgAction.entity[0],
        entityLocation: RequestEntityLocation.OBJECT,
        guid: orgGuid,
        entityType: organizationEntityType,
        type: '[Entity] Associate with parent',
        childEntityKey: 'quota_definition',
        endpointType: 'cf'
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
      store = getInitialTestStoreState();

      store.request[organizationEntityType][orgGuid] = getDefaultRequestState();
      TestBed.configureTestingModule({
        imports: [
          createBasicStoreModule(store),
        ]
      });
      allEntities = store.requestData;
      apiResponse = {
        response: {
          entities: {
            [organizationEntityType]: {
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
      apiResponse.response.entities[organizationEntityType][orgGuid].entity.spaces = [newSpace];
      apiResponse.response.entities[spaceEntityType] = { [spaceGuid]: newSpace };
      testListExistsListRequired(done);
    });

    it('List exists, list not required', (done) => {
      const newSpace = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      apiResponse.response.entities[organizationEntityType][orgGuid].entity.spaces = [newSpace];
      apiResponse.response.entities[spaceEntityType] = { [spaceGuid]: newSpace };
      testListExistsListNotRequired(done);
    });

    it('Entity Missing, entity required', (done) => {
      testEntityMissingEntityRequired(done);
    });

  });

});
