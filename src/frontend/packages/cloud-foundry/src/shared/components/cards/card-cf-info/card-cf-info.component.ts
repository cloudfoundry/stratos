import { Component, inject, ChangeDetectionStrategy, OnInit, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { TailwindDialogService, MetadataItemComponent, UrlPartsPipe } from '@stratosui/core';
import { AutoscalerInfoDataService } from '@stratosui/cf-autoscaler';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';
import {
  UserInviteConfigurationDialogComponent,
} from '../../../../features/cf/user-invites/configuration-dialog/user-invite-configuration-dialog.component';
import { UserInviteConfigureService, UserInviteService } from '../../../../features/cf/user-invites/user-invite.service';

/**
 * CF endpoint summary card. `cfEndpointService.info` is the
 * CfInfoDataService signal over the V3-native `/pp/v1/cf/info/{cnsi}`
 * handler — the wire shape is StratosCFInfo (snake_case, flat, no entity
 * envelope), sourced from /v3/info + the unversioned API root.
 */
@Component({
  selector: 'app-card-cf-info',
  templateUrl: './card-cf-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MetadataItemComponent,
    UrlPartsPipe,
  ],
})
export class CardCfInfoComponent implements OnInit {
  cfEndpointService = inject(CloudFoundryEndpointService);
  userInviteService = inject(UserInviteService);
  userInviteConfigureService = inject(UserInviteConfigureService);
  private dialog = inject(TailwindDialogService);
  private autoscalerInfoData = inject(AutoscalerInfoDataService);

  readonly endpointInfo = this.cfEndpointService.endpoint;
  readonly info = this.cfEndpointService.info;
  readonly hasSSHAccess = this.cfEndpointService.hasSSHAccess;
  readonly canConfigureInvites = toSignal(this.userInviteService.canConfigure$, { initialValue: false });
  readonly invitesConfigured = this.userInviteService.configured;

  // Autoscaler version comes from the cf-autoscaler signal-native data
  // service. Wave-3 (A-effects-cleanup) replaced the legacy
  // fetchAutoscalerInfo helper + AutoscalerEffects path with a direct
  // injection of AutoscalerInfoDataService, dropping ngrx from the
  // autoscaler package end-to-end. The fetch is still deferred to
  // ngOnInit so test setups that don't pre-register autoscaler entities
  // can still construct this component.
  readonly autoscalerVersion = this.autoscalerInfoData.info(this.cfEndpointService.cfGuid);
  private readonly autoscalerError = this.autoscalerInfoData.error(this.cfEndpointService.cfGuid);

  /** API endpoint URL, formatted for display. */
  readonly apiUrl = computed((): string => {
    const ep = this.endpointInfo();
    if (!ep?.entity?.api_endpoint) return '';
    const apiEndpoint = ep.entity.api_endpoint;
    const path = apiEndpoint.Path ? `/${apiEndpoint.Path}` : '';
    return `${apiEndpoint.Scheme}://${apiEndpoint.Host}${path}`;
  });

  /** Endpoint description, falling back to '-' when absent. */
  readonly description = computed((): string => {
    const metadata = this.info();
    if (!metadata) return '-';
    if (!metadata.description) return '-';
    return metadata.description + (metadata.build ? ` (${metadata.build})` : '');
  });

  /** Autoscaler build version, '' for empty entity, null for error/missing. */
  readonly autoscalerVersionLabel = computed((): string | null => {
    if (this.autoscalerError()) return null;
    const info = this.autoscalerVersion();
    if (!info) return null;
    return info.build ?? '';
  });

  ngOnInit(): void {
    void this.autoscalerInfoData.load(this.cfEndpointService.cfGuid);
  }

  configureUserInvites() {
    this.dialog.open(UserInviteConfigurationDialogComponent, {
      data: { guid: this.cfEndpointService.cfGuid },
    });
  }

  deConfigureUserInvites() {
    this.userInviteConfigureService.unconfigure(this.cfEndpointService.cfGuid);
  }
}
