import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Observable } from 'rxjs';
import { AppBusyComponent } from '../busy-indicator/busy-indicator.component';

@Component({
  selector: 'app-card-progress-overlay',
  standalone: true,
  imports: [
    AppBusyComponent,
    CommonModule
  ],
  templateUrl: './card-progress-overlay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardProgressOverlayComponent {

  readonly label = input.required<string>();

  readonly busy = input.required<Observable<boolean>>();

}
