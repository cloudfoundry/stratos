import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnChanges,
  OnInit,
  SimpleChange,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';

import { IListDataSource } from '../../../data-sources/list-data-source-types';
import { TableCellAppInstancesComponent } from '../custom-cells/table-cell-app-instances/table-cell-app-instances.component';
import { TableCellAppNameComponent } from '../custom-cells/table-cell-app-name/table-cell-app-name.component';
import { TableCellAppRouteComponent } from '../custom-cells/table-cell-app-route/table-cell-app-route.component';
import { TableCellAppStatusComponent } from '../custom-cells/table-cell-app-status/table-cell-app-status.component';
import { TableCellEditVariableComponent } from '../custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import {
  TableCellEndpointStatusComponent,
} from '../custom-cells/table-cell-endpoint-status/table-cell-endpoint-status.component';
import { TableCellEventActionComponent } from '../custom-cells/table-cell-event-action/table-cell-event-action.component';
import { TableCellEventDetailComponent } from '../custom-cells/table-cell-event-detail/table-cell-event-detail.component';
import {
  TableCellEventTimestampComponent,
} from '../custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from '../custom-cells/table-cell-event-type/table-cell-event-type.component';
import { TableCellRadioComponent } from '../custom-cells/table-cell-radio/table-cell-radio.component';
import { TableCellRouteComponent } from '../custom-cells/table-cell-route/table-cell-route.component';
import { TableCellTCPRouteComponent } from '../custom-cells/table-cell-tcproute/table-cell-tcproute.component';
import { TableCellUsageComponent } from '../custom-cells/table-cell-usage/table-cell-usage.component';
import { TableCellActionsComponent } from '../table-cell-actions/table-cell-actions.component';
import { TableCellEditComponent } from '../table-cell-edit/table-cell-edit.component';
import { TableCellSelectComponent } from '../table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../table-header-select/table-header-select.component';
import { TableCellCustom } from './table-cell-custom';

@Component({
  selector: 'app-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrls: ['./table-cell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  // When we look at modules we should think about swapping this approach (create + insert in code, hard code types here) with
  // NgComponentOutlet (create in html with custom external module factory). Alternatively try marking as entry component where they live?
  entryComponents: [
    TableCellSelectComponent,
    TableHeaderSelectComponent,
    TableCellEditComponent,
    TableCellEditVariableComponent,
    TableCellEventTimestampComponent,
    TableCellEventTypeComponent,
    TableCellEventActionComponent,
    TableCellEventDetailComponent,
    TableCellActionsComponent,
    TableCellAppNameComponent,
    TableCellAppInstancesComponent,
    TableCellEndpointStatusComponent,
    TableCellAppStatusComponent,
    TableCellUsageComponent,
    TableCellRouteComponent,
    TableCellTCPRouteComponent,
    TableCellAppRouteComponent,
    TableCellRadioComponent
  ]
})
export class TableCellComponent<T> implements OnInit, OnChanges {
  @ViewChild('target', { read: ViewContainerRef })
  target;

  @Input('dataSource') dataSource = null as IListDataSource<T>;

  @Input('component') component: Type<{}>;
  @Input('func') func: () => string;
  @Input('row') row: T;
  @Input('config') config: any;

  private cellComponent: TableCellCustom<T>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  ngOnInit() {
    if (this.component) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
        this.component
      );
      // Add to target to ensure ngcontent is correct in new component
      const componentRef = this.target.createComponent(componentFactory);
      this.cellComponent = <TableCellCustom<T>>componentRef.instance;
      this.cellComponent.row = this.row;
      this.cellComponent.dataSource = this.dataSource;
      this.cellComponent.config = this.config;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const row: SimpleChange = changes.row;
    if (row && this.cellComponent && row.previousValue !== row.currentValue) {
      this.cellComponent.row = row.currentValue;
    }
  }
}
