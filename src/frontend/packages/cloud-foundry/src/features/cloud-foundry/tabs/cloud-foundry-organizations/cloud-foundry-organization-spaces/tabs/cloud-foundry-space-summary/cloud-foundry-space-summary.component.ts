import { Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { CurrentUserPermissions } from '../../../../../../../../../core/src/core/current-user-permissions.config';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';

@Component({
  selector: 'app-cloud-foundry-space-summary',
  templateUrl: './cloud-foundry-space-summary.component.html',
  styleUrls: ['./cloud-foundry-space-summary.component.scss']
})
export class CloudFoundrySpaceSummaryComponent {
  detailsLoading$: Observable<boolean>;
  public permsSpaceEdit = CurrentUserPermissions.SPACE_EDIT;
  public permsSpaceDelete = CurrentUserPermissions.SPACE_DELETE;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfOrgService: CloudFoundryOrganizationService,
    public cfSpaceService: CloudFoundrySpaceService
  ) {
    this.detailsLoading$ = combineLatest([
      // Wait for the apps to have been fetched, this will determine if multiple small cards are shown or now
      cfEndpointService.appsPagObs.fetchingEntities$.pipe(
        filter(loading => !loading)
      ),
      cfSpaceService.userProvidedServiceInstancesCount$
    ]).pipe(
      map(() => false),
      startWith(true)
    );
  }
}
