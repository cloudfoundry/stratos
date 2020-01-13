import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { fetchAutoscalerInfo } from '../../../../../../cf-autoscaler/src/core/autoscaler-helpers/autoscaler-available';
import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  UserInviteConfigurationDialogComponent,
} from '../../../../features/cloud-foundry/user-invites/configuration-dialog/user-invite-configuration-dialog.component';
import { UserInviteService } from '../../../../features/cloud-foundry/user-invites/user-invite.service';


@Component({
  selector: 'app-card-cf-info',
  templateUrl: './card-cf-info.component.html',
  styleUrls: ['./card-cf-info.component.scss']
})
export class CardCfInfoComponent implements OnInit {
  public apiUrl: string;
  public autoscalerVersion$: Observable<string>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public userInviteService: UserInviteService,
    private dialog: MatDialog,
    private esf: EntityServiceFactory
  ) { }

  description$: Observable<string>;

  ngOnInit() {
    // FIXME: CF should not depend on autoscaler. See #3916
    this.autoscalerVersion$ = fetchAutoscalerInfo(this.cfEndpointService.cfGuid, this.esf).pipe(
      map(e => e.entityRequestInfo.error ?
        null :
        e.entity ? e.entity.entity.build : ''),
    );
  }

  configureUserInvites() {
    this.dialog.open(UserInviteConfigurationDialogComponent, {
      data: {
        guid: this.cfEndpointService.cfGuid
      }
    });
  }

  deConfigureUserInvites() {
    this.userInviteService.unconfigure(this.cfEndpointService.cfGuid);
  }
}
