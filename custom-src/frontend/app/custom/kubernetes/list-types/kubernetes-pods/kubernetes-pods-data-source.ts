import { Store } from '@ngrx/store';

import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { GetKubernetesPods } from '../../store/kubernetes.actions';

import { map } from 'rxjs/operators';
import { entityFactory, kubernetesPodsSchemaKey } from '../../../../store/helpers/entity-factory';

export interface KubernetesPodInfo {
  metadata: {
    name: string;
  };
}

export class KubernetesPodsDataSource extends ListDataSource<KubernetesPodInfo, any> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesPodInfo>
  ) {
    super({
      store,
      action: new GetKubernetesPods(kubeGuid.guid),
      schema: entityFactory(kubernetesPodsSchemaKey),
      getRowUniqueId: object => object.name,
      //   getEmptyType: () => ({ name: '', value: '', }),
      paginationKey: getPaginationKey(kubernetesPodsSchemaKey, kubeGuid.guid),
      transformEntity: map(variables => {
        console.log('HERE');
        console.log(variables);
        if (!variables || variables.length === 0) {
          return [];
        }
        const data = variables[0];
        // const rows = [...Object.values(variables[0])];
        // const rows = Object.keys(data).map(name => ({ name, value: data[name] }));
        const rows = <KubernetesPodInfo[]>Object.values(data);
        console.log(rows);
        return rows;
      }),
      isLocal: true,
      // transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig
    });
  }

}
