import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { AppChip } from '../../../../chips/chips.component';
import { CardCell } from '../../../list.types';
import { ServicesWallService } from '../../../../../../features/services/services/services-wall.service';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { DeleteServiceInstance, DeleteServiceBinding } from '../../../../../../store/actions/service-instances.actions';
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-service-instance-card',
  templateUrl: './service-instance-card.component.html',
  styleUrls: ['./service-instance-card.component.scss'],
  providers: [
    ServicesWallService
  ]
})
export class ServiceInstanceCardComponent extends CardCell<APIResource> implements OnInit {
  cfGuid: string;
  cardMenu: MetaCardMenuItem[];

  @Input('row') row: APIResource<IServiceInstance>;

  serviceInstanceTags: AppChip[];
  hasMultipleBindings = new BehaviorSubject(true);



  constructor(private store: Store<AppState>, private servicesWallService: ServicesWallService) {
    super();

    this.cardMenu = [
      {
        label: 'Detach',
        action: this.detach,
        disabled: this.hasMultipleBindings
      },
      {
        label: 'Delete',
        action: this.delete
      }
    ];

  }

  ngOnInit() {

    this.serviceInstanceTags = this.row.entity.tags.map(t => ({
      value: t
    }));

    this.cfGuid = this.row.entity.cfGuid;
    this.hasMultipleBindings.next(!(this.row.entity.service_bindings.length > 0));

  }


  detach = () => {
    // Only deletes the first binding, if more than one exist this should take user to the appropriate view
    if (this.row.entity.service_bindings.length === 1) {
      this.store.dispatch(new DeleteServiceBinding(
        this.cfGuid,
        this.row.entity.service_bindings[0].metadata.guid));
    }
  }


  delete = () => this.store.dispatch(new DeleteServiceInstance(this.cfGuid, this.row.metadata.guid));

}
