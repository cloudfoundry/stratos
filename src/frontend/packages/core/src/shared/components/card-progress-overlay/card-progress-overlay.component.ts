import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { isObservable, Observable, of } from 'rxjs';
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

  readonly label = input<string>();

  // Callers with a signal pass its value; the Observable form stays for the
  // callers still on rxjs pipelines.
  readonly busy = input<boolean | Observable<boolean>>();

  protected readonly busy$ = computed(() => {
    const value = this.busy();
    return isObservable(value) ? value : of(!!value);
  });

}
