import { Component } from '@angular/core';

import {
  CfSpacesListConfigService,
} from '../../../../../shared/components/list/list-types/cf-spaces/cf-spaces-list-config.service';
import { ListConfig } from '../../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-cloud-foundry-organization-spaces',
  templateUrl: './cloud-foundry-organization-spaces.component.html',
  styleUrls: ['./cloud-foundry-organization-spaces.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSpacesListConfigService
    }
  ]
})
export class CloudFoundryOrganizationSpacesComponent { }
