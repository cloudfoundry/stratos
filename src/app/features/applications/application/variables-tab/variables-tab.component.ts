import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ApplicationService } from '../../application.service';
import { Observable, Subscription } from 'rxjs/Rx';
import { DataSource } from '@angular/cdk/table';
import { AppMetadataInfo } from '../../../../store/actions/app-metadata.actions';
import { MdPaginator, PageEvent, MdSort, Sort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

interface AppEnvVar {
  name: string;
  value: string;
}

@Component({
  selector: 'app-variables-tab',
  templateUrl: './variables-tab.component.html',
  styleUrls: ['./variables-tab.component.scss']
})
export class VariablesTabComponent implements OnInit, OnDestroy {

  constructor(private appService: ApplicationService) { }

  envVarsDataSource: AppEnvironemtEvnVarsDataSource;

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MdSort) sort: MdSort;

  filterSub: Subscription;
  hasEnvVars$: Observable<boolean>;

  ngOnInit() {
    this.envVarsDataSource = new AppEnvironemtEvnVarsDataSource(this.appService, this.paginator, this.sort);
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

  constructor(private _appService: ApplicationService, private _paginator: MdPaginator, private _sort: MdSort) {
    super();
  }

  _defaultSort: Sort = { active: 'name', direction: 'asc' };
  _defaultPaginator = {};

  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  count$ = new BehaviorSubject(0);
  filteredCount$ = new BehaviorSubject(0);
  filteredItems: AppEnvVar[] = new Array<AppEnvVar>();

  selectedRows = new Map<string, AppEnvVar>();
  hasSelected$ = new BehaviorSubject(false);
  selectAllChecked = false;


  selectedRowToggle(row) {
    const exists = this.selectedRows.has(row.name);
    if (exists) {
      this.selectedRows.delete(row.name);
    } else {
      this.selectedRows.set(row.name, row);
    }
    this.hasSelected$.next(this.selectedRows.size > 0);
  }

  selectAllFilteredRows(selectAll) {
    this.selectAllChecked = !this.selectAllChecked;
    for (const row of this.filteredItems) {
      if (this.selectAllChecked) {
        this.selectedRows.set(row.name, row);
      } else {
        this.selectedRows.delete(row.name);
      }
    }
    this.hasSelected$.next(this.selectedRows.size > 0);
  }

  connect(): Observable<AppEnvVar[]> {
    return this._appService.appEnvVars$
      .filter((envVars: AppMetadataInfo) => {
        if (envVars.metadataRequestState) {
          return !envVars.metadataRequestState.fetching;
        }
        return !!envVars.metadata;
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
    this.filteredItems.length = 0;
    let count = 0;
    for (const envVar in envVars.metadata.environment_json) {
      if (!envVars.metadata.environment_json.hasOwnProperty(envVar)) { continue; }
      const [name, value] = [envVar, envVars.metadata.environment_json[envVar]];
      count++;
      if (filter && filter.length > 0) {
        if (name.indexOf(filter) >= 0 || value.indexOf(filter) >= 0) {
          this.filteredItems.push({ name, value });
        }
      } else {
        this.filteredItems.push({ name, value });
      }
    }
    this.count$.next(count);
    this.filteredCount$.next(this.filteredItems.length);
    return this.filteredItems;
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
    const startIndex = paginator.pageIndex * paginator.pageSize;
    return envVars.splice(startIndex, this._paginator.pageSize);
  }
}
