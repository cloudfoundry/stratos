import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { Store } from '@ngrx/store';
import { take,  } from 'rxjs/operators';

import { RequestTypes } from '@stratosui/store';
import { AppState } from '@stratosui/store';
import { EntityCatalogTestModuleManualStore, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { entityCatalog } from '@stratosui/store';
import { EntityCatalogEntityConfig } from '@stratosui/store';
import { APIResource } from '@stratosui/store';
import { WrapperRequestActionSuccess } from '@stratosui/store';
import { createBasicStoreModule, createEntityStoreState, TestStoreEntity } from '@stratosui/store/testing';
import { EntityRelationSpecHelper } from './entity-relations-spec-helper';
import { GetAllOrganizationSpaces } from '../actions/organization.actions';
import { ISpace } from '../cf-api.types';
import { CFAppState } from '../cf-app-state';
import { cfEntityFactory } from '../cf-entity-factory';
import { generateCFEntities } from '../cf-entity-generator';
import { organizationEntityType, spaceEntityType } from '../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { populatePaginationFromParent } from './entity-relations';
import { EntityServiceFactory } from '@stratosui/store';
describe('Entity Relations - populate from parent', () => {
  const spaceEntityKey = entityCatalog.getEntityKey(CF_ENDPOINT_TYPE, spaceEntityType);

  const helper = new EntityRelationSpecHelper();

  const pagKey = 'populatePaginationFromParent-pagKey';
  const cfGuid = 'populatePaginationFromParent-cf';
  const orgGuid = 'populatePaginationFromParent-org';

  function setup(store) {
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

  it('No list in parent - no op', () => {
    const entityMap = new Map<EntityCatalogEntityConfig, Array<TestStoreEntity>>([
      [
        cfEntityFactory(organizationEntityType),
        [{
          guid: orgGuid,
          data: helper.createEmptyOrg(orgGuid, 'org-name'),
        }]
      ]
    ]);
    const store = createEntityStoreState(entityMap) as Partial<CFAppState>;
    setup(store);

    return new Promise<void>((done, fail) => {
      inject([Store], (iStore: Store<any>) => {
        const testAction = new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], true);
        populatePaginationFromParent(iStore, testAction).pipe(take(1))
          .subscribe(
            (action: GetAllOrganizationSpaces) => {
              // When no list exists in parent, the original action is returned
              expect(action).toBeDefined();
              expect(action).toBe(testAction);
            },
            error => fail(error),
            done
          );
      })();
    });
  });

  it('List in parent', () => {
    const spaces: APIResource<ISpace>[] = [
      helper.createEmptySpace('1', 'space1`', orgGuid),
      helper.createEmptySpace('2', 'space2`', orgGuid),
      helper.createEmptySpace('3', 'space3`', orgGuid),
    ];
    const spaceGuids = spaces.map(space => space.metadata.guid);

    const org = helper.createEmptyOrg(orgGuid, 'org-name');
    org.entity.spaces = spaces;

    const entityMap = new Map<EntityCatalogEntityConfig, Array<TestStoreEntity | string>>([
      [
        cfEntityFactory(organizationEntityType),
        [{
          guid: org.metadata.guid,
          data: org,
        }]
      ],
      [
        cfEntityFactory(spaceEntityType),
        spaces.map(space => ({
          guid: space.metadata.guid,
          data: space,
        })),
      ]
    ]);
    setup(createEntityStoreState(entityMap));

    return new Promise<void>((done, fail) => {
      inject([Store], (iStore: Store<AppState>) => {
        populatePaginationFromParent(iStore, new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], true)).pipe(take(1))
          .subscribe((action: WrapperRequestActionSuccess) => {
            expect(action).toBeDefined();
            expect(action).not.toBeNull();
            expect(action.type).toBe(RequestTypes.SUCCESS);
            expect(action.totalResults).toBe(spaces.length);
            expect(action.totalPages).toBe(1);
            expect(action.response.result).toEqual(spaceGuids);
            expect(action.response.entities[spaceEntityKey]).toEqual(spaces.reduce((map, space) => {
              map[space.metadata.guid] = space;
              return map;
            }, {}));
          },
            error => fail(error),
            done
          );
      })();
    });
  });

});
