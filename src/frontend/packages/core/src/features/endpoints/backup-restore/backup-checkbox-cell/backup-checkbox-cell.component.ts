import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomCheckboxComponent } from '../../../../shared/components/custom-checkbox/custom-checkbox.component';
import { EndpointModel } from '@stratosui/store';

import { TableCellCustom } from '../../../../shared/components/list/list.types';
import { BackupEndpointsService } from '../backup-endpoints.service';
import { BackupEndpointTypes } from '../backup-restore.types';

interface BackupCheckboxConfig {
  type: BackupEndpointTypes;
}

@Component({
  selector: 'app-backup-checkbox-cell',
  templateUrl: './backup-checkbox-cell.component.html',
  styleUrls: ['./backup-checkbox-cell.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CustomCheckboxComponent
  ]
})
export class BackupCheckboxCellComponent extends TableCellCustom<EndpointModel, BackupCheckboxConfig> {

  public service = inject(BackupEndpointsService);

  validate() {
    this.service.stateUpdated();
  }

  disabled(): boolean {
    return !this.service.canBackupEndpoint(this.row, this.config.type);
  }
}
