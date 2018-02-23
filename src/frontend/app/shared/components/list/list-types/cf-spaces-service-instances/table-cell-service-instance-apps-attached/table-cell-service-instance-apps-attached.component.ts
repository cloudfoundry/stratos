import { Component, OnInit, Input } from '@angular/core';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { StringLiteral } from 'typescript';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';

@Component({
  selector: 'app-table-cell-service-instance-apps-attached',
  templateUrl: './table-cell-service-instance-apps-attached.component.html',
  styleUrls: ['./table-cell-service-instance-apps-attached.component.scss']
})
export class TableCellServiceInstanceAppsAttachedComponent<T> extends TableCellCustom<T> implements OnInit {

  boundApps: string;
  @Input('row') row;

  constructor() {
    super();
  }

  ngOnInit() {
    this.boundApps = this.row.entity.service_bindings
      .map(a => a.entity.app.entity.name)
      .reduce((a, x) => `${x}, ${a}`, '')
      .replace(/,\s*$/, '');
  }

}
