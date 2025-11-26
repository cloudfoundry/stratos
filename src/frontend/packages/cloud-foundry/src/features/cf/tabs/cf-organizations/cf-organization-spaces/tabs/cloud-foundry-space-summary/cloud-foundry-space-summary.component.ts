import { Component , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CustomTooltipDirective, TailwindSnackBarService } from '@stratosui/core';
import { Store } from '@ngrx/store';
import { combineLatest, type Observable } from 'rxjs';
import { filter, first, map, pairwise, startWith, tap } from 'rxjs/operators';

import { ConfirmationDialogConfig, ConfirmationDialogService } from '@stratosui/core';
import { RouterNav, type AppState, entityCatalog, selectDeletionInfo } from '@stratosui/store';
import { spaceEntityType } from '../../../../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cf-types';
import { CfCurrentUserPermissions } from '../../../../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import {
  PageSubNavComponent,
  TileGridComponent,
  TileGroupComponent,
  TileComponent,
  LoadingPageComponent,
  CardNumberMetricComponent
} from '@stratosui/core';
import { CardCfRecentAppsComponent } from '../../../../../../../features/home/card-cf-recent-apps/card-cf-recent-apps.component';
import { CfUserPermissionDirective } from '../../../../../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { CardCfSpaceDetailsComponent } from '../../../../../../../shared/components/cards/card-cf-space-details/card-cf-space-details.component';

@Component({
  selector: 'app-cloud-foundry-space-summary',
  templateUrl: './cloud-foundry-space-summary.component.html',
  styleUrls: ['./cloud-foundry-space-summary.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CustomTooltipDirective,
    PageSubNavComponent,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    LoadingPageComponent,
    CardNumberMetricComponent,
    CardCfRecentAppsComponent,
    CfUserPermissionDirective,
    CardCfSpaceDetailsComponent
  ]
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
    private store: Store,
    private snackBar: TailwindSnackBarService,
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
