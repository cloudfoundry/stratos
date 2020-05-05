import { Component, Input } from '@angular/core';

import { IServiceInstance } from '../../../../../cloud-foundry/src/cf-api-svc.types';
import { APIResource } from '../../../../../store/src/types/api.types';

// TODO: Move CF code to CF Module #3769

@Component({
  selector: 'app-service-instance-last-op',
  templateUrl: './service-instance-last-op.component.html',
  styleUrls: ['./service-instance-last-op.component.scss']
})
export class ServiceInstanceLastOpComponent {
  @Input() serviceInstance: APIResource<IServiceInstance>;
  @Input() alignRight = false;

}
