import { Component, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TableCellCustom } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IQuotaDefinition } from '../../../../../../cf-api.types';

@Component({
  selector: 'app-table-cell-quota',
  templateUrl: './table-cell-quota.component.html',
  styleUrls: ['./table-cell-quota.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule
  ]
})
export class TableCellQuotaComponent extends TableCellCustom<APIResource<IQuotaDefinition>> implements OnInit {
  quotaUrl!: string[];

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.config?.baseUrl && Array.isArray(this.config.baseUrl)) {
      this.quotaUrl = [...this.config.baseUrl, this.row.metadata.guid];
    } else {
      // Fallback if config is not properly initialized
      this.quotaUrl = [];
    }
  }
}
