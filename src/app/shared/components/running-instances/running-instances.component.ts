import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { getPaginationPages } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { GetAppStatsAction } from '../../../store/actions/app-metadata.actions';
import { AppStatsSchema } from '../../../store/types/app-metadata.types';
import { map } from 'rxjs/operators';

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
    console.log(this.cfGuid);
    console.log(this.appGuid);
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
