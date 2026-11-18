import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { EMPTY, Observable, switchMap } from 'rxjs';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';
import { AppBusyComponent } from '../busy-indicator/busy-indicator.component';

export interface IActionMonitorComponentState {
  busy: boolean;
  error: boolean;
  completed: boolean;
  message: string;
}

@Component({
  selector: 'app-action-monitor-icon',
  templateUrl: './app-action-monitor-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    AppBusyComponent
  ]
})
export class AppActionMonitorIconComponent {

  // The caller supplies the action state stream directly (the only path now
  // that the ngrx EntityMonitor request-state source has been removed).
  public readonly state = input<Observable<IActionMonitorComponentState>>();

  // The bound state stream. No stream bound: render nothing, as the async
  // pipe did for undefined.
  protected readonly state$ = toObservable(this.state).pipe(switchMap(state => state ?? EMPTY));

  public readonly currentState = outputFromObservable(this.state$);
}
