import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-polling-indicator',
  templateUrl: './polling-indicator.component.html',
  styleUrls: ['./polling-indicator.component.scss']
})
export class PollingIndicatorComponent {

  @Input() isPolling: boolean;
  @Input() pollEnabled = false;
  @Output() updatePollEnabled = new EventEmitter<boolean>();

  toggle() {
    this.pollEnabled = !this.pollEnabled;
    this.updatePollEnabled.emit(this.pollEnabled);
  }
}
