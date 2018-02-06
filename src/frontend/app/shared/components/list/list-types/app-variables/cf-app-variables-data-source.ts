import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { GetAppEnvVarsAction } from '../../../../../store/actions/app-metadata.actions';
import { AppVariablesAdd, AppVariablesEdit } from '../../../../../store/actions/app-variables.actions';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { AppEnvVarSchema, AppEnvVarsState } from '../../../../../store/types/app-metadata.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export interface ListAppEnvVar {
  name: string;
  value: string;
}

export class CfAppEvnVarsDataSource extends ListDataSource<ListAppEnvVar, APIResource<AppEnvVarsState>> {

  public cfGuid: string;
  public appGuid: string;

  constructor(
    store: Store<AppState>,
    _appService: ApplicationService,
    listConfig: IListConfig<ListAppEnvVar>
  ) {
    const action = new GetAppEnvVarsAction(_appService.appGuid, _appService.cfGuid);
    const paginationKey = getPaginationKey(AppEnvVarSchema.key, _appService.cfGuid, _appService.appGuid, );

    super({
      store,
      action,
      schema: AppEnvVarSchema,
      getRowUniqueId: object => object.name,
      getEmptyType: () => ({
        name: '',
        value: '',
      }),
      paginationKey,
      transformEntity: map(variables => {
        if (!variables || variables.length === 0) {
          return [];
        }
        const env = variables[0].entity.environment_json;
        const rows = Object.keys(env).map(name => ({ name, value: env[name] }));
        return rows;
      }),
      isLocal: true,
      transformEntities: [
        {
          type: 'filter',
          field: 'name'
        },
      ],
      listConfig
    });

    this.cfGuid = _appService.cfGuid;
    this.appGuid = _appService.appGuid;
  }

  saveAdd() {
    this.store.dispatch(new AppVariablesAdd(this.cfGuid, this.appGuid, this.entityLettabledRows, this.addItem));
    super.saveAdd();
  }

  startEdit(row: ListAppEnvVar) {
    super.startEdit({ ...row });
  }

  saveEdit() {
    this.store.dispatch(new AppVariablesEdit(this.cfGuid, this.appGuid, this.entityLettabledRows, this.editRow));
    super.saveEdit();
  }

}
