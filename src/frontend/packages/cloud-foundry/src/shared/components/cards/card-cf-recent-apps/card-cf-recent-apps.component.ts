import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { filter, map, startWith, tap } from 'rxjs/operators';

import { PaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IApp } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { appDataSort } from '../../../../features/cf/services/cloud-foundry-endpoint.service';

const RECENT_ITEMS_COUNT = 10;

@Component({
  selector: 'app-card-cf-recent-apps',
  templateUrl: './card-cf-recent-apps.component.html',
  styleUrls: ['./card-cf-recent-apps.component.scss'],
})
export class CardCfRecentAppsComponent implements OnInit {

  public recentApps$: Observable<APIResource<IApp>[]>;
  @Input() allApps$: Observable<APIResource<IApp>[]>;
  @Input() loading$: Observable<boolean>;
  @Output() refresh = new EventEmitter<any>();
  @Input() endpoint: string;
  @Input() mode: string;
  @Input() showDate = true;
  @Input() dateMode: string;
  @Input() noStats = false;
  @Input() placeholderMode = false;
  @Input() hideWhenEmpty = false;

  public canRefresh = false;

  public placeholders: any[];

  appsPagObs: PaginationObservables<APIResource<IApp>>;

  hasEntities$: Observable<boolean>;
  show$: Observable<boolean>;

  private maxRowsSubject = new BehaviorSubject<number>(RECENT_ITEMS_COUNT);

  @Input() set maxRows(value: number) {
    this.maxRowsSubject.next(value);
    this.placeholders = new Array(value).fill(null);
  }

  constructor() {
    this.placeholders = new Array(RECENT_ITEMS_COUNT).fill(null);
  }

  ngOnInit() {
    if (this.placeholderMode) {
      this.canRefresh = false;
      this.hasEntities$ = of(false);
      return;
    }
    this.canRefresh = this.refresh.observers.length > 0;
    this.appsPagObs = cfEntityCatalog.application.store.getPaginationService(this.endpoint);
    if (!this.allApps$) {
      this.allApps$ = this.appsPagObs.entities$;
      this.loading$ = this.appsPagObs.fetchingEntities$;
      this.hasEntities$ = this.appsPagObs.hasEntities$
    } else {
      this.hasEntities$ = of(true);
    }

    this.recentApps$ = combineLatest(
      this.allApps$,
      this.maxRowsSubject.asObservable()
    ).pipe(
      filter(([apps]) => !!apps),
      map(([apps, maxRows]) => this.restrictApps(apps, maxRows)),
      tap(apps => this.fetchAppStats(apps))
    );

    this.show$ = this.allApps$.pipe(
      map(apps => {
        return !this.hideWhenEmpty || this.hideWhenEmpty && apps.length > 0;
      }),
      startWith(true),
    );
  }

  private fetchAppStats(recentApps: APIResource<IApp>[]) {
    if(!this.noStats) {
      recentApps.forEach(app => {
        if (app.entity.state === 'STARTED') {
          cfEntityCatalog.appStats.api.getMultiple(app.metadata.guid, this.endpoint);
        }
      });
    }
  }

  private restrictApps(apps: APIResource<IApp>[], maxRows = RECENT_ITEMS_COUNT): APIResource<IApp>[] {
    if (!apps) {
      return [];
    }
    return apps.sort(appDataSort).slice(0, maxRows);
  }

}
