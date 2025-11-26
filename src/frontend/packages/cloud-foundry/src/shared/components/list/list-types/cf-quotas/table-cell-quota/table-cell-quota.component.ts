import { Component, type OnInit , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { IQuotaDefinition } from '../../../../../../cf-api.types';

interface QuotaCellConfig {
  baseUrl: string[];
}

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
export class TableCellQuotaComponent extends TableCellCustom<APIResource<IQuotaDefinition>, QuotaCellConfig> implements OnInit {
  quotaUrl!: string[];

  ngOnInit() {
    if (this.config?.baseUrl && Array.isArray(this.config.baseUrl)) {
      this.quotaUrl = [...this.config.baseUrl, this.row.metadata.guid];
    } else {
      // Fallback if config is not properly initialized
      this.quotaUrl = [];
    }
  }
}
