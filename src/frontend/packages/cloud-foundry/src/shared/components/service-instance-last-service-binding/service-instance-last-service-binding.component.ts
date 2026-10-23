import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BooleanIndicatorComponent } from '@stratosui/core';
import { APIResource } from '@stratosui/store';

import { IServiceInstance } from '../../../cf-api-svc.types';

@Component({
  selector: 'app-service-instance-last-service-binding',
  templateUrl: './service-instance-last-service-binding.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BooleanIndicatorComponent,
  ],
})
export class ServiceInstanceLastServiceBindingComponent {
  readonly serviceInstance = input.required<APIResource<IServiceInstance>>();
  readonly alignRight = input(false);
}
