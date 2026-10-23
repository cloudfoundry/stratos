import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTooltipDirective } from '../custom-tooltip/custom-tooltip.directive';
import { CustomIconComponent } from '../custom-material/custom-material.component';

@Component({
  selector: 'app-polling-indicator',
  templateUrl: './polling-indicator.component.html',
  styleUrls: ['./polling-indicator.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    CustomTooltipDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollingIndicatorComponent {

  /**
   * Is polling currently happening
   */
  readonly isPolling = input<boolean>();
  /**
   * Can a manual poll be kicked off?
   */
  readonly manualPoll = input(false);
  /**
   * Show the min-fab version of button
   */
  readonly fabButton = input(false);
  /**
   * User has kicked off a manual poll event
   */
  @Output() poll = new EventEmitter<boolean>();
}
