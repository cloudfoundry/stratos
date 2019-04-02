import { Store } from '@ngrx/store';
import { OperatorFunction } from 'rxjs';

import { AppState } from '../../../../../store/src/app-state';
import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { KubeService } from '../store/kube.types';
import { kubernetesServicesSchemaKey } from '../store/kubernetes.entities';

export class BaseKubernetesServicesDataSource extends ListDataSource<KubeService> {

  constructor(
    store: Store<AppState>,
    action: PaginatedAction,
    listConfig: IListConfig<KubeService>,
    transformEntity: OperatorFunction<KubeService[], any> = null
  ) {
    super({
      store,
      action,
      schema: entityFactory(kubernetesServicesSchemaKey),
      getRowUniqueId: object => object.name,
      paginationKey: action.paginationKey,
      transformEntity,
      isLocal: true,
      listConfig,
      transformEntities: [{ type: 'filter', field: 'metadata.name' }]
    });
  }

}
