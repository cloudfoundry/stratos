import { Component, EventEmitter, Input, type OnInit, Output , ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, type Observable, of } from 'rxjs';
import { filter, map, startWith, tap } from 'rxjs/operators';

import type { PaginationObservables, APIResource } from '@stratosui/store';
import type { IApp } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { appDataSort } from '../../cf/services/cloud-foundry-endpoint.service';
import {
  PollingIndicatorComponent,
  CardWrapperComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardContentComponent,
} from '@stratosui/core';
import { CompactAppCardComponent } from './compact-app-card/compact-app-card.component';


const RECENT_ITEMS_COUNT = 10;

@Component({
  selector: 'app-card-cf-recent-apps',
  templateUrl: './card-cf-recent-apps.component.html',
  styleUrls: ['./card-cf-recent-apps.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
    PollingIndicatorComponent,
    CompactAppCardComponent,
    CardWrapperComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
  ]
})
export class CardCfRecentAppsComponent implements OnInit {

  public recentApps$: Observable<APIResource<IApp>[]>;
  @Input() allApps$!: Observable<APIResource<IApp>[]>;
  @Input() loading$!: Observable<boolean>;
  @Output() refresh = new EventEmitter<void>();
  @Input() endpoint!: string;
  @Input() mode!: string;
  @Input() showDate = true;
  @Input() dateMode!: string;
  @Input() noStats = false;
  @Input() placeholderMode = false;
  @Input() hideWhenEmpty = false;

  public canRefresh = false;

  public placeholders: Array<{ metadata: { guid: string }; entity: Record<string, unknown> }>;

  appsPagObs!: PaginationObservables<APIResource<IApp>>;

  hasEntities$!: Observable<boolean>;
  show$!: Observable<boolean>;

  private maxRowsSubject = new BehaviorSubject<number>(RECENT_ITEMS_COUNT);

  @Input() set maxRows(value: number) {
    this.maxRowsSubject.next(value);
    this.placeholders = this.createPlaceholders(value);
  }

  constructor() {
    this.placeholders = this.createPlaceholders(RECENT_ITEMS_COUNT);
  }

  private createPlaceholders(count: number): Array<{ metadata: { guid: string }; entity: Record<string, unknown> }> {
    return Array.from({ length: count }, (_, i) => ({
      metadata: { guid: `placeholder-${i}` },
      entity: {}
    }));
  }

  trackByAppGuid(index: number, app: APIResource<IApp> | { metadata: { guid: string }; entity: Record<string, unknown> }): string {
    return app?.metadata?.guid || String(index);
  }

  ngOnInit() {
    if (this.placeholderMode) {
      this.canRefresh = false;
      this.hasEntities$ = of(false);
      return;
    }
    this.canRefresh = this.refresh.observers.length > 0;
    this.appsPagObs = cfEntityCatalog.application.store.getPaginationService(this.endpoint, null);
    if (!this.allApps$) {
      this.allApps$ = this.appsPagObs.entities$;
      this.loading$ = this.appsPagObs.fetchingEntities$;
      this.hasEntities$ = this.appsPagObs.hasEntities$;
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
    if (!this.noStats) {
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
