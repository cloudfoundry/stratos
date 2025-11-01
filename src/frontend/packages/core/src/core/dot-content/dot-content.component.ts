import { ChangeDetectionStrategy, Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dot-content',
  templateUrl: './dot-content.component.html',
  styleUrls: ['./dot-content.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DotContentComponent {
  @Input() disabled: boolean = false;
}
