import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EndpointModel } from '@stratosui/store';

import { TableCellCustom } from '../../../../shared/components/list/list.types';
import { BackupEndpointsService } from '../backup-endpoints.service';

@Component({
  selector: 'app-backup-checkbox-cell',
  templateUrl: './backup-checkbox-cell.component.html',
  styleUrls: ['./backup-checkbox-cell.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatCheckboxModule
  ]
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
