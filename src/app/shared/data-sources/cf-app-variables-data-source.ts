import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { MdPaginator, MdSort, Sort, PageEvent, MdSortable } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { EventEmitter, PACKAGE_ROOT_URL } from '@angular/core';
import { StandardTableDataSource } from './table-data-source-standard';
import { ApplicationService } from '../../features/applications/application.service';
import { EntityInfo } from '../../store/types/api.types';
import { UpdateApplication } from '../../store/actions/application.actions';
import { ListFilter, ListSort, SetListStateAction } from '../../store/actions/list.actions';

export interface AppEnvVar {
  name: string;
  value: string;
}

interface AddAppEnvVar extends AppEnvVar {
  select: boolean;
}

function key(_cnsiGuid: string, _appGuid: string) {
  return `app-variables:${_cnsiGuid}:${_appGuid}`;
}

export class CfAppEvnVarsDataSource extends StandardTableDataSource<AppEnvVar> {

  // Only needed for unique filter when adding new env vars
  private rowNames: Array<string> = new Array<string>();
  // Only needed for update purposes
  private rows = new Array<AppEnvVar>();
  // Default sort shizzle
  private _defaultSortParmas: MdSortable;

  filteredRows = new Array<AppEnvVar>();
  isLoadingPage$: Observable<boolean>;
  data$: any;


  constructor(
    private _store: Store<AppState>,
    private _appService: ApplicationService,
  ) {
    super(
      _store,
      (object: AppEnvVar) => {
        return object.name;
      },
      {
        name: '',
        value: '',
      },
      { active: 'name', direction: 'asc' },
      `app-variables:${_appService.cfGuid}:${_appService.appGuid}`
    );

    _store.dispatch(new SetListStateAction(
      `app-variables:${_appService.cfGuid}:${_appService.appGuid}`,
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


    this.isLoadingPage$ = _appService.isFetchingApp$.combineLatest(
      _appService.isFetchingEnvVars$,
      _appService.isUpdatingEnvVars$
    ).map(([isFetchingApp, isFetchingEnvVars, isUpdatingEnvVars]: [boolean, boolean, boolean]) => {
      return isFetchingApp || isFetchingEnvVars || isUpdatingEnvVars;
    });
  }

  saveAdd() {
    const updateApp = this._createUpdateApplication(false);
    updateApp.environment_json[this.addRow.name] = this.addRow.value;
    this._appService.UpdateApplicationEvVars(updateApp);

    super.saveAdd();
  }

  selectedDelete() {
    const updateApp = this._createUpdateApplication(true);
    this._appService.UpdateApplicationEvVars(updateApp);

    super.selectedDelete();
  }

  startEdit(row: AppEnvVar) {
    super.startEdit({ ...row });
  }

  saveEdit() {
    const updateApp = this._createUpdateApplication(false);
    updateApp.environment_json[this.editRow.name] = this.editRow.value;
    this._appService.UpdateApplicationEvVars(updateApp);

    super.saveEdit();
  }

  connect(): Observable<AppEnvVar[]> {
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

  disconnect() {
    super.disconnect();
  }

  listFilter(envVars: AppEnvVar[], filter: ListFilter): any {
    this.filteredRows.length = 0;
    this.rows.length = 0;
    this.rowNames.length = 0;

    for (const envVar of envVars) {
      const { name, value } = envVar;
      this.rows.push(envVar);
      this.rowNames.push(name);

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
      // TODO: RC lower case strings?
      const [propertyA, propertyB] = [a[sort.field], b[sort.field]];
      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
    });
  }

  _createUpdateApplication(removeSelected: boolean): UpdateApplication {
    const updateApp: UpdateApplication = {
      environment_json: {},
    };
    for (const row of this.rows) {
      if (!removeSelected || !this.selectedRows.has(row.name)) {
        updateApp.environment_json[row.name] = row.value;
      }
    }
    return updateApp;
  }
}
