import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { ListConfig, CustomIconComponent, PageHeaderModule, ListComponent } from '@stratosui/core';
import {
  CfAppAutoscalerEventsConfigService,
} from '../../shared/list-types/app-autoscaler-event/cf-app-autoscaler-events-config.service';

@Component({
  selector: 'app-autoscaler-scale-history-page',
  templateUrl: './autoscaler-scale-history-page.component.html',
  styleUrls: ['./autoscaler-scale-history-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: ListConfig,
    useClass: CfAppAutoscalerEventsConfigService,
  }],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderModule,
    ListComponent,
    CustomIconComponent,
  ]
})
export class AutoscalerScaleHistoryPageComponent implements OnInit {

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
      map(({ entity }) => entity ? entity.entity.name : null),
      publishReplay(1),
      refCount()
    );
    this.cdr.markForCheck();
  }

}
