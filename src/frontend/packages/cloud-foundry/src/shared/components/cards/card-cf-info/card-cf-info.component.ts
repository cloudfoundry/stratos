import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

import { TailwindDialogService, MetadataItemComponent } from '@stratosui/core';
import { fetchAutoscalerInfo } from '@stratosui/cf-autoscaler';
import { EntityServiceFactory } from '@stratosui/store';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';
import {
  UserInviteConfigurationDialogComponent,
} from '../../../../features/cf/user-invites/configuration-dialog/user-invite-configuration-dialog.component';
import { UserInviteConfigureService, UserInviteService } from '../../../../features/cf/user-invites/user-invite.service';

/**
 * CF endpoint summary card. The data path under `cfEndpointService.info$`
 * already hits the V3-native `/pp/v1/cf/info/{cnsi}` handler — the wire
 * shape is StratosCFInfo (snake_case for legacy compat) and is sourced
 * from /v3/info + the unversioned API root. This component reads the
 * already-V3 data through signal bridges instead of the legacy observable
 * plumbing, so the Summary card renders directly off the signal graph
 * without the ngrx EntityService middle-layer in the template.
 */
@Component({
  selector: 'app-card-cf-info',
  templateUrl: './card-cf-info.component.html',
  styleUrls: ['./card-cf-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MetadataItemComponent,
  ],
})
export class CardCfInfoComponent implements OnInit, OnDestroy {
  cfEndpointService = inject(CloudFoundryEndpointService);
  userInviteService = inject(UserInviteService);
  userInviteConfigureService = inject(UserInviteConfigureService);
  private dialog = inject(TailwindDialogService);
  private esf = inject(EntityServiceFactory);

  // Signal bridges over the existing observables. The data they carry is
  // already V3-native (the effect under cfEntityCatalog.cfInfo.api.get
  // hits /pp/v1/cf/info/{cnsi}); these are template-side signal reads,
  // not a data-path migration.
  readonly endpointInfo = this.cfEndpointService.endpoint;
  readonly info = toSignal(this.cfEndpointService.info$, { initialValue: null as any });
  readonly hasSSHAccess = toSignal(this.cfEndpointService.hasSSHAccess$, { initialValue: false });
  readonly canConfigureInvites = toSignal(this.userInviteService.canConfigure$, { initialValue: false });
  readonly invitesConfigured = toSignal(this.userInviteService.configured$, { initialValue: false });

  // Autoscaler version comes from a separate package's entity catalog;
  // fetch is deferred to ngOnInit so test setups that don't register the
  // autoscaler entities can still construct this component (the catalog
  // throws on missing entity registration during fetchAutoscalerInfo).
  private readonly _autoscalerVersion = signal<any>(null);
  readonly autoscalerVersion = this._autoscalerVersion.asReadonly();
  private autoscalerSub?: Subscription;

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
    const metadata = this.info()?.entity?.entity;
    if (!metadata) return '-';
    if (!metadata.description) return '-';
    return metadata.description + (metadata.build ? ` (${metadata.build})` : '');
  });

  /** Autoscaler build version, '' for empty entity, null for error/missing. */
  readonly autoscalerVersionLabel = computed((): string | null => {
    const ev = this.autoscalerVersion() as any;
    if (!ev) return null;
    if (ev.entityRequestInfo?.error) return null;
    return ev.entity ? (ev.entity.entity?.build ?? '') : '';
  });

  ngOnInit(): void {
    this.autoscalerSub = fetchAutoscalerInfo(this.cfEndpointService.cfGuid, this.esf)
      .subscribe(v => this._autoscalerVersion.set(v));
  }

  ngOnDestroy(): void {
    this.autoscalerSub?.unsubscribe();
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
