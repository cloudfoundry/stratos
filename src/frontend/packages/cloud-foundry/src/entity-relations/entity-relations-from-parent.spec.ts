import { inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { spaceEntityType, cfEntityFactory, organizationEntityType } from '../cf-entity-factory';
import { EntityRelationSpecHelper } from '../../../store/src/helpers/entity-relations/entity-relations-spec-helper';
import { EntityCatalogueTestModule, TEST_CATALOGUE_ENTITIES } from '../../../core/src/core/entity-catalogue-test.module';
import { generateCFEntities } from '../cf-entity-generator';
import { createBasicStoreModule, TestStoreEntity, createEntityStoreState } from '../../../core/test-framework/store-test-helper';
import { EntityCatalogueEntityConfig } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { CFAppState } from '../cf-app-state';
import { GetAllOrganizationSpaces } from '../actions/organization.actions';
import { populatePaginationFromParent } from './entity-relations';
import { APIResource } from '../../../store/src/types/api.types';
import { ISpace } from '../../../core/src/core/cf-api.types';
import { AppState } from '../../../store/src/app-state';
import { WrapperRequestActionSuccess } from '../../../store/src/types/request.types';
import { RequestTypes } from '../../../store/src/actions/request.actions';


describe('Entity Relations - populate from parent', () => {
  const spaceEntityKey = entityCatalogue.getEntityKey(CF_ENDPOINT_TYPE, spaceEntityType);

  const helper = new EntityRelationSpecHelper();

  const pagKey = 'populatePaginationFromParent-pagKey';
  const cfGuid = 'populatePaginationFromParent-cf';
  const orgGuid = 'populatePaginationFromParent-org';

  function setup(store) {
    TestBed.configureTestingModule({
      imports: [
        {
          ngModule: EntityCatalogueTestModule,
          providers: [
            { provide: TEST_CATALOGUE_ENTITIES, useValue: generateCFEntities() }
          ]
        },
        createBasicStoreModule(store),
      ],
    });
  }

  it('No list in parent - no op', (done) => {
    const entityMap = new Map<EntityCatalogueEntityConfig, Array<TestStoreEntity>>([
      [
        cfEntityFactory(organizationEntityType),
        [{
          guid: orgGuid,
          data: helper.createEmptyOrg(orgGuid, 'org-name')
        }]
      ]
    ]);
    const store = createEntityStoreState(entityMap) as Partial<CFAppState>;
    setup(store);

    inject([Store], (iStore: Store<any>) => {
      const testAction = new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], true);
      populatePaginationFromParent(iStore, testAction).pipe(first())
        .subscribe(
          (action: GetAllOrganizationSpaces) => expect(action).toBeUndefined(),
          error => fail(error),
          done
        );
    })();
  });

  it('List in parent', done => {
    const spaces: APIResource<ISpace>[] = [
      helper.createEmptySpace('1', 'space1`', orgGuid),
      helper.createEmptySpace('2', 'space2`', orgGuid),
      helper.createEmptySpace('3', 'space3`', orgGuid),
    ];
    const spaceGuids = spaces.map(space => space.metadata.guid);

    const org = helper.createEmptyOrg(orgGuid, 'org-name');
    org.entity.spaces = spaces;

    const entityMap = new Map<EntityCatalogueEntityConfig, Array<TestStoreEntity | string>>([
      [
        cfEntityFactory(organizationEntityType),
        [{
          guid: org.metadata.guid,
          data: org
        }]
      ],
      [
        cfEntityFactory(spaceEntityType),
        spaces.map(space => ({
          guid: space.metadata.guid,
          data: space
        }))
      ]
    ]);
    setup(createEntityStoreState(entityMap));

    inject([Store], (iStore: Store<AppState>) => {
      populatePaginationFromParent(iStore, new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], true)).pipe(first())
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
