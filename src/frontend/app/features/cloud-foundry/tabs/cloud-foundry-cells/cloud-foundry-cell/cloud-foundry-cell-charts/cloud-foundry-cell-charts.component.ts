import { Component } from '@angular/core';

import { CloudFoundryCellService } from '../cloud-foundry-cell.service';

@Component({
  selector: 'app-cloud-foundry-cell-charts',
  templateUrl: './cloud-foundry-cell-charts.component.html',
  styleUrls: ['./cloud-foundry-cell-charts.component.scss'],
})
export class CloudFoundryCellChartsComponent {


  constructor(public cfCellService: CloudFoundryCellService) {

  }
}
