import { ChangeDetectionStrategy, Component, Input, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class PanelComponent {
  // Title of the panel
  @Input() title = '';
  // Display a gray background
  readonly background = input(false);
  // Show a border
  readonly border = input(false);
  // Set the size of the panel to 80%
  readonly container = input(false);
}
