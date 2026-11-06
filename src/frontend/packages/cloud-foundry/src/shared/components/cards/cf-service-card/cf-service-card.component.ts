import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, booleanAttribute, computed, inject, input, untracked } from '@angular/core';
import { Router } from '@angular/router';

import {
  CardCell,
  CustomTooltipDirective,
  EndpointsSignalService,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent
} from '@stratosui/core';

import { CfCurrentUserRolesSignalService } from '../../../../user-permissions/cf-current-user-roles-signal.service';
import { StServiceOffering } from '../../../../services/endpoint-data/stratos-types';
import { CfOrgSpaceLabelService } from '../../../services/cf-org-space-label.service';
import { ServiceIconComponent } from '../../service-icon/service-icon.component';
import { TableCellServiceActiveComponent } from './table-cell-service-active/table-cell-service-active.component';
import { TableCellServiceBindableComponent } from './table-cell-service-bindable/table-cell-service-bindable.component';
import {
  TableCellServiceBrokerComponent,
  TableCellServiceBrokerComponentConfig,
  TableCellServiceBrokerComponentMode,
} from './table-cell-service-broker/table-cell-service-broker.component';
import { TableCellServiceCfBreadcrumbsComponent } from './table-cell-service-cf-breadcrumbs/table-cell-service-cf-breadcrumbs.component';
import { TableCellServiceReferencesComponent } from './table-cell-service-references/table-cell-service-references.component';
import { TableCellServiceTagsComponent } from './table-cell-service-tags/table-cell-service-tags.component';

@Component({
  selector: 'app-cf-service-card',
  templateUrl: './cf-service-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CustomTooltipDirective,
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
  private endpoints = inject(EndpointsSignalService);
  private router = inject(Router);
  private cfRoles = inject(CfCurrentUserRolesSignalService);

  // The row under the name the template and the methods below use. It can be
  // absent: select-service binds its selection before one is made.
  get offering(): StServiceOffering {
    return this.row();
  }
  // One label service per endpoint; built untracked so that it depends on
  // the row's endpoint alone.
  private readonly cnsiGuid = computed(() => this.row()?.cnsiGuid);
  readonly cfOrgSpace = computed(() => {
    const cnsiGuid = this.cnsiGuid();
    return untracked(() => new CfOrgSpaceLabelService(this.endpoints, this.cfRoles, cnsiGuid));
  });
  // Lookup of providerDisplayName from brokerCatalogMetadata. The
  // legacy code JSON-parsed entity.extra; the backend now decodes it.
  readonly providerDisplayName = computed<string | null>(() => {
    const provider = this.row()?.brokerCatalogMetadata?.providerDisplayName;
    return typeof provider === 'string' ? provider : null;
  });
  brokerNameConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.NAME
  };
  brokerScopeConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.SCOPE
  };

  // Attribute form (disableCardClick / disableCardClick="true") coerces to boolean
  readonly disableCardClick = input(false, { transform: booleanAttribute });

  getDisplayName(): string {
    if (!this.offering) return '';
    const meta = this.offering.brokerCatalogMetadata;
    const display = meta?.displayName;
    if (typeof display === 'string' && display) return display;
    return this.offering.name;
  }

  goToServiceInstances = () =>
    this.router.navigate(['marketplace', this.offering.cnsiGuid, this.offering.guid]);
}
