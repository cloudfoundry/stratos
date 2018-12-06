import { Component, OnInit } from '@angular/core';

import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import {
  CfSecurityGroupsCardComponent,
} from '../../../../shared/components/list/list-types/cf-security-groups/cf-security-groups-card/cf-security-groups-card.component';
import {
  CfSecurityGroupsListConfigService,
} from '../../../../shared/components/list/list-types/cf-security-groups/cf-security-groups-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { APIResource } from '../../../../store/types/api.types';

@Component({
  selector: 'app-cloud-foundry-security-groups',
  templateUrl: './cloud-foundry-security-groups.component.html',
  styleUrls: ['./cloud-foundry-security-groups.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSecurityGroupsListConfigService
    }
  ]
})
export class CloudFoundrySecurityGroupsComponent implements OnInit {

  constructor(private listConfig: ListConfig<APIResource>) {
    const dataSource: ListDataSource<APIResource> = listConfig.getDataSource();
  }
  ngOnInit() {
  }

}
