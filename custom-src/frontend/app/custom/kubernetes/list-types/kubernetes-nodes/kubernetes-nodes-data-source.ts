import { Store } from '@ngrx/store';

import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { GetKubernetesNodes } from '../../store/kubernetes.actions';

import { map } from 'rxjs/operators';
import { entityFactory, kubernetesNodesSchemaKey } from '../../../../store/helpers/entity-factory';
import { KubernetesNode } from '../../../../../../../src/frontend/app/custom/kubernetes/store/kube.types';

export class KubernetesNodesDataSource extends ListDataSource<KubernetesNode, any> {

  constructor(
    store: Store<AppState>,
    kubeGuid: BaseKubeGuid,
    listConfig: IListConfig<KubernetesNode>
  ) {
    super({
      store,
      action: new GetKubernetesNodes(kubeGuid.guid),
      schema: entityFactory(kubernetesNodesSchemaKey),
      getRowUniqueId: object => object.name,
      //   getEmptyType: () => ({ name: '', value: '', }),
      paginationKey: getPaginationKey(kubernetesNodesSchemaKey, kubeGuid.guid),
      transformEntity: map(variables => {
        if (!variables || variables.length === 0) {
          return [];
        }
        const data = variables[0];
        // const rows = [...Object.values(variables[0])];
        // const rows = Object.keys(data).map(name => ({ name, value: data[name] }));
        const rows = <KubernetesNode[]>Object.values(data);
        return rows;
      }),
      isLocal: true,
      // transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig
    });
  }

}
