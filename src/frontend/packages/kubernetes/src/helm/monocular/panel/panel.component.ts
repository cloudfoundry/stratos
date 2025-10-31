import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss'],
  standalone: true,
  imports: [CommonModule]
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
