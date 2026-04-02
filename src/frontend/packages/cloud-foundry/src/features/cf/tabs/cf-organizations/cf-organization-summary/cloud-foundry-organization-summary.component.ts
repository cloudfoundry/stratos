import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CustomTooltipDirective, TailwindSnackBarService } from '@stratosui/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { take, filter, map, pairwise, startWith, tap } from 'rxjs/operators';

import { ConfirmationDialogConfig } from '../../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog';
import { selectDeletionInfo } from '../../../../../../../store/src/selectors/api.selectors';
import { CFAppState } from '../../../../../cf-app-state';
import { organizationEntityType } from '../../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { goToAppWall } from '../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { PageSubNavComponent } from '../../../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { TileGridComponent } from '../../../../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../../../../core/src/shared/components/tile/tile/tile.component';
import { CardCfOrgUserDetailsComponent } from '../../../../../shared/components/cards/card-cf-org-user-details/card-cf-org-user-details.component';
import { LoadingPageComponent } from '../../../../../../../core/src/shared/components/loading-page/loading-page.component';
import { CardNumberMetricComponent } from '../../../../../../../core/src/shared/components/cards/card-number-metric/card-number-metric.component';
import { CardCfRecentAppsComponent } from '../../../../home/card-cf-recent-apps/card-cf-recent-apps.component';
import { CfUserPermissionDirective } from '../../../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { PollingIndicatorComponent } from '../../../../../../../core/src/shared/components/polling-indicator/polling-indicator.component';

@Component({
  selector: 'app-cloud-foundry-organization-summary',
  templateUrl: './cloud-foundry-organization-summary.component.html',
  styleUrls: ['./cloud-foundry-organization-summary.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CustomTooltipDirective,
    RouterModule,
    PageSubNavComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardCfOrgUserDetailsComponent,
    LoadingPageComponent,
    CardNumberMetricComponent,
    CardCfRecentAppsComponent,
    CfUserPermissionDirective,
    PollingIndicatorComponent
  ]
})
export class CloudFoundryOrganizationSummaryComponent {
  private store = inject<Store<CFAppState>>(Store);
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);

  appLink: () => void;
  detailsLoading$: Observable<boolean>;
  public permsOrgEdit = CfCurrentUserPermissions.ORGANIZATION_EDIT;
  public permsOrgDelete = CfCurrentUserPermissions.ORGANIZATION_DELETE;

  constructor() {
    const store = this.store;
    const cfEndpointService = this.cfEndpointService;
    const cfOrgService = this.cfOrgService;

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
      take(1)
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
