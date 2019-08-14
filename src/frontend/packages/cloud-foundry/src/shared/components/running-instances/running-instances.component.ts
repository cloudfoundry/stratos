import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GetAppStatsAction } from '../../../../../cloud-foundry/src/actions/app-metadata.actions';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { appStatsEntityType, cfEntityFactory } from '../../../../../cloud-foundry/src/cf-entity-factory';
import { PaginationMonitorFactory } from '../../../../../core/src/shared/monitors/pagination-monitor.factory';

@Component({
  selector: 'app-running-instances',
  templateUrl: './running-instances.component.html',
  styleUrls: ['./running-instances.component.scss']
})
export class RunningInstancesComponent implements OnInit {

  @Input() instances;
  @Input() cfGuid;
  @Input() appGuid;

  // Observable on the running instances count for the application
  public runningInstances$: Observable<number>;

  constructor(
    private store: Store<CFAppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) { }

  ngOnInit() {
    const dummyAction = new GetAppStatsAction(this.appGuid, this.cfGuid);
    const paginationMonitor = this.paginationMonitorFactory.create(
      dummyAction.paginationKey,
      cfEntityFactory(appStatsEntityType)
    );
    this.runningInstances$ =
      paginationMonitor.currentPage$
        .pipe(
          map(appInstancesPages => {
            const allInstances = [].concat.apply([], Object.values(appInstancesPages || [])).filter(instance => !!instance);
            return allInstances.filter(stat => stat.entity.state === 'RUNNING').length;
          })
        );
  }

}
