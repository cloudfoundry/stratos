import { async, inject, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../cloud-foundry/cf-types';
import { GetAllOrganizationSpaces } from '../../../../cloud-foundry/src/actions/organization.actions';
import { organizationEntityType, spaceEntityType } from '../../../../cloud-foundry/src/cf-entity-factory';
import { CloudFoundryPackageModule } from '../../../../cloud-foundry/src/cloud-foundry.module';
import { ISpace } from '../../../../core/src/core/cf-api.types';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { createBasicStoreModule, getInitialTestStoreState } from '../../../../core/test-framework/store-test-helper';
import { RequestTypes } from '../../actions/request.actions';
import { AppState, IRequestEntityTypeState } from '../../app-state';
import { getDefaultRequestState } from '../../reducers/api-request-reducer/types';
import { APIResource } from '../../types/api.types';
import { WrapperRequestActionSuccess } from '../../types/request.types';
import { populatePaginationFromParent } from './entity-relations';
import { EntityRelationSpecHelper } from './entity-relations-spec-helper';

interface SpaceState {
  space: IRequestEntityTypeState<APIResource<ISpace>>;
}
describe('Entity Relations - populate from parent', () => {
  const orgEntityKey = entityCatalogue.getEntityKey(CF_ENDPOINT_TYPE, organizationEntityType);
  const spaceEntityKey = entityCatalogue.getEntityKey(CF_ENDPOINT_TYPE, spaceEntityType);

  const helper = new EntityRelationSpecHelper();

  const pagKey = 'populatePaginationFromParent-pagKey';
  const cfGuid = 'populatePaginationFromParent-cf';
  const orgGuid = 'populatePaginationFromParent-org';
  // const spaceGuid = 'populatePaginationFromParent-space';

  let store;

  beforeEach(() => {
    store = getInitialTestStoreState();
    store.requestData[orgEntityKey] = {};
    store.request[orgEntityKey] = {};
    store.requestData[spaceEntityKey] = {};
    store.request[spaceEntityKey] = {};
    store.requestData[orgEntityKey][orgGuid] = helper.createEmptyOrg(orgGuid, 'org-name');
    store.request[orgEntityKey][orgGuid] = getDefaultRequestState();
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

  it('List in parent', async(() => {
    const spaces: APIResource<ISpace>[] = [
      helper.createEmptySpace('1', 'space1`', orgGuid),
      helper.createEmptySpace('2', 'space2`', orgGuid),
      helper.createEmptySpace('3', 'space3`', orgGuid),
    ];
    const spaceGuids = spaces.map(space => space.metadata.guid);

    spaces.forEach(space => {
      store.requestData[spaceEntityKey][space.metadata.guid] = space;
    });
    store.requestData[orgEntityKey][orgGuid].entity.spaces = spaces;

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
