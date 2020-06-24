import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, pairwise, startWith, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ConfirmationDialogConfig } from '../../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog';
import { selectDeletionInfo } from '../../../../../../../store/src/selectors/api.selectors';
import { organizationEntityType } from '../../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { goToAppWall } from '../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';

@Component({
  selector: 'app-cloud-foundry-organization-summary',
  templateUrl: './cloud-foundry-organization-summary.component.html',
  styleUrls: ['./cloud-foundry-organization-summary.component.scss'],

})
export class CloudFoundryOrganizationSummaryComponent {
  appLink: () => void;
  detailsLoading$: Observable<boolean>;
  public permsOrgEdit = CfCurrentUserPermissions.ORGANIZATION_EDIT;
  public permsOrgDelete = CfCurrentUserPermissions.ORGANIZATION_DELETE;

  constructor(
    private store: Store<CFAppState>,
    public cfEndpointService: CloudFoundryEndpointService,
    public cfOrgService: CloudFoundryOrganizationService,
    private confirmDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar
  ) {
    this.appLink = () => {
      goToAppWall(store, cfOrgService.cfGuid, cfOrgService.orgGuid);
    };
    this.detailsLoading$ = combineLatest([
      // Wait for the apps to have been fetched, this will determine if multiple small cards are shown or now
      cfEndpointService.appsPagObs.fetchingEntities$.pipe(
        filter(loading => !loading)
      ),
      cfOrgService.userProvidedServiceInstancesCount$
    ]).pipe(
      map(() => false),
      startWith(true)
    );
  }

  deleteOrgWarn() {
    this.cfOrgService.org$.pipe(
      map(org => org.entity.entity.name),
      first()
    ).subscribe(name => {
      const confirmation = new ConfirmationDialogConfig(
        'Delete Organization',
        {
          textToMatch: name
        },
        'Delete',
        true,
      );
      this.confirmDialog.open(confirmation, () => {
        this.cfEndpointService.deleteOrg(
          this.cfOrgService.orgGuid,
          this.cfEndpointService.cfGuid
        );

        const orgEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, organizationEntityType);
        this.store.select(selectDeletionInfo(orgEntity.entityKey, this.cfOrgService.orgGuid)).pipe(
          pairwise(),
          filter(([oldV, newV]) => (oldV.busy && !newV.busy) || newV.error),
          tap(([, newV]) => {
            if (newV.deleted) {
              this.store.dispatch(new RouterNav({
                path: [
                  'cloud-foundry',
                  this.cfOrgService.cfGuid,
                  'organizations'
                ]
              }));
            } else if (newV.error) {
              this.snackBar.open(`Failed to delete space: ${newV.message}`, 'Close');
            }
          })
        ).subscribe();
      });
    });
  }
}
