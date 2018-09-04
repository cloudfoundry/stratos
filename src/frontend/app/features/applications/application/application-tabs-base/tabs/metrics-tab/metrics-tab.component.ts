import { Component } from '@angular/core';
import { ApplicationService } from '../../../../application.service';

@Component({
  selector: 'app-metrics-tab',
  templateUrl: './metrics-tab.component.html',
  styleUrls: ['./metrics-tab.component.scss']
})
export class MetricsTabComponent {
  constructor(public applicationService: ApplicationService) { }
}
