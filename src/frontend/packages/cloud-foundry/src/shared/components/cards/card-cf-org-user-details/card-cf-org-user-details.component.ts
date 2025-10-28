import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

import { CfUserService } from '../../../../../../cloud-foundry/src/shared/data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../features/cf/services/cloud-foundry-organization.service';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { BooleanIndicatorComponent } from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { CapitalizeFirstPipe } from '../../../../../../core/src/core/capitalize-first.pipe';

@Component({
  selector: 'app-card-cf-org-user-details',
  templateUrl: './card-cf-org-user-details.component.html',
  styleUrls: ['./card-cf-org-user-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MetadataItemComponent,
    BooleanIndicatorComponent,
    CapitalizeFirstPipe
  ]
})
export class CardCfOrgUserDetailsComponent {
  constructor(
    public cfOrgService: CloudFoundryOrganizationService,
    public cfUserService: CfUserService,
    public cfEndpointService: CloudFoundryEndpointService
  ) { }
}
