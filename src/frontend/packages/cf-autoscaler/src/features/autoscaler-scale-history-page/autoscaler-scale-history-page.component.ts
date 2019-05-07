import { Component } from '@angular/core';

import { ApplicationService } from '../../../../core/src/features/applications/application.service';
import { ListConfig } from '../../../../core/src/shared/components/list/list.component.types';
import {
  CfAppAutoscalerEventsConfigService,
} from '../../shared/list-types/app-autoscaler-event/cf-app-autoscaler-events-config.service';

@Component({
  selector: 'app-autoscaler-scale-history-page',
  templateUrl: './autoscaler-scale-history-page.component.html',
  styleUrls: ['./autoscaler-scale-history-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfAppAutoscalerEventsConfigService,
  }]
})
export class AutoscalerScaleHistoryPageComponent {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;

  constructor(
    public applicationService: ApplicationService,
  ) {
  }
}
