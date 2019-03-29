import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { GetHelmReleasePods } from '../store/helm.actions';
import { HelmReleasePod } from '../store/helm.types';

export class HelmReleasePodsDataSource extends ListDataSource<HelmReleasePod> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<HelmReleasePod>,
    endpointGuid: string,
    releaseTitle: string
  ) {
    const action = new GetHelmReleasePods(endpointGuid, releaseTitle);
    super({
      store,
      action,
      schema: entityFactory(action.entityKey),
      getRowUniqueId: (object: HelmReleasePod) => object.endpointGuid,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
    });
  }
}
