import { APIResource } from '../../store/types/api.types';
import { GetAppEnvVarsAction } from './../../store/actions/app-metadata.actions';
import { ListDataSource } from './list-data-source';
import { DataSource } from '@angular/cdk/table';
import { Store, Action } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { MatPaginator, MatSort, Sort, PageEvent, MatSortable } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { EventEmitter, PACKAGE_ROOT_URL } from '@angular/core';
import { ApplicationService } from '../../features/applications/application.service';
import { UpdateApplication } from '../../store/actions/application.actions';
import { ListFilter, ListSort, SetListStateAction } from '../../store/actions/list.actions';
import { AppVariablesDelete, AppVariablesAdd, AppVariablesEdit } from '../../store/actions/app-variables.actions';
import { ListActionConfig, ListActions } from './list-data-source-types';
import { map } from 'rxjs/operators';
import { getPaginationKey } from '../../store/actions/pagination.actions';
import { AppEnvVarSchema, AppEnvVarsState } from '../../store/types/app-metadata.types';

export interface ListAppEnvVar {
  name: string;
  value: string;
}

// TODO: RC
export class CfAppEvnVarsDataSource extends ListDataSource<ListAppEnvVar, APIResource<AppEnvVarsState>> {

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
      AppEnvVarSchema,
      (object: ListAppEnvVar) => {
        return object.name;
      },
      (): ListAppEnvVar => {
        return {
          name: '',
          value: '',
        };
      },
      getPaginationKey(
        AppEnvVarSchema.key,
        _appService.cfGuid,
        _appService.appGuid,
      ),
      map(variables => {
        if (!variables || variables.length === 0) {
          return [];
        }
        const env = variables[0].entity.environment_json;
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
      AppEnvVarSchema.key,
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

  startEdit(row: ListAppEnvVar) {
    super.startEdit({ ...row });
  }

  saveEdit() {
    this._store.dispatch(new AppVariablesEdit(this.cfGuid, this.appGuid, this.entityLettabledRows, this.editRow));
    super.saveEdit();
  }

}
