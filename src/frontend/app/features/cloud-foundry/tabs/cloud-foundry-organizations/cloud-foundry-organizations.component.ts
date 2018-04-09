import { Component, OnInit } from '@angular/core';

import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { CfOrgCardComponent } from '../../../../shared/components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { CfOrgsListConfigService } from '../../../../shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { APIResource } from '../../../../store/types/api.types';

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
export class CloudFoundryOrganizationsComponent implements OnInit {
  cardComponent = CfOrgCardComponent;

  constructor(private listConfig: ListConfig<APIResource>) {
    const dataSource: ListDataSource<APIResource> = listConfig.getDataSource();
  }

  ngOnInit() { }
}
