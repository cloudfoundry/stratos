import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BooleanIndicatorComponent, TableCellCustom } from '@stratosui/core';
import type { IFeatureFlag } from '@stratosui/cloud-foundry';

@Component({
  selector: 'app-table-cell-feature-flag-state',
  templateUrl: './table-cell-feature-flag-state.component.html',
  styleUrls: ['./table-cell-feature-flag-state.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BooleanIndicatorComponent
  ]
})
export class TableCellFeatureFlagStateComponent extends TableCellCustom<IFeatureFlag> { }
