import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { APIResource, EntityInfo } from '../../../../../../store/src/types/api.types';
import { fetchAutoscalerInfo } from '../../../../autoscaler-available';
import { ICfV2Info } from '../../../../cf-api.types';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';
import {
  UserInviteConfigurationDialogComponent,
} from '../../../../features/cf/user-invites/configuration-dialog/user-invite-configuration-dialog.component';
import { UserInviteConfigureService, UserInviteService } from '../../../../features/cf/user-invites/user-invite.service';

@Component({
  selector: 'app-card-cf-info',
  templateUrl: './card-cf-info.component.html',
  styleUrls: ['./card-cf-info.component.scss']
})
export class CardCfInfoComponent implements OnInit, OnDestroy {
  public apiUrl: string;
  private subs: Subscription[] = [];
  public autoscalerVersion$: Observable<string>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public userInviteService: UserInviteService,
    public userInviteConfigureService: UserInviteConfigureService,
    private dialog: MatDialog,
    private esf: EntityServiceFactory,
  ) { }

  description$: Observable<string>;

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

    this.autoscalerVersion$ = fetchAutoscalerInfo(this.cfEndpointService.cfGuid, this.esf).pipe(
      map(e => e.entityRequestInfo.error ?
        null :
        e.entity ? e.entity.entity.build : ''),
    );
  }

  getApiEndpointUrl(apiEndpoint) {
    const path = apiEndpoint.Path ? `/${apiEndpoint.Path}` : '';
    return `${apiEndpoint.Scheme}://${apiEndpoint.Host}${path}`;
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private getMetadataFromInfo(entity: EntityInfo<APIResource<ICfV2Info>>) {
    return entity && entity.entity && entity.entity.entity ? entity.entity.entity : null;
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
