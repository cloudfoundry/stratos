import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { GetServiceBroker } from '../../../../../../../../store/src/actions/service-broker.actions';
import { AppState } from '../../../../../../../../store/src/app-state';
import { entityFactory, serviceBrokerSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IService, IServiceBroker, IServiceExtra } from '../../../../../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { AppChip } from '../../../../chips/chips.component';
import { CardCell } from '../../../list.types';

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
        this.serviceBrokerName$ = this.entityServiceFactory.create<APIResource<IServiceBroker>>(
          serviceBrokerSchemaKey,
          entityFactory(serviceBrokerSchemaKey),
          brokerGuid,
          new GetServiceBroker(
            brokerGuid,
            this.serviceEntity.entity.cfGuid
          )
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
    private store: Store<AppState>,
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
