import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import {
  appEnvVarsEntityType,
  applicationEntityType,
  cfEntityFactory,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAppEnvVarsAction } from '../../../../../../../cloud-foundry/src/actions/app-metadata.actions';
import { AppVariablesAdd, AppVariablesEdit } from '../../../../../../../cloud-foundry/src/actions/app-variables.actions';
import { CFAppState } from '../../../../../../../store/src/app-state';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppEnvVarsState } from '../../../../../../../store/src/types/app-metadata.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export interface ListAppEnvVar {
  name: string;
  value: string;
}

export class CfAppVariablesDataSource extends ListDataSource<ListAppEnvVar, APIResource<AppEnvVarsState>> {

  public cfGuid: string;
  public appGuid: string;

  constructor(
    store: Store<CFAppState>,
    appService: ApplicationService,
    listConfig: IListConfig<ListAppEnvVar>
  ) {
    super({
      store,
      action: new GetAppEnvVarsAction(appService.appGuid, appService.cfGuid),
      schema: cfEntityFactory(appEnvVarsEntityType),
      getRowUniqueId: object => object.name,
      getEmptyType: () => ({ name: '', value: '', }),
      paginationKey: createEntityRelationPaginationKey(applicationEntityType, appService.appGuid),
      transformEntity: map(variables => {
        if (!variables || variables.length === 0) {
          return [];
        }
        const env = variables[0].entity.environment_json;
        const rows = Object.keys(env).map(name => ({ name, value: env[name] }));
        return rows;
      }),
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig
    });

    this.cfGuid = appService.cfGuid;
    this.appGuid = appService.appGuid;
  }

  saveAdd() {
    this.store.dispatch(new AppVariablesAdd(this.cfGuid, this.appGuid, this.transformedEntities, this.addItem));
    super.saveAdd();
  }

  startEdit(row: ListAppEnvVar) {
    super.startEdit({ ...row });
  }

  saveEdit() {
    this.store.dispatch(new AppVariablesEdit(this.cfGuid, this.appGuid, this.transformedEntities, this.editRow));
    super.saveEdit();
  }

}
