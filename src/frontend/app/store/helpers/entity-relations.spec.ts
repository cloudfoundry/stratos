import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../core/cf-api.types';
import { createBasicStoreModule, getInitialTestStoreState } from '../../test-framework/store-test-helper';
import { GetAllOrganizationSpaces, GetOrganization } from '../actions/organization.actions';
import { SetInitialParams } from '../actions/pagination.actions';
import { FetchRelationPaginatedAction, FetchRelationSingleAction } from '../actions/relation.actions';
import { APIResponse, RequestTypes } from '../actions/request.actions';
import { AppState, IRequestTypeState } from '../app-state';
import { getDefaultRequestState } from '../reducers/api-request-reducer/types';
import { APIResource } from '../types/api.types';
import { IRequestDataState } from '../types/entity.types';
import { WrapperRequestActionSuccess } from '../types/request.types';
import {
  entityFactory,
  EntitySchema,
  organizationSchemaKey,
  quotaDefinitionSchemaKey,
  spaceSchemaKey,
} from './entity-factory';
import { listEntityRelations, populatePaginationFromParent, validateEntityRelations } from './entity-relations';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
  EntityTreeRelation,
} from './entity-relations.types';

describe('Entity Relations - ', () => {

  const missingSpacesUrl = 'spaces_url';
  const missingQuotaGuid = 'quota_guid';
  const missingQuotaUrl = 'quota_url/' + missingQuotaGuid;

  function createEmptyOrg(guid: string, name: string): APIResource<IOrganization> {
    return {
      entity: {
        name,
        spaces_url: missingSpacesUrl,
        quota_definition_url: missingQuotaUrl
      },
      metadata: {
        guid,
        url: '',
        created_at: '2017-09-08T17:23:42Z',
        updated_at: '2017-09-08T17:23:43Z'
      }
    };
  }

  function createEmptySpace(guid: string, name: string, orgGuid: string): APIResource<ISpace> {
    return {
      entity: {
        name,
        organization_guid: orgGuid,
        organization_url: '',
        developers_url: '',
        auditors_url: '',
        apps_url: '',
        app_events_url: '',
        domains_url: '',
        managers_url: '',
        routes_url: '',
        security_groups_url: '',
        service_instances_url: '',
        allow_ssh: false,
        staging_security_groups_url: ''
      },
      metadata: {
        guid,
        url: '',
        created_at: '2017-09-08T17:23:42Z',
        updated_at: '2017-09-08T17:23:43Z'
      }
    };
  }

  fdescribe('validateEntityRelations - ', () => {

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
      expect(res.apiResponse).toBeFalsy();
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
        missingSpacesUrl
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
        expect(res.apiResponse).toBeFalsy();

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
        missingQuotaGuid,
        childQuotaToOrgRelation,
        getOrgAction.includeRelations,
        true,
        missingQuotaUrl
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
        expect(res.apiResponse).toBeFalsy();

        expect(iStore.dispatch).toHaveBeenCalledTimes(1);
        expect(dispatchSpy.calls.count()).toBe(1);
        expect(dispatchSpy.calls.all()[0].args[0]).toEqual(getQuotaAction);
        done();

      })();
    }

    describe('validate from store - ', () => {
      beforeEach(() => {
        store = getInitialTestStoreState();
        store.requestData[organizationSchemaKey][orgGuid] = createEmptyOrg(orgGuid, 'org-name');
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
          createEmptySpace(spaceGuid, 'Some params, none required', orgGuid)
        ];
        listExistsListRequired(done);
      });

      it('List exists, list not required', (done) => {
        store.requestData[organizationSchemaKey][orgGuid].entity.spaces = [
          createEmptySpace(spaceGuid, 'Some params, none required', orgGuid)
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
                [orgGuid]: createEmptyOrg(orgGuid, 'org-name')
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
        const newSpace = createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
        apiResponse.response.entities[organizationSchemaKey][orgGuid].entity.spaces = [newSpace];
        apiResponse.response.entities[spaceSchemaKey][spaceGuid] = newSpace;
        listExistsListRequired(done);
      });

      it('List exists, list not required', (done) => {
        const newSpace = createEmptySpace(spaceGuid, 'Some params, none required', orgGuid);
        apiResponse.response.entities[organizationSchemaKey][orgGuid].entity.spaces = [newSpace];
        apiResponse.response.entities[spaceSchemaKey][spaceGuid] = newSpace;
        listExistsListNotRequired(done);
      });

      it('Entity Missing, entity required', (done) => {
        entityMissingEntityRequired(done);
      });

    });
    // already fetching?
    // with, without api response







    // it('', () => {

    // })


    // iStore.select(selectPaginationState(spaceSchemaKey, getSpacesAction.paginationKey)).pipe(
    //   filter(state => !!state),
    //   first(),
    //   tap(state => {
    //     expect(state).toBeDefined();
    //     expect(state.pageRequests[0]).toBeDefined();
    //     expect(state.pageRequests[0].busy).toBeTruthy();

    //     const fakeResponse: NormalizedResponse = {
    //       entities: {
    //         [spaceSchemaKey]: [
    //           createEmptySpace(spaceGuid, 'No params, some required', orgGuid)
    //         ]
    //       },
    //       result: [spaceGuid]
    //     };

    //     iStore.dispatch(new WrapperRequestActionSuccess(fakeResponse, getSpacesAction, 'fetch', 1, 1));
    //   })
    // ).subscribe();
    // console.log(JSON.stringify(store.pagination[spaceSchemaKey]));
    // store.request[organizationSchemaKey][orgGuid] = getDefaultRequestState(); // TODO: fetching
    // expect(res.completed.then(done));
  });

  describe('listEntityRelations', () => {
    function createBaseAction(): EntityInlineParentAction {
      const entityKey = 'parent';
      return {
        entityKey,
        entity: new EntitySchema(entityKey),
        includeRelations: [],
        populateMissing: false,
        type: 'type',
      };
    }

    // See entity-relations.tree.spec for main tests
    it('no relations', () => {
      const res = listEntityRelations(createBaseAction());
      expect(res.maxDepth).toBe(0);
      expect(res.relations.length).toBe(0);
    });

    it('relation depth of 2 with relations', () => {
      const child2Schema = new EntitySchema('child2');
      const child1Schema = new EntitySchema('child1', {
        entity: {
          [child2Schema.key]: child2Schema
        }
      });

      const action = createBaseAction();
      action.includeRelations = [
        createEntityRelationKey(action.entityKey, child1Schema.key),
        createEntityRelationKey(child1Schema.key, child2Schema.key)
      ];
      action.entity = new EntitySchema(action.entityKey, { entity: { [child1Schema.key]: child1Schema } });

      const res = listEntityRelations(action);
      expect(res.maxDepth).toBe(2);
      expect(res.relations.length).toBe(2);
      expect(res.relations).toEqual([child1Schema.key, child2Schema.key]);
    });

  });


  describe('populatePaginationFromParent', () => {

    const pagKey = 'populatePaginationFromParent-pagKey';
    const cfGuid = 'populatePaginationFromParent-cf';
    const orgGuid = 'populatePaginationFromParent-org';
    const spaceGuid = 'populatePaginationFromParent-space';

    let store;


    beforeEach(() => {
      store = getInitialTestStoreState();
      store.requestData[organizationSchemaKey][orgGuid] = createEmptyOrg(orgGuid, 'org-name');
      store.request[organizationSchemaKey][orgGuid] = getDefaultRequestState();
      TestBed.configureTestingModule({
        imports: [
          createBasicStoreModule(store),
        ]
      });
    });



    it('No list in parent - no op', (done) => {
      inject([Store], (iStore: Store<AppState>) => {
        populatePaginationFromParent(iStore, new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], true))
          .pipe(first()).subscribe((action: WrapperRequestActionSuccess) => {
            expect(action).toBeUndefined();
            done();
          });
      })();

    });

    it('List in parent', (done) => {
      const spaces: APIResource<ISpace>[] = [
        createEmptySpace('1', 'space1`', orgGuid),
        createEmptySpace('2', 'space2`', orgGuid),
        createEmptySpace('3', 'space3`', orgGuid),
      ];
      const spaceGuids = spaces.map(space => space.metadata.guid);

      spaces.forEach(space => {
        store.requestData.space[space.metadata.guid] = space;
      });
      store.requestData[organizationSchemaKey][orgGuid].entity.spaces = spaces;

      inject([Store], (iStore: Store<AppState>) => {
        populatePaginationFromParent(iStore, new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], true))
          .pipe(first()).subscribe((action: WrapperRequestActionSuccess) => {
            expect(action).toBeDefined();
            expect(action.type).toBe(RequestTypes.SUCCESS);
            expect(action.totalResults).toBe(spaces.length);
            expect(action.totalPages).toBe(1);
            expect(action.response.result).toEqual(spaceGuids);
            expect(action.response.entities.space).toEqual(spaces.reduce(function (map, space) {
              map[space.metadata.guid] = space;
              return map;
            }, {}));
            done();
          });
      })();

    });

  });
});
