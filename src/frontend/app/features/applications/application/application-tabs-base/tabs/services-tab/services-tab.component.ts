import { Component, OnInit } from '@angular/core';

import { ListDataSource } from '../../../../../../shared/components/list/data-sources-controllers/list-data-source';
import {
  AppServiceBindingListConfigService,
} from '../../../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';
import { APIResource } from '../../../../../../store/types/api.types';

@Component({
  selector: 'app-services-tab',
  templateUrl: './services-tab.component.html',
  styleUrls: ['./services-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: AppServiceBindingListConfigService
    }
  ]
})
export class ServicesTabComponent implements OnInit {

  constructor(private listConfig: ListConfig<APIResource>) {
    const dataSource: ListDataSource<APIResource> = listConfig.getDataSource();
  }
  ngOnInit() {
  }

}
