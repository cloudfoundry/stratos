import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../../../../store/types/api.types';
import { IFeatureFlag } from '../../../../../../core/cf-api.types';

@Component({
  selector: 'app-table-cell-feature-flag-state',
  templateUrl: './table-cell-feature-flag-state.component.html',
  styleUrls: ['./table-cell-feature-flag-state.component.scss']
})
export class TableCellFeatureFlagStateComponent implements OnInit {

  @Input() row: APIResource<IFeatureFlag>;
  constructor() { }

  ngOnInit() {
  }

}
