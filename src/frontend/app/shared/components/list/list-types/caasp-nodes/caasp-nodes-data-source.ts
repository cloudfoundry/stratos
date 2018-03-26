import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { GetCaaspInfo } from '../../../../../store/actions/caasp.actions';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { entityFactory, caaspInfoSchemaKey } from '../../../../../store/helpers/entity-factory';

export interface CaaspNodeInfo {
  fqdn: string;
  minion_id: string;
  role: string;
}

export class CaaspNodesDataSource extends ListDataSource<CaaspNodeInfo, any> {

  public casspGuid: string;

  constructor(
    store: Store<AppState>,
    caaspId: string,
    listConfig: IListConfig<CaaspNodeInfo>
  ) {
    super({
      store,
      action: new GetCaaspInfo(caaspId),
      schema: entityFactory(caaspInfoSchemaKey),
      getRowUniqueId: object => object.name,
      //   getEmptyType: () => ({ name: '', value: '', }),
      paginationKey: getPaginationKey(caaspInfoSchemaKey, caaspId),
      transformEntity: map(variables => {
        console.log('HERE');
        console.log(variables);
        if (!variables || variables.length === 0) {
          return [];
        }
        const rows = [...variables[0].assigned_minions];
        //const rows = Object.keys(env).map(name => ({ name, value: env[name] }));
        return rows;
      }),
      isLocal: true,
      //transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig
    });
  }

}
