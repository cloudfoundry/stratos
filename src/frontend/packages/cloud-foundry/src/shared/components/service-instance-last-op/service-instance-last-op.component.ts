import { Component, Input } from '@angular/core';

import { APIResource } from '../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../cf-api-svc.types';

@Component({
  selector: 'app-service-instance-last-op',
  templateUrl: './service-instance-last-op.component.html',
  styleUrls: ['./service-instance-last-op.component.scss']
})
export class ServiceInstanceLastOpComponent {
  @Input() serviceInstance: APIResource<IServiceInstance>;
  @Input() alignRight = false;

}
