import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { ServicesWallService } from '../../../../../../features/services/services/services-wall.service';
import { DeleteServiceInstance } from '../../../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { AppChip } from '../../../../chips/chips.component';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';
import { DeleteServiceBinding } from '../../../../../../store/actions/service-bindings.actions';
import { detachServiceBinding, deleteServiceInstance } from '../../app-sevice-bindings/service-binding.helper';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';

@Component({
  selector: 'app-service-instance-card',
  templateUrl: './service-instance-card.component.html',
  styleUrls: ['./service-instance-card.component.scss'],
  providers: [
    ServicesWallService
  ]
})
export class ServiceInstanceCardComponent extends CardCell<APIResource<IServiceInstance>> implements OnInit {
  cfGuid: string;
  cardMenu: MetaCardMenuItem[];

  serviceInstanceTags: AppChip[];
  hasMultipleBindings = new BehaviorSubject(true);

  constructor(
    private store: Store<AppState>,
    private servicesWallService: ServicesWallService,
    private confirmDialog: ConfirmationDialogService
  ) {
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
    const serviceBindingGuid = this.row.entity.service_bindings[0].metadata.guid;
    detachServiceBinding(this.confirmDialog, this.store, serviceBindingGuid, this.row.metadata.guid, this.row.entity.cfGuid);
  }


  delete = () => deleteServiceInstance(this.confirmDialog, this.store, this.row.metadata.guid, this.row.entity.cfGuid);

}
