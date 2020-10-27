import { Component, Input, OnInit } from '@angular/core';

import { AppChip } from '../../../../../../core/src/shared/components/chips/chips.component';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../cf-api-svc.types';

@Component({
  selector: 'app-compact-service-instance-card',
  templateUrl: './compact-service-instance-card.component.html',
  styleUrls: ['./compact-service-instance-card.component.scss']
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
