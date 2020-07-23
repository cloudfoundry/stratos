import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, pairwise, startWith, tap } from 'rxjs/operators';

import { ConfirmationDialogConfig } from '../../../../../../../../../core/src/shared/components/confirmation-dialog.config';
import {
  ConfirmationDialogService,
} from '../../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { RouterNav } from '../../../../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../../../../store/src/entity-catalog/entity-catalog';
import { selectDeletionInfo } from '../../../../../../../../../store/src/selectors/api.selectors';
import { spaceEntityType } from '../../../../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cf-types';
import { CfCurrentUserPermissions } from '../../../../../../../user-permissions/cf-user-permissions-checkers';
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
  public permsSpaceEdit = CfCurrentUserPermissions.SPACE_EDIT;
  public permsSpaceDelete = CfCurrentUserPermissions.SPACE_DELETE;

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
    const spaceEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, spaceEntityType);
    this.cfOrgService.deleteSpace(
      this.cfSpaceService.spaceGuid,
      this.cfSpaceService.orgGuid,
      this.cfSpaceService.cfGuid
    );

    this.store.select(selectDeletionInfo(spaceEntity.entityKey, this.cfSpaceService.spaceGuid)).pipe(
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
