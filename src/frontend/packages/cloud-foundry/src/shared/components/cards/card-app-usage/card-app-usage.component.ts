import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { combineLatest as observableCombineLatest, type Observable } from 'rxjs';
import { map, share, startWith } from 'rxjs/operators';

import { ApplicationMonitorService } from '../../../../features/applications/application-monitor.service';
import { ApplicationService } from '../../../../features/applications/application.service';
import {
  pathGet,
  CardWrapperComponent,
  CardStatusComponent,
  CardContentComponent,
  CardHeaderComponent,
  CardTitleComponent,
  TableCellStatusDirective,
  PercentagePipe
} from '@stratosui/core';
import { StratosStatus } from '@stratosui/store';

@Component({
  selector: 'app-card-app-usage',
  templateUrl: './card-app-usage.component.html',
  styleUrls: ['./card-app-usage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CardWrapperComponent,
    CardStatusComponent,
    CardContentComponent,
    CardHeaderComponent,
    CardTitleComponent,
    TableCellStatusDirective,
    PercentagePipe
  ]
})
export class CardAppUsageComponent implements OnInit {
  private appService = inject(ApplicationService);
  private appMonitor = inject(ApplicationMonitorService);

  appData$!: Observable<{ monitor: unknown; isRunning: boolean; status: StratosStatus }>;
  status$!: Observable<StratosStatus>;

  ngOnInit() {
    this.appData$ = observableCombineLatest(
      this.appMonitor.appMonitor$.pipe(startWith(null)),
      this.appService.applicationRunning$,
    ).pipe(
      map(([monitor, isRunning]) => ({
        monitor,
        isRunning,
        status: !isRunning ? StratosStatus.TENTATIVE : (pathGet('status.usage', monitor) as StratosStatus)
      })),
      share()
    );
    this.status$ = this.appData$.pipe(
      map(data => data.status)
    );
  }
}
