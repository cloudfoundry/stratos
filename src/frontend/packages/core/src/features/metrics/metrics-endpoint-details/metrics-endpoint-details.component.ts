import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { MetricsStratosAction } from 'frontend/packages/store/src/actions/metrics-api.actions';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { EndpointListDetailsComponent } from '../../../shared/components/list/list-types/endpoint/endpoint-list.helpers';
import { mapMetricsData } from '../metrics.helpers';
import { MetricsEndpointProvider, MetricsService } from '../services/metrics-service';
import { EndpointModel } from './../../../../../store/src/types/endpoint.types';


interface MetricsDetailsInfo {
  ok: number;
  total: number;
  warning: boolean;
  plural: boolean;
}

@Component({
  selector: 'app-metrics-endpoint-details',
  templateUrl: './metrics-endpoint-details.component.html',
  styleUrls: ['./metrics-endpoint-details.component.scss']
})
export class MetricsEndpointDetailsComponent extends EndpointListDetailsComponent {

  data$: Observable<MetricsDetailsInfo>;

  // The guid of the metrics endpoint that this row shows
  guid$ = new BehaviorSubject<string>(null);

  constructor(
    public store: Store<AppState>,
    private metricsService: MetricsService
  ) {
    super();

    // Raw endpoint data for this metrics endpoint
    this.data$ = combineLatest(
      this.metricsService.metricsEndpoints$,
      this.guid$.asObservable()).pipe(
        map(([endpoints, guid]) => endpoints.find((item) => item.provider.guid === guid)),
        filter(provider => !!provider),
        tap(data => {
          if (!this.hasStratosData(data)) {
            this.store.dispatch(new MetricsStratosAction(data.provider.guid));
          }
        }),
        map((provider) => this.processProvider(provider))
    );
  }

  private hasStratosData(provider: MetricsEndpointProvider): boolean {
    const data = provider.provider;
    return data && data.metadata && data.metadata.metrics_stratos && Array.isArray(data.metadata.metrics_stratos);
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
    this.guid$.next(data.guid);
  }
}
