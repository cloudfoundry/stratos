import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { MetricsStratosAction, AppState, EndpointModel } from '@stratosui/store';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, publishReplay, refCount, tap } from 'rxjs/operators';

import { EndpointListDetailsComponent } from '../../../shared/components/list/list-types/endpoint/endpoint-list.helpers';
import { mapMetricsData } from '../metrics.helpers';
import { MetricsEndpointProvider, MetricsService } from '../services/metrics-service';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

interface MetricsDetailsInfo {
  ok: number;
  total: number;
  warning: boolean;
  plural: boolean;
}

@Component({
  selector: 'app-metrics-endpoint-details',
  templateUrl: './metrics-endpoint-details.component.html',
  styleUrls: ['./metrics-endpoint-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent
  ]
})
export class MetricsEndpointDetailsComponent extends EndpointListDetailsComponent {

  data$: Observable<MetricsDetailsInfo>;

  // The guid of the metrics endpoint that this row shows
  private _guid = signal<string>(null);
  public guid = this._guid.asReadonly();
  public guid$: Observable<string>;

  constructor(
    public store: Store<AppState>,
    private metricsService: MetricsService
  ) {
    super();

    const endpoints$ = this.metricsService.metricsEndpoints$.pipe(
      filter(endpoints => !!endpoints),
      distinctUntilChanged()
    );

    this.guid$ = toObservable(this._guid);
    const guid$ = this.guid$.pipe(
      filter(guid => !!guid),
      distinctUntilChanged()
    );

    // Raw endpoint data for this metrics endpoint
    this.data$ = combineLatest(
      endpoints$,
      guid$
    ).pipe(
      map(([endpoints, guid]) => endpoints.find((item) => item.provider.guid === guid)),
      filter(provider => !!provider),
      filter(data => data.provider.connectionStatus === 'connected'),
      tap(data => {
        if (!this.hasStratosData(data)) {
          this.store.dispatch(new MetricsStratosAction(data.provider.guid));
        }
      }),
      map((provider) => this.processProvider(provider)),
      publishReplay(1),
      refCount()
    );
  }

  private hasStratosData(provider: MetricsEndpointProvider): boolean {
    const data = provider.provider;
    return !!data && !!data.metadata && !!data.metadata.metrics_stratos;
  }

  private processProvider(provider: MetricsEndpointProvider): MetricsDetailsInfo {
    const hasStratosData = this.hasStratosData(provider);
    const parsed = mapMetricsData(provider);
    const known = parsed.filter(item => item.known).length;
    return {
      ok: known,
      total: hasStratosData ? parsed.length : -1,
      warning: known === 0,
      plural: hasStratosData ? parsed.length !== 1 : known !== 1,
    };
  }

  @Input()
  set row(data: EndpointModel) {
    super.row = data;
    this._guid.set(data.guid);
  }
}
