import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { GetAppStatsAction } from '../../../store/actions/app-metadata.actions';
import { AppState } from '../../../store/app-state';
import { getPaginationPages } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { AppStatSchema, AppStatsSchema } from '../../../store/types/app-metadata.types';
import { PaginationMonitorFactory } from '../../monitors/pagination-monitor.factory';

@Component({
  selector: 'app-running-instances',
  templateUrl: './running-instances.component.html',
  styleUrls: ['./running-instances.component.scss']
})
export class RunningInstancesComponent implements OnInit {

  @Input('instances') instances;
  @Input('cfGuid') cfGuid;
  @Input('appGuid') appGuid;

  // Observable on the running instances count for the application
  private runningInstances$: Observable<number>;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) { }

  ngOnInit() {
    const dummyAction = new GetAppStatsAction(this.appGuid, this.cfGuid);
    const paginationMonitor = this.paginationMonitorFactory.create(
      dummyAction.paginationKey,
      AppStatSchema
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
