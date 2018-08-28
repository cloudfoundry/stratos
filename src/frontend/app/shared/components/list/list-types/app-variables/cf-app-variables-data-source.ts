import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { GetAppEnvVarsAction } from '../../../../../store/actions/app-metadata.actions';
import { AppVariablesAdd, AppVariablesEdit } from '../../../../../store/actions/app-variables.actions';
import { AppState } from '../../../../../store/app-state';
import { appEnvVarsSchemaKey, entityFactory, applicationSchemaKey } from '../../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { AppEnvVarsState } from '../../../../../store/types/app-metadata.types';
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
    store: Store<AppState>,
    _appService: ApplicationService,
    listConfig: IListConfig<ListAppEnvVar>
  ) {
    super({
      store,
      action: new GetAppEnvVarsAction(_appService.appGuid, _appService.cfGuid),
      schema: entityFactory(appEnvVarsSchemaKey),
      getRowUniqueId: object => object.name,
      getEmptyType: () => ({ name: '', value: '', }),
      paginationKey: createEntityRelationPaginationKey(applicationSchemaKey, _appService.appGuid),
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

    this.cfGuid = _appService.cfGuid;
    this.appGuid = _appService.appGuid;
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
