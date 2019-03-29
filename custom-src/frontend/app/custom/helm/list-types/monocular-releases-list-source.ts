import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { HelmRelease } from '../store/helm.types';
import { GetHelmReleases } from '../store/helm.actions';
import { helmReleasesSchemaKey } from '../store/helm.entities';
import { PaginationEntityState } from '../../../../../store/src/types/pagination.types';

export class HelmReleasesDataSource extends ListDataSource<HelmRelease> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<any>
  ) {
    const action = new GetHelmReleases();
    super({
      store,
      action,
      schema: entityFactory(helmReleasesSchemaKey),
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
