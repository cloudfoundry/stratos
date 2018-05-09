import { Component, Input, OnInit } from '@angular/core';

import { APIResource } from '../../../../../../store/types/api.types';
import { CardCell } from '../../../list.types';
import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { AppChip } from '../../../../chips/chips.component';

@Component({
  selector: 'app-service-instance-card',
  templateUrl: './service-instance-card.component.html',
  styleUrls: ['./service-instance-card.component.scss']
})
export class ServiceInstanceCardComponent extends CardCell<APIResource> implements OnInit {

  @Input('row') row: APIResource<IServiceInstance>;

  serviceInstanceTags: AppChip[];

  constructor() {
    super();
  }

  ngOnInit() {

    this.serviceInstanceTags = this.row.entity.tags.map(t => ({
      value: t
    }));
  }

}
