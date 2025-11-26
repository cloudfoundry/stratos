import { Component, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import type { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import {
  ApplicationMonitorService,
} from '../../../../../../cloud-foundry/src/features/applications/application-monitor.service';
import { ApplicationService } from '../../../../../../cloud-foundry/src/features/applications/application.service';
import { UptimePipe } from '@stratosui/core';
import { MetadataItemComponent } from '@stratosui/core';

@Component({
  selector: 'app-card-app-uptime',
  templateUrl: './card-app-uptime.component.html',
  styleUrls: ['./card-app-uptime.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    UptimePipe,
    MetadataItemComponent
  ]
})
export class CardAppUptimeComponent implements OnInit {
  public appService = inject(ApplicationService);
  private appMonitor = inject(ApplicationMonitorService);

  appData$!: Observable<{
    maxUptime: number,
    minUptime: number,
    averageUptime: number,
    runningCount: number
  }>;

  ngOnInit() {
    this.appData$ = this.appMonitor.appMonitor$.pipe(
      map(monitor => ({
        maxUptime: monitor.max.uptime,
        minUptime: monitor.min.uptime,
        averageUptime: monitor.avg.uptime,
        runningCount: monitor.running
      })),
      startWith({
        maxUptime: 0,
        minUptime: 0,
        averageUptime: 0,
        runningCount: 0
      })
    );
  }
}
