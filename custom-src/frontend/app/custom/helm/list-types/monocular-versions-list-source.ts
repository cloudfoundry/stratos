import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { getHelmVersionId, helmEntityFactory } from '../helm-entity-factory';
import { GetHelmVersions } from '../store/helm.actions';
import { HelmVersion } from '../store/helm.types';

export class HelmVersionsDataSource extends ListDataSource<HelmVersion> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<any>
  ) {
    const action = new GetHelmVersions();
    super({
      store,
      action,
      schema: helmEntityFactory(action.entityType),
      getRowUniqueId: getHelmVersionId,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
    });
  }
}
