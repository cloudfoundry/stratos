import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import { createBasicStoreModule, getInitialTestStoreState } from '../../test-framework/store-test-helper';
import { GetOrganization } from '../actions/organization.actions';
import { SetInitialParams } from '../actions/pagination.actions';
import { FetchRelationPaginatedAction, FetchRelationSingleAction } from '../actions/relation.actions';
import { APIResponse } from '../actions/request.actions';
import { AppState, IRequestTypeState } from '../app-state';
import { getDefaultRequestState } from '../reducers/api-request-reducer/types';
import { IRequestDataState } from '../types/entity.types';
import { entityFactory, organizationSchemaKey, quotaDefinitionSchemaKey, spaceSchemaKey } from './entity-factory';
import { validateEntityRelations } from './entity-relations';
import {
  entityRelationMissingQuotaGuid,
  entityRelationMissingQuotaUrl,
  entityRelationMissingSpacesUrl,
  EntityRelationSpecHelper,
} from './entity-relations.spec';
import { createEntityRelationKey, createEntityRelationPaginationKey, EntityTreeRelation } from './entity-relations.types';

fdescribe('validateEntityRelations - ', () => {

  const helper = new EntityRelationSpecHelper();

  const pagKey = 'validateEntityRelations-pagKey';
  const cfGuid = 'validateEntityRelations-cf';
  const orgGuid = 'validateEntityRelations-org';
  const spaceGuid = 'validateEntityRelations-space';

  let store: AppState;
  let allEntities: IRequestDataState;
  let apiResponse: APIResponse;
  let newEntities: IRequestTypeState;

  function noOp(iStore: Store<AppState>, includeRelations: string[], done: () => void) {
    const res = validateEntityRelations({
      cfGuid,
      action: new GetOrganization(orgGuid, cfGuid, [], true),
      allEntities,
      allPagination: {},
      apiResponse,
      parentEntities: [orgGuid],
      newEntities,
      populateMissing: true,
      store: iStore
    });
    expect(res.started).toBeFalsy();
    if (apiResponse) {
      expect(res.apiResponse).toBeTruthy();
    } else {
      expect(res.apiResponse).toBeFalsy();
    }

    expect(res.completed.then(done));
  }

  function everythingMissingNothingRequired(done: () => void) {
    inject([Store], (iStore: Store<AppState>) => {
      noOp(iStore, [], done);
    })();
  }

  function listMissingListRequired(done: () => void) {
    const getOrgAction = new GetOrganization(orgGuid, cfGuid, [createEntityRelationKey(organizationSchemaKey, spaceSchemaKey)], true);

    const childSpaceToOrgRelation = new EntityTreeRelation(entityFactory(spaceSchemaKey), true, 'spaces', 'entity.spaces', []);
    const parentOrgToSpaceRelation = new EntityTreeRelation(getOrgAction.entity[0], true, null, '', [childSpaceToOrgRelation]);

    const getSpacesAction = new FetchRelationPaginatedAction(
      cfGuid,
      orgGuid,
      parentOrgToSpaceRelation,
      childSpaceToOrgRelation,
      getOrgAction.includeRelations,
      createEntityRelationPaginationKey(organizationSchemaKey, orgGuid) + '-relation',
      true,
      entityRelationMissingSpacesUrl
    );
    const setSpacesParamsActions = new SetInitialParams(
      spaceSchemaKey,
      getSpacesAction.paginationKey,
      getSpacesAction.initialParams,
      true
    );


    inject([Store], (iStore: Store<AppState>) => {
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
      if (apiResponse) {
        expect(res.apiResponse).toBeTruthy();
      } else {
        expect(res.apiResponse).toBeFalsy();
      }

      expect(iStore.dispatch).toHaveBeenCalledTimes(2);
      expect(dispatchSpy.calls.count()).toBe(2);
      expect(dispatchSpy.calls.all()[0].args[0]).toEqual(setSpacesParamsActions);
      expect(dispatchSpy.calls.all()[1].args[0]).toEqual(getSpacesAction);
      done();
    })();
  }

  function listExistsListRequired(done: () => void) {
    inject([Store], (iStore: Store<AppState>) => {
      noOp(iStore, [createEntityRelationKey(organizationSchemaKey, spaceSchemaKey)], done);
    })();
  }

  function listExistsListNotRequired(done: () => void) {
    inject([Store], (iStore: Store<AppState>) => {
      noOp(iStore, [], done);
    })();
  }

  function entityMissingEntityRequired(done: () => void) {
    const getOrgAction = new GetOrganization(
      orgGuid,
      cfGuid,
      [createEntityRelationKey(organizationSchemaKey, quotaDefinitionSchemaKey)],
      true);

    const childQuotaToOrgRelation = new EntityTreeRelation(
      entityFactory(quotaDefinitionSchemaKey),
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

    inject([Store], (iStore: Store<AppState>) => {
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
      if (apiResponse) {
        expect(res.apiResponse).toBeTruthy();
      } else {
        expect(res.apiResponse).toBeFalsy();
      }

      expect(iStore.dispatch).toHaveBeenCalledTimes(1);
      expect(dispatchSpy.calls.count()).toBe(1);
      expect(dispatchSpy.calls.all()[0].args[0]).toEqual(getQuotaAction);
      done();

    })();
  }

  describe('validate from store - ', () => {
    beforeEach(() => {
      store = getInitialTestStoreState();
      store.requestData[organizationSchemaKey][orgGuid] = helper.createEmptyOrg(orgGuid, 'org-name');
      store.request[organizationSchemaKey][orgGuid] = getDefaultRequestState(); // TODO: fetching
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
      everythingMissingNothingRequired(done);
    });

    it('List missing, list required', (done) => {
      listMissingListRequired(done);
    });

    it('List exists, list required', (done) => {
      store.requestData[organizationSchemaKey][orgGuid].entity.spaces = [
        helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid)
      ];
      listExistsListRequired(done);
    });

    it('List exists, list not required', (done) => {
      store.requestData[organizationSchemaKey][orgGuid].entity.spaces = [
        helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid)
      ];
      listExistsListNotRequired(done);
    });

    it('Entity Missing, entity required', (done) => {
      entityMissingEntityRequired(done);
    });

  });

  describe('validate from api response', () => {

    beforeEach(() => {
      store = getInitialTestStoreState();

      // store.requestData[organizationSchemaKey][orgGuid] = createEmptyOrg(orgGuid, 'org-name');
      store.request[organizationSchemaKey][orgGuid] = getDefaultRequestState(); // TODO: fetching
      TestBed.configureTestingModule({
        imports: [
          createBasicStoreModule(store),
        ]
      });
      allEntities = store.requestData;
      apiResponse = {
        response: {
          entities: {
            [organizationSchemaKey]: {
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
      everythingMissingNothingRequired(done);
    });

    it('List missing, list required', (done) => {
      listMissingListRequired(done);
    });

    it('List exists, list required', (done) => {
      const newSpace = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      apiResponse.response.entities[organizationSchemaKey][orgGuid].entity.spaces = [newSpace];
      apiResponse.response.entities[spaceSchemaKey] = { [spaceGuid]: newSpace };
      listExistsListRequired(done);
    });

    it('List exists, list not required', (done) => {
      const newSpace = helper.createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
      apiResponse.response.entities[organizationSchemaKey][orgGuid].entity.spaces = [newSpace];
      apiResponse.response.entities[spaceSchemaKey] = { [spaceGuid]: newSpace };
      listExistsListNotRequired(done);
    });

    it('Entity Missing, entity required', (done) => {
      entityMissingEntityRequired(done);
    });

  });
  // already fetching?
  // specific features
});

