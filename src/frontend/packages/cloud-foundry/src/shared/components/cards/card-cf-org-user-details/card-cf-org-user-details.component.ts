import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { BooleanIndicatorComponent, CapitalizeFirstPipe, MetadataItemComponent } from '@stratosui/core';
import { CfUserService } from '../../../../../../cloud-foundry/src/shared/data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../features/cf/services/cloud-foundry-organization.service';

@Component({
  selector: 'app-card-cf-org-user-details',
  templateUrl: './card-cf-org-user-details.component.html',
  styleUrls: ['./card-cf-org-user-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    DatePipe,
    RouterModule,
    MetadataItemComponent,
    BooleanIndicatorComponent,
    CapitalizeFirstPipe
  ]
})
export class CardCfOrgUserDetailsComponent {
  public cfOrgService = inject(CloudFoundryOrganizationService);
  public cfUserService = inject(CfUserService);
  public cfEndpointService = inject(CloudFoundryEndpointService);
}
