import { ChangeDetectionStrategy, Component, Input, type OnInit  } from '@angular/core';

import { entityCatalog, type EndpointModel } from '@stratosui/store';

import { TableCellCustom } from '../../../list.types';
import { CustomIconComponent } from '../../../../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-table-cell-endpoint-status',
  templateUrl: './table-cell-endpoint-status.component.html',
  styleUrls: ['./table-cell-endpoint-status.component.scss'],
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
    const ep = entityCatalog.getEndpoint(this.row.cnsi_type, this.row.sub_type);
    if (ep) {
      this.connectable = !ep.definition.unConnectable;
    }
  }
}
