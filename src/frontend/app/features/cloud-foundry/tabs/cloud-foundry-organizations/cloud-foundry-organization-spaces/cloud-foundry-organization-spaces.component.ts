import { Component, OnInit } from '@angular/core';

import { ListDataSource } from '../../../../../shared/components/list/data-sources-controllers/list-data-source';
import {
  CfSpacesListConfigService,
} from '../../../../../shared/components/list/list-types/cf-spaces/cf-spaces-list-config.service';
import { ListConfig } from '../../../../../shared/components/list/list.component.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ISpace } from '../../../../../core/cf-api.types';

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
export class CloudFoundryOrganizationSpacesComponent implements OnInit {

  constructor(private listConfig: ListConfig<APIResource<ISpace>>) {
    const dataSource: ListDataSource<APIResource<ISpace>> = listConfig.getDataSource();
  }

  ngOnInit() {
  }

}
