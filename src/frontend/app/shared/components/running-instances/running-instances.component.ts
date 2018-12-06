import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GetAppStatsAction } from '../../../store/actions/app-metadata.actions';
import { AppState } from '../../../store/app-state';
import { PaginationMonitorFactory } from '../../monitors/pagination-monitor.factory';
import { entityFactory } from '../../../store/helpers/entity-factory';
import { appStatsSchemaKey } from '../../../store/helpers/entity-factory';

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
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) { }

  ngOnInit() {
    const dummyAction = new GetAppStatsAction(this.appGuid, this.cfGuid);
    const paginationMonitor = this.paginationMonitorFactory.create(
      dummyAction.paginationKey,
      entityFactory(appStatsSchemaKey)
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
