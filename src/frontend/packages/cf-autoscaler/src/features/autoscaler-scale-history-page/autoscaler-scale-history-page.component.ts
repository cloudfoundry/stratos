import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
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
export class AutoscalerScaleHistoryPageComponent implements OnInit {

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
