import { Component, ComponentFactoryResolver, Input, OnDestroy, Type, ViewChild, ViewContainerRef } from '@angular/core';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { getEndpointType } from '../../../../../../features/endpoints/endpoint-helpers';
import { TableCellCustom } from '../../../list.types';
import { EndpointListDetailsComponent, EndpointListHelper } from '../endpoint-list.helpers';

@Component({
  selector: 'app-table-cell-endpoint-details',
  templateUrl: './table-cell-endpoint-details.component.html',
  styleUrls: ['./table-cell-endpoint-details.component.scss']
})
export class TableCellEndpointDetailsComponent extends TableCellCustom<EndpointModel> implements OnDestroy {

  @Input() component: Type<EndpointListDetailsComponent>;
  @ViewChild('target', { read: ViewContainerRef }) target;

  cell: EndpointListDetailsComponent;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private endpointListHelper: EndpointListHelper) {
    super();
  }

  private pRow: EndpointModel;
  @Input('row')
  set row(row: EndpointModel) {
    this.pRow = row;

    const e = getEndpointType(row.cnsi_type);
    if (!e || !e.listDetailsComponent) {
      return;
    }
    if (!this.cell) {
      const res =
        this.endpointListHelper.createEndpointDetails(e.listDetailsComponent, this.target, this.componentFactoryResolver);
      this.target = res.componentRef;
      this.cell = res.component;
    }

    if (this.cell) {
      this.cell.row = this.pRow;
      this.cell.isTable = true;
    }
  }

  get row(): EndpointModel {
    return this.pRow;
  }

  ngOnDestroy(): void {
    this.endpointListHelper.destroyEndpointDetails({
      componentRef: this.target,
      component: this.cell,
      endpointDetails: this.target
    });
  }
}
