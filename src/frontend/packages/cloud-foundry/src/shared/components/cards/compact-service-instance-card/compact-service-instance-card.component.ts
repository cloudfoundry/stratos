import { CommonModule } from '@angular/common';
import { Component, Input, OnInit , ChangeDetectionStrategy } from '@angular/core';

import { AppChipsComponent, AppChip } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IServiceInstance } from '../../../../cf-api-svc.types';

@Component({
  selector: 'app-compact-service-instance-card',
  templateUrl: './compact-service-instance-card.component.html',
  styleUrls: ['./compact-service-instance-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppChipsComponent
  ]
})
export class CompactServiceInstanceCardComponent implements OnInit {
  serviceInstanceTags: AppChip[];

  @Input() serviceInstance: APIResource<IServiceInstance>;
  constructor() { }

  ngOnInit() {
    this.serviceInstanceTags = this.serviceInstance.entity.tags.map(t => ({
      value: t
    }));
  }

}
