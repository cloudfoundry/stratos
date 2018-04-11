import { Component, OnInit } from '@angular/core';
import { MetricsService, MetricsEndpointProvider } from '../services/metrics-service';

import { getNameForEndpointType } from '../../endpoints/endpoint-helpers';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../../cloud-foundry/cf.helpers';
import { map, first } from 'rxjs/operators';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent {

  getNameForEndpointType = getNameForEndpointType;

  metricsEndpoint$: Observable<MetricsEndpointProvider>;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  constructor(private activatedRoute: ActivatedRoute, private metricsService: MetricsService) {

    const metricsGuid = getIdFromRoute(activatedRoute, 'metricsId');

    this.metricsEndpoint$ = metricsService.metricsEndpoints$.pipe(
      map((ep) => ep.find((item) => item.provider.guid === metricsGuid))
    );

    this.breadcrumbs$ = this.metricsEndpoint$.pipe(
      map(endpoint => ([
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
