import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { CustomTooltipDirective, TailwindSnackBarService } from '@stratosui/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { ConfirmationDialogConfig, ConfirmationDialogService } from '@stratosui/core';
import { CfCurrentUserPermissions } from '../../../../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CfSpacesSignalConfigService } from '../../../../../../../shared/components/list/list-types/space/cf-spaces-signal-config.service';
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
import { PollingIndicatorComponent } from '../../../../../../../../../core/src/shared/components/polling-indicator/polling-indicator.component';

@Component({
  selector: 'app-cloud-foundry-space-summary',
  templateUrl: './cloud-foundry-space-summary.component.html',
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
    CardCfSpaceDetailsComponent,
    PollingIndicatorComponent
  ]
})
export class CloudFoundrySpaceSummaryComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  cfSpaceService = inject(CloudFoundrySpaceService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private router = inject(Router);
  private spacesConfig = inject(CfSpacesSignalConfigService);

  detailsLoading$: Observable<boolean>;
  name$: Observable<string>;
  public permsSpaceEdit = CfCurrentUserPermissions.SPACE_EDIT;
  public permsSpaceDelete = CfCurrentUserPermissions.SPACE_DELETE;

  constructor() {
    const cfEndpointService = this.cfEndpointService;
    const cfSpaceService = this.cfSpaceService;

    this.detailsLoading$ = combineLatest([
      // Wait for the apps to have been fetched, this will determine if multiple small cards are shown or now
      cfEndpointService.appsLoading$.pipe(
        filter(loading => !loading)
      ),
      cfSpaceService.userProvidedServiceInstancesCount$
    ]).pipe(
      map(() => false),
      startWith(true)
    );
  }

  deleteSpaceWarn = () => {
    const name = this.cfSpaceService.spaceDataService.space()?.name;
    if (!name) return;
    const confirmation = new ConfirmationDialogConfig(
      'Delete Space',
      { textToMatch: name },
      'Delete',
      true,
    );
    this.confirmDialog.open(confirmation, this.deleteSpace);
  }

  // Signal-native delete: drives the native DELETE
  // /pp/v1/cf/spaces/{cnsi}/{spaceGuid} handler via
  // CfSpacesSignalConfigService. The underlying refresh inside that
  // call only re-fetches if a sibling consumer (the org-spaces L5
  // list) has already initialized the singleton with this (cnsi, org)
  // tuple — which is the only path that produces a visible row to act
  // on anyway. After the write resolves we navigate back to the
  // org-spaces list; on failure we surface a snackbar and stay on
  // the page.
  deleteSpace = async () => {
    const cnsi = this.cfSpaceService.cfGuid;
    const spaceGuid = this.cfSpaceService.spaceGuid;
    try {
      await this.spacesConfig.deleteSpace(cnsi, spaceGuid);
      this.redirectToOrgSpaces();
    } catch (err: any) {
      const msg = err?.message ?? err;
      this.snackBar.error(`Failed to delete space: ${msg}`, 'Close');
    }
  }

  redirectToOrgSpaces() {
    this.router.navigate([
      'cloud-foundry',
      this.cfSpaceService.cfGuid,
      'organizations',
      this.cfSpaceService.orgGuid,
      'spaces'
    ]);
  }
}
