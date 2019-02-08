import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/src/app-state';
import { Observable, combineLatest } from 'rxjs';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { goToAppWall } from '../../cf.helpers';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-cloud-foundry-summary-tab',
  templateUrl: './cloud-foundry-summary-tab.component.html',
  styleUrls: ['./cloud-foundry-summary-tab.component.scss']
})
export class CloudFoundrySummaryTabComponent {
  appLink: Function;
  detailsLoading$: Observable<boolean>;

  constructor(store: Store<AppState>, public cfEndpointService: CloudFoundryEndpointService) {
    this.appLink = () => {
      goToAppWall(store, cfEndpointService.cfGuid);
    };
    this.detailsLoading$ = combineLatest([
      cfEndpointService.appsPagObs.fetchingEntities$.pipe(
        filter(loading => !loading)
      ),
      cfEndpointService.users$
    ]).pipe(
      map(() => false),
      startWith(true)
    );
  }
}
