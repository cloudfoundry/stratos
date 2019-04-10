/* tslint:disable:max-line-length */
import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';

import { coreEndpointListDetailsComponents } from '../../../../../features/endpoints/endpoint-helpers';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import {
  TableCellEventActionComponent,
} from '../../list-types/app-event/table-cell-event-action/table-cell-event-action.component';
import {
  TableCellEventDetailComponent,
} from '../../list-types/app-event/table-cell-event-detail/table-cell-event-detail.component';
import {
  TableCellEventTimestampComponent,
} from '../../list-types/app-event/table-cell-event-timestamp/table-cell-event-timestamp.component';
import {
  TableCellEventTypeComponent,
} from '../../list-types/app-event/table-cell-event-type/table-cell-event-type.component';
import {
  TableCellAutoscalerEventChangeComponent,
} from '../../list-types/app-autoscaler-event/table-cell-autoscaler-event-change/table-cell-autoscaler-event-change.component';
import {
  TableCellAutoscalerEventStatusComponent,
} from '../../list-types/app-autoscaler-event/table-cell-autoscaler-event-status/table-cell-autoscaler-event-status.component';
import { TableCellCfCellComponent } from '../../list-types/app-instance/table-cell-cf-cell/table-cell-cf-cell.component';
import { TableCellUsageComponent } from '../../list-types/app-instance/table-cell-usage/table-cell-usage.component';
import {
  TableCellEditVariableComponent,
} from '../../list-types/app-variables/table-cell-edit-variable/table-cell-edit-variable.component';
import {
  TableCellAppCfOrgSpaceHeaderComponent,
} from '../../list-types/app/table-cell-app-cforgspace-header/table-cell-app-cforgspace-header.component';
import {
  TableCellAppCfOrgSpaceComponent,
} from '../../list-types/app/table-cell-app-cforgspace/table-cell-app-cforgspace.component';
import {
  TableCellAppInstancesComponent,
} from '../../list-types/app/table-cell-app-instances/table-cell-app-instances.component';
import { TableCellAppNameComponent } from '../../list-types/app/table-cell-app-name/table-cell-app-name.component';
import { TableCellAppStatusComponent } from '../../list-types/app/table-cell-app-status/table-cell-app-status.component';
import {
  TableCellConfirmOrgSpaceComponent,
} from '../../list-types/cf-confirm-roles/table-cell-confirm-org-space/table-cell-confirm-org-space.component';
import {
  TableCellConfirmRoleAddRemComponent,
} from '../../list-types/cf-confirm-roles/table-cell-confirm-role-add-rem/table-cell-confirm-role-add-rem.component';
import {
  TableCellFeatureFlagStateComponent,
} from '../../list-types/cf-feature-flags/table-cell-feature-flag-state/table-cell-feature-flag-state.component';
import {
  TableCellRouteAppsAttachedComponent,
} from '../../list-types/cf-routes/table-cell-route-apps-attached/table-cell-route-apps-attached.component';
import { TableCellRouteComponent } from '../../list-types/cf-routes/table-cell-route/table-cell-route.component';
import { TableCellTCPRouteComponent } from '../../list-types/cf-routes/table-cell-tcproute/table-cell-tcproute.component';
import {
  TableCellServiceInstanceAppsAttachedComponent,
} from '../../list-types/cf-spaces-service-instances/table-cell-service-instance-apps-attached/table-cell-service-instance-apps-attached.component';
import {
  TableCellServiceInstanceTagsComponent,
} from '../../list-types/cf-spaces-service-instances/table-cell-service-instance-tags/table-cell-service-instance-tags.component';
import {
  TableCellServiceNameComponent,
} from '../../list-types/cf-spaces-service-instances/table-cell-service-name/table-cell-service-name.component';
import {
  TableCellServicePlanComponent,
} from '../../list-types/cf-spaces-service-instances/table-cell-service-plan/table-cell-service-plan.component';
import {
  TableCellSpaceNameComponent,
} from '../../list-types/cf-spaces-service-instances/table-cell-space-name/table-cell-space-name.component';
import {
  TableCellRoleOrgSpaceComponent,
} from '../../list-types/cf-users-org-space-roles/table-cell-org-space-role/table-cell-org-space-role.component';
import {
  TableCellSelectOrgComponent,
} from '../../list-types/cf-users-org-space-roles/table-cell-select-org/table-cell-select-org.component';
import {
  CfOrgPermissionCellComponent,
} from '../../list-types/cf-users/cf-org-permission-cell/cf-org-permission-cell.component';
import {
  CfSpacePermissionCellComponent,
} from '../../list-types/cf-users/cf-space-permission-cell/cf-space-permission-cell.component';
import {
  TableCellEndpointDetailsComponent,
} from '../../list-types/endpoint/table-cell-endpoint-details/table-cell-endpoint-details.component';
import {
  TableCellEndpointNameComponent,
} from '../../list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component';
import {
  TableCellEndpointStatusComponent,
} from '../../list-types/endpoint/table-cell-endpoint-status/table-cell-endpoint-status.component';
import {
  TableCellCommitAuthorComponent,
} from '../../list-types/github-commits/table-cell-commit-author/table-cell-commit-author.component';
import {
  TableCellAServicePlanExtrasComponent,
} from '../../list-types/service-plans/table-cell-service-plan-extras/table-cell-service-plan-extras.component';
import {
  TableCellAServicePlanPriceComponent,
} from '../../list-types/service-plans/table-cell-service-plan-price/table-cell-service-plan-price.component';
import {
  TableCellAServicePlanPublicComponent,
} from '../../list-types/service-plans/table-cell-service-plan-public/table-cell-service-plan-public.component';
import { TableCellCustom } from '../../list.types';
import { TableCellDefaultComponent } from '../app-table-cell-default/app-table-cell-default.component';
import { TableCellActionsComponent } from '../table-cell-actions/table-cell-actions.component';
import { TableCellBooleanIndicatorComponent } from '../table-cell-boolean-indicator/table-cell-boolean-indicator.component';
import { TableCellEditComponent } from '../table-cell-edit/table-cell-edit.component';
import { TableCellFavoriteComponent } from '../table-cell-favorite/table-cell-favorite.component';
import { TableCellRadioComponent } from '../table-cell-radio/table-cell-radio.component';
import {
  TableCellRequestMonitorIconComponent,
} from '../table-cell-request-monitor-icon/table-cell-request-monitor-icon.component';
import { TableCellSelectComponent } from '../table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../table-header-select/table-header-select.component';
import { ICellDefinition } from '../table.types';
import { MultiActionListEntity } from './../../../../monitors/pagination-monitor';
import { TableCellAutoscalerEventStatusIconPipe } from '../../list-types/app-autoscaler-event/table-cell-autoscaler-event-status/table-cell-autoscaler-event-status-icon.pipe';

/* tslint:enable:max-line-length */
export const listTableCells = [
  TableCellDefaultComponent,
  TableHeaderSelectComponent,
  TableCellSelectComponent,
  TableCellEditComponent,
  TableCellEditVariableComponent,
  TableCellEventTimestampComponent,
  TableCellEventTypeComponent,
  TableCellEventActionComponent,
  TableCellEventDetailComponent,
  TableCellAutoscalerEventStatusComponent,
  TableCellAutoscalerEventChangeComponent,
  TableCellActionsComponent,
  TableCellAppNameComponent,
  TableCellEndpointStatusComponent,
  TableCellEndpointNameComponent,
  TableCellAppStatusComponent,
  TableCellUsageComponent,
  TableCellCfCellComponent,
  TableCellBooleanIndicatorComponent,
  TableCellRouteComponent,
  TableCellTCPRouteComponent,
  TableCellAppInstancesComponent,
  TableCellRadioComponent,
  TableCellServiceInstanceAppsAttachedComponent,
  TableCellServiceInstanceTagsComponent,
  TableCellServicePlanComponent,
  TableCellServiceNameComponent,
  TableCellRouteAppsAttachedComponent,
  CfOrgPermissionCellComponent,
  CfSpacePermissionCellComponent,
  TableCellFeatureFlagStateComponent,
  TableCellConfirmOrgSpaceComponent,
  TableCellRequestMonitorIconComponent,
  TableCellConfirmRoleAddRemComponent,
  TableCellRoleOrgSpaceComponent,
  TableCellSelectOrgComponent,
  TableCellCommitAuthorComponent,
  TableCellRequestMonitorIconComponent,
  TableCellSpaceNameComponent,
  TableCellAppCfOrgSpaceHeaderComponent,
  TableCellAppCfOrgSpaceComponent,
  TableCellAServicePlanPublicComponent,
  TableCellAServicePlanPriceComponent,
  TableCellAServicePlanExtrasComponent,
  TableCellFavoriteComponent,
  TableCellEndpointDetailsComponent,
  ...coreEndpointListDetailsComponents
];

@Component({
  selector: 'app-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrls: ['./table-cell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  // When we look at modules we should think about swapping this approach (create + insert in code, hard code types here) with
  // NgComponentOutlet (create in html with custom external module factory). Alternatively try marking as entry component where they live?
  entryComponents: [...listTableCells]
})
export class TableCellComponent<T> implements OnInit {
  @ViewChild('target', { read: ViewContainerRef })
  target: ViewContainerRef;
  private rcRow: T | MultiActionListEntity;

  @Input() dataSource = null as IListDataSource<T>;

  @Input() component: Type<{}>;
  @Input() cellDefinition: ICellDefinition<T>;
  @Input() func: () => string;
  @Input() set row(row: T | MultiActionListEntity) {
    if (this.cellComponent) {
      const { rowValue, entityKey } = this.getRowData(row);
      this.cellComponent.row = rowValue;
      this.cellComponent.entityKey = entityKey;
      if (this.dataSource.getRowState) {
        this.cellComponent.rowState = this.dataSource.getRowState(rowValue, entityKey);
      }
    }
    this.rcRow = row;
  }
  get row() {
    return this.rcRow;
  }

  @Input() config: any;

  private cellComponent: TableCellCustom<T>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  private getComponent() {
    if (this.cellDefinition) {
      return this.componentFactoryResolver.resolveComponentFactory(
        TableCellDefaultComponent
      );
    } else if (this.component) {
      return this.componentFactoryResolver.resolveComponentFactory(
        this.component
      );
    }
    return null;
  }

  private createComponent() {
    const component = this.getComponent();
    return !!component ? this.target.createComponent(component) : null;
  }

  private getRowData(rowData: T | MultiActionListEntity) {
    const rowValue = MultiActionListEntity.getEntity(rowData);
    const entityKey = MultiActionListEntity.getEntityKey(rowData);
    return {
      rowValue,
      entityKey
    };
  }

  ngOnInit() {
    const component = this.createComponent();
    if (component) {

      // Add to target to ensure ngcontent is correct in new component
      this.cellComponent = component.instance as TableCellCustom<T>;
      const { rowValue, entityKey } = this.getRowData(this.row);
      this.cellComponent.row = rowValue;
      this.cellComponent.entityKey = entityKey;
      this.cellComponent.dataSource = this.dataSource;
      this.cellComponent.config = this.config;
      if (this.dataSource.getRowState) {
        this.cellComponent.rowState = this.dataSource.getRowState(rowValue, entityKey);
      }
      if (this.cellDefinition) {
        const defaultTableCell = this.cellComponent as TableCellDefaultComponent<T>;
        defaultTableCell.cellDefinition = this.cellDefinition;
        defaultTableCell.init();
      }
    }
  }

}
