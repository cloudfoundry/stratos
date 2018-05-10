import { Component, OnInit } from '@angular/core';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import {
  CfStacksListConfigService,
} from '../../../../shared/components/list/list-types/cf-stacks/cf-stacks-list-config.service';
import { CfStacksCardComponent } from '../../../../shared/components/list/list-types/cf-stacks/cf-stacks-card/cf-stacks-card.component';
import { APIResource } from '../../../../store/types/api.types';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
@Component({
  selector: 'app-cloud-foundry-stacks',
  templateUrl: './cloud-foundry-stacks.component.html',
  styleUrls: ['./cloud-foundry-stacks.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfStacksListConfigService
    }
  ]
})
export class CloudFoundryStacksComponent implements OnInit {
  cardComponent = CfStacksCardComponent;

  constructor(private listConfig: ListConfig<APIResource>) {
    const dataSource: ListDataSource<APIResource> = listConfig.getDataSource();
  }

  ngOnInit() {
  }

}
