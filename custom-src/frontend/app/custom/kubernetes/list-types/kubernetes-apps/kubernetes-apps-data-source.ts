import { Store } from '@ngrx/store';


import { map } from 'rxjs/operators';
import { entityFactory, kubernetesAppsSchemaKey } from '../../../../store/helpers/entity-factory';
import { KubernetesApp } from '../../store/kube.types';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { GetKubernetesApps } from '../../store/kubernetes.actions';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';

export class KubernetesAppsDataSource extends ListDataSource<KubernetesApp, any> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesApp>
  ) {
    super({
      store,
      action: new GetKubernetesApps(kubeGuid.guid),
      schema: entityFactory(kubernetesAppsSchemaKey),
      getRowUniqueId: object => object.name,
      //   getEmptyType: () => ({ name: '', value: '', }),
      paginationKey: getPaginationKey(kubernetesAppsSchemaKey, kubeGuid.guid),
      transformEntity: map(variables => {
        console.log('HERE');
        console.log(variables);
        if (!variables || variables.length === 0) {
          return [];
        }
        const data = variables[0];
        // const rows = [...Object.values(variables[0])];
        // const rows = Object.keys(data).map(name => ({ name, value: data[name] }));
        const rows = <KubernetesApp[]>Object.values(data);
        console.log(rows);
        return rows;
      }),
      isLocal: true,
      // transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig
    });
  }

}
