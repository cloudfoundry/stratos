import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss'],
  standalone: true
})
export class PanelComponent {
  // Title of the panel
  @Input() title = '';
  // Display a gray background
  @Input() background = false;
  // Show a border
  @Input() border = false;
  // Set the size of the panel to 80%
  @Input() container = false;
}
