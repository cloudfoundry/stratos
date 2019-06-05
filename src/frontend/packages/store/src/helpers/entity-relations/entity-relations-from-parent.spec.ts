import { async, inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';

import { ISpace } from '../../../../core/src/core/cf-api.types';
import { createBasicStoreModule, getInitialTestStoreState } from '../../../../core/test-framework/store-test-helper';
import { GetAllOrganizationSpaces } from '../../actions/organization.actions';
import { RequestTypes } from '../../actions/request.actions';
import { AppState, IRequestEntityTypeState } from '../../app-state';
import { getDefaultRequestState } from '../../reducers/api-request-reducer/types';
import { APIResource } from '../../types/api.types';
import { WrapperRequestActionSuccess } from '../../types/request.types';
import { organizationSchemaKey, spaceSchemaKey } from '../entity-factory';
import { populatePaginationFromParent } from './entity-relations';
import { EntityRelationSpecHelper } from './entity-relations.spec';
import { CloudFoundryPackageModule } from '../../../../cloud-foundry/src/cloud-foundry.module';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { registerCFEntities } from '../../../../cloud-foundry/src/cf-entity-generator';
interface SpaceState {
  space: IRequestEntityTypeState<APIResource<ISpace>>;
}
describe('Entity Relations - populate from parent', () => {
  const entityKey = entityCatalogue.getEntityKey('cf', organizationSchemaKey);
  const spaceEntityKey = entityCatalogue.getEntityKey('cf', spaceSchemaKey);

  const helper = new EntityRelationSpecHelper();

  const pagKey = 'populatePaginationFromParent-pagKey';
  const cfGuid = 'populatePaginationFromParent-cf';
  const orgGuid = 'populatePaginationFromParent-org';
  const spaceGuid = 'populatePaginationFromParent-space';

  let store;

  beforeEach(() => {
    store = getInitialTestStoreState();
    store.requestData[entityKey] = {};
    store.request[entityKey] = {};
    store.requestData[spaceEntityKey] = {};
    store.request[spaceEntityKey] = {};
    store.requestData[entityKey][orgGuid] = helper.createEmptyOrg(orgGuid, 'org-name');
    store.request[entityKey][orgGuid] = getDefaultRequestState();
    TestBed.configureTestingModule({
      imports: [
        CloudFoundryPackageModule,
        createBasicStoreModule(store),
      ]
    });
  });

  it('No list in parent - no op', (done) => {
    inject([Store], (iStore: Store<AppState<SpaceState>>) => {
      const testAction = new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], true);
      populatePaginationFromParent(iStore, testAction)
        .pipe(first()).subscribe((action: GetAllOrganizationSpaces) => {
          expect(action).toBeUndefined();
          done();
        });
    })();

  });

  fit('List in parent', async(() => {
    const spaces: APIResource<ISpace>[] = [
      helper.createEmptySpace('1', 'space1`', orgGuid),
      helper.createEmptySpace('2', 'space2`', orgGuid),
      helper.createEmptySpace('3', 'space3`', orgGuid),
    ];
    const spaceGuids = spaces.map(space => space.metadata.guid);

    spaces.forEach(space => {
      store.requestData.space[space.metadata.guid] = space;
    });
    store.requestData[entityKey][orgGuid].entity.spaces = spaces;

    inject([Store], (iStore: Store<AppState>) => {
      populatePaginationFromParent(iStore, new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], true))
        .pipe(first()).subscribe((action: WrapperRequestActionSuccess) => {
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
        });
    })();
  }));

});
