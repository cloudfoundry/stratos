import { Component } from '@angular/core';

import {
  ApplicationPollingService,
} from '../../../features/applications/application/application-tabs-base/application-polling.service';

@Component({
  selector: 'app-cf-app-poll',
  templateUrl: './cf-app-poll.component.html',
  styleUrls: ['./cf-app-poll.component.scss']
})
export class CfAppPollComponent {

  constructor(public appPollingService: ApplicationPollingService) { }

  updatePoll(poll: boolean) {
    if (poll) {
      this.appPollingService.start();
    } else {
      this.appPollingService.stop();
    }
  }
}
