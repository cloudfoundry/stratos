import { CommonModule } from '@angular/common';
import { Component, Input , ChangeDetectionStrategy } from '@angular/core';

import { BooleanIndicatorComponent } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IServiceInstance } from '../../../cf-api-svc.types';

@Component({
  selector: 'app-service-instance-last-op',
  templateUrl: './service-instance-last-op.component.html',
  styleUrls: ['./service-instance-last-op.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BooleanIndicatorComponent
  ]
})
export class ServiceInstanceLastOpComponent {
  @Input() serviceInstance!: APIResource<IServiceInstance>;
  @Input() alignRight = false;

}
