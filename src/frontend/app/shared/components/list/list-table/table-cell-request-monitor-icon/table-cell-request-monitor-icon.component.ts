import { Component, OnInit, Input } from '@angular/core';
import { rootUpdatingKey } from '../../../../../store/reducers/api-request-reducer/types';
import { schema } from 'normalizr';
import { AppMonitorComponentTypes } from '../../../app-action-monitor-icon/app-action-monitor-icon.component';

export interface ITableCellRequestMonitorIconConfig<T> {
  entityKey: string;
  schema: schema.Entity;
  monitorState?: AppMonitorComponentTypes;
  updateKey?: string;
  getId: (element: T) => string;
}

@Component({
  selector: 'app-table-cell-request-monitor-icon',
  templateUrl: './table-cell-request-monitor-icon.component.html',
  styleUrls: ['./table-cell-request-monitor-icon.component.scss']
})
export class TableCellRequestMonitorIconComponent<T> implements OnInit {
  @Input('config')
  public config: ITableCellRequestMonitorIconConfig<T>;

  @Input('row')
  public row: T;

  public id: string;

  constructor() { }

  ngOnInit() {
    this.id = this.config.getId(this.row);
  }

}
