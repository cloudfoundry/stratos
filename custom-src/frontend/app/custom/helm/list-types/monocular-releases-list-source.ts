import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { getHelmReleaseId, helmEntityFactory, helmReleaseSchemaKey } from '../helm-entity-factory';
import { GetHelmReleases } from '../store/helm.actions';
import { HelmRelease } from '../store/helm.types';

export class HelmReleasesDataSource extends ListDataSource<HelmRelease> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<HelmRelease>
  ) {
    const action = new GetHelmReleases();
    super({
      store,
      action,
      schema: helmEntityFactory(helmReleaseSchemaKey),
      getRowUniqueId: getHelmReleaseId,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig
    });
  }
}
