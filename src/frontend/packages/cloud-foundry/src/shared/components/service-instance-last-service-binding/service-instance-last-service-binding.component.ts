import { Component, Input, OnInit } from '@angular/core';

import { APIResource } from '../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../cf-api-svc.types';

@Component({
  selector: 'app-service-instance-last-service-binding',
  templateUrl: './service-instance-last-service-binding.component.html',
  styleUrls: ['./service-instance-last-service-binding.component.scss']
})
export class ServiceInstanceLastServiceBindingComponent implements OnInit {
  @Input() serviceInstance: APIResource<IServiceInstance>;
  @Input() alignRight = false;

  ngOnInit() {
    console.log(this.serviceInstance)
  }
}
