import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GetAppStatsAction } from '../../../../../cloud-foundry/src/actions/app-metadata.actions';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { AppStat } from '../../../store/types/app-metadata.types';

@Component({
  selector: 'app-running-instances',
  templateUrl: './running-instances.component.html',
  styleUrls: ['./running-instances.component.scss']
})
export class RunningInstancesComponent implements OnInit {
  @Input() instances: number;
  @Input() cfGuid: string;
  @Input() appGuid: string;

  // Observable on the running instances count for the application
  public runningInstances$: Observable<number>;

  constructor(private paginationMonitorFactory: PaginationMonitorFactory) { }

  ngOnInit() {
    const dummyAction = new GetAppStatsAction(this.appGuid, this.cfGuid);
    const paginationMonitor = this.paginationMonitorFactory.create<AppStat>(
      dummyAction.paginationKey,
      dummyAction,
      dummyAction.flattenPagination
    );
    this.runningInstances$ = paginationMonitor.currentPage$.pipe(
      map(appInstancesPages => {
        const allInstances = [].concat.apply([], Object.values(appInstancesPages || [])).filter(instance => !!instance);
        return allInstances.filter(stat => stat.state === 'RUNNING').length;
      })
    );
  }

}
