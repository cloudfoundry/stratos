import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';
import type { IFeatureFlag } from '@stratosui/cloud-foundry';

import { FeatureFlagDescriptions } from '../cf-feature-flags-data-source';

@Component({
  selector: 'app-table-cell-feature-flag-description',
  templateUrl: './table-cell-feature-flag-description.component.html',
  styleUrls: ['./table-cell-feature-flag-description.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class TableCellFeatureFlagDescriptionComponent extends TableCellCustom<IFeatureFlag> {

  description: string;

  @Input()
  set row(row: IFeatureFlag) {
    super.row = row;
    this.description = row ? FeatureFlagDescriptions[row.name] : null;
  }

}

