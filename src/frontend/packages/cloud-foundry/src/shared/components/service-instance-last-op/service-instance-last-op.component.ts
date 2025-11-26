import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input , ChangeDetectionStrategy } from '@angular/core';

import { BooleanIndicatorComponent } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { IServiceInstance } from '../../../cf-api-svc.types';

@Component({
  selector: 'app-service-instance-last-op',
  templateUrl: './service-instance-last-op.component.html',
  styleUrls: ['./service-instance-last-op.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    BooleanIndicatorComponent
  ]
})
export class ServiceInstanceLastOpComponent {
  @Input() serviceInstance!: APIResource<IServiceInstance>;
  @Input() alignRight = false;

}
