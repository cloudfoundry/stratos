import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../core/cf-api.types';
import { createBasicStoreModule, getInitialTestStoreState } from '../../test-framework/store-test-helper';
import { GetAllOrganizationSpaces } from '../actions/organization.actions';
import { RequestTypes } from '../actions/request.actions';
import { AppState } from '../app-state';
import { getDefaultRequestState } from '../reducers/api-request-reducer/types';
import { APIResource } from '../types/api.types';
import { WrapperRequestActionSuccess } from '../types/request.types';
import { EntitySchema } from './entity-factory';
import { listEntityRelations, populatePaginationFromParent } from './entity-relations';
import { EntityInlineParentAction, createEntityRelationKey } from './entity-relations.types';

fdescribe('Entity Relations', () => {

  fdescribe('validateEntityRelations', () => {

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

    function createEmptyOrg(guid: string, name: string): APIResource<IOrganization> {
      return {
        entity: {
          name
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

    let store;


    beforeEach(() => {
      store = getInitialTestStoreState();
      store.requestData.organization[orgGuid] = createEmptyOrg(orgGuid, 'org-name');
      store.request.organization[orgGuid] = getDefaultRequestState();
      TestBed.configureTestingModule({
        imports: [
          createBasicStoreModule(store),
        ]
      });
    });

    const pagKey = 'populatePaginationFromParent-pagKey';
    const cfGuid = 'populatePaginationFromParent-cf';
    const orgGuid = 'populatePaginationFromParent-org';
    const spaceGuid = 'populatePaginationFromParent-space';

    it('No list in parent - no op', (done) => {
      inject([Store], (iStore: Store<AppState>) => {
        populatePaginationFromParent(iStore, new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], false))
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
      store.requestData.organization[orgGuid].entity.spaces = spaces;

      inject([Store], (iStore: Store<AppState>) => {
        populatePaginationFromParent(iStore, new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], false))
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
