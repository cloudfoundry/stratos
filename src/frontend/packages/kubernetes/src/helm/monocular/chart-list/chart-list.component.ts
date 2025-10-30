import { Component, Input } from '@angular/core';


import { Chart } from '../shared/models/chart';
import { ChartItemComponent } from '../chart-item/chart-item.component';

@Component({
  selector: 'app-chart-list',
  templateUrl: './chart-list.component.html',
  styleUrls: ['./chart-list.component.scss'],
  standalone: true,
  imports: [ChartItemComponent]
})
export class ChartListComponent {
  @Input() charts: Chart[];
}
