import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { AppChip } from '../../../../chips/chips.component';
import { CardCell } from '../../../list.types';
import { ServicesWallService } from '../../../../../../features/services/services/services-wall.service';

@Component({
  selector: 'app-service-instance-card',
  templateUrl: './service-instance-card.component.html',
  styleUrls: ['./service-instance-card.component.scss'],
  providers: [
    ServicesWallService
  ]
})
export class ServiceInstanceCardComponent extends CardCell<APIResource> implements OnInit {

  @Input('row') row: APIResource<IServiceInstance>;

  serviceInstanceTags: AppChip[];

  constructor(private store: Store<AppState>, private servicesWallService: ServicesWallService) {
    super();
  }

  ngOnInit() {

    this.serviceInstanceTags = this.row.entity.tags.map(t => ({
      value: t
    }));

  }

}
