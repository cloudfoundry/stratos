import { Component } from '@angular/core';

import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { TableCellCustom } from '../../../../shared/components/list/list.types';
import { BackupEndpointsService } from '../backup-endpoints.service';

@Component({
  selector: 'app-backup-restore-cell',
  templateUrl: './backup-restore-cell.component.html',
  styleUrls: ['./backup-restore-cell.component.scss']
})
export class BackupRestoreCellComponent extends TableCellCustom<EndpointModel> {

  constructor(public service: BackupEndpointsService) {
    super();
  }

  validate() {
    this.service.validate();
  }

  disabled(): boolean {
    return !this.service.canBackup(this.row, this.config.type);
  }
}
