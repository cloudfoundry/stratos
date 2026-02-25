import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';
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

  appData$!: Observable<any>;
  status$!: Observable<StratosStatus>;

  ngOnInit() {
    this.appData$ = observableCombineLatest(
      this.appMonitor.appMonitor$.pipe(startWith(null)),
      this.appService.applicationRunning$,
    ).pipe(
      map(([monitor, isRunning]) => ({
        monitor,
        isRunning,
        status: !isRunning ? 'tentative' : pathGet('status.usage', monitor)
      })),
      share()
    );
    this.status$ = this.appData$.pipe(
      map(data => data.status)
    );
  }
}
