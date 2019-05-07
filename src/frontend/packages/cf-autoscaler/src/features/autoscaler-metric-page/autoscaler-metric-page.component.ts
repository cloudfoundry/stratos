import { Component } from '@angular/core';

import { ApplicationService } from '../../../../core/src/features/applications/application.service';
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
export class AutoscalerMetricPageComponent {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;

  constructor(
    public applicationService: ApplicationService,
  ) {
  }

}
