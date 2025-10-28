import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PollingIndicatorComponent } from '../../../../../../../core/src/shared/components/polling-indicator/polling-indicator.component';
import { ApplicationPollingService } from '../application-polling.service';

@Component({
  selector: 'app-application-poll',
  templateUrl: './application-poll.component.html',
  styleUrls: ['./application-poll.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PollingIndicatorComponent
  ]
})
export class ApplicationPollComponent {
  constructor(public appPollingService: ApplicationPollingService) { }
}
