import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { entityCatalog, EndpointModel, SystemSharedUserGuid } from '@stratosui/store';

import { TableCellCustom } from '../../../../shared/components/list/list.types';
import { BackupEndpointsService } from '../backup-endpoints.service';
import { BackupEndpointConnectionTypes, BackupEndpointTypes } from '../backup-restore.types';

@Component({
  selector: 'app-backup-connection-cell',
  templateUrl: './backup-connection-cell.component.html',
  styleUrls: ['./backup-connection-cell.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule
  ]
})
export class BackupConnectionCellComponent extends TableCellCustom<EndpointModel> implements OnInit {

  connectable = false;
  backupType = BackupEndpointTypes;
  connectionTypes = BackupEndpointConnectionTypes;
  selected: BackupEndpointConnectionTypes;
  userConnectionWarning: string;

  constructor(public service: BackupEndpointsService) {
    super();
  }

  ngOnInit() {
    const epType = entityCatalog.getEndpoint(this.row.cnsi_type, this.row.sub_type);
    const epEntity = epType.definition;
    this.connectable = !epEntity.unConnectable;
    if (!this.row.user) {
      this.userConnectionWarning = 'User not connected';
    } else if (this.row.user.guid === SystemSharedUserGuid) {
      this.userConnectionWarning = 'User has shared connection';
    }
  }
}
