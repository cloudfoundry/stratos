import { DataSource } from '@angular/cdk/table';
import { Store, Action } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { MatPaginator, MatSort, Sort, PageEvent, MatSortable } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { EventEmitter, PACKAGE_ROOT_URL } from '@angular/core';
import { LocalListDataSource } from './list-data-source-local';
import { ApplicationService } from '../../features/applications/application.service';
import { EntityInfo } from '../../store/types/api.types';
import { UpdateApplication } from '../../store/actions/application.actions';
import { ListFilter, ListSort, SetListStateAction } from '../../store/actions/list.actions';
import { AppVariablesDelete, AppVariablesAdd, AppVariablesEdit } from '../../store/actions/app-variables.actions';
import { ListActionConfig, ListActions } from './list-data-source-types';

export interface AppEnvVar {
  name: string;
  value: string;
}

export class CfAppEvnVarsDataSource extends LocalListDataSource<AppEnvVar> {

  // Only needed for update purposes
  public rows = new Array<AppEnvVar>();

  public cfGuid: string;
  public appGuid: string;

  filteredRows = new Array<AppEnvVar>();
  isLoadingPage$: Observable<boolean>;
  data$: any;

  private static key(_cfGuid: string, _appGuid: string) {
    return `app-variables:${_cfGuid}:${_appGuid}`;
  }

  constructor(
    private _cfStore: Store<AppState>,
    private _appService: ApplicationService,
  ) {
    super(
      _cfStore,
      (object: AppEnvVar) => {
        return object.name;
      },
      (): AppEnvVar => {
        return {
          name: '',
          value: '',
        };
      },
      { active: 'name', direction: 'asc' },
      CfAppEvnVarsDataSource.key(_appService.cfGuid, _appService.appGuid)
    );

    this.cfGuid = _appService.cfGuid;
    this.appGuid = _appService.appGuid;

    _cfStore.dispatch(new SetListStateAction(
      CfAppEvnVarsDataSource.key(_appService.cfGuid, _appService.appGuid),
      'table',
      {
        pageIndex: 0,
        pageSize: 5,
        pageSizeOptions: [5, 10, 15],
        totalResults: 0,
      },
      {
        direction: 'asc',
        field: 'name'
      },
      {
        filter: ''
      }));

    // The _appService may not have been set up yet, create the actual observable on 'connect'
    this.isLoadingPage$ = Observable.of(true);
  }

  saveAdd() {
    this._cfStore.dispatch(new AppVariablesAdd(this.cfGuid, this.appGuid, this.rows, this.addItem));
    super.saveAdd();
  }

  startEdit(row: AppEnvVar) {
    super.startEdit({ ...row });
  }

  saveEdit() {
    this._cfStore.dispatch(new AppVariablesEdit(this.cfGuid, this.appGuid, this.rows, this.editRow));
    super.saveEdit();
  }

  connect(): Observable<AppEnvVar[]> {
    this.isLoadingPage$ = this._appService.isFetchingApp$.combineLatest(
      this._appService.isFetchingEnvVars$,
      this._appService.isUpdatingEnvVars$
    ).map(([isFetchingApp, isFetchingEnvVars, isUpdatingEnvVars]: [boolean, boolean, boolean]) => {
      return isFetchingApp === null || isFetchingApp || isFetchingEnvVars || isUpdatingEnvVars;
    });

    this.data$ = this._appService.waitForAppEntity$.map((app: EntityInfo) => {
      const rows = new Array<AppEnvVar>();
      const envVars = app.entity.entity.environment_json;
      for (const envVar in envVars) {
        if (!envVars.hasOwnProperty(envVar)) { continue; }

        const [name, value] = [envVar, envVars[envVar]];
        rows.push({ name, value });
      }
      return rows;
    });
    return super.connect();
  }

  destroy() {
    super.destroy();
  }

  listFilter(envVars: AppEnvVar[], filter: ListFilter): AppEnvVar[] {
    this.filteredRows.length = 0;
    this.rows.length = 0;

    for (const envVar of envVars) {
      const { name, value } = envVar;
      this.rows.push(envVar);


      if (filter && filter.filter && filter.filter.length > 0) {
        if (name.indexOf(filter.filter) >= 0 || value.indexOf(filter.filter) >= 0) {
          this.filteredRows.push({ name, value });
        }
      } else {
        this.filteredRows.push({ name, value });
      }
    }

    return this.filteredRows;
  }

  listSort(envVars: Array<AppEnvVar>, sort: ListSort): AppEnvVar[] {
    return envVars.slice().sort((a, b) => {
      const [propertyA, propertyB] = [a[sort.field], b[sort.field]];
      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
    });
  }
}
