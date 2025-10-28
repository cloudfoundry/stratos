import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { BooleanIndicatorComponent } from '../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../cf-api-svc.types';

@Component({
  selector: 'app-service-instance-last-op',
  templateUrl: './service-instance-last-op.component.html',
  styleUrls: ['./service-instance-last-op.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    BooleanIndicatorComponent
  ]
})
export class ServiceInstanceLastOpComponent {
  @Input() serviceInstance: APIResource<IServiceInstance>;
  @Input() alignRight = false;

}
