import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-polling-indicator',
  templateUrl: './polling-indicator.component.html',
  styleUrls: ['./polling-indicator.component.scss']
})
export class PollingIndicatorComponent {

  @Input() isPolling: boolean;
  @Input() pollEnabled = false;
  @Input() fabButton = false;
  @Output() poll = new EventEmitter<boolean>();
}
