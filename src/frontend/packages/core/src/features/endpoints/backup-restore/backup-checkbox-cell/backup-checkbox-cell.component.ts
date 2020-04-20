import { Component } from '@angular/core';

import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { TableCellCustom } from '../../../../shared/components/list/list.types';
import { BackupEndpointsService } from '../backup-endpoints.service';

@Component({
  selector: 'app-backup-checkbox-cell',
  templateUrl: './backup-checkbox-cell.component.html',
  styleUrls: ['./backup-checkbox-cell.component.scss']
})
export class BackupCheckboxCellComponent extends TableCellCustom<EndpointModel> {

  constructor(public service: BackupEndpointsService) {
    super();
  }

  validate() {
    this.service.stateUpdated();
  }

  disabled(): boolean {
    return !this.service.canBackupEndpoint(this.row, this.config.type);
  }
}
