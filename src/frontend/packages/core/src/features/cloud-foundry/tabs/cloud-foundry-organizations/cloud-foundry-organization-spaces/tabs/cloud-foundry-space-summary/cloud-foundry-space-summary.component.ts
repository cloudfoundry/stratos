import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, pairwise, startWith, tap } from 'rxjs/operators';

import { RouterNav } from '../../../../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../../../../store/src/app-state';
import { spaceSchemaKey } from '../../../../../../../../../store/src/helpers/entity-factory';
import { selectDeletionInfo } from '../../../../../../../../../store/src/selectors/api.selectors';
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
  name$: Observable<string>;
  public permsSpaceEdit = CurrentUserPermissions.SPACE_EDIT;
  public permsSpaceDelete = CurrentUserPermissions.SPACE_DELETE;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfOrgService: CloudFoundryOrganizationService,
    public cfSpaceService: CloudFoundrySpaceService,
    private confirmDialog: ConfirmationDialogService,
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
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
    this.name$ = cfSpaceService.space$.pipe(
      map(space => space.entity.entity.name),
      first()
    );
  }

  deleteSpaceWarn = () => {
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

    this.store.select(selectDeletionInfo(spaceSchemaKey, this.cfSpaceService.spaceGuid)).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      tap(([, newV]) => {
        if (newV.deleted) {
          this.redirectToOrgSpaces();
        } else if (newV.error) {
          this.snackBar.open(`Failed to delete space: ${newV.message}`, 'Close');
        }
      })
    ).subscribe();
  }

  redirectToOrgSpaces() {
    this.store.dispatch(new RouterNav({
      path: [
        'cloud-foundry',
        this.cfSpaceService.cfGuid,
        'organizations',
        this.cfSpaceService.orgGuid,
        'spaces'
      ]
    }));
  }
}
