import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { GetHelmReleaseServices } from '../store/helm.actions';
import { HelmReleaseService } from '../store/helm.types';

export class HelmReleaseServicesDataSource extends ListDataSource<HelmReleaseService> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<HelmReleaseService>,
    endpointGuid: string,
    releaseTitle: string
  ) {
    const action = new GetHelmReleaseServices(endpointGuid, releaseTitle);
    super({
      store,
      action,
      schema: entityFactory(action.entityKey),
      // TODO: RC Fix
      getRowUniqueId: (object: HelmReleaseService) => object.endpointGuid,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
    });
  }
}
