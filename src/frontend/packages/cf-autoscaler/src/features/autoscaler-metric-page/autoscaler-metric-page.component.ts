import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, type OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import type { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { CustomIconComponent, ListComponent, ListConfig, PageHeaderComponent } from '@stratosui/core';
import type { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import type { IApp } from '../../../../cloud-foundry/src/cf-api.types';
import {
  AppAutoscalerMetricChartListConfigService,
} from '../../shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-list-config.service';

@Component({
  selector: 'app-autoscaler-metric-page',
  templateUrl: './autoscaler-metric-page.component.html',
  styleUrls: ['./autoscaler-metric-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent,
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
  applicationName$!: Observable<string>;

  constructor(
    public applicationService: ApplicationService,
    private cdr: ChangeDetectorRef
  ) {
    this.parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map((appInfo: EntityInfo<APIResource<IApp>>) => {
        const entity = appInfo.entity;
        return entity && 'entity' in entity ? entity.entity.name : null;
      }),
      publishReplay(1),
      refCount()
    );
    this.cdr.markForCheck();
  }

}
