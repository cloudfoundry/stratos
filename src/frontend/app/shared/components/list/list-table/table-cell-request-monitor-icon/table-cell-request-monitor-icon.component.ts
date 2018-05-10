import { Component, OnInit, Input } from '@angular/core';
import { rootUpdatingKey } from '../../../../../store/reducers/api-request-reducer/types';
import { schema } from 'normalizr';
import { AppMonitorComponentTypes } from '../../../app-action-monitor-icon/app-action-monitor-icon.component';
import { APIResource } from '../../../../../store/types/api.types';

export interface ITableCellRequestMonitorIconConfig {
  entityKey: string;
  schema: schema.Entity;
  monitorState?: AppMonitorComponentTypes;
  updateKey?: string;
  getId?: (element) => string;
}

@Component({
  selector: 'app-table-cell-request-monitor-icon',
  templateUrl: './table-cell-request-monitor-icon.component.html',
  styleUrls: ['./table-cell-request-monitor-icon.component.scss']
})
export class TableCellRequestMonitorIconComponent implements OnInit {
  @Input('config')
  public config: ITableCellRequestMonitorIconConfig;

  @Input('row')
  public row;

  public id: string;

  constructor() { }

  ngOnInit() {
    if (this.config && this.config.getId) {
      this.id = this.config.getId(this.row);
    } else if (this.row && this.row.metadata) {
      const row = this.row as APIResource;
      this.id = row.metadata.guid;
    } else {
      throw new Error('Cannot get id for request monitor cell');
    }
  }

}
