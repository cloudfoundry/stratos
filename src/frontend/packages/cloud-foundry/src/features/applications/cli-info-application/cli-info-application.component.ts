import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CustomTooltipDirective, IHeaderBreadcrumb, PageHeaderComponent } from '@stratosui/core';
import { EndpointsDataService, getFullEndpointApiUrl } from '@stratosui/store';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { AppDetailDataService } from '../app-detail-data.service';
import { APPLICATION_CLI_COMMANDS } from '../../../shared/components/cli-info/cli-commands';
import { CFAppCLIInfoContext, CliInfoComponent } from '../../../shared/components/cli-info/cli-info.component';

@Component({
  selector: 'app-cli-info-application',
  templateUrl: './cli-info-application.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CustomTooltipDirective,
    PageHeaderComponent,
    CliInfoComponent,
  ]
})
export class CliInfoApplicationComponent {
  private applicationService = inject(ApplicationService);
  private detail = inject(AppDetailDataService);
  private endpointsData = inject(EndpointsDataService);

  readonly sections = APPLICATION_CLI_COMMANDS;


  // Null until the app, its space and org and the endpoint are all known.
  // V3 IApp.entity carries `space_guid` only — the legacy `space` relation
  // (and nested organization) isn't populated by the adapter, so the names
  // come from the detail service's space and org.
  readonly context = computed((): CFAppCLIInfoContext | null => {
    const { cfGuid } = this.applicationService;
    const app = this.detail.app()?.entity;
    const space = this.detail.space();
    const org = this.detail.org();
    const ep = this.endpointsData.endpoints().get(cfGuid);
    if (!app || !space || !org || !ep) {
      return null;
    }
    return {
      appName: app.name,
      spaceName: space.name,
      orgName: org.name,
      apiEndpoint: getFullEndpointApiUrl(ep),
      username: ep.user ? ep.user.name : '',
      skipSslValidation: !!ep.skip_ssl_validation,
      ssoAllowed: !!ep.sso_allowed
    };
  });
  readonly breadcrumbs = computed((): IHeaderBreadcrumb[] => {
    const { cfGuid, appGuid } = this.applicationService;
    const context = this.context();
    return context ? [{
      breadcrumbs: [
        { value: 'Applications', routerLink: '/applications' },
        { value: context.appName!, routerLink: `/applications/${cfGuid}/${appGuid}` }
      ]
    }] : [];
  });
  // Where the close button goes: the application this page was opened from.
  public appLink = ['/applications', this.applicationService.cfGuid, this.applicationService.appGuid];
}
