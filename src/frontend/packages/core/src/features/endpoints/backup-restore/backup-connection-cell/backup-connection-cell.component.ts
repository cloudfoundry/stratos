import { Component } from '@angular/core';

import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { TableCellCustom } from '../../../../shared/components/list/list.types';
import { BackupEndpointsService } from '../backup-endpoints.service';
import { BackupEndpointConnectionTypes, BackupEndpointTypes } from '../backup-restore.types';

@Component({
  selector: 'app-backup-connection-cell',
  templateUrl: './backup-connection-cell.component.html',
  styleUrls: ['./backup-connection-cell.component.scss']
})
export class BackupConnectionCellComponent extends TableCellCustom<EndpointModel> {

  backupType = BackupEndpointTypes;
  connectionTypes = BackupEndpointConnectionTypes;
  selected: BackupEndpointConnectionTypes;

  constructor(public service: BackupEndpointsService) {
    super();
  }
}
