import { Component, OnInit, Output, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EMPTY, Observable } from 'rxjs';
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
export class AppActionMonitorIconComponent implements OnInit {

  // The caller supplies the action state stream directly (the only path now
  // that the ngrx EntityMonitor request-state source has been removed).
  public readonly state = input<Observable<IActionMonitorComponentState>>();

  @Output()
  public currentState!: Observable<IActionMonitorComponentState>;

  ngOnInit() {
    // No state stream bound: render nothing, as the async pipe did for undefined.
    this.currentState = this.state() ?? EMPTY;
  }
}
