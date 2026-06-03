import { Component, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

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
    CustomIconComponent
  ]
})
export class AppActionMonitorIconComponent implements OnInit {

  // The caller supplies the action state stream directly (the only path now
  // that the ngrx EntityMonitor request-state source has been removed).
  @Input()
  public state!: Observable<IActionMonitorComponentState>;

  @Output()
  public currentState!: Observable<IActionMonitorComponentState>;

  ngOnInit() {
    this.currentState = this.state;
  }
}
