import { Component, Input } from '@angular/core';

import { CardCell } from '../../../../../../core/src/shared/components/list/list.types';
import { MonocularChart } from '../../store/helm.types';

@Component({
  selector: 'app-monocular-chart-card',
  templateUrl: './monocular-chart-card.component.html',
  styleUrls: ['./monocular-chart-card.component.scss']
})
export class MonocularChartCardComponent extends CardCell<MonocularChart> {

  @Input() row: MonocularChart;

  constructor() {
    super();
  }
}
