import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/shared/services/application.service';
import { ListConfig } from '../../../../core/src/shared/components/list/list.component.types';
import {
  AppAutoscalerMetricChartListConfigService,
} from '../../shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-list-config.service';

@Component({
  selector: 'app-autoscaler-metric-page',
  templateUrl: './autoscaler-metric-page.component.html',
  styleUrls: ['./autoscaler-metric-page.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: AppAutoscalerMetricChartListConfigService
    }
  ]
})
export class AutoscalerMetricPageComponent implements OnInit {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;
  applicationName$: Observable<string>;

  constructor(
    public applicationService: ApplicationService,
  ) {
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.name : null),
      publishReplay(1),
      refCount()
    );
  }

}
