import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, Input , ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  AppChip,
  CardCell,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent
} from '@stratosui/core';
import { APIResource, EntityServiceFactory, RouterNav , GeneralEntityAppState } from '@stratosui/store';

import type { CFAppState } from '../../../../../../cf-app-state';
import type { IService, IServiceExtra } from '../../../../../../cf-api-svc.types';
import { getServiceName } from '../../../../../../features/service-catalog/services-helper';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { ServiceIconComponent } from '../../../../service-icon/service-icon.component';
import { TableCellServiceActiveComponent } from '../table-cell-service-active/table-cell-service-active.component';
import { TableCellServiceBindableComponent } from '../table-cell-service-bindable/table-cell-service-bindable.component';
import {
  TableCellServiceBrokerComponent,
  type TableCellServiceBrokerComponentConfig,
  TableCellServiceBrokerComponentMode,
} from '../table-cell-service-broker/table-cell-service-broker.component';
import { TableCellServiceCfBreadcrumbsComponent } from '../table-cell-service-cf-breadcrumbs/table-cell-service-cf-breadcrumbs.component';
import { TableCellServiceReferencesComponent } from '../table-cell-service-references/table-cell-service-references.component';
import { TableCellServiceTagsComponent } from '../table-cell-service-tags/table-cell-service-tags.component';

export interface ServiceTag {
  value: string;
  key: APIResource<IService>;
}
@Component({
  selector: 'app-cf-service-card',
  templateUrl: './cf-service-card.component.html',
  styleUrls: ['./cf-service-card.component.scss'],
  providers: [EntityServiceFactory],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
    MetaCardComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardTitleComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    ServiceIconComponent,
    TableCellServiceActiveComponent,
    TableCellServiceBindableComponent,
    TableCellServiceBrokerComponent,
    TableCellServiceCfBreadcrumbsComponent,
    TableCellServiceReferencesComponent,
    TableCellServiceTagsComponent,
  ]
})
export class CfServiceCardComponent extends CardCell<APIResource<IService>> {
  serviceEntity: APIResource<IService>;
  cfOrgSpace: CfOrgSpaceLabelService;
  extraInfo: IServiceExtra;
  tags: AppChip<ServiceTag>[] = [];
  brokerNameConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.NAME
  };
  brokerScopeConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.SCOPE
  };

  @Input() disableCardClick = false;

  @Input('row')
  set row(row: APIResource<IService>) {
    super.row = row;
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
    }
  }

  constructor(
    private store: Store<GeneralEntityAppState>,
  ) {
    super();
  }

  getDisplayName() {
    return getServiceName(this.serviceEntity);
  }

  goToServiceInstances = () =>
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.serviceEntity.entity.cfGuid, this.serviceEntity.metadata.guid]
    }));
}
