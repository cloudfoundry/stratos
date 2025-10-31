import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';
import { map, share, startWith } from 'rxjs/operators';

import {
  ApplicationMonitorService,
} from '../../../../../../cloud-foundry/src/features/applications/application-monitor.service';
import { ApplicationService } from '../../../../../../cloud-foundry/src/features/applications/application.service';
import { pathGet } from '../../../../../../core/src/core/utils.service';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { TableCellStatusDirective } from '../../../../../../core/src/shared/components/list/list-table/table-cell-status.directive';
import { PercentagePipe } from '../../../../../../core/src/shared/pipes/percentage.pipe';
import { StratosStatus } from '../../../../../../store/src/types/shared.types';

@Component({
  selector: 'app-card-app-usage',
  templateUrl: './card-app-usage.component.html',
  styleUrls: ['./card-app-usage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CardStatusComponent,
    TableCellStatusDirective,
    PercentagePipe
  ]
})
export class CardAppUsageComponent implements OnInit {
  private appService = inject(ApplicationService);
  private appMonitor = inject(ApplicationMonitorService);

  appData$: Observable<any>;
  status$: Observable<StratosStatus>;

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
