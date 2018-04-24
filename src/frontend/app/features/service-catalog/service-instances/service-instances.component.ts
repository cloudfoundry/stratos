import { Component, OnInit } from '@angular/core';
import { ServicesService } from '../services.service';
import { tap, filter } from 'rxjs/operators';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import {
  ServiceInstancesListConfigService
} from '../../../shared/components/list/list-types/service-instances/service-instances-list-config.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../cloud-foundry/cf.helpers';

@Component({
  selector: 'app-service-instances',
  templateUrl: './service-instances.component.html',
  styleUrls: ['./service-instances.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: ServiceInstancesListConfigService
    }
  ]
})
export class ServiceInstancesComponent implements OnInit {

  constructor(private servicesService: ServicesService) {


  }
  ngOnInit() {
  }

}
