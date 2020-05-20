import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { EntityServiceFactory } from '../../../../../../../../store/src/entity-service-factory.service';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IService, IServiceExtra } from '../../../../../../cf-api-svc.types';
import { getServiceBrokerName, getServiceName } from '../../../../../../features/service-catalog/services-helper';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';

export interface ServiceTag {
  value: string;
  key: APIResource<IService>;
}
@Component({
  selector: 'app-cf-service-card',
  templateUrl: './cf-service-card.component.html',
  styleUrls: ['./cf-service-card.component.scss'],
  providers: [EntityServiceFactory]
})
export class CfServiceCardComponent extends CardCell<APIResource<IService>> {
  serviceEntity: APIResource<IService>;
  cfOrgSpace: CfOrgSpaceLabelService;
  extraInfo: IServiceExtra;
  tags: AppChip<ServiceTag>[] = [];
  serviceBrokerName$: Observable<string>;

  @Input() disableCardClick = false;

  @Input('row')
  set row(row: APIResource<IService>) {
    if (row) {
      this.serviceEntity = row;
      this.extraInfo = null;
      if (this.serviceEntity.entity.extra) {
        try {
          this.extraInfo = JSON.parse(this.serviceEntity.entity.extra);
        } catch { }
      }

      if (!this.cfOrgSpace) {
        this.cfOrgSpace = new CfOrgSpaceLabelService(this.store, this.serviceEntity.entity.cfGuid);
      }

      if (!this.serviceBrokerName$) {
        this.serviceBrokerName$ = getServiceBrokerName(
          this.serviceEntity.entity.service_broker_guid,
          this.serviceEntity.entity.cfGuid,
        );
      }
    }
  }

  constructor(
    private store: Store<CFAppState>,
  ) {
    super();
  }

  getDisplayName() {
    return getServiceName(this.serviceEntity);
  }

  goToServiceInstances = () =>
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.serviceEntity.entity.cfGuid, this.serviceEntity.metadata.guid]
    }))
}
