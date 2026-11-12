import { Component, ChangeDetectionStrategy, computed, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CustomTooltipDirective, TailwindSnackBarService } from '@stratosui/core';
import { leadPieces } from '@stratosui/store';
import { Router, RouterModule } from '@angular/router';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfirmationDialogConfig } from '../../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { goToCfApplications } from '../../../cf.helpers';
import { CfAppsSignalConfigService } from '../../../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CfOrgsSignalConfigService } from '../../../../../shared/signal-list-configs/org/cf-orgs-signal-config.service';
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
import { unknownHowOf, unknownOutcomeMessage } from '../../../../../services/async-jobs/unknown-outcome-message';
import { CfCliMenuComponent } from '../../../../../shared/components/cli-menu/cf-cli-menu.component';

@Component({
  selector: 'app-cloud-foundry-organization-summary',
  templateUrl: './cloud-foundry-organization-summary.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CustomTooltipDirective,
    RouterModule,
    PageSubNavComponent,
    CfCliMenuComponent,
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
  private appsConfig = inject(CfAppsSignalConfigService);
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private orgsConfig = inject(CfOrgsSignalConfigService);
  private router = inject(Router);

  appLink: () => void;

  // The HTTP-backed counts are subscribed here, by the page that shows them,
  // not in the org service that every org and space page holds.
  readonly userProvidedServiceInstancesCount = toSignal(this.cfOrgService.userProvidedServiceInstancesCount$, { initialValue: null });
  readonly routesCount = toSignal(this.cfOrgService.routesCount$, { initialValue: null });
  readonly privateDomainCount = toSignal(this.cfOrgService.privateDomains$.pipe(map(domains => domains.length)), { initialValue: null });
  readonly quota = toSignal(this.cfOrgService.quotaDefinition$, { initialValue: null });
  // Without the full app list yet, ask Cloud Foundry for the org's count;
  // once the list is here, count the org's apps in it.
  private readonly fetchedAppCount = toSignal(
    this.cfEndpointService.hasApps() ? EMPTY : this.cfEndpointService.fetchAppCount(this.cfOrgService.orgGuid),
    { initialValue: null },
  );
  readonly appCount = computed(() => {
    const apps = this.cfOrgService.apps();
    return this.cfEndpointService.hasApps() && apps ? apps.length : this.fetchedAppCount();
  });

  // The page shows its tiles once the apps have loaded and the user-provided
  // service count is in; a later poll does not bring the loading page back.
  private readonly appsSettled = linkedSignal<boolean, boolean>({
    source: this.cfOrgService.loadingApps,
    computation: (loading, previous) => !!previous?.value || !loading,
  });
  readonly detailsLoading = computed(() => !this.appsSettled() || this.userProvidedServiceInstancesCount() === null);
  public permsOrgEdit = CfCurrentUserPermissions.ORGANIZATION_EDIT;
  public permsOrgDelete = CfCurrentUserPermissions.ORGANIZATION_DELETE;

  constructor() {
    const appsConfig = this.appsConfig;
    const cfOrgService = this.cfOrgService;

    const router = this.router;
    this.appLink = () => {
      goToCfApplications(appsConfig, router, cfOrgService.cfGuid, cfOrgService.orgGuid);
    };
  }

  deleteOrgWarn() {
    const name = this.cfOrgService.orgDataService.org()?.name;
    if (!name) return;
    const confirmation = new ConfirmationDialogConfig(
      'Delete Organization',
      { textToMatch: name },
      'Delete',
      true,
    );
    this.confirmDialog.open(confirmation, async () => {
      const cfGuid = this.cfOrgService.cfGuid;
      const orgGuid = this.cfOrgService.orgGuid;
      try {
        const outcome = await this.orgsConfig.deleteOrg(cfGuid, orgGuid, name);
        const how = unknownHowOf(outcome);
        if (how) {
          // Ended, result unknown: stay rather than leave as if deleted.
          this.snackBar.error(
            unknownOutcomeMessage(`Delete organization "${name}"`, 'The Organizations list', how), 'Close');
          return;
        }
        this.router.navigate(['/cloud-foundry', cfGuid, 'organizations']);
      } catch (err: unknown) {
        this.snackBar.error(leadPieces('Failed to delete organization', err), 'Close');
      }
    });
  }
}
