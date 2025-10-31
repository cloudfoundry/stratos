import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { MetaCardComponent } from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardTitleComponent } from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardValueComponent } from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { MultilineTitleComponent } from '../../../../../../../../core/src/shared/components/multiline-title/multiline-title.component';
import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { EntityServiceFactory } from '../../../../../../../../store/src/entity-service-factory.service';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
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
        this.cfOrgSpace = new CfOrgSpaceLabelService(this.serviceEntity.entity.cfGuid);
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
    }));
}
