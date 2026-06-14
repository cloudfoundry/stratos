import { ChangeDetectionStrategy, Component, Input, OnInit  } from '@angular/core';

import { entityCatalog, EndpointModel } from '@stratosui/store';

import { TableCellCustom } from '../../signal-list/cell-base';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-table-cell-endpoint-status',
  templateUrl: './table-cell-endpoint-status.component.html',
  standalone: true,
  imports: [
    CustomIconComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellEndpointStatusComponent extends TableCellCustom<EndpointModel, { showLabel: boolean; }> implements OnInit {

  public connectable = true;

  @Input()
  get row(): EndpointModel {
    return super.row;
  }
  set row(row: EndpointModel) {
    super.row = row;
  }

  constructor() {
    super();
    this.config = {
      showLabel: true,
    };
  }

  ngOnInit() {
    const ep = this.row.cnsi_type ? entityCatalog.getEndpoint(this.row.cnsi_type, this.row.sub_type) : null;
    if (ep) {
      this.connectable = !ep.definition.unConnectable;
    }
  }
}
