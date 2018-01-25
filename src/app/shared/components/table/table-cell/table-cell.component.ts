import { TableCellTCPRouteComponent } from '../custom-cells/table-cell-tcproute/table-cell-tcproute.component';
import { TableCellRouteComponent } from '../custom-cells/table-cell-route/table-cell-route.component';
import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnInit,
  Type,
  ViewContainerRef,
  ViewChild,
  OnChanges,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import { TableCellSelectComponent } from '../table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../table-header-select/table-header-select.component';
import { TableCellEditComponent } from '../table-cell-edit/table-cell-edit.component';
import { TableCellEditVariableComponent } from '../custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import { TableCellCustom } from './table-cell-custom';
import { TableCellEventTimestampComponent } from '../custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from '../custom-cells/table-cell-event-type/table-cell-event-type.component';
import { TableCellEventActionComponent } from '../custom-cells/table-cell-event-action/table-cell-event-action.component';
import { TableCellEventDetailComponent } from '../custom-cells/table-cell-event-detail/table-cell-event-detail.component';
import { TableCellActionsComponent } from '../table-cell-actions/table-cell-actions.component';
import { TableCellAppNameComponent } from '../custom-cells/table-cell-app-name/table-cell-app-name.component';
import { TableCellEndpointStatusComponent } from '../custom-cells/table-cell-endpoint-status/table-cell-endpoint-status.component';
import { IListDataSource } from '../../../data-sources/list-data-source-types';
import { TableCellAppStatusComponent } from '../custom-cells/table-cell-app-status/table-cell-app-status.component';
import { TableCellUsageComponent } from '../custom-cells/table-cell-usage/table-cell-usage.component';

@Component({
  selector: 'app-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrls: ['./table-cell.component.scss'],
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
    TableCellEndpointStatusComponent,
    TableCellAppStatusComponent,
    TableCellUsageComponent,
    TableCellRouteComponent,
    TableCellTCPRouteComponent,
  ],
})
export class TableCellComponent<T> implements OnInit, OnChanges {

  @ViewChild('target', { read: ViewContainerRef }) target;

  @Input('dataSource') dataSource = null as IListDataSource<T>;

  @Input('component') component: Type<{}>;
  @Input('func') func: () => string;
  @Input('row') row: T;
  @Input('config') config: any;

  private cellComponent: TableCellCustom<T>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    if (this.component) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component);
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
    if (
      row &&
      this.cellComponent &&
      row.previousValue !== row.currentValue
    ) {
      this.cellComponent.row = row.currentValue;
    }
  }

}
