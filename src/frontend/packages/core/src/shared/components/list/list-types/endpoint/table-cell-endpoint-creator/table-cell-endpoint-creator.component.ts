import { Component, Input, OnInit } from '@angular/core';
import { EndpointModel, entityCatalog } from '@stratosui/store';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-endpoint-creator',
  templateUrl: './table-cell-endpoint-creator.component.html',
  styleUrls: ['./table-cell-endpoint-creator.component.scss']
})
export class TableCellEndpointCreatorComponent extends TableCellCustom<EndpointModel> implements OnInit {

  public creator = '';

  @Input()
  get row(): EndpointModel {
    return super.row;
  }
  set row(row: EndpointModel) {
    super.row = row;
  }

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.creator = this.row.creator.name;
  }

}
