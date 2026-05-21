import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CfUserService } from '../../../../../../cloud-foundry/src/shared/data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../features/cf/services/cloud-foundry-organization.service';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { BooleanIndicatorComponent } from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { CapitalizeFirstPipe } from '@stratosui/core';

@Component({
  selector: 'app-card-cf-org-user-details',
  templateUrl: './card-cf-org-user-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
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
