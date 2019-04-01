import { Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, startWith } from 'rxjs/operators';

import { CurrentUserPermissions } from '../../../../../../../core/current-user-permissions.config';
import { ConfirmationDialogConfig } from '../../../../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../shared/components/confirmation-dialog.service';
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
  public name$: Observable<string>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfOrgService: CloudFoundryOrganizationService,
    public cfSpaceService: CloudFoundrySpaceService,
    private confirmDialog: ConfirmationDialogService
  ) {
    this.detailsLoading$ = combineLatest([
      // Wait for the apps to have been fetched, this will determine if multiple small cards are shown or now
      cfEndpointService.appsPagObs.fetchingEntities$.pipe(
        filter(loading => !loading)
      ),
    ]).pipe(
      map(() => false),
      startWith(true)
    );

    this.name$ = cfSpaceService.space$.pipe(
      map(space => space.entity.entity.name),
      first()
    );
  }

  deleteSpaceWarn = () => {
    // .first within name$
    this.name$.pipe(
      first()
    ).subscribe(name => {
      const confirmation = new ConfirmationDialogConfig(
        'Delete Space',
        {
          textToMatch: name
        },
        'Delete',
        true,
      );
      this.confirmDialog.open(confirmation, this.deleteSpace);
    });
  }

  deleteSpace = () => {
    this.cfOrgService.deleteSpace(
      this.cfSpaceService.spaceGuid,
      this.cfSpaceService.orgGuid,
      this.cfSpaceService.cfGuid
    );
  }

}
