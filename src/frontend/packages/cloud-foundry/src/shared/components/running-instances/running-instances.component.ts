import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../cf-entity-catalog';

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

  ngOnInit() {
    this.runningInstances$ = cfEntityCatalog.appStats.store.getPaginationMonitor(this.appGuid, this.cfGuid).currentPage$.pipe(
      map(appInstancesPages => {
        const allInstances = [].concat.apply([], Object.values(appInstancesPages || [])).filter(instance => !!instance);
        return allInstances.filter(stat => stat.state === 'RUNNING').length;
      })
    );
  }

}
