import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GetAppStatsAction } from '../../../../../cloud-foundry/src/actions/app-metadata.actions';
import { appStatsEntityType, cfEntityFactory } from '../../../../../cloud-foundry/src/cf-entity-factory';
import { AppStat } from '../../../../../cloud-foundry/src/store/types/app-metadata.types';
import { PaginationMonitorFactory } from '../../../../../core/src/shared/monitors/pagination-monitor.factory';

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
      cfEntityFactory(appStatsEntityType)
    );
    this.runningInstances$ =
      paginationMonitor.currentPage$
        .pipe(
          map((appInstancesPages) => {
            const allInstances = [].concat.apply([], Object.values(appInstancesPages || [])).filter(instance => !!instance);
            return allInstances.filter((stat) => stat.state === 'RUNNING').length;
          })
        );
  }

}
