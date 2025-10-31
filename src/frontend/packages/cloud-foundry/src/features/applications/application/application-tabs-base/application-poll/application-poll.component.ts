import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PollingIndicatorComponent } from '../../../../../../../core/src/shared/components/polling-indicator/polling-indicator.component';
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
