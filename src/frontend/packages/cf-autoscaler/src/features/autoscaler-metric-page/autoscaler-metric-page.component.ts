import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { ListComponent } from '../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../core/src/shared/components/list/list.component.types';
import { PageHeaderComponent } from '../../../../core/src/shared/components/page-header/page-header.component';
import {
  AppAutoscalerMetricChartListConfigService,
} from '../../shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-list-config.service';

@Component({
  selector: 'app-autoscaler-metric-page',
  templateUrl: './autoscaler-metric-page.component.html',
  styleUrls: ['./autoscaler-metric-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    ListComponent,
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: AppAutoscalerMetricChartListConfigService
    }
  ],
})
export class AutoscalerMetricPageComponent implements OnInit {

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
