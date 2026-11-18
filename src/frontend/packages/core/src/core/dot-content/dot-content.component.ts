import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dot-content',
  templateUrl: './dot-content.component.html',
  standalone: true,
  imports: [
    CommonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DotContentComponent {
  readonly disabled = input<boolean>(false);
}
