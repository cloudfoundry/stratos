import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { GetHelmReleases } from '../store/helm.actions';
import { helmReleaseSchemaKey } from '../store/helm.entities';
import { HelmRelease } from '../store/helm.types';

export class HelmReleasesDataSource extends ListDataSource<HelmRelease> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<any>
  ) {
    const action = new GetHelmReleases();
    super({
      store,
      action,
      schema: entityFactory(helmReleaseSchemaKey),
      getRowUniqueId: object => object.guid,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
      // transformEntities: [{ type: 'filter', field: 'name' },
      // (entities: HelmRelease[], paginationState: PaginationEntityState) => {
      //   // const repository = paginationState.clientPagination.filter.items['repository'];
      //   return entities.filter(e => {
      //     return true;
      //   });
      // }
      // ]
    });
  }
}
