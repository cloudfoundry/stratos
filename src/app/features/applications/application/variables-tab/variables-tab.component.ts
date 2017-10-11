import { Component, OnInit, ViewChild, ElementRef, OnDestroy, EventEmitter } from '@angular/core';
import { ApplicationService } from '../../application.service';
import { Observable, Subscription } from 'rxjs/Rx';
import { DataSource } from '@angular/cdk/table';
import { AppMetadataInfo } from '../../../../store/actions/app-metadata.actions';
import { MdPaginator, PageEvent, MdSort, Sort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { UpdateApplication, UpdateExistingApplicationEnvVar, ApplicationSchema } from '../../../../store/actions/application.actions';
import { selectEntityUpdateInfo } from '../../../../store/actions/api.actions';
import { UpdateState } from '../../../../store/reducers/api-request-reducer';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';

interface AppEnvVar {
  name: string;
  value: string;
  edit?: AppEnvVar;
}

interface AddAppEnvVar extends AppEnvVar {
  select: boolean;
}

@Component({
  selector: 'app-variables-tab',
  templateUrl: './variables-tab.component.html',
  styleUrls: ['./variables-tab.component.scss']
})
export class VariablesTabComponent implements OnInit, OnDestroy {

  constructor(private store: Store<AppState>, private appService: ApplicationService) { }

  envVarsDataSource: AppEnvironemtEvnVarsDataSource;

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MdSort) sort: MdSort;

  filterSub: Subscription;
  hasEnvVars$: Observable<boolean>;

  ngOnInit() {
    this.envVarsDataSource = new AppEnvironemtEvnVarsDataSource(this.store, this.appService, this.paginator, this.sort);
    this.filterSub = Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.envVarsDataSource) { return; }
        this.envVarsDataSource.filter = this.filter.nativeElement.value;
      });
  }

  ngOnDestroy(): void {
    if (this.filterSub) {
      this.filterSub.unsubscribe();
    }
  }
}

export class AppEnvironemtEvnVarsDataSource extends DataSource<AppEnvVar> {

  constructor(private store: Store<AppState>, private _appService: ApplicationService, private _paginator: MdPaginator,
    private _sort: MdSort) {
    super();
    // this.isFetchingAppEnvVars$ = this._appService.appEnvVars$
    //   .map((envVars: AppMetadataInfo) => {
    //     if (envVars.metadataRequestState) {
    //       return envVars.metadataRequestState.fetching;
    //     }
    //     return !envVars.metadata;
    //   });
    // this.isUpdatingAppEnvVars$ = Observable.of(false);
    _sort.sort({ id: this._defaultSort.active, start: this._defaultSort.direction as 'asc' || 'desc', disableClear: true });
  }

  _defaultSort: Sort = { active: 'name', direction: 'asc' };
  _defaultPaginator = {};

  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  count$ = new BehaviorSubject(0);
  filteredCount$ = new BehaviorSubject(0);

  rows = new Array<AppEnvVar>();
  rowNames = new Array<string>();
  filteredRows = new Array<AppEnvVar>();

  selectedRows = new Map<string, AppEnvVar>();
  isSelecting$ = new BehaviorSubject(false);
  selectAllChecked = false;

  isAdding$ = new BehaviorSubject(false);

  addRow: AddAppEnvVar = {
    name: '',
    value: '',
    select: false
  };

  isFetchingAppEnvVars$: Observable<boolean>;
  isUpdatingAppEnvVars$: Observable<boolean>;

  addAppFocusEventEmitter = new EventEmitter<boolean>();

  startAdd() {
    this.addRow = {
      name: '',
      value: '',
      select: false
    };
    this.isAdding$.next(true);
    // this.addAppFocusEventEmitter.emit(true);
  }

  saveAdd() {
    const updateApp = this._createUpdateApplication(false);
    updateApp.environment_json[this.addRow.name] = this.addRow.value;
    this._appService.UpdateApplication(updateApp);
    this.isAdding$.next(false);
    this.addRow.select = true;
  }

  cancelAdd() {
    this.isAdding$.next(false);
  }

  selectedRowToggle(row: AppEnvVar) {
    const exists = this.selectedRows.has(row.name);
    if (exists) {
      this.selectedRows.delete(row.name);
    } else {
      this.selectedRows.set(row.name, row);
    }
    this.isSelecting$.next(this.selectedRows.size > 0);
  }

  selectAllFilteredRows(selectAll) {
    this.selectAllChecked = !this.selectAllChecked;
    for (const row of this.filteredRows) {
      if (this.selectAllChecked) {
        this.selectedRows.set(row.name, row);
      } else {
        this.selectedRows.delete(row.name);
      }
    }
    this.isSelecting$.next(this.selectedRows.size > 0);
  }

  selectedDelete() {
    const updateApp = this._createUpdateApplication(true);
    this._appService.UpdateApplication(updateApp);

    this.selectedRows.clear();
    this.isSelecting$.next(false);
  }

  startEdit(row: AppEnvVar) {
    row.edit = { ...row };
  }

  saveEdit(editedRow: AppEnvVar) {
    const updateApp = this._createUpdateApplication(false);
    updateApp.environment_json[editedRow.name] = editedRow.edit.value;

    this._appService.UpdateApplication(updateApp);
    delete editedRow.edit;
  }

  cancelEdit(row: AppEnvVar) {
    row.edit = null;
  }

  connect(): Observable<AppEnvVar[]> {
    return this._appService.isFetchingEnvVars$
      .combineLatest(this._appService.appEnvVars$)
      .filter(([isFetching, envVars]: [boolean, AppMetadataInfo]) => {
        return !isFetching && !!envVars.metadata;
      })
      .map(([isFetching, envVars]: [boolean, AppMetadataInfo]) => {
        return envVars;
      })
      .combineLatest(
      this._paginator.page.startWith(this._defaultPaginator),
      this._filterChange.startWith(''),
      this._sort.mdSortChange.startWith(this._defaultSort),
    )
      .map(([envVars, pageEvent, filter, sort]: [AppMetadataInfo, PageEvent, string, Sort]) => {
        // TODO: RC caching?? catch no-ops?
        const filtered = this._filterEnvVars(envVars, filter);

        const sorted = this._sortEnvVars(filtered, sort);

        const page = this._pageEnvVars(sorted, this._paginator);

        return page;
      });
  }

  disconnect() {
  }

  _filterEnvVars(envVars, filter: string): AppEnvVar[] {
    this.filteredRows.length = 0;
    this.rows.length = 0;

    for (const envVar in envVars.metadata.environment_json) {
      if (!envVars.metadata.environment_json.hasOwnProperty(envVar)) { continue; }

      const [name, value] = [envVar, envVars.metadata.environment_json[envVar]];
      this.rows.push({ name, value });
      this.rowNames.push(name);

      if (filter && filter.length > 0) {
        if (name.indexOf(filter) >= 0 || value.indexOf(filter) >= 0) {
          this.filteredRows.push({ name, value });
        }
      } else {
        this.filteredRows.push({ name, value });
      }
    }

    this.count$.next(this.rows.length);
    this.filteredCount$.next(this.filteredRows.length);

    return this.filteredRows;
  }

  _sortEnvVars(envVars: AppEnvVar[], sort: Sort): AppEnvVar[] {
    return envVars.slice().sort((a, b) => {
      // TODO: RC lower case strings?
      const [propertyA, propertyB] = [a[this._sort.active], b[this._sort.active]];
      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }

  _pageEnvVars(envVars: AppEnvVar[], paginator: MdPaginator): AppEnvVar[] {
    // Is the paginators pageIndex valid?
    if (paginator.pageIndex * paginator.pageSize > envVars.length) {
      paginator.pageIndex = Math.floor(envVars.length / paginator.pageSize);
    }
    // Should the paginator select a freshly added row?
    if (this.addRow.select) {
      for (let i = 0; i < envVars.length; i++) {
        if (envVars[i].name === this.addRow.name) {
          paginator.pageIndex = Math.floor(i / paginator.pageSize);
          this.addRow.select = false;
          break;
        }
      }
    }
    const startIndex: number = paginator.pageIndex * paginator.pageSize;
    return envVars.splice(startIndex, this._paginator.pageSize);
  }

  _createUpdateApplication(removeSelected: boolean): UpdateApplication {
    const updateApp: UpdateApplication = {
      environment_json: {}
    };
    for (const row of this.rows) {
      if (!removeSelected || !this.selectedRows.has(row.name)) {
        updateApp.environment_json[row.name] = row.value;
      }
    }
    return updateApp;
  }
}
