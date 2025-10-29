import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { ListConfig } from '../../../../core/src/shared/components/list/list.component.types';
import {
  CfAppAutoscalerEventsConfigService,
} from '../../shared/list-types/app-autoscaler-event/cf-app-autoscaler-events-config.service';
import { PageHeaderModule } from '../../../../core/src/shared/components/page-header/page-header.module';
import { ListComponent } from '../../../../core/src/shared/components/list/list.component';
import { CustomIconComponent } from '@stratosui/core';

@Component({
  selector: 'app-autoscaler-scale-history-page',
  templateUrl: './autoscaler-scale-history-page.component.html',
  styleUrls: ['./autoscaler-scale-history-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfAppAutoscalerEventsConfigService,
  }],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderModule,
    ListComponent,
    CustomIconComponent,
  ]
})
export class AutoscalerScaleHistoryPageComponent implements OnInit {

  parentUrl: string;
  applicationName$: Observable<string>;

  constructor(
    public applicationService: ApplicationService,
  ) {
    this.parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.name : null),
      publishReplay(1),
      refCount()
    );
  }

}
