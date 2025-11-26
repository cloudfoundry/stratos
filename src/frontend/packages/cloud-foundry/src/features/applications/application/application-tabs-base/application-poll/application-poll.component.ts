import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';

import { PollingIndicatorComponent } from '@stratosui/core';
import { ApplicationPollingService } from '../application-polling.service';

@Component({
  selector: 'app-application-poll',
  templateUrl: './application-poll.component.html',
  styleUrls: ['./application-poll.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PollingIndicatorComponent
  ]
})
export class ApplicationPollComponent {
  public appPollingService = inject(ApplicationPollingService);
}
