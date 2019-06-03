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
import { organizationSchemaKey } from '../entity-factory';
import { populatePaginationFromParent } from './entity-relations';
import { EntityRelationSpecHelper } from './entity-relations.spec';
interface SpaceState {
  space: IRequestEntityTypeState<APIResource<ISpace>>;
}
describe('Entity Relations - populate from parent', () => {

  const helper = new EntityRelationSpecHelper();

  const pagKey = 'populatePaginationFromParent-pagKey';
  const cfGuid = 'populatePaginationFromParent-cf';
  const orgGuid = 'populatePaginationFromParent-org';
  const spaceGuid = 'populatePaginationFromParent-space';

  let store;

  beforeEach(() => {
    store = getInitialTestStoreState();
    store.requestData[organizationSchemaKey][orgGuid] = helper.createEmptyOrg(orgGuid, 'org-name');
    store.request[organizationSchemaKey][orgGuid] = getDefaultRequestState();
    TestBed.configureTestingModule({
      imports: [
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
    store.requestData[organizationSchemaKey][orgGuid].entity.spaces = spaces;

    inject([Store], (iStore: Store<CFAppState>) => {
      populatePaginationFromParent(iStore, new GetAllOrganizationSpaces(pagKey, orgGuid, cfGuid, [], true))
        .pipe(first()).subscribe((action: WrapperRequestActionSuccess) => {
          expect(action).toBeDefined();
          expect(action).not.toBeNull();
          expect(action.type).toBe(RequestTypes.SUCCESS);
          expect(action.totalResults).toBe(spaces.length);
          expect(action.totalPages).toBe(1);
          expect(action.response.result).toEqual(spaceGuids);
          expect(action.response.entities.space).toEqual(spaces.reduce((map, space) => {
            map[space.metadata.guid] = space;
            return map;
          }, {}));
        });
    })();

  }));

});
