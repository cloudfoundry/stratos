import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@stratosui/store';

import {
  CardCell,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent
} from '@stratosui/core';
import { EntityServiceFactory, RouterNav } from '@stratosui/store';

import { CFAppState } from '../../../../../../cf-app-state';
import { CfCurrentUserRolesSignalService } from '../../../../../../user-permissions/cf-current-user-roles-signal.service';
import { StServiceOffering } from '../../../../../../services/endpoint-data/stratos-types';
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
export class CfServiceCardComponent extends CardCell<StServiceOffering> {
  private store = inject<Store<CFAppState>>(Store);
  private cfRoles = inject(CfCurrentUserRolesSignalService);

  offering!: StServiceOffering;
  cfOrgSpace!: CfOrgSpaceLabelService;
  // Cached lookup of providerDisplayName from brokerCatalogMetadata. The
  // legacy code JSON-parsed entity.extra; the backend now decodes it.
  providerDisplayName: string | null = null;
  brokerNameConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.NAME
  };
  brokerScopeConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.SCOPE
  };

  @Input() disableCardClick = false;

  @Input()
  set row(row: StServiceOffering) {
    super.row = row;
    if (row) {
      this.offering = row;
      const meta = row.brokerCatalogMetadata;
      const provider = meta?.providerDisplayName;
      this.providerDisplayName = typeof provider === 'string' ? provider : null;

      if (!this.cfOrgSpace) {
        this.cfOrgSpace = new CfOrgSpaceLabelService(this.store, this.cfRoles, row.cnsiGuid);
      }
    }
  }

  getDisplayName(): string {
    if (!this.offering) return '';
    const meta = this.offering.brokerCatalogMetadata;
    const display = meta?.displayName;
    if (typeof display === 'string' && display) return display;
    return this.offering.name;
  }

  goToServiceInstances = () =>
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.offering.cnsiGuid, this.offering.guid]
    }));
}
