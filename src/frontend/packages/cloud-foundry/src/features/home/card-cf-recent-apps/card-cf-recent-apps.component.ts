import { Component, EventEmitter, Injector, OnInit, Output, Signal, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe, CommonModule } from '@angular/common';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { APIResource } from '@stratosui/store';
import { IApp } from '../../../cf-api.types';
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
  readonly allApps$ = input<Observable<APIResource<IApp>[]>>();
  readonly loading$ = input<Observable<boolean>>();
  @Output() refresh = new EventEmitter<any>();
  readonly endpoint = input<string>();
  readonly mode = input<string>();
  readonly showDate = input(true);
  readonly dateMode = input<string>();
  // Passed to each row: show cached stats only, fetch none.
  readonly noStats = input(false);
  readonly placeholderMode = input(false);
  readonly hideWhenEmpty = input(false);
  readonly maxRows = input(RECENT_ITEMS_COUNT);

  // Set once in ngOnInit, before the first render.
  public canRefresh = false;

  // Only the count matters: each placeholder row renders with a null app.
  readonly placeholders = computed(() => Array.from({ length: this.maxRows() }, (_, i) => i));

  hasEntities$!: Observable<boolean>;
  show$!: Observable<boolean>;
  // The loading$ input, or the endpoint data's loading signal when the
  // card sources its own apps.
  appsLoading$!: Observable<boolean>;

  private readonly registry = inject(EndpointDataRegistry);
  private readonly injector = inject(Injector);

  private readonly maxRows$ = toObservable(this.maxRows);

  ngOnInit() {
    if (this.placeholderMode()) {
      this.canRefresh = false;
      this.hasEntities$ = of(false);
      return;
    }
    this.canRefresh = this.refresh.observers.length > 0;
    let allApps$ = this.allApps$();
    this.appsLoading$ = this.loading$() ?? of(false);
    if (!allApps$) {
      // Signal-native source — EndpointDataService.apps is populated by the
      // registry-managed loadDetails() call. The home card path warms via
      // load() (recent apps fast path) and then loadDetails() chains; the
      // CF/org/space summary acquire path goes straight to loadDetails().
      // Either way we read the same signal — no separate ngrx fetch.
      // strict: a card without allApps$ is always given its endpoint.
      const endpointData = this.registry.acquire(this.endpoint()!);
      const appResources: Signal<APIResource<IApp>[]> = computed(
        () => endpointData.apps().map(stAppToAPIResource),
      );
      allApps$ = toObservable(appResources, { injector: this.injector });
      this.appsLoading$ = toObservable(endpointData.isLoadingDetails, { injector: this.injector });
      this.hasEntities$ = toObservable(
        computed(() => endpointData.apps().length > 0),
        { injector: this.injector },
      );
    } else {
      this.hasEntities$ = of(true);
    }

    // Stats are loaded by each row (CompactAppCardComponent), once per
    // started app; the registry shares the request between rows.
    this.recentApps$ = combineLatest(
      allApps$,
      this.maxRows$,
    ).pipe(
      filter(([apps]) => !!apps),
      map(([apps, maxRows]) => this.restrictApps(apps, maxRows)),
    );

    this.show$ = allApps$.pipe(
      map(apps => {
        return !this.hideWhenEmpty() || this.hideWhenEmpty() && apps.length > 0;
      }),
      startWith(true),
    );
  }

  private restrictApps(apps: APIResource<IApp>[], maxRows = RECENT_ITEMS_COUNT): APIResource<IApp>[] {
    if (!apps) {
      return [];
    }
    // Copy first: the array may be a signal's value, which must not be
    // sorted in place.
    return [...apps].sort(appDataSort).slice(0, maxRows);
  }

}
