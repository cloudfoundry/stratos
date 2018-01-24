import { GetRoutes } from '../../store/actions/route.actions';
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
import { EntityInfo } from '../../store/types/api.types';
import { UpdateApplication } from '../../store/actions/application.actions';
import { ListFilter, ListSort, SetListStateAction } from '../../store/actions/list.actions';
import { AppVariablesDelete, AppVariablesAdd, AppVariablesEdit } from '../../store/actions/app-variables.actions';
import { ListActionConfig, ListActions } from './list-data-source-types';
import { map } from 'rxjs/operators';
import { schema } from 'normalizr';
import { getPaginationKey } from '../../store/actions/pagination.actions';

export const RouteSchema = new schema.Entity('route');

export class CfAppRoutesDataSource extends ListDataSource<EntityInfo> {

  public cfGuid: string;
  public appGuid: string;

  constructor(
    protected _store: Store<AppState>,
    private _appService: ApplicationService,
  ) {
    super(
      _store,
      new GetRoutes(
        _appService.appGuid,
        _appService.cfGuid,
      ),
      RouteSchema,
      (object: EntityInfo) => {
        return object.entity ? object.entity.guid : null;
      },
      () => ({} as EntityInfo),
      getPaginationKey(
        'route',
        _appService.cfGuid,
        _appService.appGuid,
      ),
      null,
      false,
      [
        {
          type: 'sort',
          orderKey: 'host',
          field: 'host'
        },
      ]
    );

    this.cfGuid = _appService.cfGuid;
    this.appGuid = _appService.appGuid;
    const paginationKey = getPaginationKey(
      'route',
      _appService.cfGuid,
      _appService.appGuid,
    );
    _store.dispatch(new SetListStateAction(
      paginationKey,
      'table',
    ));
  }

}
