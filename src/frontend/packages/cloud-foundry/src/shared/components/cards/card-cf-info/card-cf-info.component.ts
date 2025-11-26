import { Component, type OnDestroy, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import type { Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { TailwindDialogService, MetadataItemComponent } from '@stratosui/core';
import { fetchAutoscalerInfo } from '@stratosui/cf-autoscaler';
import { EntityServiceFactory, type APIResource, type EntityInfo } from '@stratosui/store';
import type { ICfV2Info } from '../../../../cf-api.types';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';
import {
  UserInviteConfigurationDialogComponent,
} from '../../../../features/cf/user-invites/configuration-dialog/user-invite-configuration-dialog.component';
import { UserInviteConfigureService, UserInviteService } from '../../../../features/cf/user-invites/user-invite.service';

@Component({
  selector: 'app-card-cf-info',
  templateUrl: './card-cf-info.component.html',
  styleUrls: ['./card-cf-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MetadataItemComponent
  ]
})
export class CardCfInfoComponent implements OnInit, OnDestroy {
  public cfEndpointService = inject(CloudFoundryEndpointService);
  public userInviteService = inject(UserInviteService);
  public userInviteConfigureService = inject(UserInviteConfigureService);
  private dialog = inject(TailwindDialogService);
  private esf = inject(EntityServiceFactory);

  public apiUrl!: string;
  private subs: Subscription[] = [];
  public autoscalerVersion$!: Observable<string | null>;

  description$!: Observable<string>;

  ngOnInit() {
    const obs$ = this.cfEndpointService.endpoint$.pipe(
      tap(endpoint => {
        this.apiUrl = this.getApiEndpointUrl(endpoint.entity.api_endpoint);
      })
    );
    this.subs.push(obs$.subscribe());

    this.description$ = this.cfEndpointService.info$.pipe(
      map(entity => this.getDescription(entity))
    );

    // FIXME: CF should not depend on autoscaler. See #3916
    // FIXME: Remove hard link between cf and autoscaler packages #4416
    this.autoscalerVersion$ = fetchAutoscalerInfo(this.cfEndpointService.cfGuid, this.esf).pipe(
      map(e => e.entityRequestInfo.error ?
        null :
        e.entity ? e.entity.entity.build : ''),
    );
  }

  getApiEndpointUrl(apiEndpoint: { Path?: string; Scheme: string; Host: string }) {
    const path = apiEndpoint.Path ? `/${apiEndpoint.Path}` : '';
    return `${apiEndpoint.Scheme}://${apiEndpoint.Host}${path}`;
  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

  private getMetadataFromInfo(entity: EntityInfo<APIResource<ICfV2Info>>) {
    return entity?.entity?.entity ? entity.entity.entity : null;
  }

  private getDescription(entity: EntityInfo<APIResource<ICfV2Info>>): string {
    const metadata = this.getMetadataFromInfo(entity);
    if (metadata) {
      if (metadata.description) {
        return metadata.description + (metadata.build ? ` (${metadata.build})` : '');
      }
    }
    return '-';
  }

  configureUserInvites() {
    this.dialog.open(UserInviteConfigurationDialogComponent, {
      data: {
        guid: this.cfEndpointService.cfGuid
      }
    });
  }

  deConfigureUserInvites() {
    this.userInviteConfigureService.unconfigure(this.cfEndpointService.cfGuid);
  }
}
