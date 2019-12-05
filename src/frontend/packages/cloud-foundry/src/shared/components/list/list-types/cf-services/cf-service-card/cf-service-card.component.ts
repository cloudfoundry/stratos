import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { IService, IServiceBroker, IServiceExtra } from '../../../../../../../../core/src/core/cf-api-svc.types';
import { entityCatalogue } from '../../../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { EntityServiceFactory } from '../../../../../../../../core/src/core/entity-service-factory.service';
import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { CfOrgSpaceLabelService } from '../../../../../../../../core/src/shared/services/cf-org-space-label.service';
import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cf-types';
import { serviceBrokerEntityType } from '../../../../../../cf-entity-types';

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
      this.serviceEntity.entity.tags.forEach(t => {
        this.tags.push({
          value: t,
          hideClearButton$: observableOf(true)
        });
      });

      if (!this.cfOrgSpace) {
        this.cfOrgSpace = new CfOrgSpaceLabelService(this.store, this.serviceEntity.entity.cfGuid);
      }

      if (!this.serviceBrokerName$) {
        const brokerGuid = this.serviceEntity.entity.service_broker_guid;
        const serviceBrokerEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceBrokerEntityType);
        const actionBuilder = serviceBrokerEntity.actionOrchestrator.getActionBuilder('get');
        const getServiceBrokersAction = actionBuilder(brokerGuid, this.serviceEntity.entity.cfGuid);
        this.serviceBrokerName$ = this.entityServiceFactory.create<APIResource<IServiceBroker>>(
          brokerGuid,
          getServiceBrokersAction
        ).waitForEntity$.pipe(
          map(a => a.entity),
          filter(res => !!res),
          map(a => a.entity.name),
          first()
        );
      }
    }
  }

  constructor(
    private store: Store<CFAppState>,
    private entityServiceFactory: EntityServiceFactory
  ) {
    super();
  }

  getDisplayName() {
    if (this.extraInfo && this.extraInfo.displayName) {
      return this.extraInfo.displayName;
    }
    return this.serviceEntity.entity.label;
  }

  hasDocumentationUrl() {
    return !!(this.getDocumentationUrl());
  }
  getDocumentationUrl() {
    return this.extraInfo && this.extraInfo.documentationUrl;
  }

  hasSupportUrl() {
    return !!(this.getSupportUrl());
  }

  getSupportUrl() {
    return this.extraInfo && this.extraInfo.supportUrl;
  }

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });

  goToServiceInstances = () =>
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.serviceEntity.entity.cfGuid, this.serviceEntity.metadata.guid]
    }))
}
