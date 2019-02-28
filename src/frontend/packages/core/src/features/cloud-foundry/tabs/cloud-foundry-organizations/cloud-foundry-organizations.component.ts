import { Component } from '@angular/core';

import { CfOrgCardComponent } from '../../../../shared/components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { CfOrgsListConfigService } from '../../../../shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-cloud-foundry-organizations',
  templateUrl: './cloud-foundry-organizations.component.html',
  styleUrls: ['./cloud-foundry-organizations.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfOrgsListConfigService
    }
  ]
})
export class CloudFoundryOrganizationsComponent {
  cardComponent = CfOrgCardComponent;
}
