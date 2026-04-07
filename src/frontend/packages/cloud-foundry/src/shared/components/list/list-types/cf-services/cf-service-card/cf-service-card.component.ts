import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
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
import { APIResource, EntityServiceFactory, RouterNav } from '@stratosui/store';

import { CFAppState } from '../../../../../../cf-app-state';
import { IService, IServiceExtra } from '../../../../../../cf-api-svc.types';
import { getServiceName } from '../../../../../../features/service-catalog/services-helper';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { ServiceIconComponent } from '../../../../service-icon/service-icon.component';
import { TableCellServiceActiveComponent } from '../table-cell-service-active/table-cell-service-active.component';
import { TableCellServiceBindableComponent } from '../table-cell-service-bindable/table-cell-service-bindable.component';
import {
  TableCellServiceBrokerComponent,
  TableCellServiceBrokerComponentConfig,
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
  private store = inject<Store<CFAppState>>(Store);

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

  @Input()
  set row(row: APIResource<IService>) {
    super.row = row;
    if (row) {
      this.serviceEntity = row;
      this.extraInfo = null;
      if (this.serviceEntity.entity.extra) {
        try {
          this.extraInfo = JSON.parse(this.serviceEntity.entity.extra);
        } catch { /* intentionally empty */ }
      }

      if (!this.cfOrgSpace) {
        this.cfOrgSpace = new CfOrgSpaceLabelService(this.store, this.serviceEntity.entity.cfGuid);
      }
    }
  }

  getDisplayName() {
    return getServiceName(this.serviceEntity);
  }

  goToServiceInstances = () =>
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.serviceEntity.entity.cfGuid, this.serviceEntity.metadata.guid]
    }));
}
