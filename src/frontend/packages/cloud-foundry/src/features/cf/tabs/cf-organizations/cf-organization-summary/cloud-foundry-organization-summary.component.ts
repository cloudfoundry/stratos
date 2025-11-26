import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Store } from '@ngrx/store';
import { combineLatest, type Observable } from 'rxjs';
import { filter, first, map, pairwise, startWith, tap } from 'rxjs/operators';

import {
  CardNumberMetricComponent,
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  CustomTooltipDirective,
  LoadingPageComponent,
  PageSubNavComponent,
  TailwindSnackBarService,
  TileComponent,
  TileGridComponent,
  TileGroupComponent,
} from '@stratosui/core';
import { RouterNav, GeneralEntityAppState } from '@stratosui/store';
import { entityCatalog } from '@stratosui/store';
import { selectDeletionInfo } from '@stratosui/store';

import { organizationEntityType } from '../../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { CardCfOrgUserDetailsComponent } from '../../../../../shared/components/cards/card-cf-org-user-details/card-cf-org-user-details.component';
import { CfUserPermissionDirective } from '../../../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { goToAppWall } from '../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CardCfRecentAppsComponent } from '../../../../home/card-cf-recent-apps/card-cf-recent-apps.component';

@Component({
  selector: 'app-cloud-foundry-organization-summary',
  templateUrl: './cloud-foundry-organization-summary.component.html',
  styleUrls: ['./cloud-foundry-organization-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    RouterModule,
    CustomTooltipDirective,
    PageSubNavComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardCfOrgUserDetailsComponent,
    LoadingPageComponent,
    CardNumberMetricComponent,
    CardCfRecentAppsComponent,
    CfUserPermissionDirective,
  ],
})
export class CloudFoundryOrganizationSummaryComponent {
  appLink: () => void;
  detailsLoading$: Observable<boolean>;
  public permsOrgEdit = CfCurrentUserPermissions.ORGANIZATION_EDIT;
  public permsOrgDelete = CfCurrentUserPermissions.ORGANIZATION_DELETE;

  constructor(
    private store: Store<GeneralEntityAppState>,
    public cfEndpointService: CloudFoundryEndpointService,
    public cfOrgService: CloudFoundryOrganizationService,
    private confirmDialog: ConfirmationDialogService,
    private snackBar: TailwindSnackBarService
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
