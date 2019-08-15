import { Component } from '@angular/core';

import { ApplicationPollingService } from '../application-polling.service';

@Component({
  selector: 'app-application-poll',
  templateUrl: './application-poll.component.html',
  styleUrls: ['./application-poll.component.scss']
})
export class ApplicationPollComponent {
  constructor(public appPollingService: ApplicationPollingService) { }
}
