import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { MdPaginator, MdSort, Sort, PageEvent } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { EventEmitter } from '@angular/core';
import { EntityInfo } from '../../../../store/types/api.types';
import { UpdateApplication } from '../../../../store/actions/application.actions';
import { DefaultTableDataSource } from '../../../../core/table-data-source';

interface AppEnvVar {
  name: string;
  value: string;
}

interface AddAppEnvVar extends AppEnvVar {
  select: boolean;
}

export class AppEnvironemtEvnVarsDataSource extends DefaultTableDataSource<AppEnvVar> {

  filteredRows = new Array<AppEnvVar>();
  isLoadingPage$: Observable<boolean>;
  data$: any;

  constructor(
    private _paginator: MdPaginator,
    private _sort: MdSort,
    private _filterChange: Observable<string>,
    private _store: Store<AppState>,
    private _appService: ApplicationService,
  ) {
    super(_paginator, _sort, _filterChange, _store, 'name');
    this.addRow = {
      name: '',
      value: ''
    };
    // this.editRow = {
    //   name: '',
    //   value: ''
    // };
    this._filterChange.subscribe(() => console.log('_filterChange'));

    this.isLoadingPage$ = _appService.isFetchingApp$.combineLatest(
      _appService.isFetchingEnvVars$,
      _appService.isUpdatingEnvVars$
    ).map(([isFetchingApp, isFetchingEnvVars, isUpdatingEnvVars]: [boolean, boolean, boolean]) => {
      return isFetchingApp || isFetchingEnvVars || isUpdatingEnvVars;
    });
  }

  _defaultSort: Sort = { active: 'name', direction: 'asc' }; // TODO: RC
  _defaultPaginator = {};


  startAdd() {
    super.startAdd({
      name: '',
      value: '',
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
    this.data$.subscribe(() => console.log('data$.subscribe'));
    const obs = super.connect();
    obs.subscribe(() => console.log('obs.subscribe'));
    return obs;
  }

  disconnect() {
  }

  rowNames: Array<string> = new Array<string>();
  rows: Array<AppEnvVar> = new Array<AppEnvVar>();

  filter(envVars: AppEnvVar[], filter: string): any {
    this.filteredRows.length = 0;
    this.rows.length = 0;
    this.rowNames.length = 0;

    for (const envVar of envVars) {
      const { name, value } = envVar;
      this.rows.push(envVar);
      this.rowNames.push(name);

      if (filter && filter.length > 0) {
        if (name.indexOf(filter) >= 0 || value.indexOf(filter) >= 0) {
          this.filteredRows.push({ name, value });
        }
      } else {
        this.filteredRows.push({ name, value });
      }
    }

    // this.count$.next(this.rows.length);
    // this.filteredCount$.next(this.filteredRows.length);

    return this.filteredRows;
  }

  sort(envVars: Array<AppEnvVar>, sort: Sort): AppEnvVar[] {
    return envVars.slice().sort((a, b) => {
      // TODO: RC lower case strings?
      const [propertyA, propertyB] = [a[this._sort.active], b[this._sort.active]];
      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }

  paginate(envVars: Array<AppEnvVar>, pageSize: number, pageIndex: number): AppEnvVar[] {
    // Is the paginators pageIndex valid?
    if (pageIndex * pageSize > envVars.length) {
      pageIndex = Math.floor(envVars.length / pageSize);
    }

    // Should the paginator select a freshly added row?
    if (this.selectRow) {
      for (let i = 0; i < envVars.length; i++) {
        if (envVars[i].name === this.selectRow.name) {
          pageIndex = Math.floor(i / pageSize);
          delete this.selectRow;
          break;
        }
      }
    }
    const startIndex: number = pageIndex * pageSize;
    return envVars.splice(startIndex, this._paginator.pageSize);
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

// export class AppEnvironemtEvnVarsDataSource2 extends DataSource<AppEnvVar> {

//   constructor(private store: Store<AppState>, private _appService: ApplicationService, private _paginator: MdPaginator,
//     private _sort: MdSort) {
//     super();
//     this.showProgressIndicator = _appService.isFetchingApp$.combineLatest(
//       _appService.isFetchingEnvVars$,
//       _appService.isUpdatingEnvVars$
//     ).map(([isFetchingApp, isFetchingEnvVars, isUpdatingEnvVars]: [boolean, boolean, boolean]) => {
//       return isFetchingApp || isFetchingEnvVars || isUpdatingEnvVars;
//     });
//     _sort.sort({ id: this._defaultSort.active, start: this._defaultSort.direction as 'asc' || 'desc', disableClear: true });
//   }

//   _defaultSort: Sort = { active: 'name', direction: 'asc' };
//   _defaultPaginator = {};

//   _filterChange = new BehaviorSubject('');
//   // get filter(): string { return this._filterChange.value; }
//   // set filter(filter: string) { this._filterChange.next(filter); }

//   count$ = new BehaviorSubject(0);
//   filteredCount$ = new BehaviorSubject(0);

//   rows = new Array<AppEnvVar>();
//   rowNames = new Array<string>();
//   filteredRows = new Array<AppEnvVar>();

//   selectedRows = new Map<string, AppEnvVar>();
//   isSelecting$ = new BehaviorSubject(false);
//   selectAllChecked = false;

//   isAdding$ = new BehaviorSubject(false);

//   addRow: AddAppEnvVar = {
//     name: '',
//     value: '',
//     select: false
//   };

//   showProgressIndicator: Observable<boolean>;

//   addAppFocusEventEmitter = new EventEmitter<boolean>();

//   startAdd() {
//     this.addRow = {
//       name: '',
//       value: '',
//       select: false
//     };
//     this.isAdding$.next(true);
//     // this.addAppFocusEventEmitter.emit(true);
//   }

//   saveAdd() {
//     const updateApp = this._createUpdateApplication(false);
//     updateApp.environment_json[this.addRow.name] = this.addRow.value;
//     this._appService.UpdateApplicationEvVars(updateApp);
//     this.isAdding$.next(false);
//     this.addRow.select = true;
//   }

//   cancelAdd() {
//     this.isAdding$.next(false);
//   }

//   selectedRowToggle(row: AppEnvVar) {
//     const exists = this.selectedRows.has(row.name);
//     if (exists) {
//       this.selectedRows.delete(row.name);
//     } else {
//       this.selectedRows.set(row.name, row);
//     }
//     this.isSelecting$.next(this.selectedRows.size > 0);
//   }

//   selectAllFilteredRows(selectAll) {
//     this.selectAllChecked = !this.selectAllChecked;
//     for (const row of this.filteredRows) {
//       if (this.selectAllChecked) {
//         this.selectedRows.set(row.name, row);
//       } else {
//         this.selectedRows.delete(row.name);
//       }
//     }
//     this.isSelecting$.next(this.selectedRows.size > 0);
//   }

//   selectedDelete() {
//     const updateApp = this._createUpdateApplication(true);
//     this._appService.UpdateApplicationEvVars(updateApp);

//     this.selectedRows.clear();
//     this.isSelecting$.next(false);
//   }

//   startEdit(row: AppEnvVar) {
//     row.edit = { ...row };
//   }

//   saveEdit(editedRow: AppEnvVar) {
//     const updateApp = this._createUpdateApplication(false);
//     updateApp.environment_json[editedRow.name] = editedRow.edit.value;

//     this._appService.UpdateApplicationEvVars(updateApp);
//     delete editedRow.edit;
//   }

//   cancelEdit(row: AppEnvVar) {
//     row.edit = null;
//   }

//   connect(): Observable<AppEnvVar[]> {
//     return this._appService.waitForAppEntity$
//       .combineLatest(
//       this._paginator.page.startWith(this._defaultPaginator),
//       this._filterChange.startWith(''),
//       this._sort.mdSortChange.startWith(this._defaultSort),
//     )
//       .map(([envVars, pageEvent, filter, sort]: [EntityInfo, PageEvent, string, Sort]) => {
//         // TODO: RC caching?? catch no-ops?
//         const filtered = this._filterEnvVars(envVars, filter);

//         const sorted = this._sortEnvVars(filtered, sort);

//         const page = this._pageEnvVars(sorted, this._paginator);

//         return page;
//       });
//   }

//   disconnect() {
//   }

//   _filterEnvVars(envVars: EntityInfo, filter: string): AppEnvVar[] {
//     this.filteredRows.length = 0;
//     this.rows.length = 0;

//     for (const envVar in envVars.entity.entity.environment_json) {
//       if (!envVars.entity.entity.environment_json.hasOwnProperty(envVar)) { continue; }

//       const [name, value] = [envVar, envVars.entity.entity.environment_json[envVar]];
//       this.rows.push({ name, value });
//       this.rowNames.push(name);

//       if (filter && filter.length > 0) {
//         if (name.indexOf(filter) >= 0 || value.indexOf(filter) >= 0) {
//           this.filteredRows.push({ name, value });
//         }
//       } else {
//         this.filteredRows.push({ name, value });
//       }
//     }

//     this.count$.next(this.rows.length);
//     this.filteredCount$.next(this.filteredRows.length);

//     return this.filteredRows;
//   }

//   _sortEnvVars(envVars: AppEnvVar[], sort: Sort): AppEnvVar[] {
//     return envVars.slice().sort((a, b) => {
//       // TODO: RC lower case strings?
//       const [propertyA, propertyB] = [a[this._sort.active], b[this._sort.active]];
//       const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
//       const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

//       return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
//     });
//   }

//   _pageEnvVars(envVars: AppEnvVar[], paginator: MdPaginator): AppEnvVar[] {
//     // Is the paginators pageIndex valid?
//     if (paginator.pageIndex * paginator.pageSize > envVars.length) {
//       paginator.pageIndex = Math.floor(envVars.length / paginator.pageSize);
//     }

//     // Should the paginator select a freshly added row?
//     if (this.addRow.select) {
//       for (let i = 0; i < envVars.length; i++) {
//         if (envVars[i].name === this.addRow.name) {
//           paginator.pageIndex = Math.floor(i / paginator.pageSize);
//           this.addRow.select = false;
//           break;
//         }
//       }
//     }
//     const startIndex: number = paginator.pageIndex * paginator.pageSize;
//     return envVars.splice(startIndex, this._paginator.pageSize);
//   }

//   _createUpdateApplication(removeSelected: boolean): UpdateApplication {
//     const updateApp: UpdateApplication = {
//       environment_json: {},
//     };
//     for (const row of this.rows) {
//       if (!removeSelected || !this.selectedRows.has(row.name)) {
//         updateApp.environment_json[row.name] = row.value;
//       }
//     }
//     return updateApp;
//   }
// }
