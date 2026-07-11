import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { NgClass } from '@angular/common';
import { StratosStatus } from '@stratosui/store';
import { CustomIconComponent } from '../../custom-material/custom-material.component';
import { ApplicationStateIconPipe } from './application-state-icon.pipe';

@Component({
  selector: 'app-application-state-icon',
  templateUrl: './application-state-icon.component.html',
  standalone: true,
  imports: [
    NgClass,
    CustomIconComponent,
    ApplicationStateIconPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicationStateIconComponent {

  // Accepts null so callers can bind `status$ | async` directly
  @Input() public status!: StratosStatus | null;

}
