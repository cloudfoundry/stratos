import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { getIdFromRoute } from '../../cloud-foundry/cf.helpers';
import { getNameForEndpointType } from '../../endpoints/endpoint-helpers';
import { MetricsEndpointProvider, MetricsService } from '../services/metrics-service';

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent {

  getNameForEndpointType = getNameForEndpointType;

  public metricsEndpoint$: Observable<MetricsEndpointProvider>;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  constructor(activatedRoute: ActivatedRoute, metricsService: MetricsService) {

    const metricsGuid = getIdFromRoute(activatedRoute, 'metricsId');

    this.metricsEndpoint$ = metricsService.metricsEndpoints$.pipe(
      map((ep) => ep.find((item) => item.provider.guid === metricsGuid))
    );

    this.breadcrumbs$ = this.metricsEndpoint$.pipe(
      map(() => ([
        {
          breadcrumbs: [
            {
              value: 'Endpoints',
              routerLink: `/endpoints`
            }
          ]
        }
      ])),
      first()
    );
  }

}
