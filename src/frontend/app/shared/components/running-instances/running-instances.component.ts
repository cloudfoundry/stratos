import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { GetAppStatsAction } from '../../../store/actions/app-metadata.actions';
import { AppState } from '../../../store/app-state';
import { getPaginationPages } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { AppStatsSchema } from '../../../store/types/app-metadata.types';

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

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
    this.runningInstances$ =
      getPaginationPages(this.store, new GetAppStatsAction(this.appGuid, this.cfGuid), AppStatsSchema)
        .pipe(
        map(appInstancesPages => {
          const allInstances = [].concat.apply([], Object.values(appInstancesPages || [])).filter(instance => !!instance);
          return allInstances.filter(stat => stat.entity.state === 'RUNNING').length;
        })
        );
  }

}
