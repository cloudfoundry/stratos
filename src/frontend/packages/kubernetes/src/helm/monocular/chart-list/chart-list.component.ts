import { Component, Input } from '@angular/core';

import { Chart } from '../shared/models/chart';

@Component({
  selector: 'app-chart-list',
  templateUrl: './chart-list.component.html',
  styleUrls: ['./chart-list.component.scss'],
  standalone: true
})
export class ChartListComponent {
  @Input() charts: Chart[];
}
