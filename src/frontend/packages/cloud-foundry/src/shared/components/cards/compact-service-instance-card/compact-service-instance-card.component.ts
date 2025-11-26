import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, type OnInit , ChangeDetectionStrategy } from '@angular/core';

import { AppChipsComponent, type AppChip } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { IServiceInstance } from '../../../../cf-api-svc.types';

@Component({
  selector: 'app-compact-service-instance-card',
  templateUrl: './compact-service-instance-card.component.html',
  styleUrls: ['./compact-service-instance-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    AppChipsComponent
  ]
})
export class CompactServiceInstanceCardComponent implements OnInit {
  serviceInstanceTags: AppChip[];

  @Input() serviceInstance: APIResource<IServiceInstance>;

  ngOnInit() {
    this.serviceInstanceTags = this.serviceInstance.entity.tags.map(t => ({
      value: t
    }));
  }

}
