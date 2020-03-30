import { Component, Input } from '@angular/core';
import { TableCellCustom } from 'frontend/packages/core/src/shared/components/list/list.types';
import { IFeatureFlag } from 'frontend/packages/core/src/core/cf-api.types';
import { FeatureFlagDescriptions } from '../cf-feature-flags-data-source';

@Component({
  selector: 'app-table-cell-feature-flag-description',
  templateUrl: './table-cell-feature-flag-description.component.html',
  styleUrls: ['./table-cell-feature-flag-description.component.scss']
})
export class TableCellFeatureFlagDescriptionComponent extends TableCellCustom<IFeatureFlag> {
  @Input() row: IFeatureFlag;

  FeatureFlagDescriptions = FeatureFlagDescriptions;
}
