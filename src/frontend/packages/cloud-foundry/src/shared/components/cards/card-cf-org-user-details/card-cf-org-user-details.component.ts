import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
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
    DatePipe,
    RouterModule,
    MetadataItemComponent,
    BooleanIndicatorComponent,
    CapitalizeFirstPipe
  ]
})
export class CardCfOrgUserDetailsComponent {
  public cfOrgService = inject(CloudFoundryOrganizationService);
  readonly quota = this.cfOrgService.quotaDefinition;
}
