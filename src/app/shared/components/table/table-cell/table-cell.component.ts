import { Component, ComponentFactoryResolver, Input, OnInit, Type, ViewContainerRef, ViewChild } from '@angular/core';
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
import { IListDataSource } from '../../../data-sources/list=data-source-types';

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
  ],
})
export class TableCellComponent<T> implements OnInit {

  @ViewChild('target', { read: ViewContainerRef }) target;

  @Input('dataSource') dataSource = null as IListDataSource<T>;

  @Input('component') component: Type<{}>;
  @Input('func') func: () => string;
  @Input('row') row: T;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    if (this.component) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component);
      // Add to target to ensure ngcontent is correct in new component
      const componentRef = this.target.createComponent(componentFactory);
      const cellComponent = <TableCellCustom<T>>componentRef.instance;
      cellComponent.row = this.row;
      cellComponent.dataSource = this.dataSource;
    }
  }

}
