import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../../store/types/api.types';
import { IServiceInstance } from '../../../../core/cf-api-svc.types';
import { AppChip } from '../../chips/chips.component';

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
