import { Store } from '@ngrx/store';

import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { GetKubernetesNamespaces } from '../../store/kubernetes.actions';

import { map } from 'rxjs/operators';
import { entityFactory, kubernetesPodsSchemaKey, kubernetesNamespacesSchemaKey } from '../../../../store/helpers/entity-factory';
import { KubernetesNamespace } from '../../store/kube.types';


export class KubernetesNamespacesDataSource extends ListDataSource<KubernetesNamespace, any> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNamespace>
  ) {
    super({
      store,
      action: new GetKubernetesNamespaces(kubeGuid.guid),
      schema: entityFactory(kubernetesNamespacesSchemaKey),
      getRowUniqueId: object => object.name,
      //   getEmptyType: () => ({ name: '', value: '', }),
      paginationKey: getPaginationKey(kubernetesNamespacesSchemaKey, kubeGuid.guid),
      transformEntity: map(variables => {
        if (!variables || variables.length === 0) {
          return [];
        }
        const data = variables[0];
        // const rows = [...Object.values(variables[0])];
        // const rows = Object.keys(data).map(name => ({ name, value: data[name] }));
        const rows = <KubernetesNamespace[]>Object.values(data);
        return rows;
      }),
      isLocal: true,
      // transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig
    });
  }

}
