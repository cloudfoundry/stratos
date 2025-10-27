import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-polling-indicator',
  templateUrl: './polling-indicator.component.html',
  styleUrls: ['./polling-indicator.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ]
})
export class PollingIndicatorComponent {

  /**
   * Is polling currently happening
   */
  @Input() isPolling: boolean;
  /**
   * Can a manual poll be kicked off?
   */
  @Input() manualPoll = false;
  /**
   * Show the min-fab version of button
   */
  @Input() fabButton = false;
  /**
   * User has kicked off a manual poll event
   */
  @Output() poll = new EventEmitter<boolean>();
}
