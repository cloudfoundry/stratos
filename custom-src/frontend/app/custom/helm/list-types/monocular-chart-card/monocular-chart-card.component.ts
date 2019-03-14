import { MonocularChart } from '../../store/helm.types';
import { Component, OnInit, Input } from '@angular/core';
import { CardCell } from '../../../../shared/components/list/list.types';

@Component({
  selector: 'app-monocular-chart-card',
  templateUrl: './monocular-chart-card.component.html',
  styleUrls: ['./monocular-chart-card.component.scss']
})
export class MonocularChartCardComponent extends CardCell<MonocularChart> implements OnInit {

  @Input() row: MonocularChart;

  constructor() {
    super();
  }

  ngOnInit() {
  }

}
