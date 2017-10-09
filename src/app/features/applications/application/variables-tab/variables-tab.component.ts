import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
export class VariablesTabComponent implements OnInit {

  constructor(private appService: ApplicationService) { }

  envVarsEnvironment: AppEnvironemtEvnVarsDataSource;

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MdSort) sort: MdSort;

  ngOnInit() {
    this.envVarsEnvironment = new AppEnvironemtEvnVarsDataSource(this.appService, this.paginator, this.sort);
    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.envVarsEnvironment) { return; }
        this.envVarsEnvironment.filter = this.filter.nativeElement.value;
      });
  }

}

export class AppEnvironemtEvnVarsDataSource extends DataSource<AppEnvVar> {

  constructor(private _appService: ApplicationService, private _paginator: MdPaginator, private _sort: MdSort) {
    super();
  }

  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  count$: Observable<number>;

  connect(): Observable<AppEnvVar[]> {


    return this._appService.appEnvVars$
      .filter((envVars: AppMetadataInfo) => {
        if (envVars.metadataRequestState) {
          return !envVars.metadataRequestState.fetching;
        }
        return !!envVars.metadata;
      })
      .combineLatest(
      this._paginator.page.startWith({}),
      this._filterChange.startWith(''),
      this._sort.mdSortChange.startWith({ active: 'name', direction: 'asc' }),
    )
      .map(([envVars, pageEvent, filter, sort]: [AppMetadataInfo, PageEvent, string, Sort]) => {
        // TODO: RC caching??
        let appEnvVars: AppEnvVar[] = new Array<AppEnvVar>();
        for (const envVar in envVars.metadata.environment_json) {
          if (!envVars.metadata.environment_json.hasOwnProperty(envVar)) { continue; }
          const [name, value] = [envVar, envVars.metadata.environment_json[envVar]];
          if (filter && filter.length > 0) {
            if (name.indexOf(filter) >= 0 || value.indexOf(filter) >= 0) {
              appEnvVars.push({ name, value });
            }
          } else {
            appEnvVars.push({ name, value });
          }
        }
        const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
        this.count$ = Observable.of(appEnvVars.length);
        if (this._sort.active && this._sort.direction !== '') {
          appEnvVars = appEnvVars.sort((a, b) => {
            // TODO: RC lower case strings?
            const [propertyA, propertyB] = [a[this._sort.active], b[this._sort.active]];
            const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
            const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

            return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
          });
        }
        return appEnvVars.splice(startIndex, this._paginator.pageSize);
      });
  }

  disconnect() {
  }
}
