import { Store } from '@ngrx/store';

import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { CaaspInfoSchema, GetCaaspInfo } from '../../store/caasp.actions';

import { map } from 'rxjs/operators';

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
      schema: CaaspInfoSchema,
      getRowUniqueId: object => object.name,
      //   getEmptyType: () => ({ name: '', value: '', }),
      paginationKey: getPaginationKey(CaaspInfoSchema.key, caaspId),
      isLocal: true,
      transformEntity: map(variables => {
        if (!variables || variables.length === 0) {
          return [];
        }
        const rows = [...variables[0].assigned_minions];
        //const rows = Object.keys(env).map(name => ({ name, value: env[name] }));
        return rows;
      }),
      //transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig
    });
  }

}
