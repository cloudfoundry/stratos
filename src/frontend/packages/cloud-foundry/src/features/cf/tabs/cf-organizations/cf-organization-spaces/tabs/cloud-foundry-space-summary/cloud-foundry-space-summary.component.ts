import { Component, ChangeDetectionStrategy, computed, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';

import { CustomTooltipDirective, TailwindSnackBarService } from '@stratosui/core';
import { EMPTY } from 'rxjs';

import { ConfirmationDialogConfig, ConfirmationDialogService } from '@stratosui/core';
import { CfCurrentUserPermissions } from '../../../../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CfSpacesSignalConfigService } from '../../../../../../../shared/signal-list-configs/space/cf-spaces-signal-config.service';
import {
  PageSubNavComponent,
  TileGridComponent,
  TileGroupComponent,
  TileComponent,
  LoadingPageComponent,
  CardNumberMetricComponent
} from '@stratosui/core';
import { leadPieces } from '@stratosui/store';
import { CardCfRecentAppsComponent } from '../../../../../../../features/home/card-cf-recent-apps/card-cf-recent-apps.component';
import { CfUserPermissionDirective } from '../../../../../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { CardCfSpaceDetailsComponent } from '../../../../../../../shared/components/cards/card-cf-space-details/card-cf-space-details.component';
import { PollingIndicatorComponent } from '../../../../../../../../../core/src/shared/components/polling-indicator/polling-indicator.component';
import { unknownHowOf, unknownOutcomeMessage } from '../../../../../../../services/async-jobs/unknown-outcome-message';
import { CfCliMenuComponent } from '../../../../../../../shared/components/cli-menu/cf-cli-menu.component';

@Component({
  selector: 'app-cloud-foundry-space-summary',
  templateUrl: './cloud-foundry-space-summary.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    CustomTooltipDirective,
    PageSubNavComponent,
    CfCliMenuComponent,
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

  // The HTTP-backed counts are subscribed here, by the page that shows them,
  // not in the space service that every space page holds.
  readonly userProvidedServiceInstancesCount = toSignal(this.cfSpaceService.userProvidedServiceInstancesCount$, { initialValue: null });
  readonly quota = toSignal(this.cfSpaceService.quotaDefinition$, { initialValue: null });
  // Without the full app list yet, ask Cloud Foundry for the space's count;
  // once the list is here, count the space's apps in it.
  private readonly fetchedAppCount = toSignal(
    this.cfEndpointService.hasApps()
      ? EMPTY
      : this.cfEndpointService.fetchAppCount(this.cfSpaceService.orgGuid, this.cfSpaceService.spaceGuid),
    { initialValue: null },
  );
  readonly appCount = computed(() =>
    this.cfEndpointService.hasApps() ? this.cfSpaceService.apps().length : this.fetchedAppCount());

  // The page shows its tiles once the apps have loaded and the user-provided
  // service count is in; a later poll does not bring the loading page back.
  private readonly appsSettled = linkedSignal<boolean, boolean>({
    source: this.cfSpaceService.loadingApps,
    computation: (loading, previous) => !!previous?.value || !loading,
  });
  readonly detailsLoading = computed(() => !this.appsSettled() || this.userProvidedServiceInstancesCount() === null);
  public permsSpaceEdit = CfCurrentUserPermissions.SPACE_EDIT;
  public permsSpaceDelete = CfCurrentUserPermissions.SPACE_DELETE;

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
      const outcome = await this.spacesConfig.deleteSpace(cnsi, spaceGuid);
      const how = unknownHowOf(outcome);
      if (how) {
        // Ended, result unknown: stay rather than leave as if deleted.
        const name = this.cfSpaceService.spaceDataService.space()?.name ?? spaceGuid;
        this.snackBar.error(
          unknownOutcomeMessage(`Delete space "${name}"`, 'The organization\'s Spaces list', how), 'Close');
        return;
      }
      this.redirectToOrgSpaces();
    } catch (err: unknown) {
      this.snackBar.error(leadPieces('Failed to delete space', err), 'Close');
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
