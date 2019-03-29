import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
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
      schema: entityFactory(action.entityKey),
      getRowUniqueId: (object: HelmVersion) => object.endpointId,
      paginationKey: action.paginationKey,
      isLocal: true,
      listConfig,
    });
  }
}
