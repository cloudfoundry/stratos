import { Component, ComponentFactoryResolver, Input, Type, ViewChild, ViewContainerRef } from '@angular/core';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { getEndpointType } from '../../../../../../features/endpoints/endpoint-helpers';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-endpoint-details',
  templateUrl: './table-cell-endpoint-details.component.html',
  styleUrls: ['./table-cell-endpoint-details.component.scss']
})
export class TableCellEndpointDetailsComponent extends TableCellCustom<EndpointModel> {

  @Input() component: Type<TableCellCustom<EndpointModel>>;
  @ViewChild('target', { read: ViewContainerRef }) target;

  cell: TableCellCustom<EndpointModel>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {
    super();
  }

  private pRow: EndpointModel;
  @Input('row')
  set row(row: EndpointModel) {
    this.pRow = row;

    const e = getEndpointType(row.cnsi_type);
    if (e.listDetailsComponent) {
      if (!this.cell) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(e.listDetailsComponent);
        const componentRef = this.target.createComponent(componentFactory);
        this.cell = componentRef.instance as TableCellCustom<EndpointModel>;
      }
      this.cell.row = this.pRow;
    }

  }
  get row(): EndpointModel {
    return this.pRow;
  }
}
