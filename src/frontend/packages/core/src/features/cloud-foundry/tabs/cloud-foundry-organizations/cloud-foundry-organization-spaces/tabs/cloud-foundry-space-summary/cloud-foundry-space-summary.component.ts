import { Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';

@Component({
  selector: 'app-cloud-foundry-space-summary',
  templateUrl: './cloud-foundry-space-summary.component.html',
  styleUrls: ['./cloud-foundry-space-summary.component.scss']
})
export class CloudFoundrySpaceSummaryComponent {
  detailsLoading$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfSpaceService: CloudFoundrySpaceService
  ) {
    this.detailsLoading$ = combineLatest([
      cfEndpointService.appsPagObs.fetchingEntities$.pipe(
        filter(loading => !loading)
      ),
      cfSpaceService.appCount$,
      cfSpaceService.allSpaceUsers$
    ]).pipe(
      map(() => false),
      startWith(true)
    );
  }
}
