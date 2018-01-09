import { EnvVarSchema, GetAppEnvVarsAction, getPaginationKey } from './../../store/actions/app-metadata.actions';
import { ListDataSource } from './list-data-source';
import { DataSource } from '@angular/cdk/table';
import { Store, Action } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { MatPaginator, MatSort, Sort, PageEvent, MatSortable } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { EventEmitter, PACKAGE_ROOT_URL } from '@angular/core';
import { ApplicationService } from '../../features/applications/application.service';
import { EntityInfo } from '../../store/types/api.types';
import { UpdateApplication } from '../../store/actions/application.actions';
import { ListFilter, ListSort, SetListStateAction } from '../../store/actions/list.actions';
import { AppVariablesDelete, AppVariablesAdd, AppVariablesEdit } from '../../store/actions/app-variables.actions';
import { ListActionConfig, ListActions } from './list-data-source-types';
import { AppMetadataProperties, EnvVarsSchema } from '../../store/actions/app-metadata.actions';
import { AppMetadataType } from '../../store/types/app-metadata.types';
import { map } from 'rxjs/operators';
import { ApplicationEnvVars } from '../../features/applications/application/build-tab/application-env-vars.service';

export interface AppEnvVar {
  name: string;
  value: string;
}

export class CfAppEvnVarsDataSource extends ListDataSource<AppEnvVar, ApplicationEnvVars> {

  public cfGuid: string;
  public appGuid: string;

  constructor(
    protected _store: Store<AppState>,
    private _appService: ApplicationService,
  ) {
    super(
      _store,
      new GetAppEnvVarsAction(
        _appService.appGuid,
        _appService.cfGuid,
      ),
      EnvVarSchema,
      (object: AppEnvVar) => {
        return object.name;
      },
      (): AppEnvVar => {
        return {
          name: '',
          value: '',
        };
      },
      getPaginationKey(
        AppMetadataProperties.ENV_VARS,
        _appService.cfGuid,
        _appService.appGuid,
      ),
      map(app => {
        const env = app[0].environment_json;
        const rows = Object.keys(env).map(name => ({ name, value: env[name] }));
        return rows;
      }),
      true,
      [
        {
          type: 'sort',
          orderKey: 'name',
          field: 'name'
        },
        {
          type: 'sort',
          orderKey: 'value',
          field: 'value'
        },
        {
          type: 'filter',
          field: 'name'
        },
      ]
    );

    this.cfGuid = _appService.cfGuid;
    this.appGuid = _appService.appGuid;
    const paginationKey = getPaginationKey(
      AppMetadataProperties.ENV_VARS,
      _appService.cfGuid,
      _appService.appGuid,
    );
    _store.dispatch(new SetListStateAction(
      paginationKey,
      'table',
    ));
  }

  saveAdd() {
    this._store.dispatch(new AppVariablesAdd(this.cfGuid, this.appGuid, this.entityLettabledRows, this.addItem));
    super.saveAdd();
  }

  startEdit(row: AppEnvVar) {
    super.startEdit({ ...row });
  }

  saveEdit() {
    this._store.dispatch(new AppVariablesEdit(this.cfGuid, this.appGuid, this.entityLettabledRows, this.editRow));
    super.saveEdit();
  }

}
