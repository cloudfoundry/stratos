import { Component, EventEmitter, Injector, Input, OnInit, Output, Signal, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe, CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { filter, map, startWith, tap } from 'rxjs/operators';

import { APIResource } from '@stratosui/store';
import { IApp } from '../../../cf-api.types';
import { AppStatsDataRegistry } from '../../../services/endpoint-data/app-stats-data.registry';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { stAppToAPIResource } from '../../../services/endpoint-data/st-app-adapter';
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

  // strict: assigned in ngOnInit for the live path; in placeholderMode the
  // hasEntities$=of(false) gate makes the template render placeholders and
  // never read recentApps$, so the field is never observed unassigned.
  public recentApps$!: Observable<APIResource<IApp>[]>;
  @Input() allApps$!: Observable<APIResource<IApp>[]>;
  @Input() loading$!: Observable<boolean>;
  @Output() refresh = new EventEmitter<any>();
  @Input() endpoint!: string;
  @Input() mode!: string;
  @Input() showDate = true;
  @Input() dateMode!: string;
  @Input() noStats = false;
  @Input() placeholderMode = false;
  @Input() hideWhenEmpty = false;

  public canRefresh = false;

  public placeholders: any[];

  hasEntities$!: Observable<boolean>;
  show$!: Observable<boolean>;

  private readonly registry = inject(EndpointDataRegistry);
  private readonly statsRegistry = inject(AppStatsDataRegistry);
  private readonly injector = inject(Injector);
  private statsRequested = new Set<string>();

  private maxRowsSubject = new BehaviorSubject<number>(RECENT_ITEMS_COUNT);

  @Input() set maxRows(value: number) {
    this.maxRowsSubject.next(value);
    this.placeholders = this.createPlaceholders(value);
  }

  constructor() {
    this.placeholders = this.createPlaceholders(RECENT_ITEMS_COUNT);
  }

  private createPlaceholders(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      metadata: { guid: `placeholder-${i}` },
      entity: {}
    }));
  }

  trackByAppGuid(index: number, app: any): string {
    return app?.metadata?.guid || String(index);
  }

  ngOnInit() {
    if (this.placeholderMode) {
      this.canRefresh = false;
      this.hasEntities$ = of(false);
      return;
    }
    this.canRefresh = this.refresh.observers.length > 0;
    if (!this.allApps$) {
      // Signal-native source — EndpointDataService.apps is populated by the
      // registry-managed loadDetails() call. The home card path warms via
      // load() (recent apps fast path) and then loadDetails() chains; the
      // CF/org/space summary acquire path goes straight to loadDetails().
      // Either way we read the same signal — no separate ngrx fetch.
      const endpointData = this.registry.acquire(this.endpoint);
      const appResources: Signal<APIResource<IApp>[]> = computed(
        () => endpointData.apps().map(stAppToAPIResource),
      );
      this.allApps$ = toObservable(appResources, { injector: this.injector });
      this.loading$ = toObservable(endpointData.isLoadingDetails, { injector: this.injector });
      this.hasEntities$ = toObservable(
        computed(() => endpointData.apps().length > 0),
        { injector: this.injector },
      );
    } else {
      this.hasEntities$ = of(true);
    }

    this.recentApps$ = combineLatest(
      this.allApps$,
      this.maxRowsSubject.asObservable()
    ).pipe(
      filter(([apps]) => !!apps),
      map(([apps, maxRows]) => this.restrictApps(apps, maxRows)),
      // Stats fetch is gated by a per-(guid,endpoint) Set so the back-to-back
      // signal emissions during loadDetails() warming don't fan out into
      // duplicate /v2/apps/:guid/stats calls. Each app's stats fire at most
      // once per card lifetime; refresh() clears the gate.
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
    if (this.noStats) return;
    recentApps.forEach(app => {
      if (app.entity.state !== 'STARTED') return;
      const key = `${this.endpoint}:${app.metadata.guid}`;
      if (this.statsRequested.has(key)) return;
      this.statsRequested.add(key);
      this.statsRegistry.acquire(this.endpoint, app.metadata.guid).load();
    });
  }

  private restrictApps(apps: APIResource<IApp>[], maxRows = RECENT_ITEMS_COUNT): APIResource<IApp>[] {
    if (!apps) {
      return [];
    }
    return apps.sort(appDataSort).slice(0, maxRows);
  }

}
