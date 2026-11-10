import { Component, OnInit, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe, CommonModule } from '@angular/common';
import { isObservable, Observable, of, Subject } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { APIResource } from '@stratosui/store';
import { IApp } from '../../../cf-api.types';
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

  // Callers with a signal pass its value (home card); the Observable form
  // stays for the service pipelines (CF, org and space summaries).
  readonly allApps$ = input<APIResource<IApp>[] | Observable<APIResource<IApp>[]>>();
  readonly loading$ = input<boolean | Observable<boolean>>();
  // Backed by a Subject so ngOnInit can tell whether a parent listens:
  // the subject is observed only while a (refresh) binding exists.
  protected readonly refresh$ = new Subject<void>();
  readonly refresh = outputFromObservable(this.refresh$);
  readonly endpoint = input<string>();
  readonly mode = input<string>();
  readonly showDate = input(true);
  readonly dateMode = input<string>();
  // Passed to each row: show cached stats only, fetch none.
  readonly placeholderMode = input(false);
  readonly hideWhenEmpty = input(false);
  readonly maxRows = input(RECENT_ITEMS_COUNT);

  // Set once in ngOnInit, before the first render.
  public canRefresh = false;

  // Only the count matters: each placeholder row renders with a null app.
  readonly placeholders = computed(() => Array.from({ length: this.maxRows() }, (_, i) => i));

  // Each is a stream the template reads with `async`; a new input value
  // yields a new stream, which the pipe re-subscribes to.
  private readonly apps$ = computed(() => {
    const value = this.allApps$();
    return isObservable(value) ? value : of(value ?? []);
  });
  // Not loading when none is given.
  protected readonly appsLoading$ = computed(() => {
    const value = this.loading$();
    return isObservable(value) ? value : of(!!value);
  });
  // Stats are loaded by each row (CompactAppCardComponent), once per
  // started app; the registry shares the request between rows.
  protected readonly recentApps$ = computed(() => {
    const maxRows = this.maxRows();
    return this.apps$().pipe(
      filter(apps => !!apps),
      map(apps => this.restrictApps(apps, maxRows)),
    );
  });
  protected readonly show$ = computed(() => {
    const hideWhenEmpty = this.hideWhenEmpty();
    return this.apps$().pipe(
      map(apps => !hideWhenEmpty || apps.length > 0),
      startWith(true),
    );
  });

  ngOnInit() {
    this.canRefresh = !this.placeholderMode() && this.refresh$.observed;
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
